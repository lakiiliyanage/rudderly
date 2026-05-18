import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserUsage } from '@/lib/usage'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised — please sign in.' }, { status: 401 })
    }

    const { tier, messageCount, monthlyLimit, agentCount, agentLimit } = await getUserUsage(user.id)

    return NextResponse.json({ tier, messageCount, monthlyLimit, agentCount, agentLimit })
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
