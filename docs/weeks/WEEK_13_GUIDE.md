# Week 13 — Testing Foundation: Unit Tests, API Route Tests & CI Integration

**Phase 5 — Code Quality & Security**
**Estimated time:** 6–8 hours core · 2 hours stretch
**Difficulty:** Intermediate — new tooling, but the patterns repeat once you learn the first one

---

## What You're Building This Week

AgentForge now has 12 weeks of features — auth, CRUD, streaming, tool loops, payments, security hardening, and a production deploy. But every time you add something new, there's a nagging question: *did I accidentally break something that was already working?*

This week you build the answer. You'll set up **Vitest** (a fast test runner that understands your codebase) and write three layers of tests:

1. **Unit tests** for pure logic functions — the parts of your code that don't touch the database or network
2. **API route tests** for your most critical endpoints — so you can verify POST /api/agents and DELETE /api/agents/[id] behave correctly without actually hitting Supabase
3. **CI integration** — wiring your tests into GitHub Actions so they run automatically on every push and pull request

By the end of the week, every future feature you ship will be guarded by a test net that runs in the cloud before anything reaches production.

**The UX designer analogy:** think of tests as your design system's "does not break" constraints. A design system tells future designers "these component states are correct". Your test suite tells future code "these behaviours are correct". Both prevent regressions — accidental changes that silently undo decisions you already made.

---

## Before You Start

Open the project in your terminal and run these checks. Fix anything that fails before writing a single test.

```bash
# Navigate to the project
cd path/to/agentforge

# Confirm TypeScript has no errors — a clean type check before adding tests
npx tsc --noEmit

# Build check — make sure the app still compiles cleanly
npm run build

# Check the existing test infrastructure
npx tsx src/lib/tools/test-runner.ts      # Tests tool logic directly (no HTTP server needed)
# node src/lib/tools/test-routes.ts       # Tests API routes via HTTP — requires dev server running

# Vitest — skip if not set up yet (you're setting it up in Step 2)
npm test
```

---

## Concepts for This Week

Work through this table before you start the steps. Every term will appear in the prompts below — knowing what each one means will make the prompts far easier to follow.

| Concept | What it means | Figma analogy |
|---|---|---|
| **Test runner** | Software that finds your test files, runs them, and reports which passed or failed | Like Figma's auto-layout — it discovers and applies rules automatically |
| **Vitest** | The test runner we're using; designed for Vite/Next.js projects, fast, supports TypeScript natively | Figma's inspect panel — built specifically for your tool, not bolted on afterwards |
| **Test suite** | A named group of related tests (`describe('relativeTime', ...)`) | A Figma component set — all variants of the same thing, together |
| **Test case** | One specific scenario to verify (`it('returns "just now" for < 60s', ...)`) | One component variant in the set |
| **Assertion** | The check inside a test — "the actual result must equal the expected result" | A constraint in auto-layout: "this gap must always be 8px" |
| **`describe()`** | A function that groups related test cases under a name | Figma frame — a labelled container for related things |
| **`it()` / `test()`** | A function that defines one test case; `it` and `test` are identical | A single component variant inside a frame |
| **`expect()`** | Wraps the actual value; you chain `.toBe()`, `.toEqual()`, `.toThrow()` to assert what it should be | Measuring a gap and confirming it equals what the spec says |
| **Mock** | A fake version of a dependency (database, Stripe, Supabase) that you control completely | A placeholder component in Figma — same shape, fake content |
| **`vi.fn()`** | Creates a mock function; records how many times it was called and with what arguments | A "link" override on a component that you can swap without breaking the design |
| **`vi.mock()`** | Replaces an entire module with a mock version for the duration of a test | Swapping a library component for a local override in a design file |
| **Coverage report** | A summary of which lines/branches of your code were actually executed by tests | A heatmap audit — shows which parts of your design were never tested in user research |
| **Line coverage** | The percentage of lines in your code that at least one test touched | How many artboards were actually opened during the critique |
| **Branch coverage** | The percentage of `if/else` branches that were tested (both the `if` AND the `else`) | Checking both the "logged in" and "logged out" states of a component, not just one |
| **GitHub Actions** | Automated workflows that run on GitHub's servers whenever you push code or open a pull request | A Figma plugin that runs automatically when you publish — no manual trigger needed |
| **`on: push / pull_request`** | The events that trigger a GitHub Actions workflow to run | "Run this Figma plugin whenever the file is published" |
| **`npm ci`** | Like `npm install` but faster and stricter — installs exactly what's in `package-lock.json`, no surprises | Restoring a Figma file from version history — exact state, no drift |
| **Happy path** | The test that confirms the correct behaviour when everything goes right | The component in its default / ideal state |
| **Failure path (sad path)** | The test that confirms correct error behaviour when something goes wrong | The component in its error or empty state — equally important to design |

---

## HTTP Status Codes Reference

You'll use these codes in your API route tests. Keep this table handy when reading the test assertions below.

| Code | Name | Meaning | When to use |
|---|---|---|---|
| 200 | OK | Request succeeded | Generic success |
| 201 | Created | New resource created | After a successful INSERT (e.g. creating an agent) |
| 400 | Bad Request | Client sent malformed or incomplete data | Missing fields, failed Zod validation |
| 401 | Unauthorised | Not logged in — no valid session | No Supabase session found |
| 403 | Forbidden | Logged in but not allowed to do this | Trying to delete another user's agent |
| 404 | Not Found | Resource doesn't exist | Agent ID not found in the database |
| 500 | Internal Server Error | Something broke on the server | Unhandled exception, database crash |

