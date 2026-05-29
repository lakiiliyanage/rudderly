import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const email = parsed.data.email

  // Insert into waitlist table using the service role (bypasses RLS).
  // A primary-key conflict (23505) means the email is already subscribed.
  const admin = createAdminClient()
  if (!admin) {
    console.error('[WAITLIST] Admin client unavailable — check SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { error: dbError } = await admin
    .from('waitlist')
    .insert({ email, source: 'website' })

  if (dbError) {
    if (dbError.code === '23505') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
    }
    console.error('[WAITLIST] DB insert error:', dbError.message)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }

  // Row inserted — now sync to Resend. A failure here is non-fatal; the
  // email is already captured in the DB so the signup isn't lost.
  const resend = new Resend(env.RESEND_API_KEY)
  const { error: resendError } = await resend.contacts.create({
    email,
    unsubscribed: false,
  })

  if (resendError) {
    const { name, message, statusCode } = resendError as { name?: string; message?: string; statusCode?: number }
    console.error('[WAITLIST] Resend sync error (non-fatal):', JSON.stringify({ name, message, statusCode }))
  } else {
    console.log('[WAITLIST] subscribed:', email)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
