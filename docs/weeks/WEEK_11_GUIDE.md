# 🚀 Week 11 — Deployment, CI/CD & Monitoring

**Phase:** 4 — Production & Launch  
**Dates:** Add your own start date  
**Total time:** 6–8 hrs core · +4–5 hrs stretch  
**Goal:** AgentForge has been running on your laptop for ten weeks. This week it goes live on the internet. You'll connect your GitHub repo to Vercel, configure all your secrets for production, and push a deploy that makes your app accessible to anyone in the world at a real URL. Then you'll add Sentry (error monitoring — so you know when real users hit real problems), wire up GitHub Actions (automated checks that run every time you push code), and do a full end-to-end smoke test on the live site. By the end of this week you'll have a public URL, a monitoring dashboard, and a CI pipeline — the three things that separate a student project from a production product.

---

## 📋 Before You Start

Run these commands to confirm your local environment is healthy before deploying anything. You want to know about problems here, not after they're live.

```bash
cd agentforge
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and run a quick smoke test:

1. **Log in** — Supabase auth still working
2. **Create an agent** — the 5-step builder completes and saves to Supabase
3. **Chat with an agent** — streaming, tools, and conversation history working from Weeks 8–9
4. **Check a public share page** — `/share/[slug]` loads without authentication
5. **Upgrade to Pro (test mode)** — Stripe Checkout opens and completes in test mode
6. **Usage limits** — free users hit the 100-message cap correctly

Then run a full TypeScript check and your test suite:

```bash
npx tsc --noEmit    # TypeScript compiler check — finds type errors without building
npm test            # Vitest unit tests from Week 13 prep (skip if not set up yet)
npx playwright test # E2E tests from Week 9 — requires dev server running (already started above)
npm run build       # Full production build — the same build Vercel will run
```

> ⚠️ **Do not deploy until `npm run build` passes cleanly.** A broken build on Vercel will result in a failed deployment and a confusing error page at your live URL. Fix TypeScript errors and build failures locally first.

### 🛠️ Known Issue — Playwright Version Conflict

If running `npm test` or `npx playwright test` produces **"Playwright Test did not expect `test()` to be called here"** across all spec files, you have a Playwright version conflict — two different copies of `@playwright/test` are installed simultaneously and the runner can't tell which one owns the test files. Fix this before deploying.

**Why it happens:** When you ran `npm init playwright@latest` in Week 9, the Playwright installer sometimes adds a bare `playwright` package alongside the existing `@playwright/test` entry in `package.json`. The bare `playwright` package ships its own bundled copy of `@playwright/test`, creating two conflicting versions in `node_modules`. A second issue is that the installer auto-generates a `tests/example.spec.ts` sample file in a new `tests/` directory — this is scaffolding boilerplate you don't need, and if `playwright.config.ts` has `testDir: 'tests'` instead of `testDir: 'e2e'`, it scans the wrong folder entirely.

Ask Claude Code:
> *"Fix a Playwright version conflict in the AgentForge project. Steps:*
>
> *1. Check for duplicate Playwright entries in `package.json`:*
> ```bash
> cat package.json | grep -i playwright
> ```
> *If both `"playwright"` and `"@playwright/test"` appear as separate entries, remove the bare `"playwright"` entry — it bundles its own copy of `@playwright/test` which conflicts with the explicit dependency. Edit `package.json` to keep only `@playwright/test`.*
>
> *2. Collapse duplicate packages in `node_modules`:*
> ```bash
> npm dedupe      # 'dedupe' is short for 'deduplicate' — finds packages installed multiple times
>                 # at different version numbers and collapses them to a single shared copy
> npm install     # rebuilds node_modules with the deduplicated dependency tree
> ```
>
> *3. Confirm only one version of `@playwright/test` exists:*
> ```bash
> npm list @playwright/test   # 'list' prints a dependency tree showing every installed copy of the package
> ```
> *A clean output shows a single version with no indented duplicates nested under other packages. Any indented copy means a sub-dependency is pulling in a conflicting version — report it.*
>
> *4. Delete the auto-generated sample file if it exists:*
> ```bash
> rm -f tests/example.spec.ts   # -f means "force" — delete without prompting, even if the file doesn't exist
> ```
> *This file is scaffolding boilerplate created by `npm init playwright@latest`. It is not part of the project. If a `tests/` directory now exists and is empty, delete it too: `rm -rf tests/` (`-r` means "recursive" — delete the folder and everything inside it; `-f` suppresses any confirmation prompts).*
>
> *5. Open `playwright.config.ts` and confirm `testDir` is set to `'e2e'` — not `'tests'` or `'.'`. The `testDir` setting tells Playwright which directory to scan for `.spec.ts` files. If it's pointing anywhere other than `'e2e'`, update it to `testDir: 'e2e'`.*
>
> *After fixing, verify by testing:*
> - *Happy path: `npx playwright test` (with `npm run dev` running in a separate terminal) runs only the two files in `e2e/` — `conversations.spec.ts` and `e2e/share.spec.ts` — with no "did not expect test() to be called here" errors*
> - *Failure path: if the version conflict persists after `npm dedupe`, run a full clean reinstall — `rm -rf node_modules && npm install` — then re-run `npx playwright test`. A full clean reinstall removes all cached copies and rebuilds from scratch.*
> *Do not mark complete until both pass."*

If anything else is broken from Weeks 1–10, paste the error into Claude Code before starting: *"Before I begin Week 11, my [feature] is broken — here's the error: [paste error]. Fix this first."*

---

## 🧠 Key Concepts for This Week

Read this table before writing a single line. These mental models will make the deployment process feel logical rather than opaque.

| Concept | What it is | Design analogy |
|---|---|---|
| **Vercel** | A cloud hosting platform specialised for Next.js. Connect your GitHub repo, push code, and Vercel automatically builds and deploys your app at a public URL — no server management required | Like Figma's cloud storage — your files (code) live locally, but Vercel keeps the live version synced and accessible to anyone with the link |
| **Deployment** | The act of taking your code from your local machine and publishing it to a server where the internet can reach it | Like publishing a Figma prototype — it goes from your private workspace to a shareable URL anyone can open |
| **Production environment** | The live version of your app — real users, real data, real payments. Contrast with "development" (your localhost) and "preview" (a test URL for a feature branch) | Like a published Figma design vs. a draft — the published version is what stakeholders see; the draft is where you experiment |
| **Environment variables in production** | The same `.env.local` variables your app needs — API keys, database URLs — but stored securely in Vercel's dashboard instead of a file on your laptop. Vercel injects them at build time and runtime | Like Figma's team library variables — they're defined once in a central place and referenced everywhere, not hardcoded into each component |
| **CI/CD** | Continuous Integration / Continuous Deployment. CI = automated checks that run every time you push code (build, type check, tests). CD = automated deployment when checks pass. Together they mean: every push is checked, and passing pushes go live automatically | Like Figma's design linting plugin — every time you publish a component, it checks against your design system rules and flags violations automatically |
| **GitHub Actions** | GitHub's built-in automation system. You define workflows in YAML files — text-based config files for automation that use `key: value` pairs — that run automatically on events like "someone pushed to main" | Like a Figma plugin that fires automatically when a component is published — you define the rules once, it enforces them forever |
| **YAML** | A text file format used for configuration — more readable than JSON because it uses indentation instead of braces. GitHub Actions workflows are written in YAML | Like a Figma Styles definition — a structured text description of rules rather than raw code |
| **Workflow file** | A YAML file in your repo at `.github/workflows/[name].yml` that tells GitHub Actions what to do and when. GitHub reads it automatically — you don't install anything | Like a Figma Auto Layout rule — you define it once in the component, and it enforces itself every time that component is used |
| **Job** | One unit of work inside a GitHub Actions workflow — runs on a fresh virtual machine. Common jobs: `build`, `test`, `lint`, `deploy` | Like a Figma plugin task — each plugin runs in isolation with its own context |
| **Runner** | The virtual machine that actually executes a GitHub Actions job. `ubuntu-latest` is the standard choice — a fresh Linux machine that installs your dependencies and runs your commands | Like Figma's rendering engine — the infrastructure that runs your plugin, separate from your plugin's code |
| **Sentry** | An error monitoring platform. When your deployed app throws an error or crashes, Sentry captures the full stack trace (the chain of function calls that led to the crash), user context, and environment details — and sends you an alert | Like Figma's activity log — every change is captured with who made it, when, and what the state was before and after |
| **DSN (Data Source Name)** | A Sentry-provided URL that tells the Sentry SDK where to send error reports. Format: `https://[key]@[org].ingest.sentry.io/[project-id]`. You paste it into your env vars | Like a Figma webhook URL — a unique destination address where events are sent |
| **Stack trace** | The chain of function calls recorded at the moment an error occurred — shows exactly which file, which function, and which line caused the crash | Like a Figma version history frame — you can rewind to the exact moment something went wrong and see the state at that point |
| **Source maps** | Files that translate minified production code (compressed JavaScript that's unreadable to humans) back into your original TypeScript source — so Sentry shows you "error at `src/app/api/chat/route.ts:47`" instead of "error at `main.js:1`" | Like Figma's component name mapping — even when a component is exported and renamed, you can trace it back to its source component |
| **Custom domain** | A human-readable web address you own (e.g. `agentforge.ai` or `agentforge.dev`) that points to your Vercel deployment instead of the default `agentforge-[random].vercel.app` URL | Like a custom Figma community profile URL — `@yourname` instead of `figma.com/community/user/12345678` |
| **DNS (Domain Name System)** | The internet's address book — translates a human-readable domain name (`agentforge.dev`) into the IP address of the server that should respond | Like a Figma redirect — `figma.com/@yourname` resolves to the underlying profile URL |
| **CNAME record** | A DNS setting that maps your custom domain to Vercel's servers. You add it at your domain registrar (the company where you bought the domain) | Like creating an alias for a Figma file — the alias points to the original, and updating the original updates everything that references it |
| **Lighthouse** | Google's open-source tool (built into Chrome DevTools) that audits a web page for performance, accessibility, SEO, and best practices — and gives scores out of 100 | Like a Figma accessibility plugin — it audits your design against WCAG rules and gives a pass/fail with specific fixes |
| **Core Web Vitals** | Google's three key performance metrics: LCP (Largest Contentful Paint — how long until the main content is visible), FID (First Input Delay — how long until the page responds to a tap or click), CLS (Cumulative Layout Shift — how much the page jumps around as it loads). Google uses these in search rankings | Like Figma's prototype performance — load time, interaction responsiveness, and layout stability |
| **Preview deployment** | Vercel automatically builds a temporary URL for every branch you push. Push a branch called `feature/new-pricing` → Vercel builds `feature-new-pricing-agentforge.vercel.app`. Share that URL for review without touching production | Like Figma's branch feature — you work on a branch and share its URL for review before merging into the main file |
| **Error boundary** | A React component that catches JavaScript errors in its child components and shows a fallback UI instead of crashing the whole page. Next.js uses `error.tsx` files as the error boundary for each route segment | Like a Figma component with a fallback state — if the real data doesn't load, it shows a placeholder instead of a blank screen |
| **`not-found.tsx`** | A special Next.js file that renders a custom 404 page — shown when a route doesn't exist or a `notFound()` function is called in a server component | Like Figma's empty state component — the designated UI for when the expected content isn't there |
| **`npm ci`** | A variant of `npm install` designed for CI environments. It installs exactly what's in `package-lock.json` (the lock file — a snapshot of exact versions of every dependency), ignores local caches, and fails if the lock file doesn't match `package.json`. Faster and more reliable than `npm install` in automated environments | Like Figma's "restore to version" — instead of reconciling changes, it snaps to an exact known state |

---

## 🔐 HTTP Status Codes Reference

These codes will appear in Sentry error reports and GitHub Actions output this week.

| Code | Name | Meaning | When you'll see it |
|------|------|---------|-------------|
| 200 | OK | Request succeeded | Sentry reporting a successful health check; Vercel API calls |
| 400 | Bad Request | Client sent malformed data | Misconfigured Stripe webhook secret in production |
| 401 | Unauthorised | Not logged in | Sentry auth issues; Vercel API token missing |
| 403 | Forbidden | Logged in but not allowed | Supabase RLS blocking a request that works locally |
| 404 | Not Found | Resource doesn't exist | A route that works locally but wasn't built into the production bundle |
| 500 | Internal Server Error | Server-side failure | The errors Sentry is there to catch — crashes in your API routes |
| 502 | Bad Gateway | Your app returned an invalid response | Cold start issues; the app crashed before sending a response |

---

## 🌐 HTTP Request Types Reference

| Request type | Intention | Real-world analogy | When used this week |
|---|---|---|---|
| GET | "Give me data" | Reading a menu | Vercel checking your app is healthy; Sentry fetching your source maps |
| POST | "Here is new data, store it" | Placing an order | Sentry sending error events; GitHub Actions triggers |
| PATCH | "Update part of existing data" | Changing an order | Updating Stripe webhook endpoint URL for production |

---

## ⚙️ Session 1 — Saturday (Hours 1–3): Deploy to Vercel

### Step 1 — Prepare Your Codebase for Production

Before connecting Vercel, do a production build locally and fix everything that breaks. Catching failures here is much faster than debugging a failed Vercel build.

Ask Claude Code:
> *"Run a full production build of the Next.js app and fix every error that appears:*
>
> ```bash
> npm run build
> ```
>
> *Common issues to watch for and fix:*
>
> *1. TypeScript errors — any `Type 'X' is not assignable to type 'Y'` errors must be fixed. Do not use `// @ts-ignore` to suppress them — fix the underlying type issue. Ask me to explain any error you don't understand.*
>
> *2. Missing environment variables at build time — if the build fails with a message like `Environment variable ANTHROPIC_API_KEY not found`, it means the Zod env validator in `src/lib/env.ts` is running at build time. Check that all required variables are in `.env.local` and that the validator doesn't run on the client side (use `server-only` imports where needed).*
>
> *3. `useSearchParams()` without Suspense boundary — Next.js 16 requires any component that calls `useSearchParams()` (the hook that reads URL query params) to be wrapped in a `<Suspense>` boundary (a React component that shows a fallback while content loads asynchronously). If the build warns about this, wrap the component: `<Suspense fallback={<div>Loading...</div>}><ComponentThatUsesSearchParams /></Suspense>`*
>
> *4. Dynamic server usage in static pages — if a page uses `cookies()` or `headers()` (server-side functions that read request data), Next.js cannot statically generate it at build time. The fix is to add `export const dynamic = 'force-dynamic'` at the top of the page file. This tells Next.js to render the page on every request instead of once at build time.*
>
> *Run `npm run build` after each fix until the output ends with:*
> ```
> ✓ Compiled successfully
> ✓ Collecting page data
> ✓ Generating static pages
> ```
>
> *Then run:*
> ```bash
> npx tsc --noEmit
> ```
> *This runs the TypeScript compiler (the program that checks your code for type errors) without generating output files — faster than a full build, good for rapid error checking. Fix all errors before proceeding.*
>
> *After building, verify by testing:*
> - *Happy path: `npm run build` completes with no errors — last line reads `✓ Generating static pages (X/X)` with no warnings about missing env vars*
> - *Failure path: if the build fails, read the first error in the output (not the last — errors cascade), paste it into Claude Code: "The build is failing with this error: [paste error]. What's wrong and how do I fix it?"*
> *Do not mark complete until both pass."*

---

### Step 2 — Create Your Vercel Account and Connect the Repo

Ask Claude Code to guide you through this, but it's mainly clicking in the Vercel dashboard:

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account — this links them together
2. Click **Add New → Project**
3. Import your `agentforge` repository from the list
4. Vercel detects it's a Next.js project automatically — the framework preset is set for you
5. **Do not click Deploy yet** — you need to add environment variables first (Step 3)

> **Why connect via GitHub?** Every time you push to your `main` branch, Vercel will automatically rebuild and deploy your app. You never need to run a deploy command manually. This is the CD (Continuous Deployment) part of CI/CD.

---

### Step 3 — Configure Production Environment Variables

This is the most critical step. Your app needs every secret it uses locally — but in production, they come from Vercel's dashboard, not your `.env.local` file (which is never committed to GitHub).

In the Vercel project settings → **Environment Variables**, add each variable below. For each one, set the environment to **Production**, **Preview**, and **Development** unless noted.

Ask Claude Code:
> *"Generate a checklist of every environment variable needed for AgentForge production deployment. For each variable, tell me: (1) what it is, (2) where to find the value, (3) whether it's safe to use in Preview environments too, and (4) any value that changes between local and production.*
>
> *The variables to include (grouped by service):*
>
> *Supabase (from Dashboard → Settings → API):*
> - `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL. Same value as `.env.local`. Safe in all environments.
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the Publishable key (`sb_publishable_...`). Same value as `.env.local`. Safe in all environments.
> - `SUPABASE_SERVICE_ROLE_KEY` — the secret key that bypasses RLS (Row Level Security — the row-level access control on your Supabase tables). Same value as `.env.local`. Production only — do not set in Preview or Development so Preview deployments can't bypass RLS policies.
>
> *Anthropic (from console.anthropic.com → API Keys):*
> - `ANTHROPIC_API_KEY` — the Claude API key. Same value as `.env.local`. Production and Preview.
>
> *Stripe (from stripe.com → Developers → API Keys):*
> - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — the test mode publishable key (`pk_test_...`) for Preview; the live mode publishable key (`pk_live_...`) for Production. These are different keys.
> - `STRIPE_SECRET_KEY` — the test mode secret key (`sk_test_...`) for Preview; the live mode secret key (`sk_live_...`) for Production. Different keys per environment.
> - `STRIPE_PRO_PRICE_ID` — the Price ID from Stripe dashboard. You need to create a second price in live mode — Stripe test prices don't work in live mode.
> - `STRIPE_WEBHOOK_SECRET` — **this changes in production** — you'll get a new one in Step 7 after creating the production webhook endpoint. For now, use the test value; update it after Step 7.
>
> *Application URL — this one changes:*
> - `NEXT_PUBLIC_APP_URL` — in `.env.local` this is `http://localhost:3000`. In Vercel, set it to your live URL: `https://[your-project-name].vercel.app` (or your custom domain if you set one up in the stretch tasks). This is used in Stripe's success/cancel redirect URLs and in your Open Graph metadata.
>
> *Upstash Redis (from upstash.com → your database → REST API — from Week 10 rate limiting):*
> - `UPSTASH_REDIS_REST_URL` — same value as `.env.local`
> - `UPSTASH_REDIS_REST_TOKEN` — same value as `.env.local`
>
> *Resend (from resend.com → API Keys — if Week 10 stretch was completed):*
> - `RESEND_API_KEY` — same value as `.env.local`
>
> *Agent Tools — these are core to the tools functionality. Without them, web search and file-reading tools will silently fail or throw errors in production:*
> - `TAVILY_API_KEY` — the Tavily search API key (from app.tavily.com → API Keys). Tavily is the web search engine your agents use when a user triggers a "search the web" tool call. Same value as `.env.local`. Production and Preview.
> - `GOOGLE_DRIVE_API_KEY` — the Google Drive API key (from console.cloud.google.com → APIs & Services → Credentials). Required for any agent tool that reads from Google Drive files. Same value as `.env.local`. Production and Preview.
>
> *For each variable, provide the exact string I should type in the Vercel 'Name' field and a reminder of where to find the value."*

After adding all variables, double-check by asking Claude Code:
> *"I've added environment variables to Vercel. Before I deploy, scan `src/lib/env.ts` (the Zod environment variable validator) and list every variable it expects. Then compare that list against the variables I've described adding. Report any that appear in `env.ts` but that I haven't mentioned — those are gaps that will cause the production build to crash."*

Fix any gaps, then proceed.

---

### Step 4 — Deploy

Now you're ready. In the Vercel dashboard, click **Deploy**.

Watch the build log in real time — it runs exactly the same `npm run build` you ran locally in Step 1. If the build fails, read the first error (not the last — errors cascade), and fix it locally before re-deploying.

Ask Claude Code if the build fails:
> *"My Vercel deployment is failing with this error in the build log: [paste the exact error message from Vercel]. My local `npm run build` passes — what's different in the production environment, and how do I fix it?"*

**When the build succeeds**, Vercel gives you a URL: `https://[project-name]-[random].vercel.app`.

Open that URL and run a quick sanity check:

1. Landing page loads
2. Sign up / log in works
3. Dashboard loads and shows your agents
4. Chat with an agent — streaming works
5. A public share page loads in an incognito window

> 🎉 If all five pass: your app is live on the internet. Anything broken at this point is a production-specific issue — usually an environment variable that's missing or has the wrong value. Check Vercel's **Functions** tab for runtime errors.

---

### ✅ Before You Commit — Production Deploy

| Test | Expected result |
|---|---|
| `npx tsc --noEmit` locally | Exits cleanly — no TypeScript errors |
| `npx playwright test` locally (dev server running) | Both `e2e/conversations.spec.ts` and `e2e/share.spec.ts` pass — if not, fix before deploying |
| `npm run build` locally | Completes with `✓ Generating static pages` — no errors |
| Vercel build log | Green checkmark — build succeeded |
| Live URL loads landing page | Page visible — not an error screen |
| Sign up with a new email on live URL | Supabase auth works — redirected to dashboard |
| Chat with an agent on live URL | Streaming response appears |
| Share page in incognito on live URL | Loads without auth — `NEXT_PUBLIC_APP_URL` is correct |

---

## 💾 Commit Checkpoint — Production Deploy Complete

Your app is live. Before moving on, save your current state in case anything goes wrong during monitoring setup.

```bash
git add -A
git commit -m "feat: production deployment — Vercel connected, env vars configured, live URL active"
```

---

## ⚙️ Session 2 — Saturday (Hours 3–5): Sentry Error Monitoring

### Step 5 — Create Your Sentry Account and Project

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project — choose **Next.js** as the platform
3. Give it the name `agentforge`
4. Copy the **DSN** (Data Source Name — the URL that tells the Sentry SDK where to send errors. Format: `https://[key]@[org].ingest.sentry.io/[project-id]`)
5. Also navigate to **Settings → Auth Tokens → Create New Token** — select `project:write` and `org:read` scopes (permissions — the specific actions this token is allowed to perform; `project:write` lets the SDK upload source maps, `org:read` lets it verify your organisation). Copy the token.

Add to `.env.local`:
```bash
SENTRY_DSN=https://your_key@your_org.ingest.sentry.io/your_project_id
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your_org_slug_here     # visible in your Sentry URL: sentry.io/organizations/[slug]
SENTRY_PROJECT=agentforge
```

Also add `SENTRY_DSN` to Vercel's environment variables (Production + Preview).

---

### Step 6 — Install and Configure Sentry

Ask Claude Code:
> *"Install and configure Sentry in the AgentForge Next.js 16.2.4 project. Use the Sentry wizard which handles all the configuration automatically:*
>
> ```bash
> npx @sentry/wizard@latest -i nextjs
> ```
>
> *The wizard will:*
> - *Install `@sentry/nextjs` (the Sentry SDK for Next.js)*
> - *Create `sentry.client.config.ts` — runs in the browser; captures frontend JavaScript errors*
> - *Create `sentry.server.config.ts` — runs on the server; captures API route errors and server component crashes*
> - *Create `sentry.edge.config.ts` — runs in Vercel's Edge Runtime (a lightweight JavaScript environment for Vercel middleware); captures `proxy.ts` errors*
> - *Update `next.config.ts` to wrap the config with `withSentryConfig` (a wrapper function that enables source map uploads — the files that translate minified production code back to readable TypeScript — so Sentry shows you readable stack traces)*
> - *Create `src/app/global-error.tsx` — a top-level error boundary (a React component that catches unhandled errors and shows a fallback UI instead of a white screen) that reports to Sentry*
>
> *After the wizard finishes, open each generated config file and confirm:*
> - *`SENTRY_DSN` is read from `process.env.SENTRY_DSN` — not hardcoded*
> - *`tracesSampleRate: 0.1` — set this to 0.1 (10%) for production. A value of 1.0 samples every request, which is expensive; 0.1 captures enough data for debugging without excessive cost*
> - *`debug: false` in the server config — `debug: true` floods your terminal logs, fine for local but never in production*
>
> *Then add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` to `.env.local` (already done in Step 5) and to Vercel's environment variables. These are needed for source map uploads during the Vercel build.*
>
> *Finally, add a deliberate test error to confirm Sentry is working. In `src/app/dashboard/page.tsx`, temporarily add a button:*
> ```typescript
> <button onClick={() => { throw new Error('Sentry test error — delete me') }}>
>   Test Sentry
> </button>
> ```
>
> *After building, verify by testing:*
> - *Happy path: run `npm run dev`, click the 'Test Sentry' button → check your Sentry dashboard → the error 'Sentry test error — delete me' appears within 30 seconds with the correct file name and line number (not minified — readable TypeScript)*
> - *Failure path: remove `SENTRY_DSN` from `.env.local`, restart the dev server, click the button → Sentry SDK logs a warning to console but the app does not crash — Sentry is optional infrastructure, never a critical dependency*
> *Do not mark complete until both pass. Then delete the test button before committing."*

---

### Step 7 — Update the Production Stripe Webhook

When you created the Stripe webhook in Week 10, it pointed to `localhost:3000/api/stripe/webhook` (your local machine). Now you need a second webhook pointing to your live URL.

In the Stripe dashboard (use **live mode** — Stripe's production environment where real card charges happen, as opposed to test mode which uses fake cards and never moves real money — for production):

1. Navigate to **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://[your-vercel-url]/api/stripe/webhook`
3. **Events to listen for:** `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `checkout.session.completed`
4. Click **Add endpoint**
5. Click **Reveal** next to the signing secret — copy the `whsec_...` value
6. In Vercel's environment variables, update `STRIPE_WEBHOOK_SECRET` to this new production value

> 💡 Keep your test mode webhook for local development — it still points to localhost and you still use `stripe listen` locally. The production webhook only fires in live mode with real payments.

Ask Claude Code:
> *"Verify the Stripe webhook is wired correctly in production by checking the webhook handler at `src/app/api/stripe/webhook/route.ts`. Confirm:*
> *1. The route reads `STRIPE_WEBHOOK_SECRET` from environment variables (not hardcoded)*
> *2. Every webhook event handler does an UPSERT (a combined INSERT + UPDATE — if the row exists, update it; if not, create it) into the `subscriptions` table rather than a plain INSERT (which would fail if the row already exists)*
> *3. The route returns 200 (OK — request succeeded) for events it doesn't handle, not 400 or 500 — Stripe resends events that don't get a 200 response, creating duplicate processing*
>
> *After checking, go to the Stripe dashboard → Webhooks → click your new production endpoint → click 'Send test event' → choose `checkout.session.completed`. Check the Supabase `subscriptions` table in production — confirm a row was inserted or updated.*
>
> *After building, verify by testing:*
> - *Happy path: Stripe 'Send test event' → your Vercel function log shows a 200 response → Supabase `subscriptions` table updated*
> - *Failure path: temporarily set `STRIPE_WEBHOOK_SECRET` to a wrong value in Vercel → redeploy → send test event → Stripe shows a 400 response (the signature validation failed, which is the correct secure behaviour — not a bug)*
> *Do not mark complete until both pass."*

---

### ✅ Before You Commit — Sentry + Webhook

| Test | Expected result |
|---|---|
| Click 'Test Sentry' button on localhost | Error appears in Sentry dashboard with readable TypeScript stack trace |
| `SENTRY_DSN` removed from `.env.local` | App still runs — Sentry failure is silent, not a crash |
| Test button deleted from dashboard page | No Sentry test button visible in the UI |
| Stripe 'Send test event' from dashboard | Vercel function log shows 200; Supabase `subscriptions` updated |
| Wrong `STRIPE_WEBHOOK_SECRET` in Vercel | Stripe shows 400 response for the test event — signature validation working |

---

## 💾 Commit Checkpoint — Sentry + Webhook Complete

```bash
git add -A
git commit -m "feat: Sentry error monitoring, production Stripe webhook endpoint"
```

---

## ⚙️ Session 3 — Sunday (Hours 5–7): GitHub Actions CI

### Step 8 — Write the CI Workflow

GitHub Actions reads YAML files in `.github/workflows/` and runs them automatically on the triggers you define. You're creating one workflow that runs on every push and pull request — catching broken builds and type errors before they reach production.

Ask Claude Code:
> *"Create `.github/workflows/ci.yml` — the GitHub Actions CI workflow for AgentForge. Here's exactly what it should do:*
>
> ```yaml
> name: CI
>
> on:
>   push:
>     branches: [main]
>   pull_request:
>     branches: [main]
>
> jobs:
>   build-and-check:
>     runs-on: ubuntu-latest
>     steps:
>       - name: Checkout code
>         uses: actions/checkout@v4
>
>       - name: Setup Node.js
>         uses: actions/setup-node@v4
>         with:
>           node-version: '20'
>           cache: 'npm'
>
>       - name: Install dependencies
>         run: npm ci
>
>       - name: TypeScript check
>         run: npx tsc --noEmit
>
>       - name: Build
>         run: npm run build
>         env:
>           NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
>           NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
>           ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
>           NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
>           STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
>           STRIPE_PRO_PRICE_ID: ${{ secrets.STRIPE_PRO_PRICE_ID }}
>           STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
>           NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
>           UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
>           UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
>           SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
>
>       - name: Run tests
>         if: ${{ hashFiles('vitest.config.ts') != '' }}
>         run: npm test
>         env:
>           NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
>           NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
>           ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
> ```
>
> *Explain each section:*
> - *`on: push: branches: [main]` — this workflow runs every time code is pushed to the `main` branch*
> - *`on: pull_request: branches: [main]` — also runs when someone opens or updates a pull request targeting `main`*
> - *`runs-on: ubuntu-latest` — GitHub spins up a fresh Ubuntu Linux virtual machine for each run*
> - *`actions/checkout@v4` — checks out (downloads) the repository code onto the runner*
> - *`actions/setup-node@v4` with `cache: 'npm'` — installs Node.js 20 and caches `node_modules` between runs so `npm ci` is faster on subsequent runs*
> - *`npm ci` — installs dependencies exactly as specified in `package-lock.json` (the lock file that pins exact versions of every dependency). Faster and more deterministic than `npm install`*
> - *`npx tsc --noEmit` — runs the TypeScript type checker without generating output files. Catches type errors that wouldn't necessarily cause a build failure*
> - *`npm run build` — runs the full Next.js production build. If this fails, the CI job fails and the merge is blocked*
> - *`${{ secrets.VARIABLE_NAME }}` — references a GitHub secret (an encrypted variable stored in GitHub, not in your code). You need to add these in the next step.*
> - *`if: ${{ hashFiles('vitest.config.ts') != '' }}` — only runs tests if `vitest.config.ts` exists (a safe guard if tests aren't set up yet)*
>
> *After creating the file, verify the YAML is valid by pasting it into [yaml-online-parser.appspot.com](https://yaml-online-parser.appspot.com) — confirm no parsing errors.*
>
> *After building, verify by testing:*
> - *Happy path: push a small change to a branch → open a pull request to main → GitHub Actions tab shows a yellow ⏳ (running) → after 3–5 minutes, turns green ✅*
> - *Failure path (intentional): temporarily introduce a TypeScript error in any file (`const x: string = 123`) → push to a branch → CI shows red ❌ for the TypeScript check step — the error is visible in the job log*
> *Do not mark complete until both pass. Then revert the intentional error."*

---

### Step 9 — Add GitHub Secrets

GitHub Actions can't read your `.env.local` file — that file is not committed to GitHub (it's in `.gitignore`). Instead, GitHub has its own encrypted secrets store.

In your GitHub repository:
1. Go to **Settings → Secrets and variables → Actions → New repository secret**
2. Add each variable from the `env:` block in your workflow file:

| Secret name | Where to find the value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your `.env.local` |
| `ANTHROPIC_API_KEY` | Your `.env.local` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your `.env.local` (use test key for CI) |
| `STRIPE_SECRET_KEY` | Your `.env.local` (use test key for CI) |
| `STRIPE_PRO_PRICE_ID` | Your `.env.local` |
| `STRIPE_WEBHOOK_SECRET` | Your `.env.local` |
| `NEXT_PUBLIC_APP_URL` | Your live Vercel URL |
| `UPSTASH_REDIS_REST_URL` | Your `.env.local` |
| `UPSTASH_REDIS_REST_TOKEN` | Your `.env.local` |
| `SENTRY_DSN` | Your `.env.local` |

> ⚠️ GitHub secrets are write-only — once saved, you cannot read them back through the UI. If you need to update one, just create a new secret with the same name.

Ask Claude Code:
> *"Confirm that all variables in the `env:` block of `.github/workflows/ci.yml` have corresponding GitHub secrets — list any that are in the workflow file but missing from the secrets list I described above. Then push a branch called `feature/ci-setup` containing only the workflow file:*
> ```bash
> git checkout -b feature/ci-setup
> git add .github/workflows/ci.yml
> git commit -m "ci: add GitHub Actions CI workflow"
> git push origin feature/ci-setup
> ```
> *Open a pull request on GitHub. Watch the Actions tab.*
>
> *After building, verify by testing:*
> - *Happy path: the `CI` workflow appears in the Actions tab with a yellow ⏳ spinner → after 3–5 minutes turns green ✅ — all steps (TypeScript check, build, optional tests) pass*
> - *Failure path: if the workflow fails with a message like `Input required and not supplied: [VARIABLE_NAME]` or `Error: Process completed with exit code 1` on the Build step, the failing step's log will show exactly which env var is missing. Add the missing GitHub Secret (Settings → Secrets → Actions) and re-push to re-trigger CI*
> *Do not mark complete until both pass."*

---

### ✅ Before You Commit — GitHub Actions CI

| Test | Expected result |
|---|---|
| Push a branch and open a PR to `main` | GitHub Actions tab shows the `CI` workflow running |
| Workflow completes with no code changes | Green ✅ — TypeScript check, build, and tests all pass |
| Introduce a deliberate TypeScript error and push | Red ❌ — TypeScript check step fails with the error visible in the log |
| Fix the error and push | Green ✅ — CI passes again |
| Merge the PR to `main` | Vercel automatically deploys the new version — live URL updates |

---

## 💾 Commit Checkpoint — GitHub Actions CI Complete

```bash
git add -A
git commit -m "feat: GitHub Actions CI workflow — TypeScript check, build, and tests on every push"
```

---

## ⚙️ Session 4 — Sunday (Hours 7–8): Production Smoke Test

### Step 10 — Full End-to-End Production Test

This is the most important test of the week. Open your live URL in an incognito window (no cached auth, no dev environment) and walk through the entire user journey as a stranger.

Ask Claude Code:
> *"I'm about to run a full production smoke test on the live URL. Prepare a test checklist for me — every major user journey in AgentForge. For each item, tell me:*
> *1. The exact URL to navigate to*
> *2. The action to take*
> *3. The expected result*
> *4. The most likely failure mode and how to debug it*
>
> *The journeys to cover:*
>
> **Authentication:**
> - Sign up with a fresh email address
> - Confirm the welcome email arrives (if Resend is set up)
> - Log out
> - Log in with the same credentials
> - Test wrong password — inline error, not a crash
>
> **Agent Creation:**
> - Create a new agent using the 5-step builder
> - Verify it appears on the dashboard
> - Edit the agent — change its name
>
> **Chat:**
> - Open the agent and send a message
> - Streaming response appears — not a static block
> - Tool call works (web search, if enabled on the agent)
> - Reload the page — conversation history loads from Supabase
>
> **Sharing:**
> - Toggle the agent public — slug is generated, URL is shown
> - Open the share URL in a second incognito window (fully separate session)
> - Chat on the public share page — streaming works
> - Clone the agent (logged in) — new agent appears on dashboard
>
> **Payments (Stripe test mode):**
> - Log in as a free user — usage limits are displayed
> - Click Upgrade to Pro
> - Stripe Checkout opens at the correct price ($12/month)
> - Complete checkout with Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVC
> - After checkout: `subscriptions` table shows `tier = 'pro'`
> - Return to dashboard — Pro badge or unlimited limits visible
>
> **Error handling:**
> - Navigate to a non-existent URL — custom 404 page shows (if built)
> - Force a network error by disconnecting briefly — app shows a user-friendly message, not a raw error
>
> *Format this as a printable checklist with ✅/❌ boxes I can actually work through."*

Work through the checklist methodically. For every ❌, immediately ask Claude Code:
> *"On my live production URL, [exact action] is failing with [exact error]. Here's the Sentry error / Vercel function log output: [paste]. What's wrong and how do I fix it?"*

---

### ✅ Before You Commit — Production Smoke Test

| Test | Expected result |
|---|---|
| Sign up with fresh email on live URL | Account created; Supabase `auth.users` shows the new user |
| Chat on live URL | Streaming response — not a loading spinner that never resolves |
| Conversation history on reload | Messages load from Supabase — same as local |
| Share page in incognito on live URL | Loads without auth; `NEXT_PUBLIC_APP_URL` correct |
| Stripe test checkout completes | Redirected to success URL; `subscriptions` table updated in Supabase |
| Non-existent URL (`/this-does-not-exist`) | Custom 404 page — not a Vercel default error page |
| Sentry dashboard after smoke test | At least one event captured (the real user journey generates some) |

---

## 💾 Commit Checkpoint — Production Smoke Test Complete

Document what you found and fixed during the smoke test.

```bash
git add -A
git commit -m "fix: production smoke test fixes — [describe what you actually fixed]"
```

---

## ✨ Stretch Tasks (+4–5 hrs, if you have time)

None of these block Week 12. But each one meaningfully improves the professionalism of your launch.

---

### Stretch 1 — Vercel Analytics (30 min)

This was deferred from Week 9 because it requires a deployed Vercel app. Now you have one.

Ask Claude Code:
> *"Add Vercel Analytics to AgentForge. Two steps:*
>
> *1. In the Vercel dashboard → your project → Analytics tab → Enable Analytics. One click.*
>
> *2. Install the package and add the component:*
> ```bash
> npm install @vercel/analytics
> ```
>
> *In `src/app/layout.tsx` (the root layout file — it wraps every page in the app), import and add the `<Analytics />` component:*
> ```typescript
> import { Analytics } from '@vercel/analytics/react'
>
> // Inside the return:
> <body>
>   {children}
>   <Analytics />
> </body>
> ```
>
> *Explain: `@vercel/analytics` is Vercel's privacy-first analytics library. It tracks page views and web vitals (Core Web Vitals — Google's three key performance metrics: LCP, FID, CLS) without setting cookies or collecting personal data. Unlike Google Analytics, it works with ad blockers.*
>
> *After building, verify by testing:*
> - *Happy path: deploy to Vercel → open the live URL → navigate between pages → check Vercel Analytics dashboard → page views appear within 2 minutes*
> - *Failure path: Analytics dashboard shows zero data on localhost — this is expected. Vercel Analytics only works on deployed Vercel URLs, not localhost. The absence of data locally is not a bug.*
> *Do not mark complete until both pass."*

---

### Stretch 2 — Performance Audit + Core Web Vitals (1.5 hrs)

Ask Claude Code:
> *"Run a Lighthouse audit on the production URL. In Chrome: open the live URL → DevTools (Cmd+Option+I) → Lighthouse tab → Analyse page load → check Desktop. Screenshot the results and fix the top 3 issues.*
>
> *Common issues and how to fix them in Next.js:*
>
> *Issue 1 — Large images not optimised:*
> - *Replace any `<img>` tags with Next.js's `<Image>` component (imported from `next/image`)*
> - *Next.js Image automatically converts images to WebP format (a modern image format 30% smaller than PNG/JPEG), lazy-loads them (loads only when near the viewport — the visible area of the browser), and serves correctly-sized versions for each screen*
> - *Ask Claude Code: "Replace all `<img>` tags in `src/components/` with the Next.js `<Image>` component. Explain what `width`, `height`, and `priority` props do and when to use `priority: true`."*
>
> *Issue 2 — Unused JavaScript (large bundle size):*
> - *Ask Claude Code: "Run `npm run build` and look at the bundle size report. Which routes are largest? Are there any large libraries imported in a page component that should be lazy-loaded (loaded only when needed, not on page load)? Show me how to use `dynamic()` from `next/dynamic` to lazy-load the heaviest component."*
> - *`dynamic()` is Next.js's function for lazy loading components — it loads the component's JavaScript only when the component is about to render, not at page load*
>
> *Issue 3 — Render-blocking fonts (fonts loaded via `@import` or `<link>` tags that force the browser to pause all page painting until the font file downloads — delaying the moment users see any content):*
> - *If you're importing fonts directly in CSS or `<link>` tags, replace with Next.js's `next/font` module*
> - *Ask Claude Code: "Are there any fonts loaded via CSS `@import` or `<link>` tags? If so, migrate them to `next/font/google` — explain why font-display: swap (a CSS property that shows a fallback font while the custom font loads, preventing invisible text) matters for Lighthouse scores."*
>
> *After applying fixes:*
> - *Deploy to Vercel*
> - *Re-run Lighthouse*
>
> *After building, verify by testing:*
> - *Happy path: re-run Lighthouse after fixes → Performance score improves by at least 5 points → Accessibility score is 90 or above*
> - *Failure path: if a fix breaks the layout (e.g. `<Image>` with wrong dimensions causes layout shift — CLS), revert that specific fix and note it: "Image component on landing page hero needs correct aspect ratio before fixing"*
> *Do not mark complete until both pass."*

Ask Claude Code: *"What are Core Web Vitals and why does Google include them in search rankings? What score should I target for Performance, Accessibility, and SEO in Lighthouse?"*

---

### Stretch 3 — Custom Error Pages (30 min)

Ask Claude Code:
> *"Build two custom error pages for AgentForge with full AgentForge branding:*
>
> *1. `src/app/not-found.tsx` — the custom 404 page. This file is automatically used by Next.js when a route doesn't match anything or when `notFound()` is called from a server component (a Next.js function that throws a special 'not found' signal that Next.js catches and renders this page for):*
> ```typescript
> // Shows: large 404 heading, 'Page not found' subtitle, 'AgentForge' brand,
> // a friendly message like "The page you're looking for doesn't exist or has been moved.",
> // and a button: 'Back to Dashboard →' (or 'Back to Home' if the user is not logged in)
> ```
>
> *2. `src/app/error.tsx` — the global error boundary for the app. This file must be a Client Component (it runs in the browser, not on the server — required because it uses React's error boundary mechanism, which is a browser concept) and receives `error` and `reset` props:*
> ```typescript
> 'use client'
>
> export default function Error({ error, reset }: { error: Error, reset: () => void }) {
>   // Shows: 'Something went wrong' heading, AgentForge branding,
>   // the error message (error.message) in a grey code block for debugging,
>   // a 'Try again' button that calls reset() — reset() re-renders the failed component
>   // instead of requiring a full page reload,
>   // and a 'Back to Dashboard' link as a secondary option
> }
> ```
>
> *Explain: `error.tsx` vs `not-found.tsx`:*
> - *`not-found.tsx` is for "this content doesn't exist" — a 404 situation. Example: `/agents/nonexistent-id`*
> - *`error.tsx` is for "something crashed" — a 500 situation. Example: Supabase threw an exception inside a server component*
> - *Both give users a graceful exit instead of a white screen or raw error dump*
>
> *After building, verify by testing:*
> - *Happy path (404): navigate to `/this-route-does-not-exist` on the live URL → custom 404 page appears with AgentForge branding and 'Back to Dashboard' button*
> - *Happy path (error): temporarily add `throw new Error('test')` at the top of a page server component → save → the error.tsx page appears with the error message and 'Try again' button → clicking Try again re-renders and clears the error*
> - *Failure path: remove the test throw → page renders normally — error.tsx only shows when an actual error occurs*
> *Do not mark complete until all three pass. Remove the test throw before committing."*

---

### Stretch 4 — Preview Deployments + Branch Protection (1 hr)

Ask Claude Code:
> *"Set up branch protection on GitHub so that direct pushes to `main` are blocked — every change must go through a pull request that passes CI before merging.*
>
> *Steps:*
> *1. GitHub repository → Settings → Branches → Add branch ruleset (a branch ruleset is a set of rules GitHub enforces on a named branch — you can require pull requests, require CI to pass, and block force pushes, all from one place)*
> *2. Branch name pattern: `main`*
> *3. Enable: 'Require a pull request before merging', 'Require status checks to pass before merging'*
> *4. Add the CI status check: search for 'build-and-check' (the job name from the CI workflow)*
> *5. Enable: 'Block force pushes' — a force push (`git push --force`) overwrites the branch's commit history on GitHub without going through a pull request, bypassing all review and CI checks. Blocking them means every change must arrive via a PR.*
>
> *Then demonstrate the preview deployment workflow:*
> *1. `git checkout -b feature/test-preview` — create a new branch*
> *2. Make a small visible change (e.g. add a '🚀' emoji to the dashboard heading)*
> *3. `git push origin feature/test-preview` — push the branch*
> *4. Open a pull request on GitHub — Vercel automatically posts a comment with a preview URL*
> *5. Open the preview URL — it shows your branch's version of the app without touching production*
> *6. Merge the PR → CI must pass before GitHub allows the merge → Vercel deploys the merged code to production*
>
> *After building, verify by testing:*
> - *Happy path: create a branch, push a change, open a PR → Vercel preview URL appears in the PR comments → the preview shows the branch change, production is unchanged*
> - *Failure path: try to push directly to `main` → GitHub blocks the push with 'remote: error: GH013: Repository rule violations found for refs/heads/main'*
> *Do not mark complete until both pass."*

---

### Stretch 5 — Custom Domain (1 hr)

Optional but impressive for the launch. Requires buying a domain (e.g. `agentforge.dev` or `agentforge.app` — typically $10–20/year from Namecheap or Google Domains).

Ask Claude Code:
> *"Guide me through connecting a custom domain to my Vercel deployment.*
>
> *Steps:*
> *1. In Vercel → your project → Settings → Domains → Add*
> *2. Type the domain you purchased (e.g. `agentforge.dev`) → Add*
> *3. Vercel shows a CNAME record (a DNS setting that maps your domain to Vercel's servers) to add: `Value: cname.vercel-dns.com`*
> *4. At your domain registrar (the company where you bought the domain — Namecheap, Google Domains, etc.):*
>    - *Find DNS settings → Add a CNAME record*
>    - *Name/Host: `@` or `www` (depends on registrar)*
>    - *Value: `cname.vercel-dns.com`*
>    - *TTL: 3600 (this is the 'Time to Live' — how long DNS servers cache this record in seconds; 3600 = 1 hour)*
> *5. DNS propagation (the time it takes for the change to spread through the global DNS network) takes 5 minutes to 24 hours. Vercel shows a green checkmark when it's active.*
>
> *After the domain is live:*
> *6. Update `NEXT_PUBLIC_APP_URL` in Vercel's environment variables to `https://agentforge.dev` (your new domain)*
> *7. Update the Stripe webhook endpoint URL to use the new domain*
> *8. Redeploy (trigger by pushing a commit or manually in Vercel dashboard)*
>
> *After building, verify by testing:*
> - *Happy path: visit your custom domain in an incognito window → the app loads → the URL bar shows your domain, not `.vercel.app`*
> - *Failure path: if the domain shows a security certificate error (NET::ERR_CERT_AUTHORITY_INVALID), wait 10 minutes — Vercel auto-provisions a TLS certificate (the HTTPS encryption certificate) and this error clears on its own*
> *Do not mark complete until the happy path passes."*

---

### Stretch 6 — Staging Environment (1–2 hrs)

Right now, Vercel's Preview deployments (the temporary URLs built from each branch) share your production Supabase database. That means testing a database migration or destructive change on a Preview URL runs it against real data. A separate staging Supabase project fixes this.

Ask Claude Code:
> *"Set up a staging environment for AgentForge so that Vercel Preview deployments use a separate Supabase project instead of the production database.*
>
> *Steps:*
>
> *1. Go to [supabase.com](https://supabase.com) → New project → name it `agentforge-staging`. This creates a completely separate database — no data is shared with production.*
>
> *2. In the new staging project, run all migrations to match the production schema. The fastest way:*
> ```bash
> supabase db push --linked   # pushes your local migration files to the staging project
> ```
> *If the Supabase CLI isn't linked to the staging project yet, run `supabase link --project-ref [staging-project-id]` first.*
>
> *3. In Vercel → your project → Settings → Environment Variables:*
> - *For each Supabase variable (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), set the environment to **Preview only** and enter the staging project's values*
> - *The Production values stay unchanged — Production still points to the real database*
> - *Result: pushes to `main` deploy to production Supabase; all branch Preview URLs deploy to staging Supabase*
>
> *4. Trigger a new Preview deployment (push any branch) and confirm:*
> - *The Preview URL connects to the staging Supabase project (sign up with a test email — check it appears in staging `auth.users`, not production)*
> - *The production URL still connects to the production Supabase project (existing users still log in)*
>
> *After building, verify by testing:*
> - *Happy path: sign up on the Preview URL → user appears in staging Supabase `auth.users` → production Supabase `auth.users` is unchanged*
> - *Failure path: if the Preview URL throws a Supabase connection error, check that the staging env vars are set to **Preview** environment only in Vercel — not Production*
> *Do not mark complete until both pass."*

---

### ✅ Before You Commit — Stretch Tasks (if attempted)

All of the following must pass for each stretch task you completed. Ask Claude Code to run them if you haven't already:

| Test | Expected result |
|---|---|
| **(Stretch 1)** Deploy to Vercel → navigate between pages → check Analytics dashboard | Page views appear in Vercel Analytics within 2 minutes — zero data on localhost is expected |
| **(Stretch 2)** Re-run Lighthouse on live URL after fixes | Performance score improved by at least 5 points vs baseline; Accessibility score ≥ 90 |
| **(Stretch 2)** Layout after `<Image>` migration | No new layout shift (CLS) — images display at correct aspect ratios |
| **(Stretch 3)** Navigate to `/this-route-does-not-exist` on live URL | Custom 404 page with AgentForge branding — not Vercel's default error screen |
| **(Stretch 3)** Error boundary test throw on live URL | `error.tsx` renders with 'Try again' button; clicking it re-renders the page cleanly — no full reload needed |
| **(Stretch 4)** Push branch, open PR | Vercel posts a preview URL comment in the PR within 2 minutes; preview shows branch changes, production is unchanged |
| **(Stretch 4)** Attempt direct push to `main` | GitHub rejects with `GH013: Repository rule violations found for refs/heads/main` |
| **(Stretch 5)** Visit custom domain in incognito | App loads at custom domain — URL bar shows your domain, not `.vercel.app`; no certificate errors |
| **(Stretch 6)** Sign up on a Preview URL | User appears in staging Supabase `auth.users` — production `auth.users` is unchanged |

Do not commit until every row for your attempted stretch tasks shows the expected result.

---

## 💾 Commit Checkpoint — Stretch Tasks (if attempted)

```bash
git add -A
git commit -m "feat: Vercel Analytics, Lighthouse fixes, custom error pages, branch protection, preview deployments, staging environment"
```

---

## 💾 Sprint Close — Week 11 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, and update `CLAUDE.md`'s Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 11 complete — Vercel production deploy, Sentry monitoring, GitHub Actions CI, production smoke test"
```

After committing, open `CLAUDE.md` and move "Week 11" from Current Focus into Completed Work with a two-sentence summary of what shipped. Update the Current Focus to Week 12: *"Launch week — demo video, Hacker News Show HN post, Twitter/X thread, LinkedIn post, ProductHunt submission, changelog page, press kit, feedback form."*

---

## ✅ Completion Checklist

Work through these top to bottom. Don't mark anything done until you've actually tested it.

- [ ] Playwright version conflict resolved — `npm list @playwright/test` shows one version, no nested duplicates
- [ ] `tests/example.spec.ts` deleted — auto-generated boilerplate not in the repo
- [ ] `playwright.config.ts` has `testDir: 'e2e'` — not `'tests'` or `'.'`
- [ ] `npx playwright test` passes (dev server running) — `e2e/conversations.spec.ts` and `e2e/share.spec.ts` only
- [ ] `npm run build` passes locally with no errors or TypeScript warnings
- [ ] `npx tsc --noEmit` passes cleanly — zero type errors
- [ ] Vercel account created and connected to GitHub repo
- [ ] All environment variables added to Vercel dashboard (Production + Preview)
- [ ] `NEXT_PUBLIC_APP_URL` updated to the live Vercel URL (not localhost)
- [ ] First Vercel deploy succeeded — green checkmark in build log
- [ ] Live URL loads the landing page without errors
- [ ] Sign up on the live URL — Supabase auth works in production
- [ ] Chat on the live URL — streaming responses work
- [ ] Conversation history persists on reload at the live URL
- [ ] Public share page loads in incognito at the live URL
- [ ] Sentry account created and project set up
- [ ] `@sentry/nextjs` installed and configured via wizard
- [ ] `SENTRY_DSN` added to both `.env.local` and Vercel environment variables
- [ ] Test error button confirmed Sentry captures errors with readable TypeScript stack traces
- [ ] Test error button deleted before committing
- [ ] Production Stripe webhook created pointing to live URL
- [ ] New `STRIPE_WEBHOOK_SECRET` from production webhook added to Vercel
- [ ] Stripe 'Send test event' returns 200 and updates Supabase
- [ ] `.github/workflows/ci.yml` created with TypeScript check, build, and test steps
- [ ] All CI environment variables added as GitHub Secrets
- [ ] Pushed a PR to `main` — CI shows green ✅
- [ ] Intentionally broke a TypeScript type — CI showed red ❌ — confirmed CI catches errors
- [ ] Full production smoke test completed: auth, create agent, chat, share, clone, Stripe checkout
- [ ] All smoke test failures identified and fixed
- [ ] Sentry dashboard shows events captured from the smoke test session
- [ ] Committed with descriptive messages after each major checkpoint

---

## 🧪 Validation Tests

Run these specific tests before closing out the week.

| Test | Expected result |
|---|---|
| `npm list @playwright/test` | Single version listed — no nested duplicates |
| `npx playwright test` (dev server running) | Both `e2e/conversations.spec.ts` and `e2e/share.spec.ts` run — no "did not expect test() to be called here" errors |
| `npm run build` | Completes with `✓ Generating static pages` — zero errors |
| `npx tsc --noEmit` | Exits cleanly — zero errors |
| Visit live URL in incognito | Landing page loads — no Vercel error page |
| Sign up with fresh email on live URL | Account created; confirmed in Supabase `auth.users` |
| Chat on live URL | Claude responds with streaming — not a spinner that never resolves |
| Reload chat page on live URL | Full conversation history loads from Supabase |
| Share page on live URL (incognito) | Agent name, capabilities, and chat load without authentication |
| Stripe test checkout on live URL | Checkout opens, test card `4242 4242 4242 4242` completes, `subscriptions.tier = 'pro'` |
| Stripe 'Send test event' from Stripe dashboard | Vercel function returns 200; Supabase updated |
| GitHub PR CI check | `build-and-check` job shows green ✅ |
| Deliberate TypeScript error pushed to a branch | CI shows red ❌ — error message visible in job log |
| Navigate to `/this-does-not-exist` on live URL | Custom 404 page with AgentForge branding (stretch) |
| Sentry dashboard after smoke test | At least one error event captured — readable stack trace in TypeScript |
| Vercel deployment after merging a PR | Live URL updates automatically — no manual deploy step needed |

---

## 📚 Resources

- [Vercel documentation](https://vercel.com/docs) — deployment, environment variables, domains, analytics
- [Vercel Next.js deployment guide](https://vercel.com/docs/frameworks/nextjs) — specific settings for Next.js projects
- [Sentry Next.js guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/) — full configuration options
- [GitHub Actions documentation](https://docs.github.com/en/actions) — workflow syntax, secrets, debugging
- [GitHub Actions `actions/checkout`](https://github.com/actions/checkout) — the action that checks out your code on the runner
- [GitHub Actions `actions/setup-node`](https://github.com/actions/setup-node) — the action that installs Node.js
- [Lighthouse in Chrome DevTools](https://developer.chrome.com/docs/lighthouse/overview/) — how to run and interpret the audit
- [Core Web Vitals explained](https://web.dev/articles/vitals) — LCP, FID, CLS in plain language
- [Next.js `<Image>` component](https://nextjs.org/docs/app/api-reference/components/image) — automatic image optimisation
- [Next.js `next/dynamic`](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading) — lazy loading heavy components
- [Next.js `not-found.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) — custom 404 pages
- [Next.js `error.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/error) — error boundaries and the `reset()` function
- [Vercel Analytics](https://vercel.com/docs/analytics) — privacy-first page view tracking
- [Stripe live vs test mode](https://stripe.com/docs/testing) — how to create live mode keys and products
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted) — rate limiting in production (same config as development)
- [Namecheap](https://www.namecheap.com) — affordable domain registration (~$10/year for `.dev`)

---

*Week 11 of 14 · AgentForge · Phase 4: Production & Launch · Updated May 2026*