---

## HTTP Request Types Reference

| Request type | Intention | Real-world analogy | Used in AgentForge |
|---|---|---|---|
| GET | "Give me data" | Reading a menu | Fetching agents, loading dashboard |
| POST | "Here is new data, store it" | Placing an order | Creating an agent (`POST /api/agents`) |
| PUT / PATCH | "Update existing data" | Changing an order | Editing an agent |
| DELETE | "Remove this data" | Cancelling an order | Deleting an agent (`DELETE /api/agents/[id]`) |

---

## Session 1 — Hours 1–2: Audit & Setup

### Step 1 — Audit Your Existing Test Infrastructure

Before adding anything new, understand what's already there. This step is read-only — you're mapping the landscape.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY`
>
> Audit the existing test infrastructure in this project. I want to understand what's already in place before I add Vitest.
>
> 1. Check if any of these files exist and show me their content:
>    - `vitest.config.ts` or `vitest.config.js`
>    - `jest.config.ts` or `jest.config.js`
>    - `src/lib/__tests__/` directory or any `.test.ts` / `.spec.ts` files anywhere in the project
>    - `src/lib/tools/test-runner.ts`
>    - `src/lib/tools/test-routes.ts`
>    - `.github/workflows/` directory and any `.yml` files inside it
> 2. Check `package.json` scripts — specifically `"test"`, `"test:watch"`, `"test:coverage"`
> 3. Check `package.json` devDependencies for any test-related packages (vitest, jest, @testing-library, etc.)
> 4. Report what's present and what's missing so I know exactly what to install and configure.

---

### Step 2 — Install and Configure Vitest

This step installs Vitest and creates the configuration files that tell it how to run tests in a Next.js project.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY`
>
> Install and configure Vitest for this Next.js 16 / React 19 project.
>
> **Install these packages as devDependencies:**
> ```bash
> npm install -D vitest @vitejs/plugin-react @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
> ```
>
> **Create `vitest.config.ts`** in the project root:
> ```typescript
> import { defineConfig } from 'vitest/config'
> import react from '@vitejs/plugin-react'
> import path from 'path'
>
> export default defineConfig({
>   plugins: [react()],
>   test: {
>     environment: 'node',
>     globals: true,
>     setupFiles: ['./src/lib/__tests__/setup.ts'],
>     coverage: {
>       provider: 'v8',
>       thresholds: {
>         lines: 40,
>         functions: 40,
>         branches: 30,
>         statements: 40,
>       },
>       exclude: [
>         'src/app/**',
>         'src/lib/__tests__/**',
>         '*.config.*',
>         'node_modules/**',
>       ],
>     },
>   },
>   resolve: {
>     alias: {
>       '@': path.resolve(__dirname, './src'),
>     },
>   },
> })
> ```
>
> **Create `src/lib/__tests__/setup.ts`** — this file runs before every test and sets up fake environment variables so tests don't fail with "missing env var" errors:
> ```typescript
> // Test environment variables — fake values that satisfy validation without hitting real services
> process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
> process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
> process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
> process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
> process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key'
> process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake_secret'
> process.env.STRIPE_PRO_PRICE_ID = 'price_test_fake_id'
> process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
> process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
> process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
> ```
>
> **Add scripts to `package.json`:**
> ```json
> "test": "vitest run",
> "test:watch": "vitest",
> "test:coverage": "vitest run --coverage"
> ```
>
> After setting up, verify by:
> - Running `npx tsc --noEmit` — must return no errors
> - Running `npm test` — should return "No test files found" (not an error, just nothing to run yet)
> - Running `npm run test:coverage` — should complete without crashing
>
> Do not mark complete until `npm test` runs without crashing.

---

### Step 3 — Unit Tests for Pure Logic Functions

