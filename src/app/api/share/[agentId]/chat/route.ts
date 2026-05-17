import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import {
  dateTimeTool,
  webSearchTool,
  calculatorTool,
  wordCounterTool,
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params

    // Public route — no auth required. Verify the agent exists and is public.
    const supabase = await createClient()
    const { data: agent } = await supabase
      .from('agents')
      .select('id, name, description, config, is_public')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found.' }, { status: 404 })
    }

    if (!agent.is_public) {
      return NextResponse.json(
        { error: 'Forbidden — this agent is private.' },
        { status: 403 }
      )
    }

    // Fire-and-forget view increment — never let analytics break the response.
    const admin = createAdminClient()
    if (admin) {
      Promise.resolve(admin.rpc('increment_agent_views', { agent_id: agentId }))
        .catch((err: unknown) => console.error('[share/chat] view increment failed:', err))
    }

    const body = await request.json()
    const { messages } = body as { messages: Anthropic.MessageParam[] }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Request body must include a messages array.' },
        { status: 400 }
      )
    }

    // ── Tools ─────────────────────────────────────────────────────────────
    const agentConfig   = agent.config as AgentConfig
    const { capabilities } = agentConfig
    const documents = capabilities.documents ?? { enabled: false, files: [] as AgentConfig['capabilities']['documents']['files'] }

    const tools: Anthropic.Tool[] = [dateTimeTool]
    if (capabilities.webSearch)   tools.push(webSearchTool)
    if (capabilities.calculator)  tools.push(calculatorTool)
    if (capabilities.wordCounter) tools.push(wordCounterTool)
    if (documents.enabled && documents.files.length > 0) tools.push(documentReaderTool)

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
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const encoder   = new TextEncoder()

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
          const attributionSources: string[] = []
          let   attributionDocument: string | null = null

          let currentMessages: Anthropic.MessageParam[] = [...messages]

          const MAX_ITERATIONS = 5

          for (let i = 0; i < MAX_ITERATIONS; i++) {
            if (cancelled) return

            const stream = anthropic.messages.stream({
              model:      'claude-haiku-4-5-20251001',
              max_tokens: 1024,
              system:     systemPrompt,
              messages:   currentMessages,
              ...(tools.length > 0 && { tools }),
            })
            abortActive = () => stream.abort()

            for await (const event of stream) {
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

            const msg = await stream.finalMessage()

            if (msg.stop_reason !== 'tool_use') break

            // ── Tool execution ────────────────────────────────────────────
            const toolUseBlocks = msg.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            )

            const toolResults: Anthropic.ToolResultBlockParam[] = []

            for (const block of toolUseBlocks) {
              if (cancelled) return

              emit({ type: 'tool_call', tool: block.name })

              let result: string
              try {
                result = await dispatchToolCall(
                  block.name,
                  block.input as Record<string, unknown>,
                  { allowedFileIds, logger: () => { /* no logging for public chats */ } }
                )
              } catch (err) {
                result =
                  `The ${block.name} tool encountered an error. ` +
                  'Please answer from your general knowledge instead.'
                console.error(`[share/chat] tool error (${block.name}):`, err)
              }

              if (block.name === 'web_search') {
                const urls = result!.split('\n')
                  .filter(line => /^   https?:\/\/\S/.test(line))
                  .map(line => line.trim())
                attributionSources.push(...urls)
              } else if (block.name === 'document_reader') {
                if (result!.startsWith('Document content:')) {
                  const fileId = (block.input as { fileId: string }).fileId
                  const file   = documents.files.find(f => f.id === fileId)
                  if (file) attributionDocument = file.name
                }
              }

              toolResults.push({
                type:        'tool_result',
                tool_use_id: block.id,
                content:     result!,
              })
            }

            if (attributionSources.length > 0 || attributionDocument) {
              emit({
                type: 'attribution',
                ...(attributionSources.length > 0 && { sources: [...attributionSources] }),
                ...(attributionDocument               && { documentUsed: attributionDocument }),
              })
            }

            if (cancelled) return

            currentMessages = [
              ...currentMessages,
              {
                role:    'assistant' as const,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content: msg.content as any,
              },
              {
                role:    'user' as const,
                content: toolResults,
              },
            ]
          }

        } catch (err) {
          console.error('[share/chat] stream error:', err)
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
    console.error('[share/chat] unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
