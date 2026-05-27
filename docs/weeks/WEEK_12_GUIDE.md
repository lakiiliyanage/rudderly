# 🎯 Week 12 — Launch Week

**Phase:** 4 — Production & Launch  
**Dates:** Add your own start date  
**Total time:** 6–8 hrs core · +4–5 hrs stretch  
**Goal:** Rudderly is live on the internet. This week you tell the world. You'll record a demo video, write a Show HN post, submit to ProductHunt and product directories, set up a public feedback form and changelog page, and build a press kit page. By the end of this week you'll have real users, real feedback, and a measurable waitlist. This is the week a project becomes a product.

---

## 📋 Before You Start

Run these commands to confirm your live production deployment is healthy before you invite thousands of people to it.

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
npx tsc --noEmit    # TypeScript compiler — find type errors before your demo video
npm run build       # Full production build — verify it still compiles cleanly
```

> ⚠️ **Do not start recording your demo video until the live site is fully working.** A broken flow in a public demo is the worst possible first impression. Verify every screen you plan to show.

---

## Saturday Session — Hours 1–2: Demo Video & GIF

### Step 1 — Write Your Demo Script

Before recording anything, write a script. A 2-minute demo should cover exactly three things: the problem, the solution, and the key action. Keep the script under 200 words — reading it should take under 90 seconds at normal pace, leaving room for screen transitions.

**Demo script template:**

> *"Most AI tools require coding to set up. Rudderly is different.*
>
> *[Screen: landing page → Sign up]*
>
> *In under two minutes I can build a fully functional AI agent — I just describe what it should do, pick its tools, and publish it.*
>
> *[Screen: 5-step builder → agent created]*
>
> *Anyone can chat with it. No login required on the public share page.*
>
> *[Screen: `/share/[slug]` in incognito tab]*
>
> *That's Rudderly — AI agents for people who have better things to do than write code."*

Ask Claude Code:
> *"Review my demo script for Rudderly. The script is:*
>
> *[paste your script here]*
>
> *Give me feedback on: (1) is the problem clear in the first 10 seconds? (2) is the core value shown, not just told? (3) is there any jargon a non-developer might not understand? (4) is the call-to-action specific (what should someone do after watching)? Keep feedback to bullet points — no rewrite unless I ask."*

### Step 2 — Record with Loom

**Loom** (loom.com) is a free screen recording tool. The free tier records unlimited videos. Create an account if you don't have one.

1. Install the Loom desktop app or use the Chrome extension
2. Set your browser window to **1280 × 800** — this is the standard screencast resolution that looks sharp when embedded
3. In Loom, choose **Screen Only** (no webcam for the first take — less to worry about)
4. Record your script in one take. Two minutes is the target. Restart if you fumble the opening — the first 10 seconds determine whether someone keeps watching
5. After recording, trim the beginning and end in Loom's editor (dead air before you start talking, dead air after you stop)
6. Copy the Loom share link — you'll embed this on the landing page

> 💡 **Figma analogy:** Think of the demo video like a prototype walkthrough. You're not showing every feature — you're showing the happy path that makes someone say "I want that." The same principle applies: show the best flow, not the full spec.

### Step 3 — Export a Demo GIF

A GIF plays automatically in Hacker News comments, README files, and tweet embeds — no click required. Use Loom's export feature or convert a clip manually.

**Option A — Loom export (easiest):**

Download your Loom video as MP4, then convert the key 15–20 seconds to GIF:

```bash
# Install ffmpeg if you don't have it (macOS)
brew install ffmpeg

