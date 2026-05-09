import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
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

    // ── Call Claude ───────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(agentName || 'Agent', '', agentConfig)

    const anthropic  = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const response   = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply })

  } catch (error) {
    console.error('[chat/preview] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
