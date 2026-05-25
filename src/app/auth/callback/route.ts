import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=link-expired', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=link-expired', request.url))
  }

  // Send welcome email only on first-ever signup confirmation, not on password reset.
  // Password reset redirects to /auth/reset-password; email confirmation defaults to /dashboard.
  console.log('[CALLBACK] route hit, next=', next)
  if (next !== '/auth/reset-password') {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[CALLBACK] user=', user?.email, 'created_at=', user?.created_at)
    if (user?.email && user.created_at) {
      const ageMs = Date.now() - new Date(user.created_at).getTime()
      console.log('[CALLBACK] ageMs=', ageMs, '(limit=600000)')
      // created_at within 10 minutes means this is a fresh signup confirmation, not a re-login
      if (ageMs < 10 * 60 * 1000) {
        console.log('[CALLBACK] sending welcome email to', user.email)
        await sendWelcomeEmail(user.email, user.user_metadata?.name as string | undefined)
        console.log('[CALLBACK] sendWelcomeEmail returned')
      } else {
        console.log('[CALLBACK] skipping welcome email — account too old')
      }
    } else {
      console.log('[CALLBACK] skipping welcome email — no user or created_at')
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
