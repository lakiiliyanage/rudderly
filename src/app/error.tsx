'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to Sentry / console in production
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">

      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <span className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-sm">
          ⚡
        </span>
        <span className="font-semibold text-white">AgentForge</span>
      </div>

      {/* Icon */}
      <div className="w-16 h-16 bg-rose-600/15 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-white mb-3">Something went wrong</h1>
      <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
        An unexpected error occurred. You can try again or head back to the dashboard.
      </p>

      {/* Error detail for debugging */}
      {error.message && (
        <pre className="mb-8 max-w-lg w-full text-left bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-rose-300 overflow-x-auto">
          {error.message}
        </pre>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-medium px-6 py-3 rounded-xl transition-all"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-6 py-3 rounded-xl transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
