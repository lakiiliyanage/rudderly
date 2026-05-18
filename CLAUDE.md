@AGENTS.md

# AgentForge — Project Memory

## Completed Work
- Weeks 1–3: Env setup, JS/TS fundamentals, Next.js scaffold with App Router + git workflow.
- Week 4: Live Supabase backend — real auth, `agents` + `messages` tables, RLS, profile page.
- Week 5: CRUD — Create Agent form, REST routes, server dashboard, `/agents/[id]`, Zod schema.
- Week 6: Anthropic SDK streaming — Zod env validation, `ReadableStream` chat, AbortController.
- Week 7: 5-step visual agent builder (shadcn/ui) + full password reset flow (PKCE).
- Week 8: Multi-turn agentic tool loop (5 tools, SSE streaming, attribution), agent edit, tool logging.
- Week 9: Conversation persistence (sidebar, auto-titles, `?c=` routing, context window), public share pages (auto-slug, OG, clone, view counter), Vitest unit + Playwright E2E tests.

## Current Focus (Week 10)
Add Stripe subscriptions — free plan (3 agents) + Pro tier; paywall on agent creation; webhook to sync subscription status to Supabase; billing portal.

## Memory Rules (Claude must always follow these)
- Keep this CLAUDE.md under 4,000 characters total; flag if approaching limit
- Completed Work: max 1 sentence per week
- Never @-import week guides older than the current sprint
- Remind me to run /sprint-close when a new sprint begins
- 13-week plan; Week 13 = Testing & Code Quality; Week 12 is not the final week.

---

# AgentForge — Project Stack & Version Reference

Never use old patterns: `middleware.ts`, `tailwind.config.js`, `useFormState`, `anon`/`service_role` key names.

## Current Stack Versions

| Technology | Version | Breaking change |
|---|---|---|
| **Next.js** | 16.2.4 | `proxy.ts` not `middleware.ts`; export named `proxy` |
| **React** | 19.2.4 | `useActionState` replaces `useFormState`; Server Actions stable |
| **Tailwind CSS** | 4.x | No `tailwind.config.js` — config in `globals.css` via `@theme` |
| **@supabase/ssr** | 0.10.2 | `cookies()` from `next/headers` must be **awaited** |
| **@supabase/supabase-js** | 2.104.1 | Publishable key (`sb_publishable_...`) replaces `anon` |
| **ESLint** | 9.x | Flat config (`eslint.config.mjs`) — no `.eslintrc.json` |

## Key Patterns (see `docs/CLAUDE_ARCHIVE.md` for full code examples)
- **proxy.ts**: named export `proxy`, not default — `middleware.ts` is silently ignored in Next.js 16
- **Supabase client**: `await cookies()` — sync access throws in SSR 0.10.x
- **Tailwind v4**: `@theme {}` in `globals.css` — no `tailwind.config.js`
- **Keys**: Publishable = `NEXT_PUBLIC_SUPABASE_ANON_KEY`; Secret = `SUPABASE_SERVICE_ROLE_KEY`

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://gqqglsttnfkftsdcbcsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

## Supabase Project — CRITICAL
- AgentForge project ID: **gqqglsttnfkftsdcbcsz** — verify before ANY MCP tool call
- NEVER trust `list_projects`; confirm against `.env.local` first
- Vampli project `zmmivcmdtttlbzqfdoyk` is unrelated — never touch it

---

## Claude Code Prompt Template

Always prepend: `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Testing
- End every prompt with: `Verify: Happy path: [steps] → [result] | Failure path: [steps] → [result]`
- Tools: `npx tsx src/lib/tools/test-runner.ts` (source .env.local) | Routes: `test-routes.ts` | TS: `npx tsc --noEmit` | E2E: `npx playwright test`
- Update test-runner.ts when tools change. Never poll a dev server for logic testable by tsx.

---

## Reference Docs
- `@AGENTS.md` — stack conventions (always loaded)
- `docs/CLAUDE_ARCHIVE.md` — key-pattern examples + extended week summaries; load when debugging legacy behaviour
- `docs/weeks/WEEK_X_GUIDE.md` — sprint guides; only @-import the current week
