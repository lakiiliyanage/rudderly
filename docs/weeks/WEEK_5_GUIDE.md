# Week 5 Guide — Next.js Deep Dive: Pages, APIs & Data Fetching 🔌

> **Goal:** Build the full CRUD skeleton of AgentForge — users can create, view, and delete AI agents, with data flowing from a real form all the way into Supabase and back onto the screen. No AI yet — but by Sunday night your app *behaves* like a real product.
> **Time:** 8–10 hours total — Saturday 3pm–7pm (4 hrs) + Sunday 3pm–7pm (4 hrs) + stretch tasks (+2 hrs)
> **Prerequisite:** Week 4 complete — Supabase auth working (users can sign up and log in), `agents` table created with RLS enabled, profile page built, `.env.local` populated with real Supabase credentials

---

## Why This Week Matters

Week 4 gave your app a heartbeat — authentication and a database. This week is the moment it learns to *think*. You're building the full data loop: a user fills in a form → that data travels to Supabase → it gets stored against their user ID → it gets fetched back and displayed on screen → they can delete it.

This loop — **create, read, update, delete** (CRUD) — is the backbone of literally every SaaS product you've ever used. Notion, Linear, Figma, Slack. Every feature in those products is some variation of this loop. Once it clicks, you'll see it everywhere.

Here's what changes this weekend:

- A user visits `/agents/new` → fills in a name, description, personality, and goal → clicks Save → it's stored in Supabase, tied to their account
- They visit `/dashboard` → their agents appear as cards, each one fetched live from the database
- They click Delete → the card disappears immediately, the row is removed from Supabase
- They visit `/agents/[id]` → they see a detail page for that specific agent, ready to be powered by Claude in Week 6

**The Next.js mental model for designers:** Think of Next.js pages like Figma frames — each URL is a frame, each frame has its own layout and content. The difference is that Next.js frames can *fetch real data* before they appear on screen. The App Router decides: does this frame get built on the server (faster, better SEO) or in the browser (interactive, responds to clicks)? This week you'll understand exactly when and why that choice matters.

---

## 8–10 Hour Overview

| Session | Hours | Focus |
|---------|-------|-------|
| Saturday 3–5pm | 1–2 | Next.js routing deep dive — build your four core pages |
| Saturday 5–7pm | 3–4 | The Create Agent form — wire it all the way to Supabase |
| Sunday 3–5pm | 5–6 | Dashboard — fetch and display real agent data |
| Sunday 5–7pm | 7–8 | Delete, AgentCard component, empty states + loading skeletons |
| Stretch (+2 hrs) | 9–10 | Zod validation + optimistic UI |

---

## What You're Learning This Week

| Concept | What it is | Design analogy |
|---------|-----------|----------------|
| Next.js routing | URL structure is defined by folder/file structure | Figma's page hierarchy — `/dashboard` maps to a `dashboard/page.tsx` file |
| Server Component | A React component that runs on the server, fetches data, and sends HTML | Like a Figma prototype that pre-renders before it reaches the user |
| Client Component | A React component that runs in the browser, handles interactions | Like a live Figma component that responds to hover/click states |
| API route | A server-side function your frontend calls to do backend work | Like a Figma plugin — it runs logic that the UI layer can't touch directly |
| Dynamic route | A URL pattern that accepts a variable segment, e.g. `/agents/[id]` | Like a Figma component variant — one definition, infinite instances |
| CRUD | Create, Read, Update, Delete — the four operations on any data | Adding, viewing, editing, and deleting a layer in Figma |
| Zod | A schema validation library that checks data shape before saving it | Like Figma's constraints — enforces rules so data doesn't break your design |
| Optimistic UI | Update the screen immediately, confirm with the server in the background | Like how Figma auto-saves locally while syncing to the cloud in the background |
| Defensive UX | Designing every interaction to handle failure gracefully, not just success | Designing error states in Figma before anyone sees the happy path — the mark of a senior designer |
| HTTP status code | A 3-digit number every server response carries — tells the client what happened | Like a delivery status: 201 = delivered, 400 = wrong address, 401 = no access, 500 = courier broke down |

---

## Before You Start — Environment Verification

Open your terminal, navigate to your `agentforge` folder, and confirm everything from Week 4 still works:

```bash
cd ~/agentforge
node --version          # should print v18.x or higher
npm run dev             # should start at localhost:3000
```

Visit `localhost:3000` in your browser:

- [ ] Landing page loads with Navbar and Footer
- [ ] `/login` page works — you can log in with your test account
- [ ] `/dashboard` redirects to login if you're not signed in
- [ ] `/profile` page shows your email and account details
- [ ] Supabase dashboard shows your `agents` table with RLS enabled

If anything above is broken, fix it before starting Hour 1. A shaky foundation will create confusing bugs later.

Also check your `.env.local` still has both real Supabase credentials:

