import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — not logged in.' },
        { status: 401 }
      )
    }

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
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
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, role, content, tool_calls, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error

      return NextResponse.json({ conversation, messages }, { status: 200 })
    } catch {
      return NextResponse.json(
        { error: 'Failed to load messages — please try again.' },
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

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — not logged in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Bad request — title is required.' },
        { status: 400 }
      )
    }

    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', id)
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
      const { data: updated, error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(updated, { status: 200 })
    } catch {
      return NextResponse.json(
        { error: 'Failed to update conversation — please try again.' },
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

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — not logged in.' },
        { status: 401 }
      )
    }

    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', id)
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
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      return NextResponse.json({ deleted: true }, { status: 200 })
    } catch {
      return NextResponse.json(
        { error: 'Failed to delete conversation — please try again.' },
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
