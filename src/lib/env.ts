import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'),

  ANTHROPIC_API_KEY: z
    .string()
    .startsWith('sk-ant-', 'ANTHROPIC_API_KEY must start with sk-ant-'),

  TAVILY_API_KEY: z
    .string()
    .min(1, 'TAVILY_API_KEY is missing — sign up at app.tavily.com'),

  GOOGLE_DRIVE_API_KEY: z
    .string()
    .min(1, 'GOOGLE_DRIVE_API_KEY is missing — create one at console.cloud.google.com'),
})

const result = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ANTHROPIC_API_KEY:             process.env.ANTHROPIC_API_KEY,
  TAVILY_API_KEY:                process.env.TAVILY_API_KEY,
  GOOGLE_DRIVE_API_KEY:          process.env.GOOGLE_DRIVE_API_KEY,
})

if (!result.success) {
  const missing = result.error.issues
    .map(issue => `  • ${String(issue.path[0])}: ${issue.message}`)
    .join('\n')

  throw new Error(
    `\n[AgentForge] Missing or invalid environment variables:\n${missing}\n\nFix these in .env.local and restart the dev server.\n`
  )
}

export const env = result.data
