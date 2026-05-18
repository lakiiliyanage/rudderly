import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from './env'

const redis = new Redis({
  url:   env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

// Strict: 20 requests per minute per user. Used on the chat route — each call costs Anthropic credits.
export const chatRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix:    'ratelimit:chat',
})

// Lenient: 60 requests per minute per user. Used on lighter routes like agent creation.
export const apiRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix:    'ratelimit:api',
})

// Public (IP-keyed): 10 requests per minute per IP. Used on unauthenticated routes that call Claude API.
export const publicChatRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix:    'ratelimit:public-chat',
})
