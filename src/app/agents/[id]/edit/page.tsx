import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AgentWizard from '@/app/agents/new/AgentWizard'
import type { AgentConfig } from '@/lib/types/agent'

interface EditAgentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, user_id, name, description, config')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!agent) notFound()

  const config = (agent.config ?? {}) as AgentConfig

  return (
    <AgentWizard
      agentId={id}
      initialName={agent.name ?? ''}
      initialDescription={agent.description ?? ''}
      initialConfig={config}
    />
  )
}
