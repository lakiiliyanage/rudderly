import { describe, it, expect } from 'vitest'
import { agentSchema } from '@/lib/validations/agent'

const validConfig = {
  type: 'custom' as const,
  personality: { tone: 50, verbosity: 50, examplePhrases: [] },
  capabilities: {
    webSearch: false, email: false, calendar: false,
    calculator: false, wordCounter: false,
    documents: { enabled: false, files: [] },
  },
  limits: { maxMessageLength: 1000, avoidTopics: [] },
}

const validPayload = { name: 'My Agent', description: 'A test agent.', config: validConfig }

describe('agentSchema', () => {
  it('happy path: valid object → success: true', () => {
    const result = agentSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('failure: missing name → success: false, error mentions "name"', () => {
    const { name: _, ...withoutName } = validPayload
    const result = agentSchema.safeParse(withoutName)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path[0])
      expect(paths).toContain('name')
    }
  })

  it('failure: empty name → success: false', () => {
    const result = agentSchema.safeParse({ ...validPayload, name: '' })
    expect(result.success).toBe(false)
  })

  it('failure: name over 50 characters → success: false', () => {
    const result = agentSchema.safeParse({ ...validPayload, name: 'A'.repeat(51) })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues[0].message
      expect(msg).toMatch(/50 characters/)
    }
  })

  it('extra unknown field: stripped silently (schema does not use .strict())', () => {
    // Zod's default is .strip() — unknown fields are removed, parse still succeeds
    const result = agentSchema.safeParse({ ...validPayload, unknownField: 'ignored' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).unknownField).toBeUndefined()
    }
  })
})
