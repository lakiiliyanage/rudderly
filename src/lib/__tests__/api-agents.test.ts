import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock all three server-side modules BEFORE importing route handlers.
// vi.mock calls are hoisted by Vitest so the mocks are in place when the
// route modules are evaluated.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// POST /api/agents calls apiRatelimit.limit() before validation.
// Mock it to always succeed so it doesn't block the tests that follow.
vi.mock('@/lib/ratelimit', () => ({
  apiRatelimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 99, reset: 0 }),
  },
}))

// POST /api/agents calls getUserUsage() to enforce the agent count limit.
// Return agentCount: 0 so the route never hits the 402 branch.
vi.mock('@/lib/usage', () => ({
  getUserUsage: vi.fn().mockResolvedValue({
    agentCount: 0,
    agentLimit: 3,
    messageCount: 0,
    monthlyLimit: 100,
    tier: 'free',
  }),
}))

import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/agents/route'
import { DELETE } from '@/app/api/agents/[id]/route'

// A full valid config required by agentSchema — POST route validates this shape.
const validConfig = {
  type: 'custom' as const,
  personality: { tone: 50, verbosity: 50, examplePhrases: [] },
  capabilities: {
    webSearch: false, email: false, calendar: false,
    calculator: false, wordCounter: false,
    documents: { enabled: false, files: [] },
  },
  limits: { maxMessageLength: 1000, avoidTopics: [] },
}

function makeRequest(method: string, body?: object): Request {
  return new Request('http://localhost/api/agents', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── POST /api/agents ────────────────────────────────────────────────────────

describe('POST /api/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not logged in', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as any)

    const req = makeRequest('POST', { name: 'Test Agent', config: validConfig })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } }, error: null,
        }),
      },
    } as any)

    // config is present but name is omitted — agentSchema requires name (min 1)
    const req = makeRequest('POST', { description: 'no name here', config: validConfig })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 when a valid agent is submitted by an authenticated user', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } }, error: null,
        }),
      },
      // Route chain: .from('agents').insert({...}).select().single()
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'agent-456', name: 'Test Agent', user_id: 'user-123' },
              error: null,
            }),
          }),
        }),
      }),
    } as any)

    const req = makeRequest('POST', { name: 'Test Agent', description: '', config: validConfig })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})

// ── DELETE /api/agents/[id] ─────────────────────────────────────────────────

describe('DELETE /api/agents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not logged in', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as any)

    const req = makeRequest('DELETE')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'agent-456' }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when deleting someone else's agent", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } }, error: null,
        }),
      },
      // Route chain: .from('agents').select('id, user_id').eq('id', id).single()
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'agent-456', user_id: 'different-user-999' },
              error: null,
            }),
          }),
        }),
      }),
    } as any)

    const req = makeRequest('DELETE')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'agent-456' }) })
    expect(res.status).toBe(403)
  })

  it('returns 200 when the owner deletes their own agent', async () => {
    // DELETE makes two from() calls:
    //   1st: .from('agents').select('id, user_id').eq('id', id).single()
    //   2nd: .from('agents').delete().eq('id', id).eq('user_id', user.id)
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } }, error: null,
        }),
      },
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'agent-456', user_id: 'user-123' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
    } as any)

    const req = makeRequest('DELETE')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'agent-456' }) })
    expect(res.status).toBe(200)
  })

  it('returns 404 when the agent ID does not exist', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } }, error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' },
            }),
          }),
        }),
      }),
    } as any)

    const req = makeRequest('DELETE')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent-id' }) })
    expect(res.status).toBe(404)
  })
})
