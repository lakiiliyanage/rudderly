import { createAdminClient } from '@/lib/supabase/admin'

const FREE_LIMITS = { messages: 100,      agents: 3        }
const PRO_LIMITS  = { messages: Infinity, agents: Infinity }

export async function getUserUsage(userId: string) {
  const admin = createAdminClient()
  if (!admin) throw new Error('Admin client unavailable')

  const period = new Date().toISOString().slice(0, 7)

  const [subResult, usageResult, agentResult] = await Promise.all([
    admin.from('subscriptions').select('tier').eq('user_id', userId).single(),
    admin.from('usage').select('message_count').eq('user_id', userId).eq('period', period).maybeSingle(),
    admin.from('agents').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const tier         = (subResult.data?.tier ?? 'free') as 'free' | 'pro'
  const limits       = tier === 'pro' ? PRO_LIMITS : FREE_LIMITS
  const messageCount = usageResult.data?.message_count ?? 0
  const agentCount   = agentResult.count ?? 0

  return {
    tier,
    messageCount,
    monthlyLimit: limits.messages,
    agentCount,
    agentLimit: limits.agents,
  }
}

// Fire-and-forget — never await this. Uses a Postgres function for an atomic
// upsert so two concurrent requests can't both read 0 and both write 1.
export function incrementMessageCount(userId: string): void {
  const admin = createAdminClient()
  if (!admin) return

  const period = new Date().toISOString().slice(0, 7)

  void admin
    .rpc('increment_message_count', { p_user_id: userId, p_period: period })
    .then(
      ({ error }) => { if (error) console.error('[usage] increment failed:', error) },
      console.error
    )
}
