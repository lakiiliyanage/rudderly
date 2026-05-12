import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import {
  dateTimeTool,
  webSearchTool,
  calculatorTool,
  documentReaderTool,
} from '@/lib/tools/definitions'
import { dispatchToolCall } from '@/lib/tools/runner'
import type { AgentConfig } from '@/lib/types/agent'

const methodNotAllowed = () =>
  NextResponse.json(
    { error: 'Method not allowed.' },
    { status: 405, headers: { Allow: 'POST' } }
  )

export const GET    = methodNotAllowed
export const PUT    = methodNotAllowed
export const PATCH  = methodNotAllowed
export const DELETE = methodNotAllowed

export async function POST(request: Request) {
  try {

    // ── Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — please sign in.' },
        { status: 401 }
      )
    }

    // ── Request body ─────────────────────────────────────────────────────
    const body = await request.json()
    const { agentId, messages } = body as {
      agentId: string
      messages: Anthropic.MessageParam[]
    }

    if (!agentId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Request body must include agentId and messages array.' },
        { status: 400 }
      )
    }

    // ── Fetch agent ───────────────────────────────────────────────────────
    const { data: agent } = await supabase
      .from('agents')
      .select('id, user_id, name, description, config')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found.' }, { status: 404 })
    }

    if (agent.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden — this agent belongs to another user.' },
        { status: 403 }
      )
    }

    // ── Tools ─────────────────────────────────────────────────────────────
    const agentConfig  = agent.config as AgentConfig
    const { capabilities } = agentConfig
    const { documents }    = capabilities

    // dateTimeTool is always included — knowing the current date is a basic
    // orientation capability every agent should have, regardless of toggles.
    const tools: Anthropic.Tool[] = [dateTimeTool]
    if (capabilities.webSearch)  tools.push(webSearchTool)
    if (capabilities.calculator) tools.push(calculatorTool)
    if (documents.enabled && documents.files.length > 0) tools.push(documentReaderTool)

    // Security boundary: only these IDs may be passed to document_reader.
    // Claude can only request documents that the agent config explicitly listed.
    const allowedFileIds = documents.files.map(f => f.id)

    // ── System prompt ─────────────────────────────────────────────────────
    let systemPrompt = buildSystemPrompt(agent.name, agent.description ?? '', agentConfig)

    if (documents.enabled && documents.files.length > 0) {
      const fileList = documents.files
        .map(f => `- "${f.name}" (ID: ${f.id})`)
        .join('\n')
      systemPrompt +=
        '\n\nYou have access to the following documents via the document_reader tool:\n' +
        fileList +
        '\n\nWhen the user asks a question that could be answered by these documents, ' +
        'always use the document_reader tool first to read the relevant document before answering. ' +
        'Ground your response in the actual document content.'
    }

    // ── Streaming response ─────────────────────────────────────────────────
    // Protocol: every chunk is a Server-Sent Events line —
    //   data: {"type":"text","text":"…"}\n\n       text delta to append
    //   data: {"type":"tool_call","tool":"…"}\n\n  thinking indicator update
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const encoder   = new TextEncoder()

    // Shared state between start() and cancel() — both run in the same closure.
    let cancelled   = false
    let abortActive: (() => void) | null = null

    const readable = new ReadableStream({
      async start(controller) {
        function emit(data: object) {
          if (!cancelled) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          }
        }

        try {
          // ── First Claude call ───────────────────────────────────────────
          const firstStream = anthropic.messages.stream({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system:     systemPrompt,
            messages,
            // Omit tools entirely when the array only has dateTimeTool and no
            // toggle-gated tools — keeps the request leaner for pure text agents.
            ...(tools.length > 0 && { tools }),
          })
          abortActive = () => firstStream.abort()

          // Stream text deltas from the first call as they arrive.
          // If Claude decides to use a tool instead, it won't emit text here —
          // the stop_reason check below will handle that path.
          for await (const event of firstStream) {
            if (cancelled) break
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              emit({ type: 'text', text: event.delta.text })
            }
          }

          if (cancelled) return
          abortActive = null

          const firstMsg = await firstStream.finalMessage()

          // Pure text response — already streamed above, nothing more to do.
          if (firstMsg.stop_reason !== 'tool_use') return

          // ── Tool execution ──────────────────────────────────────────────
          const toolUseBlocks = firstMsg.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
          )

          const toolResults: Anthropic.ToolResultBlockParam[] = []

          for (const block of toolUseBlocks) {
            if (cancelled) return

            // Tell the client which tool is running so it can update its
            // thinking indicator label (e.g. "Calculating..." or "Searching…").
            emit({ type: 'tool_call', tool: block.name })

            let result: string
            try {
              result = await dispatchToolCall(
                block.name,
                block.input as Record<string, unknown>,
                { allowedFileIds }
              )
            } catch (err) {
              // Tool failure is non-fatal. Send a fallback result so Claude can
              // answer from its own knowledge rather than returning a 500.
              result =
                `The ${block.name} tool encountered an error. ` +
                'Please answer from your general knowledge instead.'
              console.error(`[chat] tool error (${block.name}):`, err)
            }

            toolResults.push({
              type:        'tool_result',
              tool_use_id: block.id,
              content:     result,
            })
          }

          if (cancelled) return

          // ── Second Claude call ──────────────────────────────────────────
          // Append the assistant's tool_use turn and the tool_result turn, then
          // ask Claude to produce its final answer.
          const secondMessages: Anthropic.MessageParam[] = [
            ...messages,
            {
              role:    'assistant' as const,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content: firstMsg.content as any,
            },
            {
              role:    'user' as const,
              content: toolResults,
            },
          ]

          const secondStream = anthropic.messages.stream({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system:     systemPrompt,
            messages:   secondMessages,
            ...(tools.length > 0 && { tools }),
          })
          abortActive = () => secondStream.abort()

          for await (const event of secondStream) {
            if (cancelled) break
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              emit({ type: 'text', text: event.delta.text })
            }
          }

        } catch (err) {
          console.error('[chat] stream error:', err)
        } finally {
          abortActive = null
          controller.close()
        }
      },

      cancel() {
        cancelled = true
        abortActive?.()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    })

  } catch (error) {
    console.error('[chat] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