# Convert a 20-second clip starting at 10 seconds into the video
# -ss 10 = start at 10 seconds | -t 20 = clip duration 20 seconds
# -vf scale=800:-1 = resize to 800px wide, auto-height (keeps proportions)
# -r 10 = 10 frames per second (lower = smaller file size)
ffmpeg -i demo.mp4 -ss 10 -t 20 -vf "scale=800:-1" -r 10 demo.gif
```

> **Term: `ffmpeg`** — A free command-line tool for converting video and audio files. It's the industry standard — used by YouTube, streaming services, and most video processing software under the hood. The flags: `-i` means "input file", `-ss` means "seek to this time", `-t` means "clip this many seconds", `-vf` means "apply this video filter", `-r` means "frames per second".

**GIF size target:** under 5MB. If the file is too large, reduce frames (`-r 8`) or shorten the clip length.

**Option B — Cloudconvert (no terminal):**

Go to [cloudconvert.com](https://cloudconvert.com), upload your MP4, choose GIF as the output format, set width to 800px and FPS to 10, convert and download.

Save the GIF as `public/demo.gif` in your project:

```bash
cp ~/Downloads/demo.gif public/demo.gif
```

---

## Saturday Session — Hours 3–4: Changelog, Press Kit & Feedback Pages

### Step 4 — Build the Changelog Page

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
>    *- v1.0.0 (today): "Public launch — production deployment on Vercel, Sentry monitoring, CI/CD pipeline"*
> *5. Style with Tailwind v4 utility classes. Layout: reverse-chronological (newest first). Each entry: date in muted gray, version badge (e.g. `v1.0.0`), title in bold, bulleted changes list.*
> *6. Add a link to `/changelog` in the main site navigation.*
>
> *Verify: Happy path: visit `/changelog` logged out → all entries visible, newest first, no auth wall | Failure path: typo in `page.tsx` → `npm run build` fails with a TypeScript error pointing to the exact line — fix and rebuild."*

### Step 5 — Build the Press Kit Page

A press kit page (`/press`) gives journalists, bloggers, and directory editors everything they need to write about you. Without one, they either skip you or get details wrong.

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

### Step 6 — Add Screenshots to the Press Kit

Take screenshots of the three key screens and add them to the press kit page.

1. Open your live production URL in Chrome
2. Open DevTools (`Cmd+Option+I`), click the device toolbar icon (`Cmd+Shift+M`), set to **1280 × 800**
3. Take three screenshots:
   - The 5-step agent builder (mid-flow, step 3 or 4 looks best)
   - The chat interface (with a conversation showing tool use)
   - A public share page (clean, shareable URL visible)
4. Save as `public/press/screenshot-builder.png`, `public/press/screenshot-chat.png`, `public/press/screenshot-share.png`

```bash
mkdir -p public/press
# copy screenshots from wherever you saved them
cp ~/Desktop/screenshot-builder.png public/press/
cp ~/Desktop/screenshot-chat.png public/press/
cp ~/Desktop/screenshot-share.png public/press/
```

Ask Claude Code to update the press kit page to use `<Image>` (Next.js image component) instead of placeholder divs for the three screenshots.

### Step 7 — Add the Feedback Form (Tally)

**Tally** (tally.so) is a free form builder. You'll embed a Tally form on a `/feedback` page so users can tell you what they think. Tally forms are free, GDPR-compliant, and embed cleanly with a transparent background.

**Create the Tally form:**

1. Go to [tally.so](https://tally.so) and create a free account
2. Create a new form called "Rudderly Feedback"
3. Add these fields:
   - **Single choice**: "How did you find Rudderly?" — options: Hacker News / ProductHunt / Twitter/X / LinkedIn / Friend / Other
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

## Sunday Session — Hours 5–6: Waitlist & Launch Announcements

### Step 8 — Set Up the Waitlist with Resend Audiences

You set up Resend for transactional email in Week 10. Resend also has **Audiences** — a mailing list feature that lets you collect emails and send newsletters. You'll add a waitlist signup form to the landing page that adds subscribers to a Resend Audience called "Rudderly Waitlist".

> **Term: Resend Audiences** — Resend's mailing list feature. An Audience (`aud_...` ID) is a named contact list. When someone submits their email, you `POST` to `/audiences/[id]/contacts` to add them. You can then send bulk emails to the whole list from the Resend dashboard. This is separate from transactional email (password resets, notifications) — it's for marketing communication.

Ask Claude Code:

> *"Next.js 16.2.4 / React 19 / Tailwind v4 / @supabase/ssr 0.10.2 — proxy.ts, await cookies(), no tailwind.config.js, Publishable key = NEXT_PUBLIC_SUPABASE_ANON_KEY*
>
> *Add a waitlist signup component to the Rudderly landing page using Resend Audiences. Requirements:*
>
> *1. In the Resend dashboard, create a new Audience called "Rudderly Waitlist". Copy the Audience ID (format: `aud_...`). Add it to `.env.local` as `RESEND_AUDIENCE_ID=aud_...` and to Vercel environment variables.*
>
> *2. Create a new API route `src/app/api/waitlist/route.ts`:*
>    *- Method: POST*
>    *- Body: `{ email: string }`*
>    *- Validate the email with Zod (import from `src/lib/env.ts` or create a local schema)*
>    *- Use the Resend Node.js SDK to call `resend.contacts.create({ audienceId: process.env.RESEND_AUDIENCE_ID, email })`*
>    *- Return 201 on success, 409 if the contact already exists (Resend returns a 422 with "already exists" in the message — map this to a 409 `{ error: "Already subscribed" }` response), 400 for invalid email, 500 for any other Resend error*
>    *- Do NOT use `export const dynamic = 'force-dynamic'` here — this is a POST-only route and doesn't need it*
>
> *3. Add a `<WaitlistForm>` Client Component (`'use client'`) to `src/components/waitlist-form.tsx`:*
>    *- Email input + "Join waitlist" button*
>    *- On submit: POST to `/api/waitlist`*
>    *- On 201: show "You're on the list! We'll be in touch." in green*
>    *- On 409: show "You're already subscribed." in amber*
>    *- On error: show "Something went wrong — try again." in red*
>    *- Disable the button and show a spinner while submitting (prevents double-submit)*
>
> *4. Add `<WaitlistForm />` to the landing page (`src/app/page.tsx`) below the hero CTA button.*
>
> *Verify: Happy path: enter a new email → 201 response → green confirmation message → contact appears in Resend Audience dashboard | Failure path: same email submitted twice → 409 → amber "already subscribed" message (not a generic error) | Failure path: invalid email format (e.g. "notanemail") → Zod validation rejects it before hitting Resend → 400 response → red error message.*
>
> *Do not mark complete until all three paths are tested."*

### Step 9 — Commit and Deploy

Before announcing anything, push everything to production and confirm it's live.

```bash
cd rudderly
git add -A
git status   # review what's staged — confirm no .env.local or secrets included
git commit -m "feat: launch pages — changelog, press kit, feedback form, waitlist signup"
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

