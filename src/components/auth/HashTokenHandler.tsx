'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HashTokenHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('access_token') || !hash.includes('type=recovery')) return

    const params = new URLSearchParams(hash.substring(1))
    const access_token = params.get('access_token') ?? ''
    const refresh_token = params.get('refresh_token') ?? ''

    const supabase = createClient()
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      window.history.replaceState(null, '', window.location.pathname)
      if (error) {
        router.replace('/auth/forgot-password?hint=expired')
      } else {
        router.replace('/auth/reset-password')
      }
    })
  }, [router])

  return null
}
