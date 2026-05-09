import { z } from 'zod'

const agentConfigSchema = z.object({
  type: z.enum(['customer-support', 'research', 'personal-assistant', 'custom']),
  personality: z.object({
    tone:           z.number().min(0).max(100),
    verbosity:      z.number().min(0).max(100),
    examplePhrases: z.array(z.string()),
  }),
  capabilities: z.object({
    webSearch:  z.boolean(),
    email:      z.boolean(),
    calendar:   z.boolean(),
    calculator: z.boolean(),
  }),
  limits: z.object({
    maxMessageLength: z.number().min(50).max(10_000),
    avoidTopics:      z.array(z.string()),
  }),
})

export const agentSchema = z.object({
  name:        z.string().trim().min(1, 'Name is required.').max(50, 'Name must be 50 characters or fewer.'),
  description: z.string().trim().max(200, 'Description must be 200 characters or fewer.').default(''),
  config:      agentConfigSchema,
})

export type AgentFormData = z.infer<typeof agentSchema>
