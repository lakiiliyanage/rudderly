'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { AgentConfig } from '@/lib/types/agent'

export type PublicAgent = {
  id:          string
  name:        string
  description: string | null
  config:      AgentConfig
  slug:        string | null
  created_at:  string
}

type FilterKey = 'all' | 'webSearch' | 'calculator' | 'documents'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'webSearch',  label: 'Web search' },
  { key: 'calculator', label: 'Calculator' },
  { key: 'documents',  label: 'Documents' },
]

function truncate(str: string | null, max: number): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}

function CapBadges({ config }: { config: AgentConfig }) {
  const caps = config.capabilities
  const badges: { key: string; label: string }[] = []
  if (caps.webSearch)          badges.push({ key: 'webSearch',   label: '🔍 Web search' })
  if (caps.calculator)         badges.push({ key: 'calculator',  label: '🧮 Calculator' })
  if (caps.wordCounter)        badges.push({ key: 'wordCounter', label: '📝 Word counter' })
  if (caps.documents?.enabled) badges.push({ key: 'documents',   label: '📄 Documents' })

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.length > 0 ? badges.map(b => (
        <Badge key={b.key} variant="secondary" className="text-xs text-gray-300 bg-gray-800 border border-gray-700">
          {b.label}
        </Badge>
      )) : (
        <Badge variant="secondary" className="text-xs text-gray-500 bg-gray-800 border border-gray-700">
          💬 Chat only
        </Badge>
      )}
    </div>
  )
}

function AgentExploreCard({ agent }: { agent: PublicAgent }) {
  return (
    <div className="group bg-gray-900 border border-gray-800 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.07)] rounded-2xl p-5 transition-all duration-200 flex flex-col">
      <h2 className="text-white font-semibold text-sm leading-tight group-hover:text-violet-300 transition-colors mb-2">
        {agent.name || 'Untitled Agent'}
      </h2>
      <p className="text-gray-400 text-xs leading-relaxed mb-3 flex-1">
        {truncate(agent.description, 100) || 'No description provided.'}
      </p>
      <CapBadges config={agent.config} />
      <div className="mt-4 pt-4 border-t border-gray-800/60">
        {agent.slug ? (
          <Link
            href={`/share/${agent.slug}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            Try it →
          </Link>
        ) : (
          <span className="text-xs text-gray-600">Link unavailable</span>
        )}
      </div>
    </div>
  )
}

export default function ExploreClient({ agents }: { agents: PublicAgent[] }) {
  const [query,  setQuery]  = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    return agents.filter(agent => {
      const caps = agent.config.capabilities

      if (filter === 'webSearch'  && !caps.webSearch)         return false
      if (filter === 'calculator' && !caps.calculator)         return false
      if (filter === 'documents'  && !caps.documents?.enabled) return false

      if (query.trim()) {
        const q = query.toLowerCase()
        const nameMatch = agent.name.toLowerCase().includes(q)
        const descMatch = (agent.description ?? '').toLowerCase().includes(q)
        if (!nameMatch && !descMatch) return false
      }

      return true
    })
  }, [agents, query, filter])

  return (
    <>
      {/* ── Search + filter row ── */}
      <div className="mb-8 space-y-3">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search agents by name or description…"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f.key
                  ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards / empty states ── */}
      {agents.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-4">No public agents yet. Be the first to share one!</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            Go to your dashboard →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No agents match your search or filter.</p>
          <button
            onClick={() => { setQuery(''); setFilter('all') }}
            className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <AgentExploreCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </>
  )
}
