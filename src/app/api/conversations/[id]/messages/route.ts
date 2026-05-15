import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { id: conversation_id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — not logged in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { role, content, tool_calls } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Bad request — role and content are required.' },
        { status: 400 }
      )
    }

    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, user_id, agent_id')
      .eq('id', conversation_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden — this conversation belongs to another user.' },
        { status: 403 }
      )
    }

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id,
          user_id: user.id,
          agent_id: conversation.agent_id,
          role,
          content,
          tool_calls: tool_calls ?? null,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(message, { status: 201 })
    } catch {
      return NextResponse.json(
        { error: 'Failed to save message — please try again.' },
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
