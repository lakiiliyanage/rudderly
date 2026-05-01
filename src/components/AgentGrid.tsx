'use client'

import { useState, useEffect } from 'react'
import AgentCard from './AgentCard'
import EmptyState from './EmptyState'

export type GridAgent = {
  id: string
  name: string
  description: string
  personality: string
  created_at: string
}

export default function AgentGrid({ initialAgents }: { initialAgents: GridAgent[] }) {
  const [agents, setAgents] = useState(initialAgents)
  const [toast, setToast]   = useState<string | null>(null)

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4_000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleDelete(id: string) {
    const idx     = agents.findIndex(a => a.id === id)
    const removed = agents[idx]

    // Optimistic: remove the card immediately so the UI feels instant
    setAgents(prev => prev.filter(a => a.id !== id))

    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      // Restore the card at its original position and surface the error
      setAgents(prev => {
        const next = [...prev]
        next.splice(idx, 0, removed)
        return next
      })
      setToast('Failed to delete agent — please try again.')
    }
  }

  return (
    <>
      {agents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              id={agent.id}
              name={agent.name}
              description={agent.description}
              personality={agent.personality}
              createdAt={agent.created_at}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Toast — floats at the bottom centre of the viewport */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 border border-red-800/60 text-red-300 text-sm rounded-xl px-4 py-3 shadow-xl shadow-black/40 whitespace-nowrap">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="ml-1 text-red-400/60 hover:text-red-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
