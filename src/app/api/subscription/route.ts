import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const FREE_MESSAGE_LIMIT = 100
const FREE_AGENT_LIMIT   = 3

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised — please sign in.' }, { status: 401 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    const period = new Date().toISOString().slice(0, 7)

    const [subResult, usageResult, agentResult] = await Promise.all([
      admin.from('subscriptions').select('tier').eq('user_id', user.id).single(),
      admin.from('usage').select('message_count').eq('user_id', user.id).eq('period', period).maybeSingle(),
      admin.from('agents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const tier         = (subResult.data?.tier ?? 'free') as 'free' | 'pro'
    const messageCount = usageResult.data?.message_count ?? 0
    const agentCount   = agentResult.count ?? 0

    return NextResponse.json({
      tier,
      messageCount,
      monthlyLimit: tier === 'pro' ? null : FREE_MESSAGE_LIMIT,
      agentCount,
      agentLimit:   tier === 'pro' ? null : FREE_AGENT_LIMIT,
    })
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
