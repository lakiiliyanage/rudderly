import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { apiRatelimit } from '@/lib/ratelimit'

export async function GET(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorised — please sign in.' }, { status: 401 })
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const { success, remaining, reset } = await apiRatelimit.limit(user.id)
  if (!success) {
    return Response.json(
      { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait a moment.' },
      {
        status: 429,
        headers: {
          'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    )
  }

  // ── Input validation ──────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')

  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return Response.json({ error: 'invalid_file_id' }, { status: 400 })
  }

  // ── Drive metadata fetch ──────────────────────────────────────────────────
  const driveUrl =
    `https://www.googleapis.com/drive/v3/files/${fileId}` +
    `?fields=id%2Cname%2CmimeType&key=${env.GOOGLE_DRIVE_API_KEY}`

  let res: Response
  try {
    res = await fetch(driveUrl)
  } catch {
    return Response.json({ error: 'network_error' }, { status: 502 })
  }

  if (res.status === 403) {
    return Response.json({ error: 'file_not_public' }, { status: 403 })
  }

  if (res.status === 404) {
    return Response.json({ error: 'file_not_found' }, { status: 404 })
  }

  if (!res.ok) {
    return Response.json({ error: 'drive_error' }, { status: 502 })
  }

  const data = await res.json() as { id: string; name: string; mimeType: string }
  return Response.json({ id: data.id, name: data.name })
}
