import slugify from 'slugify'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

const methodNotAllowed = () =>
  NextResponse.json(
    { error: 'Method not allowed.' },
    { status: 405, headers: { Allow: 'PATCH' } }
  )

export const GET    = methodNotAllowed
export const POST   = methodNotAllowed
export const PUT    = methodNotAllowed
export const DELETE = methodNotAllowed

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised — not logged in.' }, { status: 401 })
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id, user_id, name, is_public, slug')
      .eq('id', id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Not Found.' }, { status: 404 })
    }

    if (agent.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden — not your agent.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isPublic } = body as { isPublic: boolean }

    let slug: string | null = agent.slug

    // Only generate a slug the first time the agent is made public.
    if (isPublic && !slug) {
      let candidate = slugify(agent.name ?? 'agent', { lower: true, strict: true })

      const { data: conflict } = await supabase
        .from('agents')
        .select('id')
        .eq('slug', candidate)
        .single()

      if (conflict) {
        candidate = candidate + '-' + Math.random().toString(16).slice(2, 6)
      }

      slug = candidate
    }

    const update: { is_public: boolean; slug?: string } = { is_public: isPublic }
    if (isPublic && !agent.slug && slug) {
      update.slug = slug
    }

    const { error: updateError } = await supabase
      .from('agents')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    return NextResponse.json(
      { is_public: isPublic, slug, publicUrl: '/share/' + slug },
      { status: 200 }
    )

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
