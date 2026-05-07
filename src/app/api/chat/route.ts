import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

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

    // ── Authentication ────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — please sign in.' },
        { status: 401 }
      )
    }

    // ── Request body ──────────────────────────────────────────────────
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

    // ── Fetch agent ───────────────────────────────────────────────────
    const { data: agent } = await supabase
      .from('agents')
      .select('id, user_id, name, description, config')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found.' },
        { status: 404 }
      )
    }

    // ── Ownership check ───────────────────────────────────────────────
    if (agent.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden — this agent belongs to another user.' },
        { status: 403 }
      )
    }

    // ── System prompt ─────────────────────────────────────────────────
    const { personality, goal } = agent.config as { personality: string; goal: string }

    const systemPrompt =
      `You are ${agent.name}. ${agent.description}. ` +
      `Your personality: ${personality}. Your goal: ${goal}.`

    // ── Stream to client ──────────────────────────────────────────────
    // messages.stream() opens a persistent connection to Anthropic and
    // yields RawMessageStreamEvent objects as the model generates text.
    // We pipe only the text deltas into a ReadableStream so the client
    // receives plain text chunks, not raw SSE events.
    const anthropic       = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const anthropicStream = anthropic.messages.stream({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     systemPrompt,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          console.error('[chat] Anthropic stream error:', err)
        } finally {
          controller.close()
        }
      },
      // Called when the client disconnects or calls reader.cancel() —
      // tells the Anthropic SDK to abort the upstream request.
      cancel() {
        anthropicStream.abort()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })

  } catch (error) {
    console.error('[chat] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
