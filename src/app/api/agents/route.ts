import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { agentSchema } from '@/lib/validations/agent'

// Next.js App Router automatically returns 405 for methods that have no
// named export, but these explicit handlers ensure the response is JSON
// with a consistent shape — not the framework's plain-text default.
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
  // Outer catch — guards against anything unexpected (malformed JSON body,
  // a thrown exception we didn't predict) so the server never crashes.
  try {

    // ── Authentication ──────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — please sign in.' },
        { status: 401 }
      )
    }

    // ── Validation ──────────────────────────────────────────────────
    const body = await request.json()
    const result = agentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error:  'Validation failed.',
          // flatten() gives { fieldErrors: { name?: string[], ... } }
          // — each field maps to an array of error messages.
          fields: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, description, config } = result.data

    // ── Database ────────────────────────────────────────────────────
    let agent
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name,
          description,
          config,
        })
        .select()   // return the inserted row
        .single()   // unwrap the array into a single object

      // Supabase signals insert failure via the error field, not a thrown
      // exception — re-throw so the catch below handles it uniformly.
      if (error) throw error

      agent = data
    } catch {
      // Raw Supabase errors (e.g. "duplicate key value violates unique
      // constraint …") can reveal table/column names. Never forward them.
      return NextResponse.json(
        { error: 'Failed to save agent — please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(agent, { status: 201 })

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
