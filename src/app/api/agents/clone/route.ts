import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — not logged in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sourceAgentId } = body as { sourceAgentId: string }

    if (!sourceAgentId) {
      return NextResponse.json(
        { error: 'sourceAgentId is required.' },
        { status: 400 }
      )
    }

    // RLS returns a row if is_public = true OR auth.uid() = user_id.
    const { data: sourceAgent } = await supabase
      .from('agents')
      .select('id, name, description, config, is_public')
      .eq('id', sourceAgentId)
      .single()

    if (!sourceAgent) {
      return NextResponse.json({ error: 'Not Found.' }, { status: 404 })
    }

    if (!sourceAgent.is_public) {
      return NextResponse.json(
        { error: 'Forbidden — this agent is private and cannot be cloned.' },
        { status: 403 }
      )
    }

    const { data: newAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        user_id:     user.id,
        name:        (sourceAgent.name ?? 'Agent') + ' (clone)',
        description: sourceAgent.description,
        config:      sourceAgent.config,
        is_public:   false,
        slug:        null,
      })
      .select('id')
      .single()

    if (insertError || !newAgent) {
      console.error('[clone] insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to clone agent — please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agentId: newAgent.id }, { status: 201 })

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
