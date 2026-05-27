'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [loading, setLoading]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
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

          {success ? (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-900/40 border border-green-800/60 mx-auto">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Password updated</h1>
              <p className="text-gray-400 text-sm">
                Password updated successfully — taking you to your dashboard.
              </p>
              <div className="flex justify-center pt-1">
                <svg className="animate-spin h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white">Set new password</h1>
                <p className="text-gray-400 text-sm mt-1">Choose a password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-300">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
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
                  {loading ? 'Updating…' : 'Update password'}
                </Button>

              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
