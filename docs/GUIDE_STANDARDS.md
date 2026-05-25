# AgentForge — Weekly Guide Standards

Non-negotiable rules for every weekly guide. These apply whether the guide is being written fresh or updated. All rules were established through explicit feedback during the 13-week learning plan.

---

## 1. Technical Terms — Always Explain Inline

Whenever a technical term, code, number, or jargon appears for the first time, explain it in the same sentence or immediately after. Never assume the reader knows what it means.

**Applies to:** HTTP status codes, terminal commands, TypeScript/React concepts, package names, file naming conventions (`[id]`, `route.ts`), Supabase terms (RLS, SSR client), any acronym on first use.

**Correct:** `return 403 (Forbidden — logged in but not allowed to do this action)`
**Wrong:** `return 403 if the agent doesn't belong to them`

When many related terms appear together (e.g. all HTTP codes used in a week), add a reference table before the section that uses them.

---

## 2. Defensive UX — Always Build Both Paths

Every task involving a form, API call, database operation, or user action must include:
1. The happy path (success)
2. All realistic failure paths (network down, session expired, server error, empty input)

Error handling is not a stretch task — it is part of the core task. Claude Code prompts must explicitly request both paths. Testing steps must include deliberate failure tests.

UX principle to reinforce: **never punish the user for a system failure.** Form fields must not clear on error. Buttons must reset after failure. Error messages must be human-readable, not raw error dumps.

---

## 3. HTTP Reference Tables

Include the request types table whenever API routes are first introduced in a week:

| Request type | Intention | When used |
|---|---|---|
| GET | "Give me data" | Loading pages, fetching lists |
| POST | "Here is new data, store it" | Creating resources |
| PUT / PATCH | "Update existing data" | Editing resources |
| DELETE | "Remove this data" | Deleting resources |

Include the status codes table whenever a week introduces routes that return non-200 codes:

| Code | Name | Meaning | When to use |
|---|---|---|---|
| 200 | OK | Request succeeded | Generic success |
| 201 | Created | New resource created | After successful INSERT |
| 400 | Bad Request | Malformed/incomplete data | Missing fields, invalid signature |
| 401 | Unauthorised | Not logged in | No valid Supabase session |
| 403 | Forbidden | Logged in but not allowed | Wrong user |
| 402 | Payment Required | Usage limit hit | Free-tier limit reached |
| 429 | Too Many Requests | Rate limit exceeded | Rate limiter triggered |
| 500 | Internal Server Error | Server-side failure | DB crash, unhandled exception |

---

## 4. Test Cases Inside Claude Code Prompts — Non-Negotiable

Every Claude Code prompt that involves building something must end with verification steps **inside the prompt itself**. Claude Code only sees what's in the prompt — tests listed after the quote block are invisible to it.

**Required ending for every build prompt:**
```
After building, verify by testing:
- Happy path: [exact steps] → [expected result]
- Failure path: [exact steps] → [expected result]
Do not mark complete until both pass.
```

---

## 5. Pre-Commit Verification Block — Before Every Checkpoint

Every commit checkpoint must be preceded by a `### ✅ Before You Commit` block that consolidates all tests from the preceding steps. Format:

```
### ✅ Before You Commit — [Section Name]

| Test | Expected result |
|---|---|
| [test from Step X] | [expected output] |
| [test from Step Y] | [expected output] |
```

Place it immediately above the `### 💾 Commit Checkpoint` block. Include both happy path AND failure path tests. If any test fails, fix it before committing.

---

## 6. Git Commit Checkpoints — Required in Every Guide

- After logical groups of completed work — not after every single task
- Use `feat:` prefix with descriptive messages: `feat: create agent form with POST API route and full error handling`
- If the week has stretch tasks, add a checkpoint after them (marked "if attempted") before the sprint close
- Sprint close always goes **after** stretch tasks, never before

**Sprint Close format:**
```
### 💾 Sprint Close — Week X Complete

Run `/sprint-close` in Claude Code first to review the week's work and update CLAUDE.md. Then commit:

\`\`\`bash
git add -A
git commit -m "feat: week X complete — [summary of what shipped]"
\`\`\`

After committing, move "Week X" from Current Focus into Completed Work in CLAUDE.md.
```

---

## 7. Validation Tests — Grouped by App State, Never Backtracking

The `## 🧪 Validation Tests` section at the end of every guide must be structured as **named groups that share app state** — never a flat list. The rule: you should never need to make the same Supabase change twice, or switch state back and forth.

### Required section header

```
## 🧪 Validation Tests

Work through the groups **in order** — each group shares the same app state so you never need to backtrack or make the same Supabase change twice.
```

### Group ordering (always follow this sequence)

