# 🏗️ Week 12 — Pre-Launch Infrastructure & Soft Beta

**Phase:** 4 — Production & Pre-Launch  
**Dates:** Add your own start date  
**Total time:** 4–6 hrs core · +3–4 hrs stretch  
**Goal:** Rudderly's infrastructure is launch-ready and in the hands of 10–20 hand-picked beta users. This week you build the pages and systems that support a launch (changelog, press kit, feedback form, waitlist) — then use them with a private closed beta *before* the public announcement. You are not posting to Hacker News this week. You are not launching on ProductHunt. You are building the runway so that when Week 18 arrives, everything is polished, feedback-incorporated, and ready to fire. A soft beta now saves you from a broken public launch later.

---

## 📋 Before You Start

Run these commands to confirm your live production deployment is healthy before you share it with any human being.

```bash
cd rudderly
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and verify the local build is intact, then confirm the production URL works end-to-end:

1. **Sign up on the live URL** — Supabase auth working in production
2. **Create an agent** — 5-step builder saves to production Supabase
3. **Chat with an agent** — streaming and tool use working
4. **Visit a `/share/[slug]`** URL while logged out — public agent page loads
5. **Stripe Checkout** — test card `4242 4242 4242 4242` completes in test mode
6. **Check CI** — confirm GitHub Actions are green on `main`

```bash
npx tsc --noEmit    # TypeScript compiler — find type errors before sharing with anyone
npm run build       # Full production build — verify it still compiles cleanly
```

> ⚠️ **Do not share the live URL with beta users until the production site is fully working.** A broken flow in a beta session destroys trust before you've had a chance to build it. Verify every screen you plan to show.

---

## Saturday Session — Hours 1–3: Changelog, Press Kit & Feedback Pages

### Step 1 — Build the Changelog Page

A changelog page (`/changelog`) is where you publicly document what you've shipped. It serves three purposes: (1) it shows active development to potential users, (2) it gives journalists something to link to, and (3) it signals professionalism. Most first-time founders skip it. Don't.

Ask Claude Code:

> *"Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY*
>
> *Add a public `/changelog` route to Rudderly. Requirements:*
>
> *1. Create `src/app/changelog/page.tsx` as a Server Component (no `'use client'` — this is a static public page)*
> *2. Hard-code the changelog entries as a TypeScript array in the same file — no database query needed yet (we'll add that later if needed)*
> *3. Each entry should have: `version`, `date`, `title`, and `changes: string[]`*
> *4. Initial entries to include:*
>    *- v0.1.0 (Week 6 date): "First working AI agent chat — Claude API streaming, conversation history"*
>    *- v0.2.0 (Week 8 date): "Multi-tool agents — 5 built-in tools, agentic loop, tool attribution UI"*
>    *- v0.3.0 (Week 9 date): "Public share pages — shareable agent links, clone feature, view counter"*
>    *- v0.4.0 (Week 10 date): "Stripe payments — freemium tier, Pro plan at \$12/month, usage limits"*
>    *- v1.0.0-beta (today): "Closed beta — production deployment on Vercel, Sentry monitoring, CI/CD pipeline"*
> *5. Style with Tailwind v4 utility classes. Layout: reverse-chronological (newest first). Each entry: date in muted gray, version badge (e.g. `v1.0.0-beta`), title in bold, bulleted changes list.*
> *6. Add a link to `/changelog` in the main site navigation.*
>
> *Verify: Happy path: visit `/changelog` logged out → all entries visible, newest first, no auth wall | Failure path: typo in `page.tsx` → `npm run build` fails with a TypeScript error pointing to the exact line — fix and rebuild."*

### Step 2 — Build the Press Kit Page

A press kit page (`/press`) gives journalists, bloggers, and directory editors everything they need to write about you. Without one, they either skip you or get details wrong. Build it now — even for the beta — because it takes an hour and you'll use it in Week 18.

Ask Claude Code:

> *"Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY*
>
> *Add a public `/press` page to Rudderly. Requirements:*
>
> *1. Create `src/app/press/page.tsx` as a Server Component*
> *2. Include these sections:*
>    *- **About Rudderly**: 2-sentence summary ("Rudderly is a visual AI agent builder for non-developers. It lets anyone create, configure, and deploy AI agents without writing a single line of code.")*
>    *- **Key Facts**: bullet list — Founded 2026, Built with Next.js + Claude AI + Supabase, Free tier + Pro at \$12/month, By [your name/handle]*
>    *- **Screenshots**: placeholder `<div>` blocks labelled "Screenshot 1 — Agent Builder", "Screenshot 2 — Chat Interface", "Screenshot 3 — Public Share Page" (we'll add actual images in the next step)*
>    *- **Tagline options**: 3 one-liners for journalists to choose from*
>    *- **Contact**: your email address for press enquiries*
> *3. Add a link to `/press` in the site footer*
>
> *Verify: Happy path: visit `/press` logged out → all sections visible, no auth wall | Failure path: missing `export default` in `page.tsx` → Next.js throws "module has no exports" error on `npm run build` — fix by adding the default export."*

### Step 3 — Add Screenshots to the Press Kit

Take screenshots of the three key screens and add them to the press kit page.

> **Note:** These are your beta screenshots. After Week 15 (UX Polish), the UI will look better. Save updated screenshots to the same paths then — the press kit page will automatically use the newer images. File names stay the same, content improves.

1. Open your live production URL in Chrome
2. Open DevTools (`Cmd+Option+I`), click the device toolbar icon (`Cmd+Shift+M`), set to **1280 × 800**
3. Take three screenshots:
   - The 5-step agent builder (mid-flow, step 3 or 4 looks best)
   - The chat interface (with a conversation showing tool use)
   - A public share page (clean, shareable URL visible)
4. Save as `public/press/screenshot-builder.png`, `public/press/screenshot-chat.png`, `public/press/screenshot-share.png`

```bash
mkdir -p public/press
cp ~/Desktop/screenshot-builder.png public/press/
cp ~/Desktop/screenshot-chat.png public/press/
cp ~/Desktop/screenshot-share.png public/press/
```

Ask Claude Code to update the press kit page to use `<Image>` (Next.js image component) instead of placeholder divs for the three screenshots. Also save a copy of these to `docs/press-kit/screenshots/` — you'll reference them when writing launch content in Week 16.

```bash
mkdir -p docs/press-kit/screenshots
cp public/press/*.png docs/press-kit/screenshots/
```

### Step 4 — Add the Feedback Form (Tally)

**Tally** (tally.so) is a free form builder. You'll embed a Tally form on a `/feedback` page so beta users can tell you what they think. Tally forms are free, GDPR-compliant, and embed cleanly with a transparent background.

**Create the Tally form:**

1. Go to [tally.so](https://tally.so) and create a free account
2. Create a new form called "Rudderly Feedback"
3. Add these fields:
   - **Single choice**: "How did you find Rudderly?" — options: Beta invite / Hacker News / ProductHunt / Twitter/X / LinkedIn / Friend / Other
   - **Rating (1–5)**: "How easy was it to build your first agent?"
   - **Long text**: "What's the most useful thing Rudderly could add?"
   - **Long text**: "What confused you most?"
   - **Short text** (optional): "Your email (if you'd like a reply)"
4. In Tally settings → Share → Get the embed code. Copy the form ID from the URL (it looks like `wMdXyz`)

Ask Claude Code:

> *"Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY*
>
> *Add a public `/feedback` page to Rudderly that embeds a Tally form. Requirements:*
>
> *1. Create `src/app/feedback/page.tsx` as a Client Component (needs `'use client'` because the Tally embed uses a script tag that requires the browser)*
> *2. Embed the Tally form using an `<iframe>` with these attributes:*
>    *`src="https://tally.so/embed/[YOUR_FORM_ID]?transparentBackground=1&dynamicHeight=1&hideTitle=1"`*
>    *`width="100%"`, `height="500"`, `frameBorder="0"`, `title="Rudderly Feedback"`*
> *3. Add a `<Script>` tag (from `next/script`) with `src="https://tally.so/widgets/embed.js"` and `strategy="lazyOnload"` — this script resizes the iframe dynamically so scrollbars don't appear*
> *4. Add a heading above the form: "Help shape Rudderly" with a subheading: "Takes 2 minutes. Every response is read."*
> *5. Add a link to `/feedback` in the main navigation*
>
> *Replace `[YOUR_FORM_ID]` with the actual Tally form ID before running.*
>
> *Verify: Happy path: visit `/feedback` → Tally form loads inside the page with no scrollbar, transparent background, submit sends response visible in Tally dashboard | Failure path: wrong form ID in the `src` → Tally shows a "Form not found" message inside the iframe — fix by correcting the ID from the Tally embed URL."*

---

## Sunday Session — Hours 4–5: Waitlist & Analytics Baseline

### Step 5 — Set Up the Waitlist with Resend

You set up Resend for transactional email in Week 10. Now you'll add a waitlist signup form to the landing page that captures emails in both Resend and your own Supabase database.

> **Term: Resend Contacts (global model)** — Resend's current contacts API uses a global model. Contacts are identified by email address and are not tied to any specific list — no Audience ID is required. You simply call `resend.contacts.create({ email, unsubscribed: false })` and the contact is stored globally. For broadcasts, you organise contacts using Segments (Resend's new name for Audiences), but for waitlist capture you don't need one.

> **Why Supabase too?** Resend's global contacts endpoint silently upserts on duplicate emails — it returns HTTP 200 whether the contact is new or already exists, with no error. That means Resend alone cannot detect duplicates. The fix is to track signups in a Supabase `waitlist` table with a unique constraint on `email`. Your API route tries the Supabase insert first — a duplicate triggers a Postgres unique constraint error (code `23505`), which you map to a 409. Only new emails proceed to Resend. This also gives you your own record of signups independent of any third-party service.

**Two-environment migration — run on staging first, then production:**

This step creates a new table in Supabase. Because you have both a staging project (`emqkmiwrburwwtulmnfr`) and a production project (`gqqglsttnfkftsdcbcsz`), the migration must run on both. Always staging first to verify it applies cleanly, then production.

Ask Claude Code:

> *"Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY*
>
> *Implement the Supabase waitlist table fix. Create a migration that adds a `waitlist` table with `email` as a unique primary key, `created_at` timestamptz, and `source` text (default 'website'). Update `src/app/api/waitlist/route.ts` to: (1) try to insert the email into the Supabase `waitlist` table first using the service role key (server-side only, never exposed to the client), (2) if the insert throws a unique constraint violation (Postgres error code `23505`), return 409 with `{"error":"Already subscribed"}` without calling Resend, (3) if insert succeeds, call `resend.contacts.create({ email, unsubscribed: false })` and return 201. Add RLS to the waitlist table so only the service role can insert/read. Apply this migration to both Supabase projects: staging (`emqkmiwrburwwtulmnfr`) first, then production (`gqqglsttnfkftsdcbcsz`) — confirm each completed before moving to the next.*
>
> *Also add a `<WaitlistForm>` Client Component (`'use client'`) to `src/components/waitlist-form.tsx` if not already present:*
> *- Email input + "Join waitlist" button*
> *- On submit: POST to `/api/waitlist`*
> *- On 201: show "You're on the list! We'll be in touch." in green (replace form — no re-submit)*
> *- On 409: show "You're already subscribed." in amber (keep form visible)*
> *- On error: show "Something went wrong — try again." in red (keep form visible)*
> *- Disable button and show spinner while submitting (prevents double-submit)*
>
> *Add `<WaitlistForm />` to `src/app/page.tsx` below the hero CTA if not already placed.*
>
> *Verify: (1) new email → 201 + green confirmation + row in Supabase `waitlist` table + contact in Resend → (2) same email again → 409 + amber "already subscribed" (Resend NOT called a second time) → (3) bad email (e.g. "notanemail") → 400 "Invalid email address" (Zod rejects before Supabase or Resend are touched). Do not mark complete until all three paths pass."*

**No environment variable needed** — unlike the old Audiences model, there is no `RESEND_AUDIENCE_ID` to copy. You do not need to add anything to `.env.local` or Vercel for this step beyond your existing `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

### Step 6 — Create Your Launch Metrics Baseline

Before you have real users you can't measure improvement. The purpose of `LAUNCH_METRICS.md` is to snapshot your baseline numbers *now* — before beta — so that in Week 18 you can compare Day 1 public launch numbers against something meaningful. Create the file and fill it with today's data.

Create `docs/LAUNCH_METRICS.md`:

```markdown
# Rudderly — Launch Metrics Baseline

**Snapshot date:** [today's date]
**Phase:** Pre-launch / Closed Beta

## Infrastructure Health
- TypeScript errors (`npx tsc --noEmit`): 0
- Production build (`npm run build`): ✅ passing
- CI status (GitHub Actions): ✅ green
- Vercel deployment: ✅ live

## Baseline Numbers (Pre-Beta)
- Total registered users: [check Supabase auth.users count]
- Total agents created: [check Supabase agents table count]
- Total conversations: [check conversations table count]
- Waitlist emails collected: 0 (form just built)
- Tally feedback responses: 0 (form just built)

## Page Performance (run Lighthouse on live URL)
- Landing page Performance score: [score]
- Landing page Accessibility score: [score]
- Landing page SEO score: [score]
- Agent builder Performance score: [score]

## Technical Baseline
- Average API response time (Vercel Analytics): [ms]
- Largest Contentful Paint on landing page: [s]
- Any open Sentry errors: [count] — resolve before beta invite

## Goals for Week 18 Public Launch (fill in now, measure then)
- Signups in first 7 days: target [X]
- HN upvotes: target [X]
- ProductHunt votes: target [X]
- Waitlist → signup conversion: target [X]%
```

> **Why document this now?** On launch day, adrenaline and chaos make it easy to forget what "before" looked like. A documented baseline means Week 18's retrospective is a real comparison, not a guess.

### Step 7 — Commit and Deploy

Before inviting any beta users, push everything to production and confirm it's live.

```bash
cd rudderly
git add -A
git status   # review what's staged — confirm no .env.local or secrets included
git commit -m "feat: beta infrastructure — changelog, press kit, feedback form, waitlist signup, launch metrics baseline"
git push origin main
```

> ⚠️ **Pre-commit verification — run these before every commit this week:**
>
> ```bash
> git diff --staged | grep -i "RESEND_API_KEY\|SUPABASE_SERVICE_ROLE_KEY\|sk_live\|sk_test"
> ```
>
> If any secrets appear in the diff output, stop immediately. Run `git reset HEAD <file>` to unstage the file, add it to `.gitignore`, and re-stage only the non-secret files. **Never commit API keys to version control** — even private repositories. Secrets committed to Git persist in the commit history even after deletion.

After pushing, watch the Vercel deployment:

1. Go to your Vercel dashboard and watch the deployment log for the `main` branch
2. Once deployed, visit your live URL and test all four new pages: `/changelog`, `/press`, `/feedback`, and the waitlist form on the landing page
3. Submit a test email to the waitlist — verify it appears in your Resend Audience dashboard

**Commit checkpoint** — do not invite beta users until:
- [ ] `git push` triggers a green CI run on GitHub Actions
- [ ] Vercel deployment succeeds (no error in the build log)
- [ ] All four new pages load on the live URL
- [ ] Test waitlist signup appears in Resend dashboard
- [ ] `LAUNCH_METRICS.md` is committed with today's baseline numbers

---

## Sunday Session — Hours 6: README & Sprint Close

### Step 8 — Update Your README

Your GitHub repository README is often the first thing a technical person reads when evaluating a product. Even though Rudderly is a private repository at launch, the README should be polished — you may share it selectively or make it public later.

> **Note: This is a private repository.** Do not commit `.env.example` or any file that references your production secrets. Do not make the repository public without a full secrets audit first.

Ask Claude Code:

> *"Write a README.md for Rudderly — a visual AI agent builder for non-developers. Include:*
>
> *1. **Hero section**: Product name and one-line description ("Build AI agents without code. Deploy in minutes."). Leave a placeholder comment `<!-- demo.gif will be added in Week 16 -->` where the GIF will go — do not add a broken image link.*
> *2. **What it does**: 3-sentence plain-language description*
> *3. **Tech stack table**: Next.js 16.2.4, React 19, Tailwind CSS v4, Supabase, Claude API (claude-sonnet-4-6), Stripe, Vercel, Resend, Upstash Redis*
> *4. **Quick start** section with these commands:*
>    *```bash*
>    *git clone [repo-url]*
>    *cd rudderly*
>    *npm install*
>    *# Copy .env.local.example to .env.local and fill in your own keys*
>    *npm run dev*
>    *```*
> *5. **Roadmap** section with 3 upcoming features (placeholders — fill in based on your most-requested feedback)*
> *6. **Built by** section with your name/handle*
>
> *Do not include: license badge, contribution guidelines, or any open-source language — this is a private repository.*
>
> *Write in Markdown. Keep it under 100 lines."*

### Step 9 — Final Commit & Sprint Close

All Week 12 work is now complete. Do a final commit to capture the README update and any remaining changes.

```bash
cd rudderly
git add -A
git status   # review what's staged — confirm no .env.local or secrets
git diff --staged | grep -i "RESEND_API_KEY\|SUPABASE_SERVICE_ROLE_KEY\|sk_live\|sk_test"
# ↑ must return nothing — empty output means no secrets staged
git commit -m "feat: week 12 complete — changelog, press kit, feedback, waitlist, metrics baseline, README"
git push origin feature/week12-launch
```

Then open a pull request on GitHub: `feature/week12-launch` → `main`. Wait for GitHub Actions CI to go green, then merge. Vercel will auto-deploy to production.

**Post-merge verification — visit the live URL and confirm:**
- [ ] `/changelog` loads without login
- [ ] `/press` loads with screenshots
- [ ] `/feedback` Tally form renders
- [ ] Waitlist form on homepage → submit test email → green confirmation → row in Supabase `waitlist` table
- [ ] Vercel Analytics recording page views
- [ ] GitHub Actions all green ✅

> **Beta user recruitment** has been moved to the post-Week-18 phase. The product needs UX polish (Week 15), a full template library (Week 17), and security hardening (Week 13–14) before putting it in front of real users. The beta invite email template and `docs/BETA_FEEDBACK.md` are ready and waiting — you'll use them after the public launch. See Week 18 guide for the post-launch outreach plan.

---

## Stretch Tasks

### Stretch 1 — Populate BETA_FEEDBACK.md (post-launch)

> ✅ `docs/BETA_FEEDBACK.md` has already been created as an empty template. No action needed this week.

Once real user feedback starts arriving after the Week 18 public launch, use this Claude Code prompt to synthesise it:

> *"I have [N] feedback responses from my Tally form. Here they are: [paste all responses]. Please: (1) extract every distinct piece of feedback and group by theme, (2) count how many users mentioned each theme, (3) rank themes by frequency, (4) classify each as Bug / UX Confusion / Feature Request / Positive Signal. Output as a structured list I can paste into `docs/BETA_FEEDBACK.md`."*

Then if a P0 bug emerges (multiple users hitting the same issue), ship a hotfix immediately:

```bash
git checkout -b fix/post-launch-[short-description]
# make the fix
git add -A
git commit -m "fix: [description] — reported by multiple users at launch"
git push origin fix/post-launch-[short-description]
# merge to main → auto-deploys to Vercel
```

Reply personally to users who reported it: "Fixed — thanks for catching that."

### Stretch 2 — Write the Post-Build Retrospective

> ✅ `docs/BUILD_RETROSPECTIVE.md` has already been created as an empty template. Fill it in now while the build is fresh.

Writing down what you learned during the build cements it in memory and creates content for future blog posts. Open `docs/BUILD_RETROSPECTIVE.md` and fill in the sections:

```markdown
# Rudderly — Build Retrospective (Weeks 1–12)

## What worked
- [3 things that went faster or better than expected]

## What was harder than expected
- [3 things that took longer or were more complex than planned]

## What I'd do differently
- [2–3 decisions you'd reverse with hindsight]

## Key technical lessons
- [3 specific technical things you now understand deeply that you didn't before]

## What I'm most proud of
- [1–2 things]

## Biggest remaining risks before public launch
- [what could still go wrong in Weeks 13–18]
```

Once filled in, commit it:

```bash
git add docs/BUILD_RETROSPECTIVE.md docs/BETA_FEEDBACK.md
git diff --staged | grep -i "RESEND_API_KEY\|SUPABASE_SERVICE_ROLE_KEY\|sk_live\|sk_test"
# must return nothing
git commit -m "docs: build retrospective and beta feedback template"
git push origin feature/week12-launch
```

---

## 🏁 Sprint Close

Run this at the end of Week 12 before starting Week 13.

```bash
# 1. Confirm everything is merged and main is up to date
git checkout main
git pull origin main
git log --oneline -5   # your week 12 commit should be at the top

# 2. Confirm production is healthy
npx tsc --noEmit       # 0 errors
npm run build          # clean build

# 3. Check Vercel — all 4 new pages live on rudderly.dev
# /changelog · /press · /feedback · waitlist form on homepage

# 4. Create your Week 13 branch
git checkout -b feature/week13-testing
git push -u origin feature/week13-testing
```

Then in Claude Code, run `/sprint-close` to update `CLAUDE.md` — move Week 12 to Completed Work and set Current Focus to Week 13 (Testing & Code Quality).

> **Week 13 preview:** Vitest unit tests, Playwright E2E tests, GitHub Actions CI hardening, and TypeScript strict mode. The goal is a test suite that gives you confidence to ship fast without breaking things.

---

## ✅ Completion Checklist

Complete these before closing Week 12.

- [ ] `/changelog` page live on production URL (entries up to v1.0.0-beta)
- [ ] `/press` page live with screenshots and contact email
- [ ] `/feedback` Tally form embedded and working (test submission confirmed in Tally dashboard)
- [ ] Waitlist form on landing page — new email → 201 green, duplicate → 409 amber, bad email → 400 red
- [ ] `docs/LAUNCH_METRICS.md` committed with today's baseline numbers
- [ ] README.md updated — Rudderly branding, full tech stack, demo GIF placeholder comment
- [ ] All changes merged to `main` via PR and deployed via Vercel CI ✅
- [ ] `git diff --staged | grep -i "API_KEY\|SERVICE_ROLE\|sk_live"` returned empty before commit
- [ ] ✅ `docs/BETA_FEEDBACK.md` created as empty template (ready for post-launch)
- [ ] ✅ `docs/BUILD_RETROSPECTIVE.md` created — fill in while the build is fresh

> **Not on this checklist:** beta user recruitment, Hacker News post, ProductHunt submission, social media, directory submissions. Beta recruitment moves to the post-Week-18 phase — after UX polish (Week 15), templates (Week 17), and security hardening (Weeks 13–14) are complete. The product needs to be finished before real users touch it.

---

## 🧪 Validation Tests

| Group | Test | Expected result |
|---|---|---|
| **Pages** | Visit `/changelog` logged out | All entries visible, newest first, no auth wall |
| **Pages** | Visit `/press` logged out | All sections and screenshots visible, no auth wall |
| **Pages** | Visit `/feedback` logged out | Tally form loads inside the page, no scrollbar |
| **Pages** | Visit `/feedback`, complete and submit the form | Response appears in Tally dashboard within 30 seconds |
| **Waitlist** | Submit a new email on landing page | 201 → green confirmation → row in Supabase `waitlist` table → contact in Resend |
| **Waitlist** | Submit the same email a second time | 409 → amber "Already subscribed" — Resend not called again |
| **Waitlist** | Submit an invalid email (e.g. `notanemail`) | 400 → red error — Zod rejects before Supabase or Resend touched |
| **Repo** | Check GitHub repository settings | Repository is set to **Private** |
| **Repo** | Run `git ls-files .env.local` | Returns empty — file is not tracked in git |
| **CI** | Merge PR to `main` | GitHub Actions shows all jobs green ✅ |
| **Deploy** | Vercel dashboard after merge | Production deployment succeeded — all 4 new pages load on live URL |
| **Metrics** | Open `docs/LAUNCH_METRICS.md` | Baseline numbers filled in with today's Supabase counts and Lighthouse scores |

---

## 📚 Resources

- [Tally](https://tally.so) — free form builder; transparent background embed instructions are in their Help docs
- [Resend Contacts API](https://resend.com/docs/api-reference/contacts/create-contact) — global contacts model (no audienceId required)
- [Resend — Migrating from Audiences to Segments](https://resend.com/docs/dashboard/segments/migrating-from-audiences-to-segments) — explains the model change
- [Vercel Analytics](https://vercel.com/docs/analytics) — track which new pages get traffic
- [Lighthouse](https://developer.chrome.com/docs/lighthouse) — run from Chrome DevTools (F12 → Lighthouse tab) to get Performance, Accessibility, and SEO scores for your baseline

---

*Week 12 of 18 · Rudderly · Phase 4: Production & Pre-Launch · Updated May 2026*