Now write the first real tests. These three functions are "pure" — they take an input and return an output, no database or network involved. Perfect first targets.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY`
>
> Write Vitest unit tests for three pure functions in this project. Create one test file per function in `src/lib/__tests__/`.
>
> **File 1: `src/lib/__tests__/relativeTime.test.ts`**
>
> Find the `relativeTime` utility function (likely in `src/lib/utils.ts` or similar). Write tests covering:
> - Input of 0 seconds → "just now"
> - Input of 30 seconds → "just now" (under the 60s threshold)
> - Input of 60 seconds → "1 minute ago"
> - Input of 90 seconds → "1 minute ago"
> - Input of 120 seconds → "2 minutes ago"
> - Input of 3600 seconds (1 hour) → "1 hour ago"
> - Input of 7200 seconds (2 hours) → "2 hours ago"
> - Input of 86400 seconds (1 day) → "1 day ago"
>
> If the function signature is `relativeTime(seconds: number): string`, the test structure should be:
> ```typescript
> describe('relativeTime', () => {
>   it('returns "just now" for values under 60 seconds', () => {
>     expect(relativeTime(0)).toBe('just now')
>     expect(relativeTime(30)).toBe('just now')
>   })
>   it('returns minutes for values between 60s and 3600s', () => {
>     expect(relativeTime(60)).toBe('1 minute ago')
>   })
>   // etc.
> })
> ```
>
> Adapt exact expected strings to match what the actual function returns — run it first to find out, then write assertions against what it actually produces.
>
> **File 2: `src/lib/__tests__/agentSchema.test.ts`**
>
> Find the Zod schema used to validate agent creation (likely in `src/lib/schemas/agent.ts` or `src/app/api/agents/route.ts`). Write tests:
> - Happy path: a valid object with all required fields → `.safeParse()` returns `{ success: true }`
> - Failure: missing `name` field → `{ success: false }`, error mentions "name"
> - Failure: `name` is empty string → `{ success: false }`
> - Failure: `system_prompt` over the maximum character limit (if a limit exists) → `{ success: false }`
> - Failure: unknown extra field (if the schema uses `.strict()`) → depends on the schema; document what it does
>
> **File 3: `src/lib/__tests__/env.test.ts`**
>
> Find the env validation file (likely `src/lib/env.ts` or `src/env.ts`). Write tests:
> - Happy path: all required env vars present (they are — `setup.ts` sets them) → the module loads without throwing
> - Failure: temporarily `delete process.env.ANTHROPIC_API_KEY` inside a test → re-importing or calling the validation should throw or return an error
>   - Use `vi.resetModules()` before re-importing to get a fresh module evaluation
>   - Restore the env var in `afterEach` so other tests aren't affected
>
> After writing all three test files:
> - Run `npm test` — all tests must pass
> - Run `npm run test:coverage` — coverage report should appear in the terminal
>
> After building, verify by testing:
> - Happy path: `npm test` → all tests pass, output shows test file names and ✓ for each case
> - Failure path: deliberately change one expected value (e.g. `toBe('just now')` → `toBe('never')`) → test fails with a clear diff showing expected vs received → revert the change
>
> Do not mark complete until both paths pass.

---

### ✅ Before You Commit — Session 1 Setup & Unit Tests

All of the following must pass before committing. Ask Claude Code to run them if you haven't already:

| Test | Expected result |
|---|---|
| `npx tsc --noEmit` | No TypeScript errors |
| `npm run build` | Build completes without errors |
| `npm test` | All unit tests pass (relativeTime, agentSchema, env) |
| `npm run test:coverage` | Coverage report prints to terminal without crashing |
| Deliberately break one assertion | Test fails with a clear diff, not a crash |
| Revert the broken assertion | `npm test` passes again |

Do not commit until every row shows the expected result.

### 💾 Commit Checkpoint — Vitest Setup & Unit Tests Complete

Unit tests are working and all three pure-function test files are passing. This is a stable foundation before adding API route tests, which are more complex.

```bash
git add -A
git commit -m "feat: add Vitest with unit tests for relativeTime, agent schema, and env validation"
```

---

## Session 2 — Hours 3–4: API Route Tests

### Step 4 — API Route Tests for POST and DELETE /api/agents

API route tests are more complex than unit tests because the routes depend on Supabase (the database). You can't hit the real database in tests — so you use a **mock** (a fake version of Supabase that you control completely).

The pattern: import the real route handler function → mock the Supabase client → call the handler directly with a fake request → assert on the response.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY`
>
> Create `src/lib/__tests__/api-agents.test.ts` — Vitest tests for the POST and DELETE handlers in `src/app/api/agents/route.ts` and `src/app/api/agents/[id]/route.ts`.
>
> **Mocking strategy:** Mock the Supabase server client so tests never hit the real database. The mock pattern is:
>
> ```typescript
> import { vi, describe, it, expect, beforeEach } from 'vitest'
>
> // Mock the Supabase server module BEFORE importing the route handler
> vi.mock('@/lib/supabase/server', () => ({
>   createClient: vi.fn(),
> }))
>
> import { createClient } from '@/lib/supabase/server'
> import { POST } from '@/app/api/agents/route'
> import { DELETE } from '@/app/api/agents/[id]/route'
>
> // Helper to build a fake Next.js Request object
> function makeRequest(method: string, body?: object): Request {
>   return new Request('http://localhost/api/agents', {
>     method,
>     headers: { 'Content-Type': 'application/json' },
>     body: body ? JSON.stringify(body) : undefined,
>   })
> }
> ```
>
> **Tests for POST /api/agents (creating an agent):**
>
> ```typescript
> describe('POST /api/agents', () => {
>   beforeEach(() => {
>     vi.clearAllMocks()
>   })
>
>   it('returns 401 (Unauthorised — no session) when user is not logged in', async () => {
>     vi.mocked(createClient).mockResolvedValue({
>       auth: {
>         getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
>       },
>     } as any)
>
>     const req = makeRequest('POST', { name: 'Test Agent', system_prompt: 'You are helpful.' })
>     const res = await POST(req)
>     expect(res.status).toBe(401)
>   })
>
>   it('returns 400 (Bad Request — missing required field) when name is missing', async () => {
>     vi.mocked(createClient).mockResolvedValue({
>       auth: {
>         getUser: vi.fn().mockResolvedValue({
>           data: { user: { id: 'user-123' } }, error: null,
>         }),
>       },
>     } as any)
>
>     const req = makeRequest('POST', { system_prompt: 'You are helpful.' }) // name missing
>     const res = await POST(req)
>     expect(res.status).toBe(400)
>   })
>
>   it('returns 201 (Created) when a valid agent is submitted by an authenticated user', async () => {
>     const mockInsert = vi.fn().mockResolvedValue({
>       data: [{ id: 'agent-456', name: 'Test Agent', user_id: 'user-123' }],
>       error: null,
>     })
>     vi.mocked(createClient).mockResolvedValue({
>       auth: {
>         getUser: vi.fn().mockResolvedValue({
>           data: { user: { id: 'user-123' } }, error: null,
>         }),
>       },
>       from: vi.fn().mockReturnValue({
>         insert: vi.fn().mockReturnValue({
>           select: vi.fn().mockReturnValue({ single: mockInsert }),
>         }),
>       }),
>     } as any)
>
>     const req = makeRequest('POST', { name: 'Test Agent', system_prompt: 'You are helpful.' })
>     const res = await POST(req)
>     expect(res.status).toBe(201)
>   })
> })
> ```
>
> **Tests for DELETE /api/agents/[id] (deleting an agent):**
>
> ```typescript
> describe('DELETE /api/agents/[id]', () => {
>   beforeEach(() => {
>     vi.clearAllMocks()
>   })
>
>   it('returns 401 (Unauthorised) when user is not logged in', async () => {
>     vi.mocked(createClient).mockResolvedValue({
>       auth: {
>         getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
>       },
>     } as any)
>
>     const req = makeRequest('DELETE')
>     const res = await DELETE(req, { params: Promise.resolve({ id: 'agent-456' }) })
>     expect(res.status).toBe(401)
>   })
>
>   it('returns 403 (Forbidden — agent belongs to a different user) when deleting someone else\'s agent', async () => {
>     vi.mocked(createClient).mockResolvedValue({
>       auth: {
>         getUser: vi.fn().mockResolvedValue({
>           data: { user: { id: 'user-123' } }, error: null,
>         }),
>       },
>       from: vi.fn().mockReturnValue({
>         select: vi.fn().mockReturnValue({
>           eq: vi.fn().mockReturnValue({
>             single: vi.fn().mockResolvedValue({
>               data: { id: 'agent-456', user_id: 'different-user-999' }, // owned by someone else
>               error: null,
>             }),
>           }),
>         }),
>       }),
>     } as any)
>
>     const req = makeRequest('DELETE')
>     const res = await DELETE(req, { params: Promise.resolve({ id: 'agent-456' }) })
>     expect(res.status).toBe(403)
>   })
>
>   it('returns 200 (OK) when the owner deletes their own agent', async () => {
>     const mockDelete = vi.fn().mockResolvedValue({ error: null })
>     vi.mocked(createClient).mockResolvedValue({
>       auth: {
>         getUser: vi.fn().mockResolvedValue({
>           data: { user: { id: 'user-123' } }, error: null,
>         }),
>       },
>       from: vi.fn().mockReturnValue({
>         select: vi.fn().mockReturnValue({
>           eq: vi.fn().mockReturnValue({
>             single: vi.fn().mockResolvedValue({
>               data: { id: 'agent-456', user_id: 'user-123' }, // same user
>               error: null,
>             }),
>           }),
>         }),
>         delete: vi.fn().mockReturnValue({
>           eq: vi.fn().mockReturnValue(mockDelete),
>         }),
>       }),
>     } as any)
>
>     const req = makeRequest('DELETE')
>     const res = await DELETE(req, { params: Promise.resolve({ id: 'agent-456' }) })
>     expect(res.status).toBe(200)
>   })
>
>   it('returns 404 (Not Found) when the agent ID does not exist', async () => {
>     vi.mocked(createClient).mockResolvedValue({
>       auth: {
>         getUser: vi.fn().mockResolvedValue({
>           data: { user: { id: 'user-123' } }, error: null,
>         }),
>       },
>       from: vi.fn().mockReturnValue({
>         select: vi.fn().mockReturnValue({
>           eq: vi.fn().mockReturnValue({
>             single: vi.fn().mockResolvedValue({
>               data: null,
>               error: { code: 'PGRST116', message: 'Row not found' },
>             }),
>           }),
>         }),
>       }),
>     } as any)
>
>     const req = makeRequest('DELETE')
>     const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent-id' }) })
>     expect(res.status).toBe(404)
>   })
> })
> ```
>
> **Important:** The mock chain above (`from().select().eq().single()`) must match the actual chain used in the real route handler. If the route uses a different chain (e.g. `.from().delete().eq().match()`), adjust accordingly — read the actual route code first and mirror it exactly in the mock.
>
> After building, verify by testing:
> - Happy path: `npm test` → all 7 tests pass (3 unit + 4 API route)
> - Failure path: Change `.toBe(401)` to `.toBe(200)` in the unauthorised test → it fails with "expected 401, received 200" → revert
>
> Do not mark complete until both paths pass.

