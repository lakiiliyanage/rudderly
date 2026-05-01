'use client'

import { useState } from 'react'
import Link from 'next/link'
import { agentSchema, PERSONALITIES } from '@/lib/validations/agent'

type FieldErrors = Partial<Record<'name' | 'description' | 'personality' | 'goal', string>>

type Banner =
  | { kind: 'session' }
  | { kind: 'error'; message: string }
  | { kind: 'network' }

// Returns the right border + ring colour depending on whether the field has an error
function inputCls(hasError: boolean, extra = '') {
  const base =
    'w-full px-3.5 py-2.5 bg-gray-950 border rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 transition-colors'
  const state = hasError
    ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/50'
    : 'border-gray-700 focus:border-violet-500 focus:ring-violet-500'
  return `${base} ${state} ${extra}`
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-red-400 text-xs mt-1.5">{message}</p>
}

function ErrorBanner({ banner }: { banner: Banner }) {
  if (banner.kind === 'session') {
    return (
      <div className="flex items-start gap-2.5 bg-amber-950/50 border border-amber-700/60 text-amber-300 text-sm rounded-lg px-3.5 py-3">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <span>
          Your session expired — please{' '}
          <Link href="/auth/login" className="underline underline-offset-2 hover:text-amber-200 transition-colors">
            sign in again
          </Link>
          .
        </span>
      </div>
    )
  }

  const message =
    banner.kind === 'network'
      ? 'Connection failed — check your internet and try again.'
      : banner.message

  return (
    <div className="flex items-start gap-2.5 bg-red-950/60 border border-red-800/60 text-red-300 text-sm rounded-lg px-3.5 py-3">
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

export default function CreateAgentForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [personality, setPersonality] = useState('')
  const [goal, setGoal] = useState('')

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<Banner | null>(null)

  function validate(): FieldErrors {
    const result = agentSchema.safeParse({ name, description, personality, goal })
    if (result.success) return {}

    const flat = result.error.flatten().fieldErrors
    return {
      name:        flat.name?.[0],
      description: flat.description?.[0],
      // Map any enum error to a plain message — Zod's default includes the full
      // list of allowed values which is too verbose for a dropdown.
      personality: flat.personality?.length ? 'Please select a valid personality.' : undefined,
      goal:        flat.goal?.[0],
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          personality,
          goal: goal.trim(),
        }),
      })

      if (res.status === 401) {
        setBanner({ kind: 'session' })
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setBanner({
          kind: 'error',
          message: data.error ?? 'Something went wrong saving your agent. Please try again.',
        })
        return
      }

      // Hard navigation so the dashboard re-fetches agents server-side
      window.location.href = '/dashboard'
    } catch {
      setBanner({ kind: 'network' })
    } finally {
      // Always reset loading — including when we early-return on 401
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white">Create Agent</h1>
        <p className="text-gray-400 text-sm mt-1">
          Define your agent&apos;s name, purpose, and personality.
        </p>
      </div>

      {/* ── Card ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Agent Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Agent Name <span className="text-violet-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              className={inputCls(!!fieldErrors.name)}
            />
            <div className="flex items-start justify-between">
              <FieldError message={fieldErrors.name} />
              <span className="text-gray-600 text-xs ml-auto tabular-nums">{name.trim().length}/50</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
              Description <span className="text-violet-400">*</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this agent do? Who is it for?"
              className={inputCls(!!fieldErrors.description, 'resize-none')}
            />
            <div className="flex items-start justify-between">
              <FieldError message={fieldErrors.description} />
              <span className="text-gray-600 text-xs ml-auto tabular-nums">{description.trim().length}/200</span>
            </div>
          </div>

          {/* Personality */}
          <div className="space-y-1.5">
            <label htmlFor="personality" className="block text-sm font-medium text-gray-300">
              Personality <span className="text-violet-400">*</span>
            </label>
            <div className="relative">
              <select
                id="personality"
                value={personality}
                onChange={e => setPersonality(e.target.value)}
                className={inputCls(!!fieldErrors.personality, 'appearance-none pr-10 cursor-pointer')}
              >
                <option value="" disabled>Select a personality…</option>
                {PERSONALITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
            <FieldError message={fieldErrors.personality} />
          </div>

          {/* Goal */}
          <div className="space-y-1.5">
            <label htmlFor="goal" className="block text-sm font-medium text-gray-300">
              Goal <span className="text-violet-400">*</span>
            </label>
            <input
              id="goal"
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Help users resolve billing issues without escalating to a human agent."
              className={inputCls(!!fieldErrors.goal)}
            />
            <div className="flex items-start justify-between">
              <FieldError message={fieldErrors.goal} />
              <span className="text-gray-600 text-xs ml-auto tabular-nums">{goal.trim().length}/150</span>
            </div>
          </div>

          {/* Error banner — shown above the submit button */}
          {banner && <ErrorBanner banner={banner} />}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-medium text-sm rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Saving…' : 'Save Agent'}
            </button>
            <Link
              href="/dashboard"
              className="py-2.5 px-5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}
