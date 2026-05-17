import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const TEST_DATA_FILE = 'e2e/.auth/test-data.json'

async function globalTeardown() {
  if (!fs.existsSync(TEST_DATA_FILE)) return

  const raw      = fs.readFileSync(TEST_DATA_FILE, 'utf8')
  const data     = JSON.parse(raw) as { agentId?: string; tempUserId?: string }
  fs.unlinkSync(TEST_DATA_FILE)

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[teardown] env vars missing — skipping cleanup')
    return
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (data.agentId) {
    await admin.from('agents').delete().eq('id', data.agentId)
    console.log(`[teardown] deleted test agent ${data.agentId}`)
  }

  if (data.tempUserId) {
    const { error } = await admin.auth.admin.deleteUser(data.tempUserId)
    if (error) console.warn(`[teardown] failed to delete test user:`, error.message)
    else console.log(`[teardown] deleted temp test user ${data.tempUserId}`)
  }
}

export default globalTeardown