---

### Step 5 — Understand What You Just Built

Mocking can feel like magic the first time. This step is conceptual — take 15 minutes to understand why the pattern works, so you can extend it yourself.

**Why mocking works:**

When your route handler imports `createClient` from `@/lib/supabase/server`, it's importing whatever that module exports. `vi.mock()` intercepts that import and returns your fake version instead — before the real module ever loads. Your handler code doesn't know it's talking to a fake; it just calls `.auth.getUser()` and gets back whatever you told the mock to return.

This is why you can test the 403 case (agent owned by a different user) without creating two real Supabase users. You just tell the mock "pretend the database returned an agent owned by `different-user-999`" — and the route handler's logic runs exactly as it would with a real response.

**The design analogy:** in Figma, you use placeholder components when you're testing a layout before real content is ready. Mocks are placeholder database responses — same shape, controlled content, available immediately.

**The Supabase chain problem:** the trickiest part of API route mocking is matching the exact method chain. If the real code does:
```typescript
supabase.from('agents').select('*').eq('id', agentId).single()
```
Your mock must return an object where each call returns the next level:
```typescript
from: () => ({
  select: () => ({
    eq: () => ({
      single: mockFn
    })
  })
})
```
If you get `Cannot read property 'eq' of undefined`, it means the chain doesn't match the real code. Read the route handler carefully and trace every method call.

