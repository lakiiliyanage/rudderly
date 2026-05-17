import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const AUTH_FILE      = 'e2e/.auth/user.json'
const TEST_DATA_FILE = 'e2e/.auth/test-data.json'

setup('authenticate', async ({ page }) => {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const dir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  let email    = process.env.E2E_EMAIL    ?? ''
  let password = process.env.E2E_PASSWORD ?? ''
  let tempUserId: string | null = null

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (!email || !password) {
    // Create an ephemeral test user — cleaned up by teardown.ts after all tests.
    email    = `e2e-${Date.now()}@agentforge.test`
    password = 'E2ePassword123!'

    const { data: { user }, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (error || !user) throw new Error(`Failed to create E2E test user: ${error?.message}`)

    tempUserId = user.id
    console.log(`[auth.setup] created temp test user: ${email}`)
  }

  // Resolve the user ID for the account we signed in with.
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { session } } = await anon.auth.signInWithPassword({ email, password })
  const userId = session?.user.id ?? tempUserId!

  // Create a test agent owned by this user so the conversations tests have
  // something to chat with. We use admin to bypass RLS.
  const { data: agent, error: agentErr } = await admin
    .from('agents')
    .insert({
      user_id:     userId,
      name:        'E2E Test Agent',
      description: 'Created by Playwright setup — safe to delete',
      is_public:   false,
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
    .select('id')
    .single()

  if (agentErr || !agent) throw new Error(`Failed to create E2E test agent: ${agentErr?.message}`)
  console.log(`[auth.setup] created test agent: ${agent.id}`)

  // Persist IDs so teardown can delete them, and so spec files can read the agent ID.
  fs.writeFileSync(TEST_DATA_FILE, JSON.stringify({
    agentId: agent.id,
    ...(tempUserId && { tempUserId }),
  }), 'utf8')

  // Sign in via the browser so Playwright captures the real session cookie.
  await page.goto('/auth/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
