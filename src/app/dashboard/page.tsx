import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AgentGrid, { type GridAgent } from '@/components/AgentGrid'
import SubscriptionBar from '@/components/SubscriptionBar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // personality lives inside the config jsonb column, not a direct column —
  // select config and extract it into the flat GridAgent shape below.
  const { data: rawAgents } = await supabase
    .from('agents')
    .select('id, name, description, config, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const agents: GridAgent[] = (rawAgents ?? []).map(row => ({
    id:          row.id,
    name:        row.name        ?? '',
    description: row.description ?? '',
    personality: (row.config as { personality?: string } | null)?.personality ?? '',
    created_at:  row.created_at,
  }))

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* ── Subscription status bar ── */}
      <SubscriptionBar />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">🚀 My Agents</h1>
          <p className="text-gray-400 text-sm mt-1">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Link
          href="/agents/new"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Agent
        </Link>
      </div>

      {/* ── Grid or empty state (managed client-side by AgentGrid) ── */}
      <AgentGrid initialAgents={agents} />

    </div>
  )
}
