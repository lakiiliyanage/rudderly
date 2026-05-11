'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HashRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (window.location.hash.includes('error_code=otp_expired')) {
      router.replace('/auth/forgot-password?hint=expired')
    }
  }, [router])

  return null
}
