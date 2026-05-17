import { describe, it, expect } from 'vitest'
import { generateBaseSlug, addUniqueSuffix } from '../slug'

describe('generateBaseSlug', () => {
  it("converts 'My Research Agent' to 'my-research-agent'", () => {
    expect(generateBaseSlug('My Research Agent')).toBe('my-research-agent')
  })
})

describe('slug uniqueness (two agents with identical names)', () => {
  it('produces different slugs — second gets a 4-char hex suffix', () => {
    const first  = generateBaseSlug('My Research Agent')
    const second = addUniqueSuffix(first)

    expect(first).toBe('my-research-agent')

    // Suffix is 4 hex characters (Math.random().toString(16).slice(2, 6))
    expect(second).toMatch(/^my-research-agent-[0-9a-f]{4}$/)

    expect(first).not.toBe(second)
  })
})
