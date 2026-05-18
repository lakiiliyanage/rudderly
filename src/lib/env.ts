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

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'),

  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),

  STRIPE_PRO_PRICE_ID: z
    .string()
    .startsWith('price_', 'STRIPE_PRO_PRICE_ID must start with price_'),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  UPSTASH_REDIS_REST_URL: z
    .string()
    .url('UPSTASH_REDIS_REST_URL must be a valid URL'),

  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN is missing'),
})

const result = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL:           process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ANTHROPIC_API_KEY:                  process.env.ANTHROPIC_API_KEY,
  TAVILY_API_KEY:                     process.env.TAVILY_API_KEY,
  GOOGLE_DRIVE_API_KEY:               process.env.GOOGLE_DRIVE_API_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY:                  process.env.STRIPE_SECRET_KEY,
  STRIPE_PRO_PRICE_ID:                process.env.STRIPE_PRO_PRICE_ID,
  STRIPE_WEBHOOK_SECRET:              process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL:                process.env.NEXT_PUBLIC_APP_URL,
  UPSTASH_REDIS_REST_URL:             process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN:           process.env.UPSTASH_REDIS_REST_TOKEN,
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
