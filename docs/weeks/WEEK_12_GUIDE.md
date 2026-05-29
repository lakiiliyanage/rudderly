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

## Sunday Session — Hours 6–7: Closed Beta Recruitment

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

### Step 9 — Recruit 10–20 Closed Beta Users

The closed beta is the most important thing you do this week. Real users finding real bugs is worth more than any amount of internal testing. A closed beta of 10–20 people gives you enough signal to fix the most critical issues before the public launch — without the pressure of thousands of people watching.

**Who to invite:**

Choose people who fit one or more of these criteria:
- Non-technical (designers, marketers, small business owners, freelancers) — your actual target users
- Will actually try it and give you honest feedback, not just encouraging words
- Represent diverse use cases (someone who wants a customer support bot, someone who wants a research tool, someone who wants a content writer)
- Have enough time to spend 20 minutes building an agent and writing feedback

**Avoid:** other developers (their feedback will be "make it more technical"), people who will just say "looks great!" to be kind, people who won't actually use it.

**The invite email (send via Resend or Gmail — not a mass email, personal messages):**

```
Subject: Want early access to something I built?

Hey [Name],

I've been building a side project for the last 3 months — Rudderly, a visual AI agent builder for non-developers. The idea: you describe what an agent should do, pick its tools, and publish it in minutes. No code required.

I'm doing a private beta before the public launch and I'd love your honest take. Not looking for encouragement — looking for what breaks or confuses.

Live at: [your-production-url]
Feedback form: [your-production-url]/feedback

If you try it, just fill out the feedback form and let me know what you think. Takes about 20 minutes to build your first agent.

Thanks,
[Your name]
```

**Personal message, not a template blast.** Change the opening line for each person so it feels like you actually thought about them specifically. People can smell mass emails.

**Target:** 10–20 beta users who actually try the product. More invites than that becomes noise at this stage — you can't act on 200 pieces of feedback before Week 18.

---

## Stretch Tasks

### Stretch 1 — Create BETA_FEEDBACK.md

As beta responses come in from Tally, create a synthesis document. Don't wait until all responses are in — start synthesising after the first 3–5.

Create `docs/BETA_FEEDBACK.md`:

```markdown
# Rudderly — Beta Feedback Synthesis

**Beta period:** [start date] → [end date]
**Total responses:** [n]

## Raw Themes (add as feedback arrives)

### Bugs / Things That Broke
- [ ] [description of bug — include which user reported it]

### Confusion Points (UX Issues)
- [ ] [what confused them and where in the flow]

### Feature Requests
- [ ] [what they wanted that didn't exist]

### What Worked Well
- [positive signals worth noting]

## Synthesised Priorities (fill in after 10+ responses)

### P0 — Fix Before Public Launch
1. 
2. 
3. 

### P1 — Address in Weeks 13–17
1. 
2. 

### P2 — Post-Launch Backlog
1. 

## Representative Quotes
> "..." — [beta user, anonymous]
```

Ask Claude Code to help you synthesise once you have 5+ responses:
> *"I have [N] beta feedback responses from my Tally form. Here they are: [paste all responses]. Please: (1) extract every distinct piece of feedback and group by theme, (2) count how many users mentioned each theme, (3) rank themes by frequency, (4) classify each as Bug / UX Confusion / Feature Request / Positive Signal. Output as a structured list I can paste into my BETA_FEEDBACK.md."*

### Stretch 2 — Fix the Top Beta Issue

If a P0 issue emerges from early beta responses (multiple users hitting the same bug or confusion), fix it before continuing. Ship a hotfix:

```bash
git checkout -b fix/beta-issue-[short-description]
# make the fix
git add -A
git commit -m "fix: [description of what you fixed based on beta feedback]"
git push origin fix/beta-issue-[short-description]
# merge to main → auto-deploys to Vercel
```

Reply personally to the beta users who reported it: "Fixed — thanks for catching that." This kind of responsiveness builds the kind of loyalty money can't buy.

