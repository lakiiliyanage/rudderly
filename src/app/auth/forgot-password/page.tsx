'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const showExpiredBanner = searchParams.get('hint') === 'expired'

  const [email, setEmail]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'http://localhost:3000/auth/callback?next=/auth/reset-password',
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <span className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-violet-900/40">
              ⚡
            </span>
            <span className="text-white font-semibold text-lg tracking-tight">Rudderly</span>
          </div>

          {showExpiredBanner && (
            <div className="flex items-start gap-2.5 bg-amber-950/60 border border-amber-700/60 text-amber-300 text-sm rounded-lg px-3.5 py-3 mb-6">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>That link has expired — request a new one below.</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-900/40 border border-green-800/60 mx-auto">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Check your inbox</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                If that email has an account, a reset link is on its way. Check your inbox.
              </p>
              <p className="pt-2">
                <Link href="/auth/login" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white">Forgot your password?</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg px-3.5 py-3">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[0.98]"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>

              </form>
            </>
          )}

        </div>

        {!success && (
          <p className="text-sm text-gray-500 text-center mt-5">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        )}

      </div>
    </div>
  )
}
