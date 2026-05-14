import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { dispatchToolCall } from '@/lib/tools/runner'
import type { ToolLogCore } from '@/lib/tools/runner'

const ALLOWED_EMAIL = 'liyanage.lakii@gmail.com'

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

    if (!user || user.email !== ALLOWED_EMAIL) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = await request.json() as {
      tool:  string
      input: Record<string, unknown>
    }

    if (!body.tool || typeof body.tool !== 'string') {
      return NextResponse.json({ error: 'Missing tool name.' }, { status: 400 })
    }

    // For document_reader, allow whatever fileId is being tested.
    // This route is only accessible to the admin email, so no security risk.
    const fileId = body.input?.fileId as string | undefined
    const allowedFileIds = fileId ? [fileId] : []

    const logger = (core: ToolLogCore) => {
      void supabase
        .from('tool_logs')
        .insert({ ...core, user_id: user.id, agent_id: null })
        .then(({ error }) => { if (error) console.error('[tool_logs]', error) }, err => console.error('[tool_logs]', err))
    }

    const result = await dispatchToolCall(body.tool, body.input ?? {}, { allowedFileIds, logger })

    return NextResponse.json({ result })

  } catch (error) {
    console.error('[tools/test] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
