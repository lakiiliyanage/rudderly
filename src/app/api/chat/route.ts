import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import { prepareMessagesForContext } from '@/lib/context'
import { getUserUsage, incrementMessageCount } from '@/lib/usage'
import {
  dateTimeTool,
  webSearchTool,
  calculatorTool,
  wordCounterTool,
  documentReaderTool,
} from '@/lib/tools/definitions'
import { dispatchToolCall } from '@/lib/tools/runner'
import type { ToolLogCore } from '@/lib/tools/runner'
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

    // ── Usage limit check ─────────────────────────────────────────────────
    const usage = await getUserUsage(user.id)
    if (usage.messageCount >= usage.monthlyLimit) {
      const { tier, monthlyLimit } = usage
      return NextResponse.json({
        error:   'MESSAGE_LIMIT_REACHED',
        tier,
        message: tier === 'pro'
          ? `You've used all ${monthlyLimit.toLocaleString()} Pro messages this month.`
          : `You've used all ${monthlyLimit} messages this month.`,
        cta: tier === 'pro' ? 'enterprise' : 'upgrade',
      }, { status: 402 })
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
    const documents = capabilities.documents ?? { enabled: false, files: [] as AgentConfig['capabilities']['documents']['files'] }

    // dateTimeTool is always included — knowing the current date is a basic
    // orientation capability every agent should have, regardless of toggles.
    const tools: Anthropic.Tool[] = [dateTimeTool]
    if (capabilities.webSearch)   tools.push(webSearchTool)
    if (capabilities.calculator)  tools.push(calculatorTool)
    if (capabilities.wordCounter) tools.push(wordCounterTool)
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

    // ── Tool logger ───────────────────────────────────────────────────────
    // Fire-and-forget: the void promise is intentionally not awaited.
    // If the insert fails, we log to console but never surface it to the user.
    function makeLogger(userId: string, agentId: string) {
      return (core: ToolLogCore) => {
        void supabase
          .from('tool_logs')
          .insert({ ...core, user_id: userId, agent_id: agentId })
          .then(({ error }) => { if (error) console.error('[tool_logs]', error) }, err => console.error('[tool_logs]', err))
      }
    }
    const logger = makeLogger(user.id, agent.id)

    // ── Streaming response ─────────────────────────────────────────────────
    // Protocol: every chunk is a Server-Sent Events line —
    //   data: {"type":"text","text":"…"}\n\n       text delta to append
    //   data: {"type":"tool_call","tool":"…"}\n\n  thinking indicator update
    const MAX_HISTORY_MESSAGES = 40

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
          // Attribution data accumulated across all tool-use rounds.
          const attributionSources: string[] = []
          let   attributionDocument: string | null = null

          // Carry messages forward so each tool-use round has the full history.
          const preparedMessages  = await prepareMessagesForContext(messages, MAX_HISTORY_MESSAGES, anthropic)
          let currentMessages: Anthropic.MessageParam[] = [...preparedMessages]

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

            // Stream text deltas as they arrive. On tool-use turns Claude emits
            // no text, so this is effectively a no-op until the final turn.
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

            // Final response — text was already streamed above.
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
                  { allowedFileIds, logger }
                )
              } catch (err) {
                result =
                  `The ${block.name} tool encountered an error. ` +
                  'Please answer from your general knowledge instead.'
                console.error(`[chat] tool error (${block.name}):`, err)
              }

              // ── Attribution extraction ──────────────────────────────────
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

            // Emit accumulated attribution after each tool round so the client
            // has the latest sources ready before the final text stream begins.
            if (attributionSources.length > 0 || attributionDocument) {
              emit({
                type: 'attribution',
                ...(attributionSources.length > 0 && { sources: [...attributionSources] }),
                ...(attributionDocument               && { documentUsed: attributionDocument }),
              })
            }

            if (cancelled) return

            // Append this round's assistant + tool_result turns so the next
            // iteration has the complete conversation context.
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
          console.error('[chat] stream error:', err)
        } finally {
          abortActive = null
          if (!cancelled) incrementMessageCount(user.id)
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