```bash
cat .env.local
# Should show your actual NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Hours 1–2: Next.js Routing Deep Dive — Build Your Four Core Pages

### The Mental Model First

Next.js App Router uses your **folder structure as your URL structure**. This is genuinely one of the most elegant things about modern Next.js — there's no separate routing config file. The file system *is* the router.

| File path | URL it produces | What it shows |
|-----------|----------------|---------------|
| `src/app/page.tsx` | `/` | Landing page |
| `src/app/dashboard/page.tsx` | `/dashboard` | User's agent list |
| `src/app/agents/new/page.tsx` | `/agents/new` | Create agent form |
| `src/app/agents/[id]/page.tsx` | `/agents/abc123` | Specific agent detail |

The `[id]` in square brackets is a **dynamic segment** — it's a placeholder that matches any value. When a user visits `/agents/abc123`, Next.js gives you `params.id === "abc123"` inside the page component. This is how every detail page works — Notion pages, Figma file URLs, Stripe invoice pages. One template, infinite instances.

### Task 1 — Understand Server vs. Client Components

Before building anything, ask Claude Code this:

> *"Explain the difference between Server Components and Client Components in Next.js App Router. When should I choose one over the other? Give me a real example using an agent list on a dashboard — which parts would be Server Components and which would be Client Components?"*

Read the response carefully. The key rule you need to remember:

- **Server Component** — default in App Router. Can fetch data from Supabase directly. Cannot use `useState`, `useEffect`, or browser event listeners (`onClick`, `onChange`). Runs once on the server, ships HTML.
- **Client Component** — add `"use client"` at the top. Can use hooks, handle events, respond to user interactions. Cannot directly access server-only resources (like secret API keys).

The pattern you'll use all week: **Server Component fetches data → passes it to Client Component as props → Client Component handles interactions**.

### Task 2 — Build the Four Core Pages

Ask Claude Code:

> *"I'm building AgentForge — a visual AI agent builder. I need you to create four pages using Next.js 16 App Router, TypeScript, and Tailwind CSS v4. The pages should use our dark theme consistent with the landing page already built. Here's what each page needs:*
>
> *1. `/` — the landing page already exists, skip this one*
> *2. `/dashboard` — a protected page (redirect to /login if not authenticated). Header says 'My Agents' with a 'Create Agent' button linking to /agents/new. Show a placeholder grid where agent cards will go. Fetch agents from Supabase if any exist.*
> *3. `/agents/new` — a protected page with a form: Agent Name, Description, Personality, Goal fields. A 'Save Agent' button and a 'Cancel' link back to /dashboard.*
> *4. `/agents/[id]` — a protected detail page. Show the agent's name and description in a header. Show a placeholder chat area with 'AI integration coming in Week 6'. Include Edit and Delete buttons.*
>
> *Use Supabase SSR client for authentication checks. Use our existing Navbar and Footer in all pages."*

Once Claude Code generates the files, do the following:
1. Read each file it created — don't skim. Ask it to explain any line you don't recognise.
2. Test each URL in your browser: `/dashboard`, `/agents/new`, `/agents/sometest`
3. Try visiting `/dashboard` while logged out — confirm you get redirected to `/login`

### Task 3 — Understand the Dynamic Route

Open `src/app/agents/[id]/page.tsx` and find where `params` is used. Then ask Claude Code:

> *"In this file, explain how `params.id` gets its value. Walk me through what happens when I visit /agents/abc123 — from the browser request all the way to the value appearing inside my component."*

This is one of those moments where the explanation is more valuable than the code. Write the answer in your own words in a comment at the top of the file:

```tsx
// When a user visits /agents/abc123:
// 1. Next.js matches the [id] dynamic segment
// 2. params.id is set to "abc123"
// 3. We use that ID to fetch the right agent from Supabase
// 4. The fetched agent's data is rendered into this template
```

---

## Hours 3–4: The Create Agent Form — Wired All the Way Through

### The Mental Model First

A form in a web app is a small data pipeline — and every stage of it can fail:

```
User fills fields      → can fail: empty fields, wrong format, too long
JavaScript captures    → can fail: field not wired up, wrong value type
API route receives     → can fail: session expired, malformed request body
API route validates    → can fail: missing fields, constraint violation
Supabase stores        → can fail: network error, DB constraint, RLS block
User is redirected     → can fail: redirect config wrong, stale session
```

Most developers build the happy path first and patch failures later. As a UX designer you already know that users encounter failure states constantly — and that a silent failure (nothing happens, no feedback) is far worse than a visible one. Build both paths together from the start.

### Task 4 — Build the Create Agent Form

Ask Claude Code:

> *"Build the complete Create Agent form at `/agents/new`. I need:*
>
> *Form fields (all required):*
> - *Agent Name — text input, 3–50 characters*
> - *Description — textarea, 10–200 characters*
> - *Personality — select dropdown with options: Professional, Friendly, Direct, Creative, Empathetic*
> - *Goal — text input, what this agent is designed to do, up to 150 characters*
>
> *On submit — happy path:*
> - *Validate that all fields are filled*
> - *Send data to a new API route: POST /api/agents*
> - *The API route inserts a row into the Supabase `agents` table with: name, description, personality, goal, user_id (from the current session), created_at (now)*
> - *On success, redirect the user to /dashboard*
> - *Show a loading state on the button while the request is in flight*
>
> *On submit — error handling (all of these must be handled):*
> - *If the API returns an error response, show a visible error banner above the submit button — e.g. 'Something went wrong saving your agent. Please try again.'*
> - *If the network request fails entirely (no internet, server down), catch that error and show: 'Connection failed — check your internet and try again.'*
> - *If the user's session has expired mid-form, show: 'Your session expired — please sign in again.' with a link to /login*
> - *After any error, reset the button from loading state back to normal so the user can retry*
> - *Never clear the form fields on failure — the user should not have to retype their work*
>
> *Use our dark theme and Tailwind CSS. Add the `'use client'` directive since this form has state and events."*

### HTTP Request Types — Quick Reference

Before diving into the API route, it helps to understand that not all requests are equal. Every HTTP request carries a **method** — a verb that tells the server what the client wants to do. There are four you'll use throughout AgentForge:

| Request type | Intention | Real-world analogy | When you'll use it |
|---|---|---|---|
| **GET** | "Give me data" | Reading a menu | Loading a page, fetching a list of agents |
| **POST** | "Here is new data, store it" | Placing an order | Creating a new agent — Task 5 below |
| **PUT / PATCH** | "Update existing data" | Changing an order | Editing an agent's name or description |
| **DELETE** | "Remove this data" | Cancelling an order | Deleting an agent — Task 11 |

This is why Task 5's API route uses POST — you're asking the server to store something new. When you build the Edit Agent feature later, that will use PATCH. When you wire up delete in Task 11, that uses DELETE. The method is the contract between your form and your server.

---

### HTTP Status Codes — Quick Reference

Every **response** your API route sends back carries a 3-digit status code. Where request methods tell the server what you want, status codes tell the client what happened. Same standard, other direction — used by every API you'll ever interact with, from Stripe to Supabase to Google.

| Code | Name | Meaning | When you use it |
|------|------|---------|-----------------|
| **200** | OK | Request succeeded | Generic success — data returned or action completed |
| **201** | Created | New resource was created | After a successful INSERT — e.g. a new agent was saved |
| **400** | Bad Request | The client sent something malformed or incomplete | Missing fields, wrong data types, failed validation |
| **401** | Unauthorised | The user is not authenticated (not logged in) | No valid session found — prompt them to sign in |
| **403** | Forbidden | The user is authenticated but not allowed to do this | Logged in but trying to delete someone else's agent |
| **404** | Not Found | The resource doesn't exist | Agent ID in the URL has no matching row in the database |
| **405** | Method Not Allowed | The HTTP method used isn't supported by this endpoint | A GET request hitting a POST-only route |
| **500** | Internal Server Error | Something broke on the server | Database failure, unexpected crash, unhandled exception |

> **Why this matters:** When your form receives an error response, it needs to decide what message to show the user. The status code is what lets your frontend distinguish "you did something wrong" (400) from "you're not logged in" (401) from "our server broke" (500) — and show the right message for each.

---

### Task 5 — Build the API Route

The form submits to `/api/agents`. Ask Claude Code separately:

> *"Create the Next.js API route at `src/app/api/agents/route.ts`. It should:*
>
> *Authentication:*
> - *Handle POST requests only — return 405 (Method Not Allowed) for any other HTTP method*
> - *Get the current user's session from Supabase SSR*
> - *Return 401 (Unauthorised — not logged in) with message 'Unauthorised — please sign in' if no valid session exists*
>
> *Validation:*
> - *Extract name, description, personality, and goal from the request body*
> - *Return 400 (Bad Request — the client sent incomplete data) with a clear message if any required field is missing or empty*
>
> *Database:*
> - *Wrap the Supabase insert in a try/catch block*
> - *If the insert succeeds, return the new agent as JSON with status 201 (Created — new resource saved successfully)*
> - *If the Supabase insert fails, return 500 (Internal Server Error — something broke on our side) with a descriptive message — not just 'Internal Server Error' — e.g. 'Failed to save agent — please try again'*
> - *Never expose raw Supabase error messages to the client (they can leak schema details)*
>
> *General:*
> - *Wrap the entire route handler in a try/catch so unexpected errors return a 500 with a safe message rather than crashing the server*"*

Once both files exist, ask Claude Code to explain this:

> *"What is an API route in Next.js App Router? How is it different from a Server Component? Why do I need a separate API route for form submissions instead of just fetching in the component?"*

### Task 6 — Test the Full Form Flow

**Happy path first:**
1. Start your dev server: `npm run dev`
2. Log in to your test account
3. Visit `/agents/new`
4. Fill in all four fields and click Save
5. Confirm you're redirected to `/dashboard`
6. Open your Supabase dashboard → Table Editor → `agents` table
7. Confirm your new agent row appears with your `user_id` attached

If the row appears in Supabase — you just built your first full-stack data pipeline. Data originated on your screen, travelled to your server, and was permanently stored in a database. This is how everything works.

**Now deliberately break it — test every failure path:**

| Test | How to trigger it | What you should see |
|------|-------------------|---------------------|
| Network failure | Turn off your internet, submit the form | 'Connection failed' message, button resets, fields preserved |
| API route returns 500 | In `src/app/api/agents/route.ts`, temporarily add `return NextResponse.json({ error: 'Forced error' }, { status: 500 })` as the first line of the POST handler, restart dev server, submit a valid form | Error banner shown, button resets, fields preserved. Remove the forced error after testing. |
| Broken Supabase URL | Change `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` to a fake value, restart dev server, visit `/agents/new` | You will be redirected to `/auth/login` — this is correct. The broken URL causes the page-level auth check to fail before the form even renders. This tests a different layer than form submission error handling. Restore the URL after. |
| Session expired | Sign out in another tab, go back to the form tab and submit | Session expired message with link to sign in |
| Empty fields | Submit with one or more fields blank | Validation error shown, form does not call the API |

After each failure test, confirm: the error message is visible and human-readable, the submit button is clickable again, and none of your typed content was lost.

> **Restore your `.env.local`** after the invalid URL test — don't forget.

If something unexpected goes wrong at any stage, copy the browser console error or terminal error and paste it into Claude Code: *"I'm getting this error when I submit the Create Agent form: [paste error]. Here's my form component and API route: [paste code]. What's wrong?"*

### 💾 Commit Checkpoint — Hours 3–4 Complete

The Create Agent form and API route are wired end-to-end. Commit this before moving on.

```bash
git add -A
git commit -m "feat: create agent form with POST API route and full error handling"
```

---

## Hours 5–6: Dashboard — Fetch and Display Real Agent Data

### The Mental Model First

The dashboard is your first real **Server Component data fetch**. When a user visits `/dashboard`, here's what happens in sequence:

```
Browser requests /dashboard
→ Next.js runs dashboard/page.tsx on the server
→ Page fetches the user's agents from Supabase (server-side, fast)
→ Next.js renders the HTML with the data already embedded
→ Browser receives finished HTML — no loading flash
```

This is Server-Side Rendering (SSR). The user never sees a blank page. Compare this to the old way: browser loads empty page → JavaScript runs → JavaScript fetches data → page finally shows content. SSR is faster and feels more solid.

### Task 7 — Review and Prepare the Dashboard Page

Claude Code may have already built a working dashboard when it scaffolded your pages in Hours 1–2. Before building anything new, ask it to review what exists and fill any gaps — so the file is fully ready for Tasks 8, 10, and 11.

Ask Claude Code:

> *"Review my current `src/app/dashboard/page.tsx` and confirm or fix the following:*
>
> *Server Component pattern:*
> - *No `'use client'` directive — this must be a Server Component that runs on the server, not the browser*
> - *The component function must be `async` so it can use `await` directly without hooks*
> - *Authentication must be checked via Supabase SSR before any data is fetched or any HTML is returned — redirect to `/auth/login` if no valid session*
>
> *Data fetching:*
> - *Agents must be fetched from the Supabase `agents` table server-side — no `useEffect`, no client-side fetch calls*
> - *The query must be filtered to the current user's rows only*
> - *The SELECT must include all five fields: `id`, `name`, `description`, `personality`, `created_at` — add `personality` if it is missing*
> - *The `Agent` type definition must include all five fields — add `personality: string | null` if missing*
>
> *Display:*
> - *Agents rendered in a responsive grid — 1 column on mobile, 2 on tablet, 3 on desktop*
> - *An empty state shown when the user has no agents*
>
> *Don't change anything that's already correct — only add or fix what's missing. Tell me what you changed and what was already in place."*

### Task 8 — Understand What's Already There

Open `dashboard/page.tsx` — you're not changing it, just reading it. Locate the auth check and the Supabase query, then ask Claude Code:

> *"Walk me through the data fetching in my `src/app/dashboard/page.tsx` — specifically the auth check and the Supabase query beneath it. Why can we fetch Supabase data directly in this component without a separate API route? Why does this pattern work in a Server Component but would fail in a Client Component that uses `useEffect`? What does `async` on the component function actually mean in Next.js — and why does it matter?"*

This is the conceptual heart of Week 5. Understanding the code that's already working is just as valuable as writing new code — and this exact pattern repeats in every data-fetching page you'll build through Weeks 6–12.

### The Full Picture in One Flow

Here is the complete sequence of what actually happens when a user visits `/dashboard` — from browser request to finished HTML:

```
Browser: GET /dashboard
         ↓