**Commit checkpoint** — do not proceed to Step 10 until:
- [ ] `git push` triggers a green CI run on GitHub Actions
- [ ] Vercel deployment succeeds (no error in the build log)
- [ ] All four new pages load on the live URL
- [ ] Test waitlist signup appears in Resend dashboard

---

## Sunday Session — Hours 7–8: Hacker News & ProductHunt

### Step 10 — Update Your README

Your GitHub repository README is often the first thing a technical person reads when evaluating a product. Even though Rudderly is a private repository at launch, the README should be polished — you may share it selectively or make it public later.

> **Note: This is a private repository.** Do not commit `.env.example` or any file that references your production secrets. Do not make the repository public without a full secrets audit first.

Ask Claude Code:

> *"Write a README.md for Rudderly — a visual AI agent builder for non-developers. Include:*
>
> *1. **Hero section**: Product name, one-line description ("Build AI agents without code. Deploy in minutes."), and a reference to the demo GIF (`![Rudderly demo](public/demo.gif)` — this will be visible when the repo is shared)*
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

### Step 11 — Write the Hacker News Show HN Post

**Show HN** is a Hacker News section for sharing things you've built. A good Show HN post gets hundreds of upvotes, thousands of visitors, and real user feedback within hours of posting. The format is rigid: title must start with "Show HN:", the body is a short explanation of what you built and why.

> **Term: Hacker News** — A technology news and discussion site run by Y Combinator. The audience is developers, founders, and technically sophisticated readers. Posts are upvoted by the community; high-upvote posts reach the front page and can drive 5,000–50,000 visitors in a single day. Show HN posts are specifically for things you've built — the community expects a working product, not a concept.

**HN post title:**
```
Show HN: Rudderly – Build and deploy AI agents without writing code
```

**HN post body (paste this into the text field):**
```
I'm a UX designer who kept running into the same problem: every AI agent tool 
requires you to understand APIs, write prompts in YAML, or set up infrastructure.

So I built Rudderly — a visual builder that lets anyone create a fully functional 
AI agent in under 5 minutes. You describe what the agent should do, pick tools 
(web search, calculator, etc.), and publish it. Anyone can chat with it via a 
public share link, no account required.

Stack: Next.js + Claude API (Anthropic) + Supabase + Stripe + Vercel

Live: [your-production-url]

The thing I'm most curious about: which use cases are people actually trying to 
solve with agents? Most of my early assumptions were wrong.
```

**Timing matters:** Post between **8–10am EST on a weekday** (Tuesday or Wednesday). This is when the HN audience is most active. Posts that reach 10+ upvotes in the first 30 minutes tend to front-page; posts that sit idle for an hour rarely recover.

