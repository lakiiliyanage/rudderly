import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'

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

    // ── Load subscription ───────────────────────────────────────────
    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      )
    }

    const { data: subscription, error: subError } = await admin
      .from('subscriptions')
      .select('tier, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError) {
      return NextResponse.json(
        { error: 'Failed to load subscription.' },
        { status: 500 }
      )
    }

    if (subscription?.tier === 'pro') {
      return NextResponse.json(
        { error: 'Already on Pro plan' },
        { status: 400 }
      )
    }

    // ── Look up or create Stripe customer ───────────────────────────
    let stripeCustomerId = subscription?.stripe_customer_id ?? null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      await admin
        .from('subscriptions')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    }

    // ── Create Checkout session ─────────────────────────────────────
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=true`,
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 })

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