Next.js server calls DashboardPage()
— it's an async function, so Next.js awaits it before sending anything
         ↓
await createClient()    → reads the session cookie from the incoming HTTP request headers
await getUser()         → sends that cookie to Supabase auth servers to verify the JWT
redirect() if no user   → throws a redirect, Next.js sends a 302 to /login, function stops here
         ↓
await supabase.from('agents').select(...)
— runs directly on the server, server-to-server, no browser involved
         ↓
rawAgents.map(...)      → transforms each database row into the Agent shape your components expect
         ↓
return <div>...</div>   → JSX compiled to HTML with the real data already embedded in it
         ↓
Browser receives complete, finished HTML
— no loading state, no empty flash, no second network request needed
```

The browser never sees the Supabase query. It never sees the session cookie logic. It never sees your database credentials. It just receives finished HTML — the same way a static website works, except the content is personalised and live. That's the power of Server Components.

### Task 9 — Verify Data Isolation (RLS is Working)

Create a second test account in your app. Log in as that second account. Visit `/dashboard` — confirm you see zero agents (you created your test agent from Account 1). This is Row Level Security doing its job. Never take this for granted.

Then log back in as Account 1 — your agent is still there.

Ask Claude Code:

> *"Explain what SQL query Supabase actually runs when I fetch agents from the dashboard. How does Row Level Security intercept the query and filter it down to just the current user's rows? Show me the RLS policy as SQL."*

### 💾 Commit Checkpoint — Hours 5–6 Complete

Dashboard is fetching real data server-side and RLS is confirmed working. Commit before touching the card components.

```bash
git add -A
git commit -m "feat: dashboard server-side data fetch with RLS verified across two accounts"
```

---

## Hours 7–8: Delete, AgentCard Component, Empty States & Loading Skeletons

### Task 10 — Extract and Upgrade the AgentCard Component

Your `dashboard/page.tsx` currently has both `AgentCard` and `EmptyState` as inline functions at the bottom of the file. This works, but as the app grows these need to be independent, reusable components. This task extracts them and adds the missing features — personality badge and Delete button.

Ask Claude Code:

> *"I need to refactor and upgrade the agent card in my dashboard. Right now `AgentCard` and `EmptyState` are inline functions at the bottom of `src/app/dashboard/page.tsx`. Please:*
>
> *1. Extract `AgentCard` into a new file at `src/components/AgentCard.tsx` with these props:*
> - *`id: string`*
> - *`name: string`*
> - *`description: string`*
> - *`personality: string`*
> - *`createdAt: string`*
> - *`onDelete: (id: string) => void`*
>
> *The card should have: hover state (border glow or background shift), agent name as heading, description truncated to 2 lines with `line-clamp-2`, a personality badge with colour-coding (Professional = blue, Friendly = green, Direct = orange, Creative = purple, Empathetic = pink), creation date formatted as 'Created 3 days ago' using relative time, an Edit button linking to `/agents/[id]`, and a Delete button calling `onDelete(id)`. Add `'use client'` since it handles clicks.*
>
> *2. Extract `EmptyState` into `src/components/EmptyState.tsx`.*
>
> *3. Update `dashboard/page.tsx` to: import both new components, and add `personality` to the Supabase SELECT query — change the select from `'id, name, description, created_at'` to `'id, name, description, personality, created_at'` — and update the Agent type to include `personality: string | null`.*
>
> *Use Tailwind CSS and our dark theme throughout."*

Study the component once it's built:

**Find the `props` and trace where each one is used in the JSX**
At the top of `AgentCard.tsx` you'll see a TypeScript type definition — something like `type AgentCardProps = { id: string; name: string; description: string; ... }`. These are the values the card *receives* from its parent (the dashboard). Pick one — say `name` — and follow it through the file. It enters as a prop, gets destructured from the function argument, and then appears somewhere inside the JSX as `{name}`. Do the same for `personality` — you'll see it used twice: once to set the badge text, and once inside a conditional class or switch statement that picks the colour. This trace — prop → destructure → JSX — is the core pattern of every React component you'll ever read.

**Find the delete mechanism — onClick, fetch, and useState working together**
Look for the `<button>` element that says Delete. It now uses `onClick={handleDelete}` — a proper async function defined above the JSX. Here's the full picture of what's happening:

```tsx
const [isDeleting, setIsDeleting]   = useState(false)
const [deleteError, setDeleteError] = useState<string | null>(null)

