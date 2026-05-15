'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CloneButton({
  agentId,
}: {
  agentId: string
}) {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [toast,   setToast]     = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleClone() {
    setLoading(true)
    setToast(null)
    try {
      const res  = await fetch('/api/agents/clone', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sourceAgentId: agentId }),
      })
      const data = await res.json() as { agentId?: string; error?: string }
      if (res.status === 201 && data.agentId) {
        router.push(`/agents/${data.agentId}`)
      } else {
        setToast(data.error ?? 'Failed to clone agent. Please try again.')
      }
    } catch {
      setToast('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClone}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-all active:scale-95"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cloning…
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
            Clone this agent to your account
          </>
        )}
      </button>

      {toast && (
        <p className="text-xs text-red-400 text-center max-w-xs">{toast}</p>
      )}
    </div>
  )
}
