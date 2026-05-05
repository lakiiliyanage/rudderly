@AGENTS.md

# AgentForge — Project Memory

## Completed Work
- Week 1: Project environment set up — VS Code, Node, Claude Code CLI, Supabase auth configured and first commit pushed to GitHub.
- Week 2: JavaScript/TypeScript fundamentals covered; built a To-Do app, three React components (AgentCard, MessageCounter, AgentList), and practised Tailwind CSS styling.
- Week 3: Next.js scaffold built with real landing page, Navbar/Footer components, App Router structure understood, and git branching workflow established.
- Week 4: Connected AgentForge to a live Supabase backend with real auth (signup, login, signout, session management via `proxy.ts` and Server Actions), the `agents` table with five RLS policies, and a `messages` table with INSERT/SELECT policies. The profile page displays the user's email, formatted join date (`Intl.DateTimeFormat`), and live agent count fetched server-side.
- Week 5: Built the full CRUD skeleton — Create Agent form, REST API routes (POST/DELETE with 401/403/404/500 handling), server-side dashboard with real Supabase fetching, `/agents/[id]` detail page, and shared Zod schema as single source of truth for form and API validation. Key patterns established: AgentGrid Client Component bridging the Server/Client boundary; personality/goal stored in a `config` jsonb column; optimistic delete with toast rollback.

## Current Focus (Week 6)
Integrating the Claude AI API to power real agent conversations — wiring up a chat interface on `/agents/[id]`, streaming responses, and validating environment variables with Zod.

## Memory Rules (Claude must always follow these)
- If any @-imported file exceeds 40k characters, flag it and suggest archiving it
- Keep this CLAUDE.md file under 8,000 characters total
- At the start of a session where a new sprint has begun, remind me to run /sprint-close
- Completed Work summaries must be max 2 sentences per week
- Never @-import week guides older than the current sprint
- Every weekly guide must include git commit checkpoints after logical task groups (not after every single task — after a meaningful chunk of related work is complete). Use descriptive commit messages. After the final task of any week, always include a sprint close block: run /sprint-close, then commit with a summary message covering the whole week.
- The plan is 13 weeks, not 12. Week 13 = Testing & Code Quality (Vitest, API route tests, CI integration). Week 6 Additional Tasks includes env validation with Zod. Do not treat Week 12 as the final week.

---

# AgentForge — Project Stack & Version Reference

Always generate code targeting the exact versions below. Never suggest or generate code for older patterns (e.g. Next.js middleware.ts, tailwind.config.js, useFormState, anon/service_role key names) unless explicitly asked.

## Current Stack Versions

| Technology | Version | Key behaviour change from older versions |
|---|---|---|
| **Next.js** | 16.2.4 | `middleware.ts` → `proxy.ts`, export must be named `proxy` |
| **React** | 19.2.4 | Server Actions stable (`'use server'`), `useActionState` replaces `useFormState` |
| **Tailwind CSS** | 4.x | No `tailwind.config.js` — config lives in `globals.css` via `@import "tailwindcss"` and `@theme` |
| **@supabase/ssr** | 0.10.2 | `cookies()` from `next/headers` must be **awaited** |
| **@supabase/supabase-js** | 2.104.1 | Publishable key (`sb_publishable_...`) replaces old `anon` key |
| **TypeScript** | 5.x | Standard — no special changes |
| **ESLint** | 9.x | Flat config (`eslint.config.mjs`) — no `.eslintrc.json` |

## Key Patterns for This Stack

**Auth proxy file (Next.js 16):**
```typescript
// src/proxy.ts — NOT middleware.ts
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

**Server Actions (React 19):**
```typescript
// src/app/auth/signup/actions.ts
'use server'
export async function signUpAction(formData: FormData) {
  const supabase = await createClient() // cookies() must be awaited
  ...
}
```

**Supabase server client (SSR 0.10.x):**
```typescript
import { cookies } from 'next/headers'
const cookieStore = await cookies() // must be awaited
const supabase = createServerClient(URL, KEY, { cookies: { ... } })
```

**Tailwind v4 — no config file:**
```css
/* globals.css */
@import "tailwindcss";
/* Custom tokens go here via @theme, not tailwind.config.js */
```

**Supabase API keys (2025 UI):**
- Publishable key (`sb_publishable_...`) = browser-safe, used as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Secret key (`sb_secret_...`) = server only, never `NEXT_PUBLIC_`
- Project URL = found at Settings → Data API (not Settings → General)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://gqqglsttnfkftsdcbcsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   ← server only, added in Week 10
```

## Supabase Project — CRITICAL
- AgentForge Supabase project ID: **gqqglsttnfkftsdcbcsz**
- Before using ANY Supabase MCP tool, verify the project_id matches this ID
- NEVER use a project_id from list_projects without first confirming it against .env.local
- The Vampli project (zmmivcmdtttlbzqfdoyk) is a completely separate project — never touch it

## Development Workflow — Large Features

Use **OpenSpec** (`@fission-ai/openspec`) for any task that spans multiple files, pages, or requires a design decision before coding. Skip it for small fixes, single-file edits, or bug repairs.

**When to use:** new pages, major refactors, new Supabase tables, multi-step features.
**When to skip:** typo fixes, style tweaks, adding a single field, answering questions.

If OpenSpec is not yet initialised in the project:
```bash
npm install -g @fission-ai/openspec@latest
openspec init --tools claude
```

Core workflow:
1. `/opsx:propose <feature-name>` — agree on spec and tasks before any code
2. `/opsx:apply` — implement tasks from the approved spec
3. `/opsx:archive` — clean up after the feature ships

---

## Claude Code Prompt Template

When asking Claude Code to build anything, always include version context:

```
I'm building AgentForge — a visual AI agent builder for non-developers.
Stack: Next.js 16.2.4, React 19, TypeScript, Tailwind CSS v4, @supabase/ssr 0.10.2.
- Use proxy.ts (not middleware.ts) for session handling
- Use Server Actions ('use server') for form submissions
- Await cookies() from next/headers
- Tailwind v4: no tailwind.config.js, CSS-based config only
- Supabase keys: Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY
```