async function handleDelete() {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return

  setIsDeleting(true)
  setDeleteError(null)

  try {
    const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setDeleteError('Failed to delete agent — please try again.')
      return
    }
    onDelete?.(id)   // tell the parent to remove this card from its list
  } catch {
    setDeleteError('Failed to delete agent — please try again.')
  } finally {
    setIsDeleting(false)
  }
}
```

Walk through it step by step:

- `useState(false)` and `useState(null)` — two pieces of local state: whether the delete is in flight, and whether there's an error to show. `useState` is a React hook that lets a Client Component remember values between renders. Because this component has `'use client'` at the top, it's allowed to use hooks.
- `confirm(...)` — a built-in browser dialog. If the user clicks Cancel, the function returns immediately and nothing happens.
- `setIsDeleting(true)` — flips the state, which causes React to re-render the button as `'Deleting…'` with `disabled` applied so it can't be double-clicked.
- `fetch('/api/agents/${id}', { method: 'DELETE' })` — sends a DELETE request to your API route. This is the `fetch()` API — a browser built-in for making HTTP requests from JavaScript.
- `if (!res.ok)` — `res.ok` is `true` for any 2xx status code (200, 201, etc.) and `false` for anything else (400, 401, 500). If the server returned an error, the error message is set and the function stops.
- `onDelete?.(id)` — the `?.` means "only call this if it exists". If the parent passed an `onDelete` prop, it's called with the agent's ID so the parent can remove the card from its list. If no `onDelete` was passed, this line does nothing.
- `catch` — if `fetch()` itself throws (no internet, server completely unreachable), the error is caught here and the error message is set.
- `finally` — runs whether the try succeeded or failed. Always re-enables the button so the user can retry.

Below the card's main content, there's a conditional error message:

```tsx
{deleteError && (
  <p className="mt-3 text-red-400 text-xs">{deleteError}</p>
)}
```

`{deleteError && ...}` is a JavaScript short-circuit — if `deleteError` is `null` (falsy), nothing renders. If it has a string value (truthy), the `<p>` appears. This is the standard React pattern for conditional rendering.

**Find the `line-clamp-2` class — search what it does if you haven't seen it**
`line-clamp-2` is a Tailwind utility that limits a block of text to a maximum of 2 lines, then cuts off the rest with a `…` ellipsis. It's used on the `description` paragraph so long descriptions don't break the card grid layout — every card stays the same height regardless of how much text is in it. Without it, a 10-word description and a 100-word description would produce cards of wildly different heights, and the grid would look broken. If you want to see it in action, temporarily change it to `line-clamp-1` or remove it entirely — the difference is immediate. This is the kind of small defensive detail that separates a polished grid from a janky one.

### Task 11 — Wire Up the Delete Action

Ask Claude Code:

> *"Add a delete endpoint to my agents API route: DELETE /api/agents/[id]. It should:*
>
> *Server-side (API route):*
> - *Verify the user is authenticated — return 401 (Unauthorised — not logged in) if not*
> - *Verify the agent with that ID belongs to the current user (don't just delete by ID — check user_id matches) — return 403 (Forbidden — logged in but not allowed) if not*
> - *Return 404 (Not Found — no row with that ID exists) if no agent with that ID exists*
> - *Wrap the Supabase delete in a try/catch — return 500 (Internal Server Error) with a safe message if the delete fails*
> - *Return 200 (OK — action completed successfully) on success*
>
> *Client-side (dashboard):*
> - *When `onDelete` is called on an AgentCard, call DELETE /api/agents/[id]*
> - *If the request succeeds, remove the card from the UI*
> - *If the request fails for any reason (network error, 500, etc.), show a visible error message: 'Failed to delete agent — please try again.' Do not remove the card.*
> - *Disable the Delete button during the in-flight request so the user can't double-click*
> - *Re-enable the Delete button after the request completes, whether it succeeded or failed*"*

Test the delete — happy and unhappy paths:
1. Click Delete on an agent card → card disappears, row gone from Supabase
2. Check Supabase confirms the row is actually removed
3. Temporarily break your internet and click Delete → error message shown, card stays on screen
4. Try deleting from a different account's agent ID directly → confirm you get a 403

**How to run the 403 test:**

You need two things: an agent ID from Account A, and to be logged in as Account B.

- Log in as Account A → open Supabase → Table Editor → `agents` → copy one of Account A's agent IDs (a UUID like `abc123-...`)
- Log out, log in as Account B
- Open browser DevTools → Console tab → paste this, replacing the ID:

```js
fetch('/api/agents/PASTE-ACCOUNT-A-ID-HERE', { method: 'DELETE' })
  .then(r => console.log(r.status))
