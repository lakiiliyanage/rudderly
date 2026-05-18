'use client'

import { useEffect, useState } from 'react'

export type SubscriptionData = {
  tier: 'free' | 'pro'
  messageCount: number
  monthlyLimit: number
  agentCount: number
  agentLimit: number
}

type UseSubscriptionResult = SubscriptionData & {
  isLoading: boolean
  error: string | null
}

export function useSubscription(): UseSubscriptionResult {
  const [data, setData]       = useState<SubscriptionData | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<SubscriptionData>
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return {
    tier:         data?.tier         ?? 'free',
    messageCount: data?.messageCount ?? 0,
    monthlyLimit: data?.monthlyLimit ?? 0,
    agentCount:   data?.agentCount   ?? 0,
    agentLimit:   data?.agentLimit   ?? 0,
    isLoading,
    error,
  }
}
