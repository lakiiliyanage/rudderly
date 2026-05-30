import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { relativeTime } from '@/lib/utils'

// Freeze time so assertions aren't flaky against a moving clock.
const FROZEN_NOW = new Date('2024-06-15T12:00:00.000Z').getTime()

function msAgo(ms: number): string {
  return new Date(FROZEN_NOW - ms).toISOString()
}

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN_NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "now" for 0 seconds ago', () => {
    expect(relativeTime(msAgo(0))).toBe('now')
  })

  it('returns seconds for values under 60 seconds (30s → "30 seconds ago")', () => {
    expect(relativeTime(msAgo(30_000))).toBe('30 seconds ago')
  })

  it('returns minutes for values between 60s and 3600s', () => {
    expect(relativeTime(msAgo(60_000))).toBe('1 minute ago')
    // 90s: Math.round(-1.5) = -1 in JS (rounds toward +∞), so still "1 minute ago"
    expect(relativeTime(msAgo(90_000))).toBe('1 minute ago')
    expect(relativeTime(msAgo(120_000))).toBe('2 minutes ago')
  })

  it('returns hours for values between 3600s and 86400s', () => {
    expect(relativeTime(msAgo(3_600_000))).toBe('1 hour ago')
    expect(relativeTime(msAgo(7_200_000))).toBe('2 hours ago')
  })

  it('returns "yesterday" for exactly 1 day ago (Intl numeric:auto)', () => {
    // Intl.RelativeTimeFormat with { numeric: 'auto' } renders -1 day as "yesterday"
    expect(relativeTime(msAgo(86_400_000))).toBe('yesterday')
  })
})
