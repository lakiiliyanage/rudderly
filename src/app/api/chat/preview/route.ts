import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import { getUserUsage } from '@/lib/usage'
import { chatRatelimit } from '@/lib/ratelimit'
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
    // ── Auth ─────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — please sign in.' },
        { status: 401 }
      )
    }

    // ── Rate limit check ──────────────────────────────────────────────
    const { success, remaining, reset } = await chatRatelimit.limit(user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait a moment.' },
        {
          status: 429,
          headers: {
            'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      )
    }

    // ── Usage limit check ─────────────────────────────────────────────
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

    // ── Body ──────────────────────────────────────────────────────────
    const { agentConfig, agentName, messages } = await request.json() as {
      agentConfig: AgentConfig
      agentName:   string
      messages:    Anthropic.MessageParam[]
    }

    if (!agentConfig || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Request body must include agentConfig and messages.' },
        { status: 400 }
      )
    }

    // ── Tools ─────────────────────────────────────────────────────────
    const { capabilities } = agentConfig
    const documents = capabilities.documents ?? { enabled: false, files: [] as AgentConfig['capabilities']['documents']['files'] }

    const tools: Anthropic.Tool[] = [dateTimeTool]
    if (capabilities.webSearch)   tools.push(webSearchTool)
    if (capabilities.calculator)  tools.push(calculatorTool)
    if (capabilities.wordCounter) tools.push(wordCounterTool)
    if (documents.enabled && documents.files.length > 0) tools.push(documentReaderTool)

    const allowedFileIds = documents.files.map(f => f.id)

    // ── System prompt ─────────────────────────────────────────────────
    let systemPrompt = buildSystemPrompt(agentName || 'Agent', '', agentConfig)

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

    // ── First Claude call ─────────────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const firstResponse = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     systemPrompt,
      messages,
      ...(tools.length > 0 && { tools }),
    })

    // Pure text response — return immediately.
    if (firstResponse.stop_reason !== 'tool_use') {
      const reply = firstResponse.content[0].type === 'text' ? firstResponse.content[0].text : ''
      return NextResponse.json({ reply })
    }

    // ── Tool logger (preview has no agent_id) ────────────────────────
    const logger = (core: ToolLogCore) => {
      void supabase
        .from('tool_logs')
        .insert({ ...core, user_id: user.id, agent_id: null })
        .then(({ error }) => { if (error) console.error('[tool_logs]', error) }, err => console.error('[tool_logs]', err))
    }

    // ── Tool execution ────────────────────────────────────────────────
    const toolUseBlocks = firstResponse.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of toolUseBlocks) {
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
        console.error(`[chat/preview] tool error (${block.name}):`, err)
      }

      toolResults.push({
        type:        'tool_result',
        tool_use_id: block.id,
        content:     result!,
      })
    }

    // ── Second Claude call ────────────────────────────────────────────
    const secondMessages: Anthropic.MessageParam[] = [
      ...messages,
      {
        role:    'assistant' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: firstResponse.content as any,
      },
      {
        role:    'user' as const,
        content: toolResults,
      },
    ]

    const secondResponse = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   secondMessages,
      ...(tools.length > 0 && { tools }),
    })

    const reply = secondResponse.content[0].type === 'text' ? secondResponse.content[0].text : ''
    return NextResponse.json({ reply })

  } catch (error) {
    console.error('[chat/preview] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
