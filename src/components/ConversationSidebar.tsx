'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trash2, X } from 'lucide-react'

type Conversation = {
  id:         string
  title:      string | null
  created_at: string
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function Skeleton() {
  return (
    <div className="px-2 py-2.5 rounded-lg space-y-1.5">
      <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4" />
      <div className="h-2.5 bg-gray-800/60 rounded animate-pulse w-1/3" />
    </div>
  )
}

export default function ConversationSidebar({
  agentId,
  isOpen,
  onClose,
}: {
  agentId: string
  isOpen:  boolean
  onClose: () => void
}) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeId     = searchParams.get('c')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading,     setIsLoading]     = useState(true)

  useEffect(() => {
    fetch(`/api/conversations?agentId=${agentId}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: Conversation[]) => setConversations(data))
      .catch(() => setConversations([]))
      .finally(() => setIsLoading(false))
  }, [agentId])

  function navigate(href: string) {
    router.push(href)
    onClose()
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation?')) return
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setConversations(prev => prev.filter(c => c.id !== id))
    if (id === activeId) router.push(`/agents/${agentId}`)
  }

  const content = (
    <div className="flex flex-col h-full">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800 shrink-0">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">History</span>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="md:hidden text-gray-600 hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── New conversation ── */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={() => navigate(`/agents/${agentId}`)}
          className="w-full text-left text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 rounded-lg px-3 py-2 transition-all"
        >
          + New conversation
        </button>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {isLoading ? (
          <>{[0, 1, 2].map(i => <Skeleton key={i} />)}</>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-gray-600 text-center pt-8">No conversations yet</p>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/agents/${agentId}?c=${conv.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/agents/${agentId}?c=${conv.id}`) }}
              className={`group w-full text-left px-2 py-2 rounded-lg transition-colors flex items-start justify-between gap-1 cursor-pointer ${
                conv.id === activeId
                  ? 'bg-violet-500/15 text-white'
                  : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                {conv.title ? (
                  <p className="text-xs font-medium leading-snug truncate">{conv.title}</p>
                ) : (
                  <p className="text-xs leading-snug truncate italic text-gray-500">New conversation</p>
                )}
                <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(conv.created_at)}</p>
              </div>
              <button
                onClick={e => handleDelete(e, conv.id)}
                aria-label="Delete conversation"
                className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all mt-0.5 p-0.5 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always visible at md+ */}
      <div className="hidden md:flex flex-col w-52 shrink-0 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden self-start">
        {content}
      </div>

      {/* Mobile drawer — fixed overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 shadow-2xl flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  )
}
