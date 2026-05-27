import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ExploreClient from './ExploreClient'
import type { PublicAgent } from './ExploreClient'

export const metadata: Metadata = {
  title: 'Explore Agents | Rudderly',
  description: 'Discover and try public AI agents built with Rudderly.',
}

export default async function ExplorePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('agents')
    .select('id, name, description, config, slug, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(30)

  const agents = (data ?? []) as PublicAgent[]

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Explore Agents</h1>
        <p className="text-gray-400 text-sm">Discover and try public AI agents built with Rudderly.</p>
      </div>
      <ExploreClient agents={agents} />
    </div>
  )
}