---

### ✅ Before You Commit — API Route Tests

All of the following must pass before committing. Ask Claude Code to run them if you haven't already:

| Test | Expected result |
|---|---|
| `npm test` | All 7+ tests pass (unit tests + API route tests) |
| `npx tsc --noEmit` | No TypeScript errors in test files |
| POST 401 test | Passes — mock returns `user: null`, route returns 401 |
| POST 400 test | Passes — mock returns authenticated user, missing body → 400 |
| POST 201 test | Passes — mock returns user + successful insert → 201 |
| DELETE 401 test | Passes — mock returns `user: null` → 401 |
| DELETE 403 test | Passes — mock returns different user_id → 403 |
| DELETE 200 test | Passes — mock returns matching user_id + successful delete → 200 |
| DELETE 404 test | Passes — mock returns null data + PGRST116 error → 404 |

Do not commit until every row shows the expected result.

### 💾 Commit Checkpoint — API Route Tests Complete

API route tests are now covering the two most critical endpoints with mocked Supabase. This is the most complex testing pattern you'll use — everything else is a variation on this.

```bash
git add -A
git commit -m "feat: add API route tests for POST and DELETE /api/agents with vi.mock()"
```

---

## Session 3 — Hours 5–6: CI Integration & Coverage

### Step 6 — Add Tests to GitHub Actions CI

Now wire your tests into the automated pipeline. Every push to `main` (and every pull request) will run `npm test` on GitHub's servers before anything is deployed.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY`
>
> Add a test job to the existing GitHub Actions CI workflow.
>
> First, check if `.github/workflows/` already has a CI file (likely `ci.yml` or `main.yml`). If it does, add a parallel `test` job alongside the existing job(s). If it doesn't exist yet, create `.github/workflows/ci.yml` from scratch.
>
> **The test job should:**
>
> ```yaml
> test:
>   name: Unit & API Tests
>   runs-on: ubuntu-latest
>   steps:
>     - uses: actions/checkout@v4
>
>     - name: Set up Node.js
>       uses: actions/setup-node@v4
>       with:
>         node-version: '20'
>         cache: 'npm'
>
>     - name: Install dependencies
>       run: npm ci  # Faster than npm install — uses exact versions from package-lock.json
>
>     - name: Type check
>       run: npx tsc --noEmit  # Fails the CI if there are TypeScript type errors
>
>     - name: Run tests
>       run: npm test
>       env:
>         # All required env vars with fake test values — same as setup.ts but available to the CI runner
>         NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
>         NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key
>         SUPABASE_SERVICE_ROLE_KEY: test-service-role-key
>         ANTHROPIC_API_KEY: sk-ant-test-key
>         STRIPE_SECRET_KEY: sk_test_fake_key
>         STRIPE_WEBHOOK_SECRET: whsec_test_fake_secret
>         STRIPE_PRO_PRICE_ID: price_test_fake_id
>         UPSTASH_REDIS_REST_URL: https://test.upstash.io
>         UPSTASH_REDIS_REST_TOKEN: test-token
>         NEXT_PUBLIC_APP_URL: http://localhost:3000
> ```
>
> **If adding to an existing workflow file**, make the `test` job run in parallel with the existing `build` or `deploy` job — NOT as a dependency of it. This keeps CI fast.
>
> **If creating a new workflow file from scratch**, the full file should look like:
>
> ```yaml
> name: CI
>
> on:
>   push:
>     branches: [main, develop]
>   pull_request:
>     branches: [main]
>
> jobs:
>   test:
>     name: Unit & API Tests
>     runs-on: ubuntu-latest
>     steps:
>       - uses: actions/checkout@v4
>       - name: Set up Node.js
>         uses: actions/setup-node@v4
>         with:
>           node-version: '20'
>           cache: 'npm'
>       - name: Install dependencies
>         run: npm ci
>       - name: Type check
>         run: npx tsc --noEmit
>       - name: Run tests
>         run: npm test
>         env:
>           NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
>           NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key
>           SUPABASE_SERVICE_ROLE_KEY: test-service-role-key
>           ANTHROPIC_API_KEY: sk-ant-test-key
>           STRIPE_SECRET_KEY: sk_test_fake_key
>           STRIPE_WEBHOOK_SECRET: whsec_test_fake_secret
>           STRIPE_PRO_PRICE_ID: price_test_fake_id
>           UPSTASH_REDIS_REST_URL: https://test.upstash.io
>           UPSTASH_REDIS_REST_TOKEN: test-token
>           NEXT_PUBLIC_APP_URL: http://localhost:3000
> ```
>
> After building, verify by testing:
> - Happy path: Run `npm test` locally — all tests pass
> - Failure path: Temporarily add `process.env.NONEXISTENT_CHECK = 'should-fail'` and assert `expect(process.env.NONEXISTENT_CHECK).toBe('wrong')` in any test → test fails → revert → tests pass again
>
> Do not mark complete until both paths pass.

