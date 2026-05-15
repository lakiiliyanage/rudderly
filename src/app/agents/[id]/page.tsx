// Browser fires a http GET request with agents/123
// Next.js router: matches src/app/agents/[id]/page.tsx and renders the default export function AgentPage
// Extracts the id from the url (123)
// Wraps the id in the Promise
// Queries supabase for the agent with id 123 that belongs to the current user
// If found renders the page if not manages with a notFound() error


import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import DeleteButton from './DeleteButton'
import AgentChatLayout from './AgentChatLayout'
import CreatedBanner from './CreatedBanner'
import ShareDialog from '@/components/ShareDialog'
import { Badge } from '@/components/ui/badge'
import type { AgentConfig } from '@/lib/types/agent'

interface AgentPageProps {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function AgentPage({ params, searchParams }: AgentPageProps) {
  const { id }      = await params
  const { created } = await searchParams
  const showCreatedBanner = created === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, name, description, config, is_public, slug, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!agent) notFound()

  const config = (agent.config ?? {}) as AgentConfig
  const capabilityCount = config.capabilities
    ? Object.values(config.capabilities).filter(Boolean).length
    : 0

  // Capability badge list — displayed in the agent header.
  const caps = config.capabilities
  const capBadges: { key: string; label: string }[] = []
  if (caps?.webSearch)          capBadges.push({ key: 'webSearch',   label: '🔍 Web search' })
  if (caps?.calculator)         capBadges.push({ key: 'calculator',  label: '🧮 Calculator' })
  if (caps?.wordCounter)        capBadges.push({ key: 'wordCounter', label: '📝 Word counter' })
  if (caps?.documents?.enabled) capBadges.push({ key: 'documents',   label: `📄 Documents (${caps.documents.files.length})` })

  const date = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(agent.created_at))

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* ── Created banner ── */}
      {showCreatedBanner && (
        <CreatedBanner agentName={agent.name ?? 'Agent'} capabilityCount={capabilityCount} />
      )}

      {/* ── Back link ── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        My Agents
      </Link>

      {/* ── Agent header ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
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
            <p className="text-gray-600 text-xs mt-2">Created {date}</p>

            {/* Capability badges */}
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

        {/* Share + Edit + Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <ShareDialog
            agentId={id}
            initialIsPublic={agent.is_public ?? false}
            initialSlug={agent.slug ?? null}
          />
          <Link
            href={`/agents/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3.5 py-2 rounded-lg transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </Link>
          <DeleteButton agentId={id} />
        </div>
      </div>

      {/* ── Config details ── */}
      {/* TODO: render config.type, config.personality.tone/verbosity,
          config.capabilities, and config.limits once the agent edit form
          is updated to write the full AgentConfig shape */}

      {/* ── Chat + History sidebar ── */}
      <Suspense>
        <AgentChatLayout agentId={id} agentName={agent.name ?? 'Agent'} />
      </Suspense>
    </div>
  )
}
