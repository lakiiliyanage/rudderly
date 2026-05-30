import { describe, it, expect, afterEach, vi } from 'vitest'

// env.ts runs validation at module-evaluation time and throws if vars are missing.
// vi.resetModules() forces a fresh evaluation on each dynamic import.

afterEach(() => {
  vi.resetModules()
})

describe('env validation', () => {
  it('loads without throwing when all required vars are present', async () => {
    // setup.ts (runs before every test) sets all required vars
    vi.resetModules()
    const mod = await import('@/lib/env')
    expect(mod.env).toBeDefined()
    expect(mod.env.ANTHROPIC_API_KEY).toBe('sk-ant-test-key')
  })

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    const original = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    vi.resetModules()
    await expect(import('@/lib/env')).rejects.toThrow('ANTHROPIC_API_KEY')

    // Restore so subsequent tests are unaffected
    process.env.ANTHROPIC_API_KEY = original
  })
})
