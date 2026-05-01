import { z } from 'zod'

export const PERSONALITIES = [
  'Professional',
  'Friendly',
  'Direct',
  'Creative',
  'Empathetic',
] as const

// Single source of truth for agent validation rules.
// Imported by the form (client-side) and the API route (server-side) so the
// rules can never drift apart between the two.
export const agentSchema = z.object({
  name: z.string()
    .trim()
    .min(3,  'Name must be at least 3 characters.')
    .max(50, 'Name must be 50 characters or fewer.'),

  description: z.string()
    .trim()
    .min(10,  'Description must be at least 10 characters.')
    .max(200, 'Description must be 200 characters or fewer.'),

  // z.enum() enforces the exact set of allowed values at the type level.
  // Any value outside this tuple — including an empty string — fails parsing.
  personality: z.enum(PERSONALITIES),

  goal: z.string()
    .trim()
    .min(5,   'Goal must be at least 5 characters.')
    .max(150, 'Goal must be 150 characters or fewer.'),
})

// Infer the TypeScript type directly from the schema — no manual interface needed.
// result.data will always match this type when safeParse() succeeds.
export type AgentFormData = z.infer<typeof agentSchema>
