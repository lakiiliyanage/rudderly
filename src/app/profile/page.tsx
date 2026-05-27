import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from './SignOutButton'

export default async function ProfilePage() {
  const supabase = await createClient()

  // getUser() verifies the JWT with Supabase's servers — more reliable than
  // reading session from the cookie alone for pages that show personal data.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { count, error: countError } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const agentCount = countError ? 0 : (count ?? 0)

  const joinedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(user.created_at))

  // First letter of email for the avatar circle
  const initial = user.email?.[0].toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">

          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-violet-900/40">
              {initial}
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">{user.email}</p>
              <p className="text-gray-500 text-xs mt-0.5">Rudderly account</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Member since</p>
              <p className="text-white text-sm font-medium">{joinedDate}</p>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Agents created</p>
              <p className="text-white text-sm font-medium">
                {agentCount}
                <span className="text-gray-500 font-normal"> agent{agentCount !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>

          {/* Sign out */}
          <SignOutButton />

        </div>

      </div>
    </div>
  )
}
