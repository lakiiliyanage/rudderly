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
  if (ok) { passed++ } else { failed++ }
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
  let clonedAgentId:  string | null = null

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

  // ── Week 9 ───────────────────────────────────────────────────────────

  // ── 6. PATCH /api/agents/[id]/share { isPublic: true } → 200 + slug ──
  {
    const res  = await authedFetch(`/api/agents/${agent.id}/share`, cookie, {
      method: 'PATCH',
      body:   JSON.stringify({ isPublic: true }),
    })
    const body = await res.json()
    const ok   = res.status === 200 && typeof body.slug === 'string' && body.slug.length > 0
    check('PATCH /api/agents/[id]/share { isPublic: true } → 200 + slug', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)
  }

  // ── 7. POST /api/agents/clone (public agent) → 201 + agentId ─────────
  {
    const res  = await authedFetch('/api/agents/clone', cookie, {
      method: 'POST',
      body:   JSON.stringify({ sourceAgentId: agent.id }),
    })
    const body = await res.json()
    const ok   = res.status === 201 && typeof body.agentId === 'string'
    check('POST /api/agents/clone (public agent) → 201 + agentId', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)
    if (ok) clonedAgentId = body.agentId
  }

  // ── 8. POST /api/agents/clone (private agent) → 403 ─────────────────
  // The cloned agent is private by default (clone route sets is_public: false).
  if (clonedAgentId) {
    const res = await authedFetch('/api/agents/clone', cookie, {
      method: 'POST',
      body:   JSON.stringify({ sourceAgentId: clonedAgentId }),
    })
    check('POST /api/agents/clone (private agent) → 403', res.status === 403,
      `got ${res.status}`)
  } else {
    check('POST /api/agents/clone (private agent) → 403', false, 'skipped — clone in test 7 failed')
  }

  // ── 9. POST /api/conversations/[id]/title → 200 + title string ───────
  if (conversationId) {
    const res  = await authedFetch(`/api/conversations/${conversationId}/title`, cookie, {
      method: 'POST',
      body:   JSON.stringify({
        userMessage:      'What is the capital of France?',
        assistantMessage: 'The capital of France is Paris.',
      }),
    })
    const body = await res.json()
    const ok   = res.status === 200 && typeof body.title === 'string' && body.title.length > 0
    check('POST /api/conversations/[id]/title → 200 + title string', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)
  } else {
    check('POST /api/conversations/[id]/title → 200', false, 'skipped — no conversation ID')
  }

  // ── 10. Public chat → messages not persisted ─────────────────────────
  // Agent is public (made public in test 6). Send a message via the share
  // route — it streams but never writes to the DB. Verify zero conversations
  // were created for this agent that are not owned by our test user.
  {
    const chatRes = await fetch(`${BASE_URL}/api/share/${agent.id}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        messages: [{ role: 'user', content: 'Reply with just the word "ok".' }],
      }),
    })
    await chatRes.text() // drain the SSE stream

    // admin bypasses RLS — count conversations for this agent not owned by the test user
    const { count } = await admin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .neq('user_id', user.id)

    check(
      'POST /api/share/[agentId]/chat — public chat not persisted (0 rows in messages for public session)',
      (count ?? 0) === 0,
      `found ${count ?? 'null'} public-owned conversations for this agent`
    )
  }

  // ── 11. PATCH /api/agents/[id]/share { isPublic: false } → 200 ───────
  {
    const res  = await authedFetch(`/api/agents/${agent.id}/share`, cookie, {
      method: 'PATCH',
      body:   JSON.stringify({ isPublic: false }),
    })
    const body = await res.json()
    const ok   = res.status === 200 && body.is_public === false
    check('PATCH /api/agents/[id]/share { isPublic: false } → 200 + is_public false', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)
  }

  // ── Week 10: Stripe Checkout ─────────────────────────────────────────

  // ── 12. POST /api/stripe/checkout (no auth) → 401 ────────────────────
  {
    const res = await fetch(`${BASE_URL}/api/stripe/checkout`, { method: 'POST' })
    check('POST /api/stripe/checkout (no auth) → 401', res.status === 401, `got ${res.status}`)
  }

  // ── 13. POST /api/stripe/checkout (free user) → 200 + checkout URL ───
  {
    const res  = await authedFetch('/api/stripe/checkout', cookie, { method: 'POST' })
    const body = await res.json()
    const ok   = res.status === 200
      && typeof body.url === 'string'
      && body.url.startsWith('https://checkout.stripe.com')
    check('POST /api/stripe/checkout (free user) → 200 + checkout.stripe.com URL', ok,
      `status=${res.status} url=${body.url ?? 'missing'}`)
  }

  // ── 14. POST /api/stripe/checkout (already pro) → 400 ────────────────
  {
    await admin
      .from('subscriptions')
      .update({ tier: 'pro' })
      .eq('user_id', user.id)

    const res  = await authedFetch('/api/stripe/checkout', cookie, { method: 'POST' })
    const body = await res.json()
    check('POST /api/stripe/checkout (already pro) → 400 + Already on Pro plan',
      res.status === 400 && body.error === 'Already on Pro plan',
      `status=${res.status} body=${JSON.stringify(body)}`)

    // reset tier so cleanup is clean
    await admin
      .from('subscriptions')
      .update({ tier: 'free' })
      .eq('user_id', user.id)
  }

  // ── Week 10: Subscription API ─────────────────────────────────────────

  // ── 15. GET /api/subscription (no auth) → 401 ────────────────────────
  {
    const res = await fetch(`${BASE_URL}/api/subscription`)
    check('GET /api/subscription (no auth) → 401', res.status === 401, `got ${res.status}`)
  }

  // ── 16. GET /api/subscription (free user) → 200 with expected shape ──
  {
    const res  = await authedFetch('/api/subscription', cookie)
    const body = await res.json()
    const ok   = res.status === 200
      && body.tier === 'free'
      && typeof body.messageCount === 'number'
      && body.monthlyLimit === 100
      && typeof body.agentCount === 'number'
      && body.agentLimit === 3
    check('GET /api/subscription (free user) → 200 with free tier shape', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)
  }

  // ── 17. GET /api/subscription (pro user) → null limits ───────────────
  {
    await admin.from('subscriptions').update({ tier: 'pro' }).eq('user_id', user.id)

    const res  = await authedFetch('/api/subscription', cookie)
    const body = await res.json()
    const ok   = res.status === 200
      && body.tier === 'pro'
      && body.monthlyLimit === 5000
      && body.agentLimit === 25
    check('GET /api/subscription (pro user) → 200 with pro limits (5000/25)', ok,
      `status=${res.status} body=${JSON.stringify(body)}`)

    await admin.from('subscriptions').update({ tier: 'free' }).eq('user_id', user.id)
  }

  // ── Week 10: Usage tracking ───────────────────────────────────────────

  // ── 18. Chat → usage row inserted / incremented ───────────────────────
  // Send a real chat message and wait briefly for the fire-and-forget to land.
  {
    const chatRes = await authedFetch('/api/chat', cookie, {
      method: 'POST',
      body: JSON.stringify({
        agentId: agent.id,
        messages: [{ role: 'user', content: 'Reply with just the word "ok".' }],
      }),
    })
    // Drain the SSE stream fully before checking the DB.
    await chatRes.text()

    // Give the fire-and-forget a moment to write.
    await new Promise(r => setTimeout(r, 1500))

    const period = new Date().toISOString().slice(0, 7)
    const { data: usageRow } = await admin
      .from('usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('period', period)
      .single()

    check(
      'POST /api/chat → usage row inserted with message_count = 1',
      usageRow?.message_count === 1,
      `message_count=${usageRow?.message_count ?? 'null'}`
    )
  }

  // ── 19. Second chat message → counter increments to 2 ────────────────
  {
    const chatRes = await authedFetch('/api/chat', cookie, {
      method: 'POST',
      body: JSON.stringify({
        agentId: agent.id,
        messages: [{ role: 'user', content: 'Say "yes".' }],
      }),
    })
    await chatRes.text()
    await new Promise(r => setTimeout(r, 1500))

    const period = new Date().toISOString().slice(0, 7)
    const { data: usageRow } = await admin
      .from('usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('period', period)
      .single()

    check(
      'POST /api/chat (second message) → message_count increments to 2',
      usageRow?.message_count === 2,
      `message_count=${usageRow?.message_count ?? 'null'}`
    )
  }

  // ── Week 10: Limit enforcement ────────────────────────────────────────

  // ── 20. Chat under message limit → 200 (streams normally) ────────────
  {
    const period = new Date().toISOString().slice(0, 7)
    await admin.from('usage').upsert({ user_id: user.id, period, message_count: 50 }, { onConflict: 'user_id,period' })

    const res = await authedFetch('/api/chat', cookie, {
      method: 'POST',
      body: JSON.stringify({
        agentId: agent.id,
        messages: [{ role: 'user', content: 'Say "ok".' }],
      }),
    })
    await res.text()
    check('POST /api/chat (message_count=50, under limit) → 200', res.status === 200, `got ${res.status}`)
  }

  // ── 21. Chat at message limit → 402 MESSAGE_LIMIT_REACHED ────────────
  {
    const period = new Date().toISOString().slice(0, 7)
    await admin.from('usage').upsert({ user_id: user.id, period, message_count: 100 }, { onConflict: 'user_id,period' })

    const res  = await authedFetch('/api/chat', cookie, {
      method: 'POST',
      body: JSON.stringify({
        agentId: agent.id,
        messages: [{ role: 'user', content: 'Should be blocked.' }],
      }),
    })
    const body = await res.json()
    check(
      'POST /api/chat (free, message_count=100) → 402 + cta=upgrade',
      res.status === 402 && body.error === 'MESSAGE_LIMIT_REACHED' && body.cta === 'upgrade' && body.tier === 'free',
      `status=${res.status} body=${JSON.stringify(body)}`
    )
  }

  // ── 22. Pro tier at 200 messages → 200 (well under 5000 limit) ──────────
  {
    await admin.from('subscriptions').update({ tier: 'pro' }).eq('user_id', user.id)
    const period = new Date().toISOString().slice(0, 7)
    await admin.from('usage').upsert({ user_id: user.id, period, message_count: 200 }, { onConflict: 'user_id,period' })

    const res = await authedFetch('/api/chat', cookie, {
      method: 'POST',
      body: JSON.stringify({
        agentId: agent.id,
        messages: [{ role: 'user', content: 'Say "pro".' }],
      }),
    })
    await res.text()
    check('POST /api/chat (pro, message_count=200, under 5000) → 200', res.status === 200, `got ${res.status}`)

    await admin.from('subscriptions').update({ tier: 'free' }).eq('user_id', user.id)
  }

  // ── 22b. Pro tier at 5000 messages → 402 + cta=enterprise ────────────
  {
    await admin.from('subscriptions').update({ tier: 'pro' }).eq('user_id', user.id)
    const period = new Date().toISOString().slice(0, 7)
    await admin.from('usage').upsert({ user_id: user.id, period, message_count: 5000 }, { onConflict: 'user_id,period' })

    const res  = await authedFetch('/api/chat', cookie, {
      method: 'POST',
      body: JSON.stringify({
        agentId: agent.id,
        messages: [{ role: 'user', content: 'Should be blocked.' }],
      }),
    })
    const body = await res.json()
    check(
      'POST /api/chat (pro, message_count=5000) → 402 + cta=enterprise',
      res.status === 402 && body.error === 'MESSAGE_LIMIT_REACHED' && body.cta === 'enterprise' && body.tier === 'pro',
      `status=${res.status} body=${JSON.stringify(body)}`
    )

    await admin.from('subscriptions').update({ tier: 'free' }).eq('user_id', user.id)
  }

  // ── 23. Create agent at limit → 402 AGENT_LIMIT_REACHED ──────────────
  {
    // Create 2 extra agents to bring total to 3 (one already exists from setup)
    const extras: string[] = []
    for (let i = 0; i < 2; i++) {
      const { data } = await admin.from('agents').insert({
        user_id: user.id, name: `Limit Test ${i}`,
        description: '', config: { type: 'custom', personality: { tone: 50, verbosity: 50, examplePhrases: [] }, capabilities: { webSearch: false, email: false, calendar: false, calculator: false, wordCounter: false, documents: { enabled: false, files: [] } }, limits: { maxMessageLength: 1000, avoidTopics: [] } },
      }).select('id').single()
      if (data) extras.push(data.id)
    }

    const res  = await authedFetch('/api/agents', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fourth Agent', description: '', config: { type: 'custom', personality: { tone: 50, verbosity: 50, examplePhrases: [] }, capabilities: { webSearch: false, email: false, calendar: false, calculator: false, wordCounter: false, documents: { enabled: false, files: [] } }, limits: { maxMessageLength: 1000, avoidTopics: [] } } }),
    })
    const body = await res.json()
    check(
      'POST /api/agents (free, 3 agents) → 402 + cta=upgrade',
      res.status === 402 && body.error === 'AGENT_LIMIT_REACHED' && body.cta === 'upgrade' && body.tier === 'free',
      `status=${res.status} body=${JSON.stringify(body)}`
    )

    for (const id of extras) await admin.from('agents').delete().eq('id', id)
  }

  // ── 24. Pro tier bypasses agent limit → 201 ───────────────────────────
  {
    await admin.from('subscriptions').update({ tier: 'pro' }).eq('user_id', user.id)

    // Create 3 extra agents (already have 1 from setup = 4 total, above free limit)
    const extras: string[] = []
    for (let i = 0; i < 3; i++) {
      const { data } = await admin.from('agents').insert({
        user_id: user.id, name: `Pro Limit Test ${i}`,
        description: '', config: { type: 'custom', personality: { tone: 50, verbosity: 50, examplePhrases: [] }, capabilities: { webSearch: false, email: false, calendar: false, calculator: false, wordCounter: false, documents: { enabled: false, files: [] } }, limits: { maxMessageLength: 1000, avoidTopics: [] } },
      }).select('id').single()
      if (data) extras.push(data.id)
    }

    const res = await authedFetch('/api/agents', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pro Agent', description: '', config: { type: 'custom', personality: { tone: 50, verbosity: 50, examplePhrases: [] }, capabilities: { webSearch: false, email: false, calendar: false, calculator: false, wordCounter: false, documents: { enabled: false, files: [] } }, limits: { maxMessageLength: 1000, avoidTopics: [] } } }),
    })
    const body = await res.json()
    check('POST /api/agents (pro, 4 agents) → 201 (no limit)', res.status === 201, `status=${res.status} body=${JSON.stringify(body)}`)

    for (const id of extras) await admin.from('agents').delete().eq('id', id)
    if (body.id) await admin.from('agents').delete().eq('id', body.id)
    await admin.from('subscriptions').update({ tier: 'free' }).eq('user_id', user.id)
  }

  // ── Cleanup ───────────────────────────────────────────────────────────
  console.log('\nCleaning up...')
  if (clonedAgentId)  await admin.from('agents').delete().eq('id', clonedAgentId)
  if (conversationId) await admin.from('conversations').delete().eq('id', conversationId)
  await admin.from('agents').delete().eq('id', agent.id)
  await admin.auth.admin.deleteUser(user.id)
  console.log('Done.\n')

  console.log(`${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch(err => { console.error(err); process.exit(1) })