```

You will most likely see `404` in the console — not `403`. Both are correct rejections. Here's why:

**Which status code fires depends on your RLS policy.** The DELETE route has two separate checks:

```ts
if (!agent) return 404           // agent invisible or doesn't exist
if (agent.user_id !== user.id) return 403  // agent visible but not yours
```

Right now AgentForge's RLS policy is strict — users can only SELECT their own rows. When Account B queries for Account A's agent, RLS silently filters it out at the database level before the route even sees it. The result is `null`, which hits the 404 branch. The 403 branch never runs because the row was already invisible.

If AgentForge later adds a "public agents" feature with a permissive read RLS policy, Account B would be able to SELECT Account A's agent — and then the 403 branch would fire correctly, because the row is visible but the `user_id` doesn't match. The route already handles this case — it's just waiting for that feature to exist.

**What you're actually confirming with this test:** Account B cannot delete Account A's agent. Whether the response is 403 or 404 is a secondary concern — both are correct rejections. If you see `200`, that's the failure case: your route deleted data it shouldn't have.

This is the security test that most tutorials skip — but in production it's the difference between a safe app and one where any user can destroy any other user's data.

### Task 12 — Empty State

Ask Claude Code:

> *"Build an empty state for the dashboard when the user has no agents. Show: a large emoji or simple SVG icon, a headline 'No agents yet', a subtitle 'Create your first agent and it will appear here', and a prominent 'Create your first agent' button that links to /agents/new. Match the dark theme."*

Test this by temporarily deleting all your agents.

### Task 13 — Loading Skeleton

Ask Claude Code:

> *"Build a loading skeleton for the agent dashboard. Create `src/app/dashboard/loading.tsx` — this file is automatically shown by Next.js while the dashboard data is loading. It should show 3 skeleton cards in the same grid layout as the real AgentCards — grey placeholder blocks with a subtle pulse animation for the name, description, and button areas. Use Tailwind's `animate-pulse` class."*

To see this in action, ask Claude Code to artificially delay the Supabase fetch by 2 seconds so you can observe the skeleton. Then remove the delay.

### 💾 Commit Checkpoint — Hours 7–8 Complete

AgentCard extracted, delete wired with defensive handling, empty state and loading skeleton in place. This is the core CRUD loop — commit it.

```bash
git add -A
git commit -m "feat: AgentCard component, delete endpoint with ownership check, empty state, loading skeleton"
```

---

## Stretch Tasks (+2 hrs)

### Stretch 1 — Zod Validation (1.5 hrs)

Right now your form validation is basic — probably just checking if fields are empty. Zod is a proper schema validation library that makes validation composable, readable, and reusable.

Install Zod:

```bash
npm install zod
```

Ask Claude Code:

> *"Add Zod validation to my Create Agent form and API route. Create a shared schema at `src/lib/validations/agent.ts`:*
> - *name: string, min 3 characters, max 50, required*
> - *description: string, min 10 characters, max 200, required*
> - *personality: one of ['Professional', 'Friendly', 'Direct', 'Creative', 'Empathetic']*
> - *goal: string, min 5 characters, max 150, required*
>
> *Use this schema in two places:*
> *1. The form component — validate on submit, show inline error messages in red under each field*
> *2. The API route — validate the request body, return 400 with error details if validation fails*
>
> *Explain what Zod is and why using it in both places matters."*

Then ask Claude Code to explain:

> *"What is a Zod schema? How does `z.object()` work? What is `safeParse` and when would I use it instead of `parse`?"*

Test the validation:
- Submit with all fields empty — see errors
- Type 2 characters in the name field — see the min-length error
- Type 201 characters in description — see the max-length error
- Submit a valid form — confirm it still works

### Stretch 2 — Optimistic UI on Delete (1 hr)

Right now when you click Delete, the UI waits for the server to respond before removing the card. This creates a noticeable delay. Optimistic UI removes the card immediately, then confirms with the server. If the server fails, the card reappears.

Ask Claude Code:

> *"Add optimistic UI to the agent delete flow in my dashboard. When Delete is clicked: immediately remove the agent card from the local state, then call the DELETE API in the background. If the API call fails, re-add the card to the list and show a toast notification: 'Failed to delete agent — please try again.' Use React's useState to manage the local agent list."*

Then ask Claude Code:

> *"What is optimistic UI? What are the trade-offs — when is it appropriate and when is it risky? Name a real app that uses optimistic UI heavily."*

(Spoiler: Figma does this for every layer move. That's why it feels instant even with slow internet.)

> **Coming in Week 6:** Environment variable validation with Zod — before wiring in the Claude API key, you'll create `src/lib/env.ts` to validate all required env vars at startup and produce a clear error if any are missing. This is deliberately placed in Week 6 setup so `ANTHROPIC_API_KEY` can be included in the schema at the exact moment it becomes relevant, rather than bolted on as an afterthought.

### 💾 Commit Checkpoint — Stretch Tasks Complete (if attempted)

If you completed either stretch task, commit them separately from the core work so they're easy to identify in your git history.

```bash
git add -A
git commit -m "feat: Zod validation on agent form and API route, optimistic delete with failure recovery"
```

### 💾 Sprint Close — Week 5 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, and update CLAUDE.md's Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 5 complete — full CRUD loop, dashboard SSR, AgentCard, delete with security checks"
```

