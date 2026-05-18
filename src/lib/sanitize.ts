export type SanitizeResult =
  | { safe: false; reason: string }
  | { safe: true; sanitized: string; flagged?: boolean }

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /disregard\s+(your\s+)?(system\s+prompt|previous\s+instructions?|rules?)/i,
  /you\s+are\s+now\s+(a\s+)?(different|new|unrestricted|uncensored|jailbroken|DAN)/i,
  /your\s+new\s+(instructions?|rules?|directives?|prompt)\s+(are|is)\b/i,
  /<\s*system\s*>|\[INST\]|\[SYSTEM\]/i,
]

export function sanitizeUserMessage(input: string): SanitizeResult {
  if (input.length > 4000) {
    return { safe: false, reason: 'Message too long. Maximum 4,000 characters.' }
  }

  const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('[SECURITY] Possible prompt injection detected:', sanitized.slice(0, 120))
      return { safe: true, sanitized, flagged: true }
    }
  }

  return { safe: true, sanitized }
}