| Group | What goes here | Supabase changes |
|---|---|---|
| **Group 1 — Environment & Build** | `npm run dev`, env var validation, `npx tsc --noEmit`, dev server startup | None |
| **Group 2 — [Feature] Happy Path** | Natural signup/usage flow — app creates its own state | None — fresh user |
| **Group 3 — External Services** | Webhooks, CLI triggers, third-party API calls (while services are already running) | None |
| **Group 4+ — State-specific limits** | One group per distinct Supabase state needed (e.g. free tier limits, pro tier limits) | One setup per group |
| **Near last — Rate Limiting & Security** | Rate limit tests, input validation, security audit | Reset `message_count` to 0 |
| **Last — Stretch Tasks** | Optional stretch feature tests | Varies |

### Supabase setup callout format

When a group requires a manual Supabase change, add this bolded block at the top of the group (not inside the table):

> **Supabase setup (do once before this group):** In `subscriptions`, set `tier = 'free'`. In `usage`, set `message_count = 100` for the current period row (`YYYY-MM`). Then run all tests in this group without changing anything in between.

### Rules

1. `npx tsc --noEmit` always belongs in Group 1 — never scattered mid-table
2. Each distinct tier change (`free` → `pro`) means a new group
3. Within a group, one incremental value change (e.g. bumping `message_count` from 200 → 5000) is acceptable
4. Stretch tasks are always the last group, with an italicised note that they're optional
5. Each group gets its own `<table>` — do not merge groups into one flat table

---

## 8. Design Analogies — Figma/Design Comparisons in Concept Tables

Lakii is a UX designer. Every technical concept in the Key Concepts table should have a Figma or design workflow analogy in the third column. This is what makes abstract technical ideas concrete and memorable.

---

## 9. Playwright E2E Tests — End-of-Week Update Rule

Every weekly guide must include a Playwright update step as part of the sprint-close sequence. This is non-negotiable — a week is not complete until the E2E suite reflects what was built.

### The three-tier rule — what goes where

| Tier | Tool | What it covers |
|---|---|---|
| **Automate — Playwright** | `e2e/*.spec.ts` | UI behaviour your code fully controls: limit cards, toasts, counters, redirects, mocked 402/429 responses, query-param handling |
| **Test manually — checklist** | Week guide completion checklist | External service flows: real Stripe checkout with test card, Stripe CLI webhook triggers, email delivery verification |
| **Never automate** | — | Stripe-hosted checkout pages, third-party iframes, anything that requires `stripe listen` as a side process during the test run |

**Why the split:** Playwright tests should only break when *your* code breaks. Automating Stripe's hosted checkout means tests break whenever Stripe updates their UI — that's the wrong signal. Use the checklist for anything that crosses an external domain.

### What to do at the end of every sprint

Before running `/sprint-close` and the final commit, assess each week's features against these rules:

1. **New UI features added this week** → create a new `e2e/[feature].spec.ts` with tests for the happy path and key failure states. Use `page.route()` to mock any API responses that return non-200 status codes (402, 429, 500) — do not depend on real DB state.

2. **Existing UI changed this week** (element type changed, selector changed, new placeholder, new route) → update the affected spec files before they go stale. Common triggers: input → textarea conversions, button text changes, route renames.

3. **External service flows added this week** (Stripe checkout, webhook handler, email sends) → add manual verification steps to the week's completion checklist only. Document the CLI commands and expected Supabase state changes there.

4. **Auth setup or teardown changed** (new tables with `user_id` FK, new test data needed) → update `e2e/auth.setup.ts` and `e2e/teardown.ts` accordingly. Confirm CASCADE DELETE covers any new tables.

5. **Run the full suite** before the sprint-close commit:
   ```bash
   npx playwright test --reporter=list
   ```
   All tests must be green. A broken E2E suite must be fixed before committing — never leave it red at end of week.

### File naming convention

| What the week built | Spec file to create or update |
|---|---|
| Conversation or chat UI changes | `e2e/conversations.spec.ts` |
| Share / public pages | `e2e/share.spec.ts` |
| Payments, subscriptions, usage limits | `e2e/subscriptions.spec.ts` |
| Auth flows (login, signup, reset) | `e2e/auth.spec.ts` |
| Agent builder / CRUD | `e2e/agents.spec.ts` |
| Admin or internal pages | `e2e/admin.spec.ts` |

### Mocking pattern — use page.route() for non-200 responses

Never change real DB state (usage rows, subscription tiers) mid-test to trigger error states. Use `page.route()` to mock the API response instead — it tests the UI's handling of the response without touching Redis or Supabase:

```typescript
await page.route('/api/chat', route =>
  route.fulfill({
    status: 402,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'MESSAGE_LIMIT_REACHED', cta: 'upgrade' }),
  })
)
// ... test the UI response ...
await page.unroute('/api/chat')  // always clean up after the test
```

Always call `page.unroute()` at the end of the test — a lingering route intercept will cause every subsequent test in the same file to receive the mocked response.
