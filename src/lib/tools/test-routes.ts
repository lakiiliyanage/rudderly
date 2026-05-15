// Tests for Week 9 conversation API routes.
// Run: set -a && source .env.local && set +a && npx tsx src/lib/tools/test-routes.ts
// Requires:
//   1. Dev server running at localhost:3000 (npm run dev)
//   2. SUPABASE_SERVICE_ROLE_KEY in .env.local — get it from:
//      Supabase dashboard → Project Settings → API → service_role secret
import { createClient } from '@supabase/supabase-js'

const BASE_URL    = 'http://localhost:3000'
const PROJECT_REF = 'gqqglsttnfkftsdcbcsz'
const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY           = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

let passed = 0
let failed = 0

function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`)
  if (!ok && detail) console.log(`       ${detail}`)
  ok ? passed++ : failed++
}

// @supabase/ssr reads the auth cookie as "base64-<base64url(JSON.stringify(session))>".
// Using Buffer avoids the special chars ({, ", :) that RFC 6265 restricts in cookie values.
function sessionToCookie(session: object): string {
  const encoded = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  return `sb-${PROJECT_REF}-auth-token=base64-${encoded}`
}

function authedFetch(path: string, cookie: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      ...((init.headers ?? {}) as Record<string, string>),
    },
  })
}

async function main() {
  // ── Pre-flight checks ────────────────────────────────────────────────
  if (!SERVICE_ROLE_KEY) {
    console.error([
      'SUPABASE_SERVICE_ROLE_KEY is not set.',
      'Get it from: Supabase dashboard → Project Settings → API → service_role (secret)',
      'Then add it to .env.local and re-run.',
    ].join('\n'))
    process.exit(1)
  }

  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) })
    res.body?.cancel()
  } catch {
    console.error('Dev server not reachable at localhost:3000 — run npm run dev first.')
    process.exit(1)
  }

  // ── Test user + session ──────────────────────────────────────────────
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const email    = `test-routes-${Date.now()}@agentforge.test`
  const password = 'TestPassword123!'

  const { data: { user }, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createErr || !user) {
    console.error('Failed to create test user:', createErr?.message)
    process.exit(1)
  }
  console.log(`\nTest user : ${email}`)
  console.log(`User ID   : ${user.id}`)

  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { session }, error: signInErr } = await anon.auth.signInWithPassword({ email, password })
  if (signInErr || !session) {
    await admin.auth.admin.deleteUser(user.id)
    console.error('Failed to sign in:', signInErr?.message)
    process.exit(1)
  }
  const cookie = sessionToCookie(session)

  // ── Test agent ────────────────────────────────────────────────────────
  const { data: agent, error: agentErr } = await admin
    .from('agents')
    .insert({
      user_id:     user.id,
      name:        'Test Agent (test-routes)',
      description: 'Created by test-routes.ts — safe to delete',
      config: {
        type: 'custom',
        personality: { tone: 50, verbosity: 50, examplePhrases: [] },
        capabilities: {
          webSearch: false, email: false, calendar: false,
          calculator: false, wordCounter: false,
          documents: { enabled: false, files: [] },
        },
        limits: { maxMessageLength: 1000, avoidTopics: [] },
      },
    })
    .select()
    .single()

  if (agentErr || !agent) {
    await admin.auth.admin.deleteUser(user.id)
    console.error('Failed to create test agent:', agentErr?.message)
    process.exit(1)
  }
  console.log(`Agent ID  : ${agent.id}\n`)

  let conversationId: string | null = null

  // ── 1. POST /api/conversations → 201 ─────────────────────────────────
  {
    const res  = await authedFetch('/api/conversations', cookie, {
      method: 'POST',
      body:   JSON.stringify({ agent_id: agent.id }),
    })
    const body = await res.json()
    const ok   = res.status === 201 && typeof body.id === 'string'
    check('POST /api/conversations → 201 with new conversation row', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)
    if (ok) conversationId = body.id
  }

  // ── 2. GET /api/conversations?agentId=[id] → 200 ─────────────────────
  {
    const res  = await authedFetch(`/api/conversations?agentId=${agent.id}`, cookie)
    const body = await res.json()
    check('GET /api/conversations?agentId=[id] → 200 with array',
      res.status === 200 && Array.isArray(body),
      `status=${res.status} body=${JSON.stringify(body)}`)
  }

  // ── 3. POST /api/conversations/[id]/messages → 201 ───────────────────
  let messageSaved = false
  if (conversationId) {
    const res  = await authedFetch(`/api/conversations/${conversationId}/messages`, cookie, {
      method: 'POST',
      body:   JSON.stringify({ role: 'user', content: 'Hello' }),
    })
    const body = await res.json()
    const ok   = res.status === 201 && body.role === 'user' && body.content === 'Hello'
    check('POST /api/conversations/[id]/messages → 201 with saved message', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)
    messageSaved = ok
  } else {
    check('POST /api/conversations/[id]/messages → 201', false, 'skipped — no conversation ID')
  }

  // ── 4. GET /api/conversations/[id] → 200 with messages ───────────────
  if (conversationId) {
    const res  = await authedFetch(`/api/conversations/${conversationId}`, cookie)
    const body = await res.json()
    const ok   = res.status === 200
      && typeof body.conversation?.id === 'string'
      && Array.isArray(body.messages)
      && (!messageSaved || body.messages.length > 0)
    check('GET /api/conversations/[id] → 200 with { conversation, messages }', ok,
      `status=${res.status} messages=${body.messages?.length ?? 'n/a'}`)
  } else {
    check('GET /api/conversations/[id] → 200', false, 'skipped — no conversation ID')
  }

  // ── 5. No auth → 401 on every route ──────────────────────────────────
  const id = conversationId ?? 'aaaaaaaa-0000-0000-0000-000000000000'
  const unauthCases: [string, string, string?][] = [
    ['GET',    `/api/conversations?agentId=${agent.id}`],
    ['POST',   '/api/conversations',                     JSON.stringify({})],
    ['GET',    `/api/conversations/${id}`],
    ['PATCH',  `/api/conversations/${id}`,               JSON.stringify({ title: 'x' })],
    ['DELETE', `/api/conversations/${id}`],
    ['POST',   `/api/conversations/${id}/messages`,      JSON.stringify({})],
  ]
  for (const [method, path, body] of unauthCases) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    check(`${method} ${path} (no auth) → 401`, res.status === 401, `got ${res.status}`)
  }

  // ── Cleanup ───────────────────────────────────────────────────────────
  console.log('\nCleaning up...')
  if (conversationId) await admin.from('conversations').delete().eq('id', conversationId)
  await admin.from('agents').delete().eq('id', agent.id)
  await admin.auth.admin.deleteUser(user.id)
  console.log('Done.\n')

  console.log(`${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch(err => { console.error(err); process.exit(1) })
