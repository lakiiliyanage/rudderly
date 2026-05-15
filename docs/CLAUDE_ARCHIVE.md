# AgentForge — CLAUDE.md Archive

Long-form reference that was trimmed from CLAUDE.md to keep it under 4,000 chars.
Load this file on demand when debugging legacy behaviour, reconsidering architectural decisions,
or writing guides that build on earlier-week foundations.

---

## Key Pattern Code Examples

These code blocks explain *why* each pattern exists — the breaking change that caused the old way to stop working.

### Auth proxy (Next.js 16)

```typescript
// src/proxy.ts — NOT middleware.ts
// Next.js 16 renamed the file and the export. Old middleware.ts / export default are silently ignored.
export async function proxy(request: NextRequest) {
  // refresh session cookie, redirect unauthenticated users, etc.
}
export const config = { matcher: ['/dashboard/:path*', '/agents/:path*', '/profile'] }
```

**Why:** Next.js 16.2.x changed the middleware convention. `middleware.ts` still compiles but is never executed — the project runs as if no middleware exists, so session cookies are never refreshed and protected routes stay open.

### Server Actions (React 19)

```typescript
// src/app/auth/signup/actions.ts
'use server'
export async function signUpAction(formData: FormData) {
  const supabase = await createClient()   // cookies() is awaited inside createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
```

**Why:** React 19 made Server Actions stable. `useFormState` was replaced by `useActionState`. Old form patterns using `action={signUpAction}` directly still work, but `useFormState` is removed.

### Supabase server client (SSR 0.10.x)

```typescript
import { cookies } from 'next/headers'

// src/lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()   // must be awaited — sync access throws in 0.10.x
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()         { return cookieStore.getAll() },
        setAll(toSet)    { try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
      },
    }
  )
}
```

**Why:** `@supabase/ssr` 0.10.x changed `cookies()` from a sync call to a Promise. Calling it without `await` returns a Promise object, not the cookie store — auth silently fails (no error thrown, just no session).

### Tailwind v4 — CSS-first config

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(55% 0.25 270);   /* custom token — replaces tailwind.config.js theme.extend */
}
```

**Why:** Tailwind v4 removed `tailwind.config.js`. All customisation (custom colours, spacing, fonts) now lives in `@theme {}` inside CSS. Any generated `tailwind.config.js` or `tailwind.config.ts` is silently ignored.

### Supabase key names

| Old name | New name (v2.104+) | Environment variable |
|---|---|---|
| `anon` key | Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | Secret key (`sb_secret_...`) | `SUPABASE_SERVICE_ROLE_KEY` |

The Supabase dashboard now shows "Publishable" and "Secret" labels. The env var names in `.env.local` stay the same — only the key prefix changed.

---

## Testing Strategy (Established Week 8)

| What to verify | How |
|---|---|
| Tool logic / dispatch | `set -a && source .env.local && set +a && npx tsx src/lib/tools/test-runner.ts` |
| Route auth / 401 / 403 / 400 | `curl` — no browser session needed |
| TypeScript correctness | `npx tsc --noEmit` — run after every change |
| UX / streaming / auth flows | Browser only — cannot be automated from CLI |

**Decision (Week 8):** Never start a dev server and poll logs waiting for browser interaction to verify logic that can be tested with `tsx`. The `test-runner.ts` approach runs in ~2 seconds against real env vars without spinning up HTTP. Dev-server polling wastes minutes and produces noisy logs.

**Commit checkpoint discipline:** Weekly guides must include git commit checkpoints after logical task groups — not after every single task, but after a meaningful chunk of related work. After the final task of any week, always include a sprint close block: run `/sprint-close`, then commit with a summary message covering the whole week.

**When adding or changing a tool:** Add a matching test case to `src/lib/tools/test-runner.ts` at the same time the tool implementation changes.

---

## Completed Work — Extended Summaries

Trimmed from CLAUDE.md to fit under 4,000 chars. One-sentence versions remain in CLAUDE.md.

### Week 4 — Supabase auth + database
Connected AgentForge to a live Supabase backend with real auth (signup, login, signout, session management via `proxy.ts` and Server Actions), the `agents` table with five RLS policies, and a `messages` table with INSERT/SELECT policies. The profile page displays the user's email, formatted join date (`Intl.DateTimeFormat`), and live agent count fetched server-side.

### Week 5 — CRUD skeleton
Built the full CRUD skeleton — Create Agent form, REST API routes (POST/DELETE with status-code handling), server-side dashboard, `/agents/[id]` detail page, and shared Zod schema for validation. Key patterns: AgentGrid bridges Server/Client boundary; `config` jsonb column for personality/goal; optimistic delete with toast rollback.

### Week 6 — Anthropic SDK + streaming
Integrated Anthropic SDK for real streaming conversations — `src/lib/env.ts` validates env vars with Zod, `/api/chat/route.ts` authenticates and streams via `ReadableStream`. `ChatPanel.tsx` handles streaming with `getReader()`, AbortController stop, 429/500/network errors, partial reply retention, and a character counter.

### Week 7 — Visual agent builder + password reset
Built the 5-step visual agent builder with shadcn/ui — type selector, personality sliders, capability toggles, limits, and a chat preview dialog saving config to the `config` jsonb column. Completed the full password reset flow: `/auth/forgot-password`, `/auth/callback` (PKCE), `/auth/reset-password`, `HashTokenHandler` and `HashRedirect`.

### Week 8 — Agentic tool loop + tool logging
Wired five capability-gated tools (web search, calculator, datetime, Google Drive document reader, word counter) into a full multi-turn agentic loop (max 5 iterations) with SSE streaming, per-tool thinking indicators, markdown rendering, and source/document attribution. Also shipped: agent edit flow (`/agents/[id]/edit`), clickable AgentCards (Link wrapper + stopPropagation), defensive fallbacks for old configs missing the `documents` key, a private tool-testing panel at `/tools/test` (admin-only, email-gated), and fire-and-forget tool logging to a `tool_logs` Supabase table with RLS and nullable `agent_id` for preview/test contexts.

Key architectural decisions:
- **Logger callback pattern**: Route builds a `(core: ToolLogCore) => void` closure over its Supabase client, passes it as `context.logger` — keeps `runner.ts` free of Supabase imports.
- **Two-arg `.then(onFulfilled, onRejected)`** instead of `.then().catch()` — Supabase returns `PromiseLike`, not `Promise`, so `.catch()` is unavailable.
- **Deep-merge for edit mode**: `{ ...defaultConfig, ...initialConfig, capabilities: { ...defaultConfig.capabilities, ...initialConfig.capabilities } }` — seeds missing capability fields before overwriting with stored config.
