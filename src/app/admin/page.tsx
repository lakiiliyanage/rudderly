'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type DauEntry = { day: string; dau: number }

type Stats = {
  totalUsers:        number
  totalAgents:       number
  messagesThisMonth: number
  proSubscribers:    number
  revenueThisMonth:  number  // cents
  dau:               DauEntry[]
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-gray-800 border border-gray-700/60 rounded-2xl px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function DauChart({ dau }: { dau: DauEntry[] }) {
  const maxDau = Math.max(...dau.map(d => d.dau), 1)

  return (
    <div className="bg-gray-800 border border-gray-700/60 rounded-2xl px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Daily Active Users — last 7 days</p>
      {dau.length === 0 ? (
        <p className="text-sm text-gray-600">No activity data yet.</p>
      ) : (
        <div className="flex items-end gap-2 h-20">
          {dau.map(({ day, dau: count }) => (
            <div key={day} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs text-gray-400 tabular-nums">{count}</span>
              <div
                className="w-full bg-violet-500 rounded-t-sm min-h-[4px]"
                style={{ height: `${Math.max(Math.round((count / maxDau) * 64), 4)}px` }}
              />
              <span className="text-xs text-gray-600 tabular-nums">{day.slice(5)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async res => {
        if (res.status === 401) { router.replace('/auth/login'); return }
        if (res.status === 403) { setError('Not authorised'); return }
        if (!res.ok)            { setError('Failed to load stats.'); return }
        const data = await res.json() as Stats
        setStats(data)
      })
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-1">{error}</p>
          <p className="text-sm text-gray-500">This page is restricted to admins.</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const freeUsers = stats.totalUsers - stats.proSubscribers
  const mrr       = (stats.revenueThisMonth / 100).toLocaleString('en-US', {
    style:    'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Admin</span>
          </div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · live stats
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Total users"
            value={stats.totalUsers.toLocaleString()}
          />
          <StatCard
            label="Total agents"
            value={stats.totalAgents.toLocaleString()}
          />
          <StatCard
            label="Messages this month"
            value={stats.messagesThisMonth.toLocaleString()}
          />
          <StatCard
            label="Pro subscribers"
            value={stats.proSubscribers.toLocaleString()}
            sub={`${stats.totalUsers > 0 ? Math.round((stats.proSubscribers / stats.totalUsers) * 100) : 0}% of users`}
          />
          <StatCard
            label="Free users"
            value={freeUsers.toLocaleString()}
            sub={`${stats.totalUsers > 0 ? Math.round((freeUsers / stats.totalUsers) * 100) : 0}% of users`}
          />
          <StatCard
            label="MRR"
            value={mrr}
            sub="successful charges this month"
          />
        </div>

        {/* DAU chart */}
        <DauChart dau={stats.dau} />

      </div>
    </div>
  )
}
