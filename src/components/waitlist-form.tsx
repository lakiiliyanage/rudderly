'use client'

import { useState } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error'

export default function WaitlistForm() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')

    try {
      const res = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })

      if (res.status === 201)      setStatus('success')
      else if (res.status === 409) setStatus('duplicate')
      else                         setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-emerald-400 text-center">
        You&apos;re on the list! We&apos;ll be in touch.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={status === 'submitting'}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'submitting' ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Joining…
            </>
          ) : (
            'Join waitlist'
          )}
        </button>
      </form>

      {status === 'duplicate' && (
        <p className="text-sm text-amber-400">You&apos;re already subscribed.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-400">Something went wrong — try again.</p>
      )}
    </div>
  )
}
