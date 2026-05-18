import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiRatelimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — not logged in.' },
        { status: 401 }
      )
    }

    const { success, remaining, reset } = await apiRatelimit.limit(user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait a moment.' },
        {
          status: 429,
          headers: {
            'Retry-After':          String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      )
    }

    const body = await request.json()
    const { agent_id } = body

    if (!agent_id) {
      return NextResponse.json(
        { error: 'Bad request — agent_id is required.' },
        { status: 400 }
      )
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', agent_id)
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

    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, agent_id })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(conversation, { status: 201 })
    } catch {
      return NextResponse.json(
        { error: 'Failed to create conversation — please try again.' },
        { status: 500 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — not logged in.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Bad request — agentId query param is required.' },
        { status: 400 }
      )
    }

    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return NextResponse.json(conversations, { status: 200 })
    } catch {
      return NextResponse.json(
        { error: 'Failed to load conversations — please try again.' },
        { status: 500 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