After committing, open CLAUDE.md and move "Week 5" from Current Focus into Completed Work with a two-sentence summary of what shipped.

---

## ✅ Completion Checklist

Mark each off before calling Week 5 done:

**Core routing:**
- [ ] `/dashboard` page exists and is protected (redirects unauthenticated users to `/login`)
- [ ] `/agents/new` page exists with a 4-field form
- [ ] `/agents/[id]` page exists and shows the correct agent based on the URL

**Create Agent:**
- [ ] Form submits to POST `/api/agents`
- [ ] API route inserts the row into Supabase with the correct `user_id`
- [ ] On success, user is redirected to `/dashboard`
- [ ] Loading state shows on the submit button during the request
- [ ] Network failure shows a visible error banner, button resets, fields are preserved
- [ ] Session expiry shows a message with a link back to sign in
- [ ] API 500 error shows a human-readable message (not a raw error dump)
- [ ] Submitting with empty fields shows validation errors without calling the API

**Dashboard:**
- [ ] Fetches agents from Supabase on the server (Server Component)
- [ ] Displays agents in a responsive grid
- [ ] Empty state shows when no agents exist
- [ ] Loading skeleton shows while data is fetching

**AgentCard:**
- [ ] Extracted into `src/components/AgentCard.tsx`
- [ ] Accepts all required props
- [ ] Shows name, description (truncated), personality badge, date
- [ ] Has Edit button (links to `/agents/[id]`) and Delete button

