import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ToolTestPanel from './ToolTestPanel'

const ALLOWED_EMAIL = 'liyanage.lakii@gmail.com'

export default async function ToolTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ALLOWED_EMAIL) redirect('/dashboard')

  return <ToolTestPanel />
}
