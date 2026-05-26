'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { login } from '../actions'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  const [linkExpired] = useState(() =>
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('error') === 'link-expired'
  )

  useEffect(() => {
    if (state && 'success' in state) {
      // Hard navigation so layout.tsx re-runs on the server, reads the new
      // session cookie, and renders "Sign Out" from the very first paint.
      window.location.href = '/dashboard'
    }
  }, [state])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <span className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-violet-900/40">
              ⚡
            </span>
            <span className="text-white font-semibold text-lg tracking-tight">AgentForge</span>
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Link-expired banner */}
          {linkExpired && (
            <div className="mb-6 flex items-start gap-2.5 bg-amber-950/60 border border-amber-800/60 text-amber-300 text-sm rounded-lg px-3.5 py-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>This link has expired or already been used. Please request a new one.</span>
            </div>
          )}

          {/* noValidate disables the browser's native validation popup so our
              styled error box is the only feedback the user sees. */}
          <form action={action} noValidate className="space-y-5">

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              />
            </div>

            {/* Error message */}
            {state && 'error' in state && (
              <div className="flex items-start gap-2.5 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg px-3.5 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={pending}
              className="w-full gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[0.98]"
            >
              {pending && (
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>

          </form>
        </div>

        {/* Below-card link */}
        <p className="text-sm text-gray-500 text-center mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-gray-300 hover:text-white transition-colors">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}