### Stretch 3 — Write the Post-Build Retrospective

Writing down what you learned during the build cements it in memory and creates content for future blog posts. Create `docs/BUILD_RETROSPECTIVE.md`:

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

---

## ✅ Completion Checklist

Complete these before closing Week 12.

- [ ] `/changelog` page live on production URL (entries up to v1.0.0-beta)
- [ ] `/press` page live with screenshots and contact email
- [ ] `/feedback` Tally form embedded and working (test submission confirmed in Tally dashboard)
- [ ] Waitlist form on landing page (test email confirmed in Resend Audience dashboard)
- [ ] `docs/LAUNCH_METRICS.md` committed with today's baseline numbers
- [ ] All changes pushed to `main` and deployed via Vercel CI
- [ ] `git diff --staged | grep -i "API_KEY\|SERVICE_ROLE\|sk_live"` returns empty before commit
- [ ] README.md updated with tech stack and placeholder for demo GIF (added Week 16)
- [ ] 10–20 personal beta invite emails sent
- [ ] At least 3 beta users have tried the product and submitted feedback
- [ ] `docs/BETA_FEEDBACK.md` created and first entries added

> **Not on this checklist:** Hacker News post, ProductHunt submission, social media announcements, directory submissions. Those happen in Week 18 — after security testing (Week 13), payment hardening (Week 14), UX polish (Week 15), and launch content preparation (Week 16). Doing them now would waste the momentum on an unfinished product.

---

## 🧪 Validation Tests

| Group | Test | Expected result |
|---|---|---|
| **Pages** | Visit `/changelog` logged out | All entries visible, newest first, no auth wall |
| **Pages** | Visit `/press` logged out | All sections and screenshots visible, no auth wall |
| **Pages** | Visit `/feedback` logged out | Tally form loads inside the page, no scrollbar |
| **Pages** | Visit `/feedback`, complete and submit the form | Response appears in Tally dashboard within 30 seconds |
| **Waitlist** | Submit a new email on landing page | 201 response → green confirmation message → contact in Resend Audience |
| **Waitlist** | Submit the same email a second time | 409 response → amber "Already subscribed" message (not a generic error) |
| **Waitlist** | Submit an invalid email (e.g. `notanemail`) | 400 response → red error message before hitting Resend |
| **Waitlist** | Submit with `RESEND_AUDIENCE_ID` env var missing | 500 error in Vercel logs — not a silent success |
| **Repo** | Check GitHub repository settings | Repository is set to **Private** |
| **Repo** | Check `.gitignore` includes `.env.local` | `git ls-files .env.local` returns empty — file is not tracked |
| **CI** | Push to `main` | GitHub Actions shows all 4 jobs green ✅ |
| **Deploy** | Vercel dashboard after push | Deployment succeeded — no build errors |
| **Beta** | Send beta invite → user signs up and creates an agent | Agent appears in production Supabase, feedback appears in Tally dashboard |
| **Metrics** | Open `docs/LAUNCH_METRICS.md` | Baseline numbers filled in with today's Supabase counts and Lighthouse scores |

---

## 📚 Resources

- [Tally](https://tally.so) — free form builder; transparent background embed instructions are in their Help docs
- [Resend Audiences documentation](https://resend.com/docs/api-reference/audiences/create-audience) — API reference for creating contacts
- [Resend Audiences overview](https://resend.com/docs/dashboard/audiences/introduction) — how the mailing list feature works
- [Vercel Analytics](https://vercel.com/docs/analytics) — track which new pages get traffic during the beta
- [Lighthouse](https://developer.chrome.com/docs/lighthouse) — run from Chrome DevTools (F12 → Lighthouse tab) to get Performance, Accessibility, and SEO scores for your baseline

---

*Week 12 of 18 · Rudderly · Phase 4: Production & Pre-Launch · Updated May 2026*