**Delete:**
- [ ] DELETE `/api/agents/[id]` endpoint exists
- [ ] Checks that the agent belongs to the current user before deleting (403 if not)
- [ ] Delete button is disabled while request is in flight (no double-click)
- [ ] Card disappears from the dashboard on successful delete
- [ ] Supabase row is actually gone after deletion
- [ ] If delete fails, card stays on screen and error message is shown
- [ ] Delete button re-enables after failure so the user can retry

**Stretch (optional):**
- [ ] Zod validation on the form (inline error messages) and API route
- [ ] Optimistic UI on delete with failure recovery

---

## 🧪 Validation Tests

Run these manually to confirm everything works end-to-end:

| Test | How to trigger | Expected result |
|------|---------------|----------------|
| Visit `/dashboard` while logged out | Open incognito window | Redirected to `/login` |
| Visit `/agents/new` while logged out | Open incognito window | Redirected to `/login` |
| Submit form with all valid fields | Fill all fields correctly, click Save | Agent on `/dashboard`, row in Supabase |
| Submit form with an empty name | Leave Name blank, click Save | Inline error shown, API not called |
| Submit form with no internet | Turn off wifi, click Save | 'Connection failed' banner, button resets, fields preserved |
| API route forced 500 | Add `return NextResponse.json({error:'Forced error'},{status:500})` as first line of POST handler, submit valid form | Error banner shown, no crash, button resets. Remove after testing. |
| Broken Supabase URL | Corrupt `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, restart, visit `/agents/new` | Redirected to `/auth/login` — correct. Auth check fails before form renders. Restore URL after. |
| Session expires mid-form | Sign out in another tab, submit from original tab | Session expired message with sign-in link |
| Create agent as User A, log in as User B | Two test accounts | User B sees zero agents |
| Click Delete on an agent card | Click Delete | Card gone, row deleted from Supabase |
| Click Delete with no internet | Turn off wifi, click Delete | Error shown, card stays on screen, button re-enables |
| Delete another user's agent by ID | Craft DELETE request via DevTools console | 404 (or 403 if public agents exist) — agent not deleted either way |
| Visit `/agents/[real-id]` | Use a real ID from Supabase | Agent name and description visible |
| Visit `/agents/[fake-id]` | Use a made-up ID | Graceful not-found message, no crash |
| Delete all agents, visit `/dashboard` | Delete everything | Empty state shown |

---

## Key Concept: The Full-Stack Data Loop

By the end of this week, you've built this pattern — both paths:

```
User action (form submit)
  → Client Component captures the values
  → POST request to /api/agents
  → API route validates the data          ← invalid? return 400, show inline errors
  → API route authenticates the user      ← no session? return 401, show sign-in prompt
  → Supabase inserts the row              ← DB error? return 500, show error banner
  → API route returns success
  → Client redirects to /dashboard
  → Server Component fetches the new list
  → AgentCard components render the data
  → User sees their agent on screen

  Network fails at any point?             ← catch error, show 'Connection failed', reset button, preserve fields
```

Every feature in AgentForge for the next 7 weeks is a variation of this loop. The underlying pattern doesn't change — only the data, validation rules, and UI components change. You've now built the foundation everything else rests on.

**Your UX superpower is showing — and now it's defensive too.** The empty state, the loading skeleton, the error banners, the button that resets after failure, the fields that don't wipe on error — these are the details that separate a designer's product from a developer's prototype. Most engineers ship the happy path and call it done. A senior UX designer designs the error states *first*, because that's what real users actually hit. You built both. That's the difference.

---

## Resources

- **Next.js App Router docs:** https://nextjs.org/docs/app — specifically "Routing" and "Data Fetching" sections
- **Supabase JavaScript client:** https://supabase.com/docs/reference/javascript/introduction
- **Zod docs:** https://zod.dev — start with "Basic usage" and "Objects"
- **React useState hook:** https://react.dev/reference/react/useState
- **Tailwind line-clamp:** https://tailwindcss.com/docs/line-clamp
- **Date formatting without a library:** search "JavaScript Intl.RelativeTimeFormat" — no extra package needed

---

*Week 5 of 12 · AgentForge · Phase 2: Backend & AI Integration · Updated April 2026*