---

### Step 7 — Verify CI Catches Real Failures

Push to GitHub and confirm the CI workflow triggers and passes. Then introduce a deliberate failure to confirm it actually catches broken code.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2`
>
> Help me verify the GitHub Actions CI workflow is working correctly.
>
> 1. Commit and push the current state (all tests passing) to the `main` or `develop` branch:
>    ```bash
>    git add -A
>    git commit -m "ci: add test job to GitHub Actions workflow"
>    git push
>    ```
>
> 2. Tell me the URL where I can watch the workflow run: `https://github.com/<username>/agentforge/actions`
>
> 3. Once the first run passes (green ✓), introduce a deliberate failure to verify CI catches broken code:
>    - In `src/lib/__tests__/relativeTime.test.ts`, change one assertion to be intentionally wrong (e.g. `toBe('just now')` → `toBe('never')`)
>    - Commit and push
>    - Tell me what the CI run should show: the test job fails with a red ✗, deployment (if any) should not proceed
>
> 4. Revert the broken assertion, commit and push again:
>    - CI should go green again
>
> This confirms CI is a real gate, not just decoration.

**After you see the green CI badge, your test infrastructure is real.** Every future PR will automatically run these tests before anyone merges.

---

### Step 8 — Coverage Report and Thresholds

Now check how much of your code is covered and ensure the thresholds you set in `vitest.config.ts` (40% lines/functions/statements, 30% branches) are met.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2`
>
> Run the coverage report and review the results:
>
> ```bash
> npm run test:coverage
> ```
>
> 1. Show me the coverage table that appears in the terminal output — it lists each file with % statements, % branches, % functions, % lines covered
> 2. Are any of the thresholds (lines: 40, functions: 40, branches: 30, statements: 40) failing?
> 3. If thresholds are failing, identify which files are dragging the numbers down. The likely culprits are:
>    - Files in `src/app/**` (which are excluded, so they won't appear)
>    - Files in `src/lib/` that have no tests at all
> 4. If the thresholds fail, either:
>    - Add the failing files to the `exclude` list in `vitest.config.ts` (acceptable for files like database clients, third-party wrappers) — or
>    - Write a minimal smoke test (just import the module and check it doesn't throw) to get that file above 0%
> 5. Once coverage thresholds pass, `npm run test:coverage` must exit with code 0 (success), not code 1 (failure)
>
> After building, verify by testing:
> - Happy path: `npm run test:coverage` → all thresholds met → exits successfully
> - Failure path: Set a threshold to 99 in `vitest.config.ts` → coverage fails with "Coverage for lines (X%) does not meet global threshold (99%)" → revert to original thresholds → passes again
>
> Do not mark complete until both paths pass.

---

### ✅ Before You Commit — CI and Coverage

All of the following must pass before committing. Ask Claude Code to run them if you haven't already:

| Test | Expected result |
|---|---|
| `npm test` | All tests pass locally |
| `npm run test:coverage` | All coverage thresholds met, exits with code 0 |
| `npx tsc --noEmit` | No TypeScript errors |
| Push to GitHub | CI workflow triggers automatically |
| First CI run | All jobs show green ✓ |
| Deliberate broken test pushed | CI job shows red ✗ |
| Fixed test pushed | CI job shows green ✓ again |

Do not commit until every row shows the expected result.

### 💾 Commit Checkpoint — CI and Coverage Complete

Tests are running locally, coverage thresholds are met, and GitHub Actions is enforcing both on every push. This is the testing foundation the project needed from day one.

```bash
git add -A
git commit -m "feat: CI test job with coverage thresholds — 40% lines/functions, 30% branches"
```

---

## ✨ Stretch Tasks

These are optional. Complete the core week first, then return here if you have time.

---

### Stretch 1 — Stripe Webhook Handler Tests

The Stripe webhook handler (`POST /api/webhooks/stripe`) is one of the most critical code paths in the app — it's what flips a user from free to Pro. Test it without needing a real Stripe event.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY`
>
> Create `src/lib/__tests__/webhook.test.ts` — Vitest tests for the Stripe webhook handler at `src/app/api/webhooks/stripe/route.ts`.
>
> **Mock both the Stripe client and Supabase:**
> ```typescript
> vi.mock('stripe', () => ({
>   default: vi.fn().mockImplementation(() => ({
>     webhooks: {
>       constructEvent: vi.fn(),
>     },
>   })),
> }))
>
> vi.mock('@/lib/supabase/server', () => ({
>   createClient: vi.fn(),
> }))
> ```
>
> **Write three test cases:**
>
> 1. **Invalid webhook signature → 400 (Bad Request)**
>    - `stripe.webhooks.constructEvent` throws a `Stripe.errors.StripeSignatureVerificationError`
>    - The route should return 400 without touching the database
>
> 2. **`customer.subscription.created` event with a Pro price ID → upgrades user to Pro**
>    - `constructEvent` returns a fake event object: `{ type: 'customer.subscription.created', data: { object: { customer: 'cus_fake', items: { data: [{ price: { id: process.env.STRIPE_PRO_PRICE_ID } }] } } } }`
>    - Mock Supabase to return a user matching that customer ID
>    - Assert the Supabase `update` is called to set `tier = 'pro'`
>    - Route should return 200
>
> 3. **`customer.subscription.deleted` event → downgrades user to free**
>    - `constructEvent` returns `{ type: 'customer.subscription.deleted', data: { object: { customer: 'cus_fake' } } }`
>    - Assert Supabase `update` is called to set `tier = 'free'`
>    - Route should return 200
>
> After building, verify by testing:
> - Happy path: `npm test` → all webhook tests pass alongside the existing tests
> - Failure path: Remove the `constructEvent` mock so it throws an unexpected error → test for invalid signature should still pass (since any throw from constructEvent → 400), but a test expecting 200 should fail → revert and fix
>
> Do not mark complete until both paths pass.

---

### Stretch 2 — Write TESTING.md

Document all four layers of your testing strategy in a single file so future contributors (and future you) understand the system.

> **Prompt for Claude Code:**
>
> `Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2`
>
> Create `docs/TESTING.md` — a clear guide to the project's testing strategy covering all four layers.
>
> **Structure:**
>
> ## Testing Strategy — AgentForge
>
> ### Four Layers of Tests
>
> | Layer | Tool | What it tests | When to use it |
> |---|---|---|---|
> | Tool logic | `npx tsx src/lib/tools/test-runner.ts` | Tests the 5 agent tools directly (no HTTP) | After changing any tool function |
> | API routes (HTTP) | `node src/lib/tools/test-routes.ts` | Tests real HTTP responses against a live dev server | After changing any API route |
> | Unit tests (Vitest) | `npm test` | Tests pure functions and mocked route handlers | After any logic change — runs in CI |
> | E2E browser tests (Playwright) | `npx playwright test` | Full browser simulation from signup to agent creation | Before major releases |
>
> ### Running Tests Locally
> (bash commands for each layer)
>
> ### Running Tests in CI
> (how the GitHub Actions workflow is structured, what triggers it)
>
> ### Coverage
> (current thresholds, where to find the report, how to interpret it)
>
> ### When Tests Should NOT Be Written
> Follow this rule from the project: "Never start a dev server and poll logs waiting for browser interaction to verify logic that can be tested with tsx." If something can be tested with `tsx` directly, test it that way — not with a browser.
>
> ### Adding New Tests
> (guidance on which layer to add to for different kinds of changes)
>
> Write in plain English, not jargon. Include the design analogy: tests are the project's design system — they define what "correct" means and prevent future changes from accidentally breaking established behaviour.

---

### ✅ Before You Commit — Stretch Tasks

| Test | Expected result |
|---|---|
| `npm test` | All tests pass including webhook tests (if Stretch 1 done) |
| `docs/TESTING.md` exists | File is present and readable (if Stretch 2 done) |
| `npx tsc --noEmit` | No TypeScript errors |

### 💾 Commit Checkpoint — Stretch Tasks Complete (if attempted)

```bash
git add -A
git commit -m "feat: Stripe webhook tests and TESTING.md documentation"
```

---

## 💾 Sprint Close — Week 13 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, and update `CLAUDE.md`'s Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 13 complete — Vitest unit tests, API route tests with mocking, CI integration, coverage thresholds"
```

After committing, open `CLAUDE.md` and move "Week 13" from Current Focus into Completed Work with a two-sentence summary of what shipped. Update the Current Focus to:

> **Week 14: Testing & Code Quality (Part 2)** — E2E Playwright tests for the critical signup-to-first-agent flow, mutation testing to verify your test suite actually catches real bugs, and a final code quality audit before launch.

---

## ✅ Completion Checklist

Go through every item. If anything is unchecked, complete it before calling the week done.

**Setup**
- [ ] Vitest installed as devDependency
- [ ] `vitest.config.ts` created with `environment: 'node'`, `globals: true`, v8 coverage provider
- [ ] `src/lib/__tests__/setup.ts` created with all required env vars as test placeholders
- [ ] `package.json` has `test`, `test:watch`, and `test:coverage` scripts
- [ ] `npx tsc --noEmit` passes with zero errors

**Unit Tests**
- [ ] `relativeTime.test.ts` exists with tests for all time ranges
- [ ] `agentSchema.test.ts` exists with happy path and at least 2 failure paths
- [ ] `env.test.ts` exists testing env validation
- [ ] `npm test` passes all unit tests

**API Route Tests**
- [ ] `api-agents.test.ts` exists with Supabase mocked via `vi.mock()`
- [ ] POST /api/agents: 401 test passes
- [ ] POST /api/agents: 400 test passes
- [ ] POST /api/agents: 201 test passes
- [ ] DELETE /api/agents/[id]: 401 test passes
- [ ] DELETE /api/agents/[id]: 403 test passes (different owner)
- [ ] DELETE /api/agents/[id]: 200 test passes (correct owner)
- [ ] DELETE /api/agents/[id]: 404 test passes (agent not found)

**Coverage**
- [ ] `npm run test:coverage` exits with code 0 (all thresholds met)
- [ ] Line coverage ≥ 40%
- [ ] Function coverage ≥ 40%
- [ ] Branch coverage ≥ 30%
- [ ] Statement coverage ≥ 40%

**CI Integration**
- [ ] `.github/workflows/ci.yml` exists (or updated) with a `test` job
- [ ] `test` job includes `npm ci`, `npx tsc --noEmit`, and `npm test` steps
- [ ] All required env vars are set in the CI job's `env:` block
- [ ] Push to GitHub triggered the CI workflow
- [ ] CI workflow shows green ✓
- [ ] Deliberately broken test produced red ✗ in CI
- [ ] Fixed test produced green ✓ again

**CLAUDE.md**
- [ ] Week 13 moved from Current Focus into Completed Work
- [ ] Current Focus updated to Week 14

**Stretch (if attempted)**
- [ ] `webhook.test.ts` with 3 test cases (invalid sig, created, deleted)
- [ ] `docs/TESTING.md` documenting all 4 test layers

---

## 🧪 Validation Tests

Work through the groups **in order** — each group shares the same app state so you never need to backtrack or make the same change twice.

---

### Group 1 — Environment & Build

No app state changes needed. Confirm the foundation is solid before testing anything else.

| Test | Expected result |
|---|---|
| `npx tsc --noEmit` | 0 errors output |
| `npm run build` | Build completes without errors |
| `cat vitest.config.ts` | File exists and contains `environment: 'node'` |
| `cat src/lib/__tests__/setup.ts` | File exists and contains `NEXT_PUBLIC_SUPABASE_URL` |
| `cat package.json \| grep "\"test\""` | Shows `"test": "vitest run"` |
| `cat package.json \| grep vitest` | Shows vitest in devDependencies |
| `cat .github/workflows/ci.yml` | File exists and contains `npm test` step |

---

### Group 2 — Unit Tests (Happy Path)

Run from the project root. No Supabase or external services needed — everything is in memory.

| Test | Expected result |
|---|---|
| `npm test` | All tests pass; output shows ✓ for relativeTime, agentSchema, env |
| `npm test -- --reporter=verbose` | Each individual test case name is visible with ✓ |
| Check relativeTime "just now" case | `relativeTime(0)` → "just now" (or equivalent) |
| Check relativeTime hours case | `relativeTime(3600)` → "1 hour ago" (or equivalent) |
| Check schema happy path | Valid agent object → `safeParse().success === true` |
| Check schema missing name | Object without name → `safeParse().success === false` |

---

### Group 3 — API Route Tests (with Mocks)

No real database needed — these run entirely against mocked Supabase responses.

| Test | Expected result |
|---|---|
| `npm test src/lib/__tests__/api-agents.test.ts` | All 7 tests in this file pass |
| POST 401 test | Output shows ✓ for "returns 401 when user is not logged in" |
| POST 400 test | Output shows ✓ for "returns 400 when name is missing" |
| POST 201 test | Output shows ✓ for "returns 201 when valid agent submitted" |
| DELETE 401 test | Output shows ✓ for "returns 401 when not logged in" |
| DELETE 403 test | Output shows ✓ for "returns 403 when deleting someone else's agent" |
| DELETE 200 test | Output shows ✓ for "returns 200 when owner deletes their agent" |
| DELETE 404 test | Output shows ✓ for "returns 404 when agent not found" |

---

### Group 4 — Coverage Thresholds

| Test | Expected result |
|---|---|
| `npm run test:coverage` | Exits with code 0 (success) |
| Lines coverage shown | ≥ 40% |
| Functions coverage shown | ≥ 40% |
| Branches coverage shown | ≥ 30% |
| Statements coverage shown | ≥ 40% |
| **Threshold verification:** temporarily set `lines: 99` in `vitest.config.ts` | Coverage fails with "does not meet global threshold" message |
| Revert to `lines: 40` | `npm run test:coverage` passes again |

---

### Group 5 — CI Pipeline

**Prerequisite:** push all commits to GitHub before this group.

| Test | Expected result |
|---|---|
| Visit `https://github.com/<username>/agentforge/actions` | CI workflow visible in list |
| Most recent run | All jobs show green ✓ |
| Click into the `test` job | Shows `npm ci`, `npx tsc --noEmit`, `npm test` all ✓ |
| **Deliberate failure test:** push a commit with a broken assertion | CI shows red ✗ on the `test` job |
| Push revert commit | CI shows green ✓ again |
| Pull request to main | CI runs automatically on the PR (if PRs are in your workflow) |

---

### Group 6 — Stretch Tasks *(optional — only if attempted)*

*Skip this group entirely if you didn't attempt the stretch tasks.*

| Test | Expected result |
|---|---|
| `npm test src/lib/__tests__/webhook.test.ts` | All 3 webhook tests pass |
| Invalid signature test | ✓ for "returns 400 for invalid webhook signature" |
| subscription.created test | ✓ for "upgrades user to Pro on subscription.created" |
| subscription.deleted test | ✓ for "downgrades user on subscription.deleted" |
| `cat docs/TESTING.md` | File exists with 4-layer table and running instructions |

---

## Resources

- [Vitest documentation](https://vitest.dev/guide/) — official guide; the "Mocking" section is especially relevant for `vi.mock()`
- [Vitest coverage](https://vitest.dev/guide/coverage) — how to interpret the coverage report and adjust thresholds
- [GitHub Actions documentation](https://docs.github.com/en/actions) — workflow syntax reference
- [Next.js testing guide](https://nextjs.org/docs/app/guides/testing/vitest) — official Vitest setup for App Router projects
- [Stripe webhook testing](https://stripe.com/docs/webhooks/test) — how to construct test events for webhook handlers (used in Stretch 1)
- [V8 coverage provider](https://vitest.dev/guide/coverage#v8) — why V8 is preferred over istanbul for Next.js projects
