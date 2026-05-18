'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'

function SubscriptionBarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tier, messageCount, monthlyLimit, agentCount, agentLimit, isLoading } = useSubscription()
  const [toast, setToast]     = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  // Show success toast when redirected back from Stripe with ?upgraded=true
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setToast('Welcome to Pro! Your account has been upgraded.')
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(id)
  }, [toast])

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST' })
      const body = await res.json() as { url?: string; error?: string }
      if (!res.ok || !body.url) throw new Error(body.error ?? 'Checkout failed')
      window.location.href = body.url
    } catch (err) {
      console.error(err)
      setUpgrading(false)
    }
  }

  const messagePercent = monthlyLimit ? Math.min((messageCount / monthlyLimit) * 100, 100) : 0
  const agentPercent   = agentLimit   ? Math.min((agentCount   / agentLimit)   * 100, 100) : 0

  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {toast}
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl px-5 py-3.5 mb-8 flex items-center justify-between gap-4 flex-wrap">
        {isLoading ? (
          <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
        ) : tier === 'pro' ? (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs font-semibold px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Pro plan
            </span>
            <span className="text-sm text-gray-400">Unlimited messages and agents</span>
          </div>
        ) : (
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Free plan</span>

            {/* Messages usage */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {messageCount} / {monthlyLimit} messages
              </span>
              <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${messagePercent >= 90 ? 'bg-rose-500' : messagePercent >= 70 ? 'bg-amber-500' : 'bg-violet-500'}`}
                  style={{ width: `${messagePercent}%` }}
                />
              </div>
            </div>

            {/* Agents usage */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {agentCount} / {agentLimit} agents
              </span>
              <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${agentPercent >= 100 ? 'bg-rose-500' : agentPercent >= 67 ? 'bg-amber-500' : 'bg-violet-500'}`}
                  style={{ width: `${agentPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {tier === 'free' && (
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="shrink-0 text-xs font-semibold text-violet-400 hover:text-violet-300 border border-violet-600/40 hover:border-violet-500/60 bg-violet-600/10 hover:bg-violet-600/20 px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {upgrading ? 'Redirecting…' : 'Upgrade to Pro →'}
          </button>
        )}
      </div>
    </>
  )
}

export default function SubscriptionBar() {
  return (
    <Suspense fallback={
      <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl px-5 py-3.5 mb-8 h-12 animate-pulse" />
    }>
      <SubscriptionBarInner />
    </Suspense>
  )
}
