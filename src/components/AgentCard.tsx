'use client'

import Link from 'next/link'

const PERSONALITY_BADGE: Record<string, string> = {
  Professional: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  Friendly:     'bg-green-500/15 text-green-400 border-green-500/25',
  Direct:       'bg-orange-500/15 text-orange-400 border-orange-500/25',
  Creative:     'bg-violet-500/15 text-violet-400 border-violet-500/25',
  Empathetic:   'bg-pink-500/15 text-pink-400 border-pink-500/25',
}

function relativeTime(dateStr: string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffMs = new Date(dateStr).getTime() - Date.now()
  const abs = Math.abs(diffMs)

  if (abs < 60_000)         return rtf.format(Math.round(diffMs / 1_000),          'second')
  if (abs < 3_600_000)      return rtf.format(Math.round(diffMs / 60_000),          'minute')
  if (abs < 86_400_000)     return rtf.format(Math.round(diffMs / 3_600_000),       'hour')
  if (abs < 604_800_000)    return rtf.format(Math.round(diffMs / 86_400_000),      'day')
  if (abs < 2_592_000_000)  return rtf.format(Math.round(diffMs / 604_800_000),     'week')
  if (abs < 31_536_000_000) return rtf.format(Math.round(diffMs / 2_592_000_000),  'month')
  return rtf.format(Math.round(diffMs / 31_536_000_000), 'year')
}

interface AgentCardProps {
  id: string
  name: string
  description: string
  personality: string
  createdAt: string
  onDelete?: (id: string) => void
}

export default function AgentCard({
  id, name, description, personality, createdAt, onDelete,
}: AgentCardProps) {
  const badgeCls = PERSONALITY_BADGE[personality]

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    onDelete?.(id)
  }

  return (
    <div className="group bg-gray-900 border border-gray-800 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.07)] rounded-2xl p-5 transition-all duration-200">

      {/* Name + personality badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-white font-semibold text-sm leading-tight group-hover:text-violet-300 transition-colors">
          {name || 'Untitled Agent'}
        </h2>
        {badgeCls && (
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${badgeCls}`}>
            {personality}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-4">
        {description || 'No description provided.'}
      </p>

      {/* Footer: relative date + action buttons */}
      <div className="pt-4 border-t border-gray-800/60 flex items-center justify-between gap-2">
        {/* suppressHydrationWarning: Date.now() differs between server and client renders */}
        <span className="text-gray-600 text-xs" suppressHydrationWarning>
          Created {relativeTime(createdAt)}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/agents/${id}`}
            className="text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-all"
          >
            Edit
          </Link>

          <button
            onClick={handleDelete}
            className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/60 px-2.5 py-1.5 rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      </div>

    </div>
  )
}
