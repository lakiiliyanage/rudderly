import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'
import { sendUpgradeEmail } from '@/lib/email'

// Force Node.js runtime — required for Stripe signature verification (crypto module).
export const runtime = 'nodejs'
// Disable static caching — webhook events must always be processed fresh.
export const dynamic = 'force-dynamic'

const methodNotAllowed = () =>
  NextResponse.json(
    { error: 'Method not allowed.' },
    { status: 405, headers: { Allow: 'POST' } }
  )

export const GET    = methodNotAllowed
export const PUT    = methodNotAllowed
export const PATCH  = methodNotAllowed
export const DELETE = methodNotAllowed

// SECURITY: accepted risk — no rate limit. Every request is cryptographically verified
// via Stripe's HMAC signature before any DB work; unsigned requests are rejected immediately.
export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  // stripe.webhooks.constructEvent validates the HMAC in the stripe-signature header.
  // If the signature doesn't match — tampered payload or wrong secret — reject immediately.
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[STRIPE WEBHOOK] Received:', event.type)

  const supabaseAdmin = createAdminClient()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) { console.error('[STRIPE] Missing supabase_user_id in metadata'); break }

      // current_period_end is a Unix timestamp (seconds). Stripe SDK types moved it
      // in API version 2026-04-22.dahlia, so we read it dynamically.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEnd = (sub as any).current_period_end as number | undefined

      await supabaseAdmin.from('subscriptions').upsert({
        user_id:                userId,
        stripe_customer_id:     sub.customer as string,
        stripe_subscription_id: sub.id,
        tier:                   sub.status === 'active' ? 'pro' : 'free',
        current_period_end:     periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at:             new Date().toISOString(),
      }, { onConflict: 'user_id' })

      // Send upgrade email only on new subscriptions, not on renewals/updates.
      if (event.type === 'customer.subscription.created' && sub.status === 'active') {
        try {
          const customer = await stripe.customers.retrieve(sub.customer as string)
          const email = (customer as Stripe.Customer).email
          if (email) await sendUpgradeEmail(email)
        } catch (err) {
          console.error('[EMAIL] Failed to send upgrade email:', err)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) { console.error('[STRIPE] Missing supabase_user_id in metadata'); break }

      await supabaseAdmin.from('subscriptions').update({
        tier:                   'free',
        stripe_subscription_id: null,
        current_period_end:     null,
        updated_at:             new Date().toISOString(),
      }).eq('user_id', userId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('[STRIPE] Payment failed for customer:', invoice.customer)
      // The actual downgrade happens when subscription.deleted fires after Stripe's retry period.
      break
    }

    default:
      break
  }

  // Always return 200 — Stripe retries any non-2xx response.
  return NextResponse.json({ received: true }, { status: 200 })
}
