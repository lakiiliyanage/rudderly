import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ShareChatPanel from './ShareChatPanel'
import CloneButton from './CloneButton'
import type { AgentConfig } from '@/lib/types/agent'

interface SharePageProps {
  params: Promise<{ slug: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params
  const supabase  = await createClient()

  // RLS allows anonymous reads of public agents.
  const { data: agent } = await supabase
    .from('agents')
    .select('id, name, description, config')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!agent) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white mb-3">Agent not available</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          This agent is no longer available. It may have been made private or deleted.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Go to AgentForge
        </Link>
      </div>
    )
  }

  // Check login state for the footer CTA (no redirect — this page is public).
  const { data: { user } } = await supabase.auth.getUser()

  const config = (agent.config ?? {}) as AgentConfig
  const caps   = config.capabilities
  const capBadges: { key: string; label: string }[] = []
  if (caps?.webSearch)          capBadges.push({ key: 'webSearch',   label: '🔍 Web search' })
  if (caps?.calculator)         capBadges.push({ key: 'calculator',  label: '🧮 Calculator' })
  if (caps?.wordCounter)        capBadges.push({ key: 'wordCounter', label: '📝 Word counter' })
  if (caps?.documents?.enabled) capBadges.push({ key: 'documents',   label: `📄 Documents (${caps.documents.files.length})` })

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* ── Shared-by banner ── */}
      <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
        <span className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center text-[10px] shrink-0">⚡</span>
        <span>Shared via <span className="text-gray-400">AgentForge</span></span>
      </div>

      {/* ── Agent header ── */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 bg-violet-600/15 rounded-2xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{agent.name ?? 'Untitled Agent'}</h1>
          {agent.description && (
            <p className="text-gray-400 text-sm mt-1 max-w-xl">{agent.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {capBadges.length > 0 ? capBadges.map(b => (
              <Badge key={b.key} variant="secondary" className="text-xs text-gray-300 bg-gray-800 border border-gray-700">
                {b.label}
              </Badge>
            )) : (
              <Badge variant="secondary" className="text-xs text-gray-500 bg-gray-800 border border-gray-700">
                💬 Chat only
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Chat ── */}
      <ShareChatPanel agentId={agent.id} agentName={agent.name ?? 'Agent'} />

      {/* ── Footer CTA ── */}
      <div className="mt-6 flex items-center justify-center gap-3 py-5 border-t border-gray-800">
        {user ? (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm text-gray-400">Like this agent?</p>
            <CloneButton agentId={agent.id} />
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Want to build your own AI agents?{' '}
            <Link
              href="/auth/signup"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Sign up free →
            </Link>
          </p>
        )}
      </div>

    </div>
  )
}
