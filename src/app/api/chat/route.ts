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

    // ── Anthropic call ────────────────────────────────────────────────
    let reply: string
    try {
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

      const response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     systemPrompt,
        messages,
      })

      reply = (response.content[0] as Anthropic.TextBlock).text
    } catch (error) {
      console.error('[chat] Anthropic API error:', error)
      return NextResponse.json(
        { error: "We're having trouble connecting to our AI service right now. Please try again in a moment." },
        { status: 503 }
      )
    }

    return NextResponse.json({ reply }, { status: 200 })

  } catch (error) {
    console.error('[chat] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
