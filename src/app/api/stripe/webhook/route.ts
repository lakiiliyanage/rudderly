import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

const methodNotAllowed = () =>
  NextResponse.json(
    { error: 'Method not allowed.' },
    { status: 405, headers: { Allow: 'POST' } }
  )

export const GET    = methodNotAllowed
export const PUT    = methodNotAllowed
export const PATCH  = methodNotAllowed
export const DELETE = methodNotAllowed

// Public route — Stripe signs every request; we verify before touching the DB.
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json(
      { error: "Bad Request — missing stripe-signature header." },
      { status: 400 }
    )
  }

  // Signature verification requires the raw body (pre-parse bytes).
  // Next.js App Router does not auto-parse, so request.text() is safe here.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json(
      { error: "Bad Request — signature doesn't match." },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session    = event.data.object as Stripe.Checkout.Session
        const userId     = session.metadata?.supabase_user_id
        const customerId = session.customer as string | null
        if (userId && customerId) {
          await admin
            .from('subscriptions')
            .update({
              tier:                   'pro',
              stripe_customer_id:     customerId,
              stripe_subscription_id: session.subscription as string,
              updated_at:             new Date().toISOString(),
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const tier       = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free'
        await admin
          .from('subscriptions')
          .update({
            tier,
            stripe_subscription_id: sub.id,
            updated_at:             new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        await admin
          .from('subscriptions')
          .update({
            tier:                   'free',
            stripe_subscription_id: null,
            updated_at:             new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      // All other events acknowledged but ignored.
    }
  } catch (err) {
    console.error('[stripe/webhook] DB update failed:', err)
    return NextResponse.json({ error: 'Internal error processing event.' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
