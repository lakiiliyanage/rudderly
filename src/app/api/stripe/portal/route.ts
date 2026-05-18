import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'

// SECURITY: accepted risk — no route-level rate limit. Portal sessions are read-only
// from our DB perspective; Stripe handles idempotency and session expiry.
export async function POST() {
  try {
    // ── Auth ────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised — please sign in.' },
        { status: 401 }
      )
    }

    // ── Load stripe_customer_id ─────────────────────────────────────
    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      )
    }

    const { data: subscription } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const stripeCustomerId = subscription?.stripe_customer_id ?? null

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found — please upgrade first.' },
        { status: 400 }
      )
    }

    // ── Create portal session ───────────────────────────────────────
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url }, { status: 200 })

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
