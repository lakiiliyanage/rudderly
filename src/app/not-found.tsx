import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function NotFound() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">

      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <span className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-sm">
          ⚡
        </span>
        <span className="font-semibold text-white">AgentForge</span>
      </div>

      {/* 404 */}
      <h1 className="text-8xl font-bold text-violet-500 mb-4 tabular-nums">404</h1>
      <h2 className="text-2xl font-semibold text-white mb-3">Page not found</h2>
      <p className="text-gray-400 max-w-sm mb-10 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* CTA */}
      <Link
        href={user ? '/dashboard' : '/'}
        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-medium px-6 py-3 rounded-xl transition-all"
      >
        {user ? 'Back to Dashboard →' : 'Back to Home →'}
      </Link>
    </div>
  )
}