**The first comment is yours to write.** Immediately after posting, add a comment with more technical detail:

```
Technical notes for the curious:

- The agent builder is a 5-step wizard that generates a system prompt and tool 
  configuration stored in Supabase
- Tool execution runs in an agentic loop — the Claude API can call tools 
  multiple times before returning a final response
- Streaming uses the Vercel AI SDK's ReadableStream; tool calls stream 
  incrementally so you see partial results in real time
- Rate limiting is handled by Upstash Redis (sliding window, 10 req/min free tier)
- The whole thing is deployed on Vercel with GitHub Actions CI

Happy to answer questions about any of the implementation choices.
```

> ⚠️ **Do not ask for upvotes.** HN has strict rules against vote manipulation. Don't post your HN link in Slack groups, Discord servers, or anywhere asking people to upvote. It's against the rules and can get your account flagged. Share the link — let people upvote because they find it interesting.

### Step 12 — ProductHunt Launch

**ProductHunt** is a daily leaderboard of new products. The top 5 products each day get emailed to 500,000+ subscribers. A #1 Product of the Day badge is a credible signal that drives signups for months.

> **Term: ProductHunt** — A community platform where makers post new products and the community upvotes their favourites. Products compete in a 24-hour window (midnight to midnight PST). The top 5 products of each day are featured in a newsletter.

**ProductHunt post requirements:**

| Field | Rudderly value |
|---|---|
| **Name** | Rudderly |
| **Tagline** | Build AI agents without writing a single line of code (≤60 chars: ✅ 53 chars) |
| **Description** | Rudderly is a visual AI agent builder for non-developers. Create, configure, and deploy AI agents that can search the web, run calculations, and answer questions — in under 5 minutes. No coding required. (≤260 chars: ✅) |
| **Thumbnail** | 240×240px logo — export from your press kit screenshot or Canva |
| **Gallery** | 3–5 screenshots from your press kit (builder, chat, share page) |
| **Video** | Paste your Loom share link |
| **Website** | Your production URL |
| **Topics** | Artificial Intelligence, Productivity, No-Code |

**Scheduling tips:**
- Schedule the post for **12:01am PST on a Tuesday or Wednesday** — this gives the full 24 hours with maximum early-morning traffic
- ProductHunt lets you schedule up to 7 days in advance — submit it the week before so it's reviewed and approved before launch day
- On launch day, respond to every comment within the first 2 hours — early comment velocity matters for ranking

**Maker comment to post immediately after your product goes live:**

```
Hey PH! 👋

I'm Lakii — UX designer turned builder. I made Rudderly because I kept hitting 
the same wall: every AI agent tool assumed you could code.

Rudderly is what I wanted to exist: a visual builder where you describe what 
your agent should do, pick its tools, and publish it in minutes.

Would love to hear: what kind of agent would YOU build first?
```

---

## Stretch Tasks

### Stretch 1 — Social Announcements

**Twitter/X thread:**

```
Tweet 1:
After 3 months of building, Rudderly is live.

Build and deploy AI agents without writing code.

[your-production-url]

🧵 Here's what's inside:

Tweet 2:
The problem: every AI agent tool requires you to know what an API is, 
write YAML config files, or manage infrastructure.

I'm a UX designer. I wanted to use agents, not configure them.

Tweet 3:
So I built a 5-step visual builder.

Describe what your agent does → pick tools → set limits → publish.

Anyone can chat with it via a public link. No account required.

[screenshot of the builder]

Tweet 4:
Under the hood:
• Next.js + Claude API (Anthropic)
• Supabase for auth + database  
• Stripe for payments
• Vercel for deployment

Free tier: 3 agents, 100 messages/month
Pro: $12/month, unlimited

Tweet 5:
If you've ever wanted an AI that does [specific thing] without 
learning to code — this is for you.

Try it: [your-production-url]
Feedback form: [your-production-url]/feedback
```

**LinkedIn post:**

```
I've spent the last 3 months building something I wanted to exist.

Rudderly is a visual AI agent builder for non-developers.

The insight: AI agent tools are built by developers, for developers. 
They assume you know what an API endpoint is. They make you write 
configuration files. They require infrastructure knowledge.

I'm a UX designer. I think the people who most need AI agents — 
small business owners, solo operators, non-technical founders — 
are the ones being left out of the conversation.

Rudderly changes that. Build an AI agent in 5 steps. Publish it. 
Share the link. Done.

It's live: [your-production-url]

If you try it and have feedback, there's a form at [url]/feedback.
```

