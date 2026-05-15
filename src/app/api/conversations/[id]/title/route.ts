import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised — not logged in.' }, { status: 401 })
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
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = await request.json()
    const { userMessage, assistantMessage } = body as {
      userMessage:      string
      assistantMessage: string
    }

    if (!userMessage || !assistantMessage) {
      return NextResponse.json({ error: 'userMessage and assistantMessage are required.' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages:   [{
        role:    'user',
        content: `Here is the first exchange from a chat conversation:

User: ${userMessage}

A: ${assistantMessage.slice(0, 200)}

Generate a short title for this conversation. Rules:
- 3 to 6 words maximum
- Descriptive of the topic, not generic (not "Chat" or "Conversation")
- No punctuation at the end
- Return only the title, nothing else`,
      }],
    })

    const firstBlock = response.content[0]
    const title = firstBlock.type === 'text' ? firstBlock.text.trim() : null

    if (!title) {
      return NextResponse.json({ error: 'Failed to generate title.' }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({ title }, { status: 200 })

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
