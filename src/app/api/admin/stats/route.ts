import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe }            from '@/lib/stripe'
import { NextResponse }      from 'next/server'
import { apiRatelimit }      from '@/lib/ratelimit'

const ADMIN_EMAILS = ['liyanage.lakii@gmail.com']

const methodNotAllowed = () =>
  NextResponse.json(
    { error: 'Method not allowed.' },
    { status: 405, headers: { Allow: 'GET' } }
  )

export const POST   = methodNotAllowed
export const PUT    = methodNotAllowed
export const PATCH  = methodNotAllowed
export const DELETE = methodNotAllowed

export async function GET() {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    if (!ADMIN_EMAILS.includes(user.email ?? '')) {
      return NextResponse.json({ error: 'Forbidden — not an admin.' }, { status: 403 })
    }

    // ── Rate limit ──────────────────────────────────────────────────────────
    // Each call fans out to 6 DB queries + Stripe API — limit even for admins.
    const { success } = await apiRatelimit.limit(user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    // ── Service-role client ─────────────────────────────────────────────
    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    const period         = new Date().toISOString().slice(0, 7)            // YYYY-MM
    const sevenDaysAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const now            = new Date()
    const firstOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfMonthTs = Math.floor(firstOfMonth.getTime() / 1000)

    // ── Parallel DB + Stripe queries ────────────────────────────────────
    const [
      totalUsersRes,
      totalAgentsRes,
      usageThisMonthRes,
      proCountRes,
      recentUsageRes,
      chargesRes,
    ] = await Promise.all([
      // Total users — subscriptions is 1-to-1 with auth.users (trigger on signup)
      admin.from('subscriptions').select('*', { count: 'exact', head: true }),
      admin.from('agents').select('*', { count: 'exact', head: true }),
      admin.from('usage').select('message_count').eq('period', period),
      admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'pro'),
      admin.from('usage').select('user_id, updated_at').gt('updated_at', sevenDaysAgo),
      stripe.charges.list({ created: { gte: firstOfMonthTs }, limit: 100 }),
    ])

    // ── Compute stats ───────────────────────────────────────────────────
    const totalUsers       = totalUsersRes.count ?? 0
    const totalAgents      = totalAgentsRes.count ?? 0
    const messagesThisMonth = (usageThisMonthRes.data ?? [])
      .reduce((sum, row) => sum + (row.message_count ?? 0), 0)
    const proSubscribers   = proCountRes.count ?? 0

    // Revenue: sum paid, non-refunded charges (amounts are in cents)
    const revenueThisMonth = chargesRes.data
      .filter(c => c.paid && !c.refunded)
      .reduce((sum, c) => sum + c.amount, 0)

    // DAU: group usage rows by calendar day, count distinct user_ids per day
    const dauMap: Record<string, Set<string>> = {}
    for (const row of recentUsageRes.data ?? []) {
      const day = (row.updated_at as string).slice(0, 10)
      if (!dauMap[day]) dauMap[day] = new Set()
      dauMap[day].add(row.user_id as string)
    }
    const dau = Object.entries(dauMap)
      .map(([day, users]) => ({ day, dau: users.size }))
      .sort((a, b) => a.day.localeCompare(b.day))

    return NextResponse.json({
      totalUsers,
      totalAgents,
      messagesThisMonth,
      proSubscribers,
      revenueThisMonth,  // cents
      dau,
    }, { status: 200 })

  } catch (err) {
    console.error('[admin/stats]', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