### Stretch 2 — Submit to Directories

Submit Rudderly to these directories this week. Each takes 5–10 minutes. Collectively they drive consistent long-tail traffic and improve SEO.

| Directory | URL | Notes |
|---|---|---|
| **There's An AI For That** | theresanaiforthat.com/submit | Most popular AI directory — high-traffic |
| **Futurepedia** | futurepedia.io/submit-tool | Large AI tool database |
| **AI Tools Directory** | aitoolsdirectory.com | Free listing |
| **TopAI.tools** | topai.tools/submit | Growing directory |
| **Toolify** | toolify.ai/submit | Another AI aggregator |
| **BetaList** | betalist.com | Startup launch directory — good for early adopters |
| **Launching Next** | launchingnext.com | Startup submissions |

**Directory submission template** (adapt for each):

- **Name:** Rudderly
- **Short description (50 chars):** AI agent builder for non-developers
- **Long description (200 chars):** Rudderly lets anyone build, configure, and deploy AI agents without writing code. Create agents that search the web, run calculations, and answer questions — in under 5 minutes.
- **Category:** AI Tools / No-Code / Productivity
- **Website:** your production URL
- **Screenshot:** use your press kit screenshot

### Stretch 3 — Write a Post-Mortem

Writing down what you learned during the build cements it in memory and creates content for future blog posts. Create a `docs/POST_MORTEM.md` file:

```markdown
# Rudderly — Build Post-Mortem

## What worked
- [3 things that went faster or better than expected]

## What was harder than expected
- [3 things that took longer or were more complex than planned]

## What I'd do differently
- [2–3 decisions you'd reverse with hindsight]

## Key technical lessons
- [3 specific technical things you now understand deeply that you didn't before]

## What's next
- [The top 3 features users have already asked for]
```

---

## ✅ Completion Checklist

Complete these before closing Week 12.

- [ ] Demo video recorded with Loom (≤2 minutes, starts with the problem)
- [ ] Demo GIF exported and saved to `public/demo.gif`
- [ ] `/changelog` page live on production URL
- [ ] `/press` page live with screenshots and contact email
- [ ] `/feedback` Tally form embedded and working (test submission confirmed in Tally dashboard)
- [ ] Waitlist form on landing page (test email confirmed in Resend Audience dashboard)
- [ ] All changes pushed to `main` and deployed via Vercel CI
- [ ] `git diff --staged | grep -i "API_KEY\|SERVICE_ROLE\|sk_live"` returns empty before commit
- [ ] README.md updated with demo GIF and tech stack
- [ ] Show HN post live on Hacker News (posted 8–10am EST)
- [ ] First HN comment with technical detail posted within 5 minutes of going live
- [ ] ProductHunt post scheduled for 12:01am PST (or already live)
- [ ] At least 3 directory submissions completed

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
| **Demo** | Watch the demo video from the Loom link | Video starts within 3 seconds, audio is clear, no dead air at start or end |
| **HN post** | Check HN submission page | Post live under "Show HN" with your first comment visible |

---

## 📚 Resources

- [Loom](https://loom.com) — free screen recording; no time limit on free tier for screen-only recordings
- [Cloudconvert](https://cloudconvert.com) — browser-based video to GIF conversion (no terminal required)
- [ffmpeg documentation](https://ffmpeg.org/documentation.html) — full reference for the video conversion commands used in Step 3
- [Tally](https://tally.so) — free form builder; transparent background embed instructions are in their Help docs
- [Resend Audiences documentation](https://resend.com/docs/api-reference/audiences/create-audience) — API reference for creating contacts
- [Hacker News Show HN guidelines](https://news.ycombinator.com/showhn.html) — official rules and etiquette
- [ProductHunt ship checklist](https://www.producthunt.com/posts/how-to-launch-on-product-hunt) — official maker guide
- [There's An AI For That](https://theresanaiforthat.com) — highest-traffic AI directory for submissions
- [Resend Audiences overview](https://resend.com/docs/dashboard/audiences/introduction) — how the mailing list feature works
- [Vercel Analytics](https://vercel.com/docs/analytics) — track which new pages get traffic after launch
- [Shields.io](https://shields.io) — generate README badges (Vercel deploy status, Supabase, etc.) if you want to add visual indicators

---

*Week 12 of 14 · Rudderly · Phase 4: Production & Launch · Updated May 2026*
