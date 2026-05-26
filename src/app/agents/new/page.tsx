import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

// Lazy-load AgentWizard so framer-motion (~538 KB) is only fetched when
// this route renders, keeping it out of shared chunks.
const AgentWizard = dynamic(() => import('./AgentWizard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default async function NewAgentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return <AgentWizard />
}
