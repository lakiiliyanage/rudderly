# 🚀 Week 12 — Launch Week

**Phase:** 4 — Production & Launch  
**Dates:** Add your own start date  
**Total time:** 6–8 hrs core · +4–5 hrs stretch  
**Goal:** AgentForge is live at a real URL, it takes payments, and it's been smoke-tested end to end. This week you stop building and start launching. By the end of the week you'll have recorded a 3-minute demo video, written and published a Hacker News "Show HN" post, posted a Twitter/X thread and LinkedIn announcement, submitted to three product directories, and built the three pages (changelog, press kit, feedback) that make a product feel like a professional business — not a side project. You'll also set up a waitlist so you can email everyone who discovers you before they see everything you're building next. You are now an AI founder.

---

## 📋 Before You Start

Run these commands to confirm everything is healthy before your launch week:

```bash
cd agentforge
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and run a quick smoke test:

1. **Log in** — Supabase auth still working
2. **Create and chat with an agent** — core feature still working post-Week 11
3. **Check the live Vercel URL** — confirm it's still up (test in incognito)
4. **Stripe checkout** — run a test checkout on the live URL with test card `4242 4242 4242 4242`
5. **CI is green** — check the GitHub Actions tab for your last commit — all checks ✅

Then run the full check suite:

```bash
npx tsc --noEmit    # TypeScript type check — exits cleanly with no errors
npm run build       # Full production build — the same build Vercel runs
npm test            # Vitest unit tests (skip if not set up yet — introduced in Week 13)
```

> ⚠️ **Do not start distributing until `npm run build` passes cleanly and the live URL works end to end.** A broken product on launch day is worse than not launching. Fix anything broken before proceeding to Step 1.

If anything is broken from Weeks 1–11, paste the error into Claude Code before starting: *"Before I begin Week 12, my [feature] is broken — here's the error: [paste error]. Fix this first."*

---

## 🧠 Key Concepts for This Week

Read this table before writing anything. These mental models will make the launch process feel like a deliberate strategy rather than a series of random social media posts.

| Concept | What it is | Design analogy |
|---|---|---|
| **Show HN** | A post format on Hacker News (the tech community's most-read discussion board, run by Y Combinator — the startup accelerator behind Airbnb, Dropbox, and Stripe). "Show HN" posts let founders share what they built. One front-page hit drives thousands of technically-savvy visitors in 24 hours | Like sharing your work to the Figma Community — a dedicated format for showing what you made to a community that gives specific, honest feedback |
| **ProductHunt** | A platform where new tech products are submitted daily and upvoted by the community. You "schedule a launch" for a specific date; the community votes throughout launch day. Front-page visibility drives thousands of signups | Like winning "Design of the Day" on the Figma Community — a moment of high visibility that signals quality to a wide audience |
| **Waitlist / Audience** | A list of email addresses from people interested in your product. Collected via a signup form and stored in Resend Audiences (Resend's mailing list feature — separate from transactional emails, built for broadcasting to subscribers). Lets you announce v2, pricing changes, and new features to people who are already warm to the product | Like maintaining a client list — people who've engaged before are far more likely to respond to future outreach than cold contacts |
| **Demo video** | A short screen recording (2–3 minutes) showing your product in action — the fastest way to communicate value to someone who's never used it. A good demo converts better than any amount of text | Like a Figma prototype walkthrough — you narrate the user flow so viewers understand the intent, not just what the screens look like in isolation |
| **Loom** | A free screen recording tool (loom.com) that creates a shareable URL instantly — no editing software required. You record your screen, it uploads automatically, you share the link | Like Figma's prototype share link — one click creates something anyone can watch without needing an account |
| **Changelog** | A public page in your product listing every feature added, bug fixed, or change made — sorted most-recent-first with dates. Loyal users check it to see what's new. Investors use it to gauge your shipping velocity | Like Figma's version history — except it's curated and written for users, not for your own reference |
| **Press kit** | A single page with everything a journalist, blogger, or directory editor needs to write about your product: logo files, screenshots, one-liner description, founder bio, tech stack, contact email | Like a Figma brand guidelines file you share with collaborators — all approved assets and messaging in one place so others can represent your product correctly |
| **Social proof** | Evidence that other people trust and use your product: GitHub stars, user count, company logos, testimonials, press mentions | Like a Figma community file's "duplicate count" — the number tells new visitors whether to trust it before they even open it |
| **Open-source launch** | Releasing your codebase publicly on GitHub simultaneously with the product launch. Different from just deploying the app — you're giving developers the editable source code, not just the output | Like making a Figma component publicly available in the Community vs. just sharing a view-only prototype link — you're giving people the source to fork and build on |
| **Tally.so** | A free form builder (similar to Typeform but simpler) that embeds inside your app as an iframe (an HTML element that loads one webpage inside another — like a window within a page). Used for structured user feedback: "What do you love? What's broken? What's missing?" | Like Figma's feedback plugin — structured input captured inside the context where users are already working |
| **Launch timing** | The Hacker News "Show HN" front page algorithm rewards early engagement. Posting between 8–10am EST on a weekday maximises initial visibility — this is when the most HN users are online. The first 2 hours determine whether you stay on the front page | Like Figma's community feature picks — the timing of submission affects discovery even before quality does |
| **Post-mortem** | A written reflection after a launch capturing: what went well, what broke, what you'd do differently, and what comes next. A launch post-mortem creates institutional memory for yourself and is impressive to include in your GitHub repo for contributors | Like a design retrospective after a project closes — the goal is to extract the learning, not assign blame |
| **v2 planning** | Deciding what goes into the next major version based purely on user feedback — not on what you assumed users would want before they existed. The discipline of waiting for real feedback before planning v2 is what separates products that grow from products that stagnate | Like iterating on a Figma prototype after user testing — the actual sessions reveal what to fix, not the spec written before users ever saw it |

---

## 🔐 HTTP Status Codes Reference

New codes introduced this week for the newsletter and feedback routes.

| Code | Name | Meaning | When to use |
|------|------|---------|-------------|
| 200 | OK | Request succeeded | Generic success |
| 201 | Created | New resource created | Waitlist email successfully added |
| 400 | Bad Request | Client sent malformed/incomplete data | Missing email, invalid email format |
| 401 | Unauthorised | Not logged in | Admin-only analytics routes |
| 409 | Conflict | Resource already exists | Email already on the waitlist |
| 500 | Internal Server Error | Server-side failure | Resend API call failed, Supabase error |

---

## 🌐 HTTP Request Types Reference

| Request type | Intention | Real-world analogy | When used this week |
|---|---|---|---|
| GET | "Give me data" | Reading a menu | Loading changelog, press kit, feedback pages |
| POST | "Here is new data, store it" | Placing an order | Signing up for the waitlist |

---

## ⚙️ Session 1 — Saturday (Hours 1–2): Build the Launch Pages

### Step 1 — Build the Public Changelog Page

The changelog is the first thing sophisticated users and investors check after signing up. It answers "how fast are they shipping?" A well-written changelog signals that there's an active team behind the product.

Ask Claude Code:
> *"Using Next.js 16.2.4 App Router, React 19, Tailwind v4 (no `tailwind.config.js` — styles in `globals.css` via `@theme`). Build `src/app/changelog/page.tsx` — a public changelog page (no auth required) listing every major feature shipped across the 12 weeks of AgentForge's development.*
>
> *Content structure — each entry has:*
> - *A version number (`v0.1` through `v0.12`)*
> - *A badge: `NEW` (green), `IMPROVEMENT` (blue), or `FIX` (orange)*
> - *A headline (one line)*
> - *2–3 bullet points of what specifically was added or changed*
>
> *Use this content for the entries (newest first):*
> - *v0.12 — Week 12: Public launch — Hacker News "Show HN", ProductHunt, open-source release; changelog, press kit, and feedback pages; waitlist newsletter*
> - *v0.11 — Week 11: Production deploy to Vercel, Sentry error monitoring, GitHub Actions CI pipeline, full production smoke test*
> - *v0.10 — Week 10: Stripe Checkout freemium model (Free / Pro / Enterprise tiers), Upstash rate limiting, prompt injection defence, full security audit*
> - *v0.9 — Week 9: Conversation persistence — sidebar history, auto-generated titles, `?c=` routing; public share pages with auto-slug, Open Graph previews, agent cloning, view counter*
> - *v0.8 — Week 8: Multi-turn agentic tool loop — web search, calculator, date/time, document reader, word counter; SSE streaming with per-tool thinking indicators; tool usage logging*
> - *v0.7 — Week 7: 5-step visual agent builder (shadcn/ui components), Framer Motion step transitions, password reset flow, mobile-responsive layout, auto-save to localStorage*
> - *v0.6 — Week 6: Claude API streaming chat, system prompt engineering from agent config, context window management, AbortController cancel, Zod env validation*
> - *v0.5 — Week 5: Full CRUD for agents, Zod form validation, loading skeletons, optimistic delete, reusable AgentCard component*
> - *v0.4 — Week 4: Supabase authentication (email/password), Row Level Security on all tables, user profile page, SQL fundamentals*
> - *v0.3 — Week 3: Next.js App Router scaffold, Navbar, Footer, landing page with hero + features, component architecture, environment variables*
> - *v0.2 — Week 2: JavaScript, TypeScript, React components with state, Tailwind CSS fundamentals*
> - *v0.1 — Week 1: Development environment (VS Code, Node.js, Claude Code CLI), first GitHub push*
>
> *Design requirements:*
> - *Timeline layout: entries flow top-to-bottom (newest first), each entry is a card with a subtle left border in the badge colour*
> - *Page header shows: "Changelog" heading, subtitle "What's new in AgentForge", and a link to the GitHub repo*
> - *Add SEO metadata: `export const metadata = { title: 'Changelog — AgentForge', description: 'AgentForge release history — what\'s new, improved, and fixed.' }`*
> - *Add a link to `/changelog` in the site footer*
>
> *After building, verify by testing:*
> - *Happy path: navigate to `/changelog` without logging in → all 12 entries render, newest (v0.12) first → footer link to `/changelog` visible on every page*
> - *Failure path: disable JavaScript in Chrome DevTools (Settings → Debugger → Disable JavaScript) → page still renders — this confirms it's server-rendered (HTML generated on the server before being sent to the browser) and not dependent on client-side JavaScript to display content*
> *Do not mark complete until both pass."*

---

### Step 2 — Build the Press Kit Page

A press kit removes friction for journalists, bloggers, and directory editors. Without one, they either skip you or write something inaccurate. With one, they have everything they need to represent your product correctly.

Ask Claude Code:
> *"Build `src/app/press/page.tsx` — a public press kit page (no auth required). This is what journalists and directory editors look at when they want to write about AgentForge.*
>
> *Sections to include:*
>
> *1. Header: "Press Kit" heading, subtitle "Everything you need to write about AgentForge.", last-updated date.*
>
> *2. One-liner descriptions (three versions for different contexts):*
>    - *Short (≤ 10 words): "Build AI agents without writing code."*
>    - *Medium (1 sentence): "AgentForge is an open-source visual builder that lets non-technical users create, configure, and deploy Claude-powered AI agents in minutes."*
>    - *Long (1 paragraph): "AgentForge is an open-source, no-code AI agent builder designed for designers, marketers, and founders who want the power of AI automation without the technical barrier of writing code. Built on Next.js, Supabase, and Anthropic's Claude API, AgentForge lets users visually configure agent personalities, enable real tools (web search, calculator, document reader), set usage limits, and deploy shareable agents — all through a polished 5-step interface. Free tier available. Pro plan at $12/month for unlimited agents and messages."*
>
> *3. Logo section: Display the AgentForge logotype (the text logo from the Navbar) in both dark and light variants. Add a note: "Use on dark backgrounds: [dark variant]. Use on light backgrounds: [light variant]. Do not alter the logo typography, colours, or proportions." Add download buttons that download each variant as SVG using the HTML `download` attribute on an anchor tag (the `download` attribute tells the browser to save the file rather than navigate to it).*
>
> *4. Screenshots: A 2×2 grid of placeholder screenshot cards — label each: "Dashboard", "Agent Builder (Step 3)", "Chat Interface", "Public Share Page". Each card is a rounded grey placeholder with the label centred and a note: "Screenshots available in the GitHub repo `/public/screenshots/` directory."*
>
> *5. Tech stack: a clean table showing: Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic Claude API · Stripe · Vercel.*
>
> *6. Founder: Name: Lakii Liyanage · Role: Founder & UX Designer · Background: UX designer who built AgentForge over 12 weeks while learning to code with Claude Code. · Contact: liyanage.lakii@gmail.com*
>
> *7. Links section: Live product URL · GitHub repo · Twitter/X*
>
> *8. Usage rights: "Logo files and screenshots may be used for editorial coverage of AgentForge. For other uses, contact liyanage.lakii@gmail.com."*
>
> *Add a link to `/press` in the site footer.*
>
> *After building, verify by testing:*
> - *Happy path: navigate to `/press` without logging in → all 8 sections render → click a logo download button → file saves to disk (browser download dialog appears rather than navigating to a new page)*
> - *Failure path: open the page on mobile (Chrome DevTools → Toggle device toolbar, or your actual phone via the live Vercel URL) → page is fully readable — no horizontal overflow (content spilling beyond the viewport width), no tiny unreadable text*
> *Do not mark complete until both pass."*

---

### Step 3 — Build the Feedback Page

Structured feedback from real users is more valuable than any assumption about what to build next. This page collects it at the moment when users are most willing to share — right after they've tried the product.

Ask Claude Code:
> *"Build `src/app/feedback/page.tsx` — a public feedback page (no auth required) that embeds a Tally.so form.*
>
> *First, go to tally.so and create a free account. Create a new form called 'AgentForge Feedback' with these fields:*
> - *Multiple choice: 'How did you find AgentForge?' (Hacker News / ProductHunt / Twitter / Google / Friend / Other)*
> - *Rating scale 1–5: 'How would you rate your first experience?'*
> - *Open text: 'What do you love about AgentForge?'*
> - *Open text: 'What's broken or confusing?'*
> - *Open text: 'What feature would you most like to see next?'*
> - *Email (optional): 'Leave your email if you'd like us to follow up'*
>
> *In Tally, click Share → Embed → copy the embed URL (format: `https://tally.so/embed/[form-id]?...`). Paste it where marked below.*
>
> *Build the page:*
> ```typescript
> // src/app/feedback/page.tsx
> export const metadata = {
>   title: 'Feedback — AgentForge',
>   description: "Help us build the right thing. Tell us what you love, what's broken, and what you want next.",
> }
>
> export default function FeedbackPage() {
>   return (
>     <main className="min-h-screen py-16 px-4">
>       <div className="max-w-2xl mx-auto">
>         <h1 className="text-3xl font-bold mb-2">Share your feedback</h1>
>         <p className="text-sm mb-8 opacity-70">
>           You're talking directly to the founder. Everything you write gets read.
>         </p>
>         <iframe
>           src="https://tally.so/embed/[YOUR-FORM-ID]?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
>           width="100%"
>           style={{ border: 'none', minHeight: '600px' }}
>           title="AgentForge feedback form"
>         />
>       </div>
>     </main>
>   )
> }
> ```
>
> *Explain the iframe query params:*
> - *`iframe` — an HTML element that loads a separate webpage inside the current page, like a window within a window. The Tally form lives on Tally's servers; your page shows a window into it*
> - *`transparentBackground=1` — makes the iframe background transparent so it blends with your page's background colour*
> - *`dynamicHeight=1` — Tally automatically resizes the iframe height as the user moves through questions, preventing a scrolling box-within-a-box*
> - *`hideTitle=1` — hides Tally's own form title since you've already added a page heading above it*
>
> *Add a link to `/feedback` in the site footer.*
>
> *After building, verify by testing:*
> - *Happy path: navigate to `/feedback` → Tally form loads within the page → fill out and submit a test response → check Tally dashboard → submission appears*
> - *Failure path: navigate to `/feedback` with network throttled to Offline mode (Chrome DevTools → Network → Offline) → the page frame renders (heading and description) but the iframe shows a fallback — the main page structure does not crash when the embedded form is unavailable*
> *Do not mark complete until both pass."*

---

### ✅ Before You Commit — Launch Pages

All of the following must pass before committing. Ask Claude Code to run them if you haven't already:

| Test | Expected result |
|---|---|
| Navigate to `/changelog` without logging in | All 12 entries render, v0.12 at the top |
| `/changelog` with JavaScript disabled in DevTools | Page still renders — server-rendered, not client-only |
| Navigate to `/press` without logging in | All 8 sections render |
| `/press` on mobile viewport (375px) | No horizontal overflow; all content readable |
| Click a logo download button on `/press` | File saves to disk — download dialog appears |
| Navigate to `/feedback` | Tally form loads inside the page |
| Submit a test response in Tally | Submission appears in Tally dashboard |
| Footer on any page | Links to `/changelog`, `/press`, `/feedback` all present and working |
| `npx tsc --noEmit` | Zero TypeScript errors |

Do not commit until every row passes.

---

### 💾 Commit Checkpoint — Launch Pages Complete

Three professional launch pages are live. The product looks like a business, not a student project.

```bash
git add -A
git commit -m "feat: changelog, press kit, and feedback pages — launch infrastructure complete"
```

---

## ⚙️ Session 2 — Saturday (Hours 3–4): Newsletter + Demo Video

### Step 4 — Set Up the Waitlist with Resend Audiences

Resend Audiences is Resend's mailing list feature — separate from its transactional email system (event-triggered emails like receipts and confirmations) and built for broadcasting to subscribers. Every person who signs up before or during launch is warm traffic: they're interested before you've even shipped v2.

**Set up Resend Audiences first (5 min, free):**
1. Log into resend.com → navigate to **Audiences** in the left sidebar
2. Click **Create audience** → name it `AgentForge Waitlist`
3. Copy the **Audience ID** (a string starting with `aud_`)
4. Add to `.env.local`:
```bash
RESEND_AUDIENCE_ID=aud_your_audience_id_here
```
Also add it to Vercel's environment variables (Production + Preview).

Ask Claude Code:
> *"Using Next.js 16.2.4 App Router, React 19, @supabase/ssr 0.10.2 (always `await cookies()`). Resend is already installed from Week 10.*
>
> *1. Add `RESEND_AUDIENCE_ID` to the Zod env validator in `src/lib/env.ts`:*
> ```typescript
> RESEND_AUDIENCE_ID: z.string().startsWith('aud_'),
> ```
> *Explain: Zod is the TypeScript schema validation library we added in Week 6 to validate all environment variables at startup. Adding this validator means a missing or malformed `RESEND_AUDIENCE_ID` produces a clear startup error immediately — not a cryptic crash when the first waitlist signup fires.*
>
> *2. Create `src/app/api/waitlist/route.ts`. POST handler only:*
>
> *Step 1 — Parse and validate the body:*
> ```typescript
> const { email } = await req.json()
> if (!email || typeof email !== 'string') {
>   return NextResponse.json({ error: 'Email is required' }, { status: 400 })
>   // 400 = Bad Request — the client sent malformed or incomplete data
> }
> const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
> if (!emailRegex.test(email)) {
>   return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
> }
> ```
>
> *Step 2 — Add the contact to the Resend Audience:*
> ```typescript
> import { Resend } from 'resend'
> import { env } from '@/lib/env'
>
> const resend = new Resend(env.RESEND_API_KEY)
>
> try {
>   await resend.contacts.create({
>     email,
>     audienceId: env.RESEND_AUDIENCE_ID,
>   })
>   return NextResponse.json({ success: true }, { status: 201 })
>   // 201 = Created — a new subscriber was added
> } catch (err: unknown) {
>   // Resend returns an error when the contact already exists in this audience
>   const message = err instanceof Error ? err.message : ''
>   if (message.toLowerCase().includes('already exists')) {
>     return NextResponse.json(
>       { error: 'Already subscribed', alreadySubscribed: true },
>       { status: 409 }  // 409 = Conflict — the resource already exists
>     )
>   }
>   console.error('[WAITLIST] Failed to add contact:', err)
>   return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
>   // 500 = Internal Server Error — the Resend API call failed
> }
> ```
>
> *3. Create `src/components/WaitlistSignup.tsx` — a horizontal email + button form:*
> ```typescript
> 'use client'
> // 'use client' marks this as a Client Component — it runs in the browser and can use
> // useState and event handlers. Without this, React hooks are not available.
>
> import { useState } from 'react'
>
> export function WaitlistSignup() {
>   const [email, setEmail] = useState('')
>   const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle')
>   const [errorMessage, setErrorMessage] = useState('')
>
>   async function handleSubmit(e: React.FormEvent) {
>     e.preventDefault()
>     // e.preventDefault() stops the browser from reloading the page on form submission —
>     // required for all React form handlers that manage their own submission logic
>     setStatus('loading')
>
>     const res = await fetch('/api/waitlist', {
>       method: 'POST',
>       headers: { 'Content-Type': 'application/json' },
>       body: JSON.stringify({ email }),
>     })
>
>     if (res.ok) {
>       setStatus('success')
>       setEmail('')
>     } else {
>       const data = await res.json()
>       if (data.alreadySubscribed) {
>         setStatus('duplicate')
>       } else {
>         setStatus('error')
>         setErrorMessage(data.error || 'Something went wrong')
>       }
>     }
>   }
>
>   if (status === 'success') {
>     return <p className="text-sm text-green-500">You're on the list! We'll be in touch. 🎉</p>
>   }
>
>   return (
>     <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
>       <input
>         type="email"
>         value={email}
>         onChange={e => setEmail(e.target.value)}
>         placeholder="your@email.com"
>         required
>         disabled={status === 'loading'}
>         className="flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
>       />
>       <button
>         type="submit"
>         disabled={status === 'loading' || !email}
>         className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
>       >
>         {status === 'loading' ? 'Joining...' : 'Get notified'}
>       </button>
>       {status === 'duplicate' && (
>         <p className="w-full text-xs opacity-60">You're already subscribed. ✓</p>
>       )}
>       {status === 'error' && (
>         <p className="w-full text-xs text-red-500">{errorMessage}</p>
>       )}
>     </form>
>   )
> }
> ```
>
> *4. Import and add `<WaitlistSignup />` to the landing page (`src/app/page.tsx`) hero section, below the CTA buttons. Add a label above it: "Stay updated — new tools and templates every week."*
>
> *After building, verify by testing:*
> - *Happy path: enter a valid email on the landing page → click 'Get notified' → button shows 'Joining...' while the request is in flight → success message appears → check Resend Audiences dashboard → email appears in the `AgentForge Waitlist` audience*
> - *Failure path (duplicate): submit the same email a second time → 409 Conflict → 'Already subscribed ✓' message appears; form is not in an error state; input is not cleared*
> - *Failure path (invalid email): type `notanemail` (no @ symbol) → click submit → 400 Bad Request → inline error message appears; input retains the typed value*
> - *Failure path (API key missing): temporarily remove `RESEND_AUDIENCE_ID` from `.env.local`, restart dev server → startup prints a clear Zod validation error naming the missing variable — not a cryptic crash when a signup is attempted*
> *Do not mark complete until all four pass."*

---

### Step 5 — Record the Loom Demo Video

No code. This step is pure content creation — but a 3-minute demo video directly drives more signups than any line of code you could write today.

**Before you record:**
1. Close all other apps — keep only your browser open
2. Open exactly three tabs in this order:
   - Tab 1: Your landing page (live Vercel URL)
   - Tab 2: The agent builder — have a "Research Assistant" agent already configured with web search enabled
   - Tab 3: That agent's public share page (already generated in Week 9)
3. Log in so the dashboard is ready to show

**Record this exact script (improvise freely within each beat):**

> *[Screen: landing page]*
> "I'm Lakii, a UX designer. 12 weeks ago I couldn't build an app. This is AgentForge — a visual AI agent builder for non-developers. Most AI tools require code. This doesn't."
>
> *[Screen: 5-step agent builder]*
> "Here's how it works. Step one: choose what your agent is for — I'll pick Research Assistant. Step two: define its personality. Step three: give it tools — I'm enabling web search so it can find information in real time. Step four: set limits. Step five: test it right here."
>
> *[Screen: chat interface — ask something like "What's happening in AI this week?"]*
> "I ask a real question. It searches the web, finds the answer, and responds. Live. In my app."
>
> *[Screen: share page in an incognito window]*
> "Every agent gets a public link. Anyone can use it — no account required."
>
> *[Screen: back to dashboard]*
> "All your agents in one place. Free to start — link below."

**Recording steps:**
1. Go to [loom.com](https://loom.com) — create a free account
2. Install the Loom desktop app or Chrome extension
3. Click **New Recording → Screen only** (or Screen + Camera if you want your face)
4. Record — aim for 2–3 minutes
5. Loom gives you a shareable URL automatically — save it somewhere accessible

> 💡 Don't re-record for perfection. A slightly rough demo with authentic energy converts better than a polished but sterile one. One re-take is fine; three is too many.

**Save the Loom URL** — you'll use it in every launch post.

---

### ✅ Before You Commit — Newsletter + Demo

| Test | Expected result |
|---|---|
| Submit a new email on landing page waitlist | Email appears in Resend Audiences dashboard within 30 seconds |
| Submit the same email again | 'Already subscribed ✓' message; form not in error state |
| Submit `notanemail` | Inline error message; input retains the value |
| Remove `RESEND_AUDIENCE_ID` from `.env.local`, restart dev server | Clear Zod error naming the missing variable at startup |
| Loom recording saved | You have a shareable URL under 3 minutes |

---

### 💾 Commit Checkpoint — Newsletter + Demo Complete

```bash
git add -A
git commit -m "feat: waitlist signup (Resend Audiences), landing page newsletter widget"
```

---

## ⚙️ Session 3 — Sunday (Hours 5–6): Write Launch Content

No code this session. You are creating the content that will drive traffic to everything you built.

### Step 6 — Write the Hacker News "Show HN" Post

The Show HN post is your single most important piece of written content this week. HN readers are technical, sceptical, and quick to dismiss — but when they upvote, they send thousands of qualified visitors.

**Rules for a good Show HN post:**
- The title is the only thing most people read — make it work alone
- No hype words: "revolutionary", "game-changer", "disrupts", "cutting-edge" are instant downvotes
- Your first comment is a reply to your own post — be honest and specific about what you built and why

Ask Claude Code:
> *"Help me draft a Hacker News 'Show HN' post for AgentForge. Two parts:*
>
> *Part 1 — Post title (under 80 characters total, including 'Show HN:'):*
> - *Must start with 'Show HN:'*
> - *State what it does, not what it is — 'Visual AI Agent Builder for Non-Developers' not 'My New SaaS Product'*
> - *No hyperbole or buzzwords*
>
> *Part 2 — First comment body (the comment I'll post immediately after submitting, as a reply to my own post):*
> - *Paragraph 1: The problem in one sentence. Why does this tool exist?*
> - *Paragraph 2: What AgentForge does and what makes it different from existing tools.*
> - *Paragraph 3: The founder context — I'm a UX designer who taught herself to code over 12 weeks using Claude Code. This is what I built.*
> - *Paragraph 4: What it does technically — Next.js, Supabase, Claude API, Stripe. Open source under MIT.*
> - *Paragraph 5: The ask — I'm specifically looking for feedback from non-technical users who've tried and failed to use other agent builders.*
> - *Links at the end: Live URL · GitHub · Demo video (Loom URL)*
>
> *Draft three versions of the title. Draft one version of the comment. All language must be direct and specific — no marketing speak, no exclamation marks.*
>
> *After drafting, verify by testing:*
> - *Happy path: read each title out loud — does someone who's never heard of AgentForge understand what it does within 5 seconds? A title that requires context knowledge fails this test.*
> - *Failure path: do any of the three titles use any of these banned words: 'revolutionary', 'game-changer', 'disrupts', 'simple', 'easy', 'powerful', 'next-gen', 'cutting-edge', 'innovative'? If yes, rewrite those titles. HN readers treat these as signals of poor judgment.*
> *Do not mark complete until both pass."*

---

### Step 7 — Write the Twitter/X Thread

Twitter/X threads are the primary medium of the indie developer community. A thread showing "I built something real" travels far further than promotional text.

Ask Claude Code:
> *"Help me draft a Twitter/X launch thread for AgentForge. The thread must be honest, personal, and specific — not marketing copy.*
>
> *Structure (8–10 tweets):*
>
> *Tweet 1 (the hook — most important, determines whether anyone reads the rest):*
> - *Opens with a surprising personal admission: '12 weeks ago I couldn't build a web app. Here's what I shipped.' OR 'I'm a UX designer. I hate that AI tools require code. So I built one that doesn't.'*
> - *Include a note that the demo GIF (from Step 9) will be attached to this tweet on posting*
>
> *Tweet 2 (the problem):*
> - *2–3 sentences. The specific frustration that led to building this. Concrete — not 'AI is complicated' but what specific situation caused the pain.*
>
> *Tweet 3 (the solution):*
> - *What AgentForge does in plain English. What you can build in under 5 minutes.*
>
> *Tweet 4 (show, don't tell):*
> - *Describe a screenshot of the 5-step builder. Caption: 'Step 3: give your agent tools. Toggle web search on. No API keys required. No code.'*
>
> *Tweet 5 (the human story):*
> - *The founder backstory. UX designer, 12 weeks, Claude Code. Authentic and specific.*
>
> *Tweet 6 (the stack — for the developers):*
> - *'Stack: Next.js 16 · React 19 · Tailwind v4 · Supabase · Claude API · Stripe · Vercel. Fully open source. MIT license.'*
>
> *Tweet 7 (social proof):*
> - *What's real: how many test agents created, that it's a functioning payment system, that it's been running for X weeks*
>
> *Tweet 8 (the ask):*
> - *'Try it free → [URL]. Share your feedback → [/feedback URL]. The code is here → [GitHub].'*
> - *Hashtags: #buildinpublic #claudeai #opensource #indiedev #aisaas*
>
> *Rules: each tweet under 280 characters. No exclamation marks — they read as noise. No vague claims that can't be backed up with a screenshot or number.*
>
> *After drafting, verify by testing:*
> - *Happy path: read Tweet 1 out loud to someone unfamiliar with the project — do they want to know more within 10 seconds? If yes, it works.*
> - *Failure path: does any tweet contain a claim that can't be backed up with a screenshot or a real number? If yes, rewrite or remove it. Claims without evidence are worse than no claims.*
> *Do not mark complete until both pass."*

---

### Step 8 — Write the LinkedIn Post and Dev.to Outline

LinkedIn's audience is founders, investors, and hiring managers — a different tone and emphasis from Twitter.

Ask Claude Code:
> *"Help me draft two pieces of content:*
>
> *Content 1 — LinkedIn post (300–500 words):*
> - *Tone: professional but personal. Not formal corporate speak. Not casual slang.*
> - *Opening line: something that makes a founder stop scrolling. Example: 'I'm a UX designer. I shipped a SaaS product in 12 weeks. Here's what I actually learned.'*
> - *Core narrative: the UX designer who used AI tools to build what used to require a team of developers — why this matters for non-technical founders*
> - *Describe AgentForge for a non-technical LinkedIn audience (founders, PMs, marketers who might use it)*
> - *One real number: 12 weeks from zero coding knowledge to live, paying subscribers*
> - *Close with a specific ask — not 'check it out' but something concrete: 'I'm looking for beta users who've tried to build AI workflows but hit a technical wall. Reply or DM if that's you.'*
> - *End with 5–7 hashtags: #buildinpublic #aitools #founderstory #uxdesign #saas #nocode #anthropic*
>
> *Content 2 — Dev.to article outline (for the stretch task retrospective article):*
> - *Title: 'How I Built an Open-Source AI Agent Builder in 12 Weeks as a UX Designer with No Coding Background'*
> - *Sections: Introduction → Tech Stack Choices → The Hardest Parts (honest) → What Claude Code Could and Couldn't Do → The Business Layer (Stripe, limits, security) → Launch Day → What I'd Do Differently → What's Next*
> - *Target audience: developers curious about the non-developer founder perspective*
> - *Draft as section headers + 2–3 bullet points each. The actual prose writing is in Stretch 4.*
>
> *After drafting:*
> - *Happy path: LinkedIn post reads as a genuine founder story, not a product advertisement. The call-to-action is specific and actionable.*
> - *Failure path: does the LinkedIn post contain any of these buzzwords: 'disrupting', 'leveraging', 'synergy', 'thought leadership', 'game-changing'? If yes, rewrite those sentences in plain English.*
> *Do not mark complete until both pass."*

---

### Step 9 — Create a Demo GIF from the Loom Video

Twitter/X threads with GIFs in the first tweet get significantly more engagement than those with only text or screenshots. A 12-second GIF of your agent actually responding to a live question is the most powerful asset you can post.

Ask Claude Code:
> *"Help me create a short demo GIF (a GIF — Graphics Interchange Format — is a short looping animation that plays automatically in tweets, Slack, and chat apps without requiring a play button or video player).*
>
> *Option A — Using Loom's built-in GIF export (fastest):*
> - *Open your Loom recording → click the three-dot menu → Download → GIF*
> - *If available on your plan, use this — it exports instantly.*
>
> *Option B — Using Cloudconvert (free web tool, no install):*
> - *Go to cloudconvert.com*
> - *Upload your downloaded Loom MP4 file*
> - *Output format: GIF. Settings: trim to the 10–15 most compelling seconds (the moment the AI response streams in), frame rate 10fps (frames per second — lower fps means a smaller file size), width 600px*
> - *Download the GIF*
>
> *Option C — Using ffmpeg (free command-line tool):*
> ```bash
> # Install ffmpeg if not already installed:
> brew install ffmpeg   # macOS only — brew is Homebrew, the macOS package manager
>
> # Create a GIF from seconds 25–40 of your demo video (adjust timestamps to match your best moment):
> ffmpeg -i demo.mp4 -ss 25 -t 15 -vf "fps=10,scale=600:-1:flags=lanczos" output.gif
>
> # What each flag means:
> # -i demo.mp4     → input file
> # -ss 25          → start at 25 seconds into the video
> # -t 15           → capture 15 seconds of duration
> # -vf             → video filter chain (a sequence of transformations applied to the video)
> # fps=10          → 10 frames per second — lower means smaller file, acceptable quality
> # scale=600:-1    → resize to 600px wide; -1 means auto-calculate height to preserve aspect ratio
> # flags=lanczos   → high-quality scaling algorithm (produces crisper edges than default)
> ```
>
> *Save the final GIF to `public/demo.gif` in the repo so it's also embedded in the README.*
>
> *After creating, verify by testing:*
> - *Happy path: open `public/demo.gif` in a browser → it plays automatically in a loop → the streaming response moment is visible → file size is under 5MB (Twitter rejects GIFs over 5MB)*
> - *Failure path: GIF is over 5MB → reduce the trim to 8 seconds and re-export. If still over 5MB, reduce frame rate to 8fps.*
> *Do not mark complete until both pass."*

---

## ⚙️ Session 4 — Sunday (Hours 7–8): Directories + GitHub Polish

### Step 10 — GitHub Repository Final Polish

Before submitting to directories, your GitHub repo is the first thing technical users will check. A README with a demo GIF, badges, and clear setup instructions is the difference between 1 star and 100.

Ask Claude Code:
> *"Update the AgentForge `README.md` to be launch-ready. The README must serve two audiences: non-technical users who want to try the product, and developers who want to run it locally or contribute.*
>
> *Structure:*
>
> *1. Top of file — badges (small visual status indicators, generated by shields.io — a free badge generator):*
> ```markdown
> ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
> ![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)
> ![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20API-orange)
> ![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red)
> ```
>
> *2. Demo GIF — immediately below the badges:*
> ```markdown
> ![AgentForge Demo](./public/demo.gif)
> ```
> *Explain: placing the GIF at the very top means it plays automatically when someone opens the repo on GitHub — before they've read a single word. This is the highest-converting element in any README.*
>
> *3. One-liner description: the medium description from the press kit.*
>
> *4. Features list — 5–6 bullet points of working features only. No roadmap items. No 'coming soon'.*
>
> *5. Live demo link + Loom video link.*
>
> *6. Tech stack table: same as press kit.*
>
> *7. Quick Start — exact commands to run the project locally:*
> ```markdown
> ## Quick Start
>
> 1. Clone the repo: `git clone https://github.com/[your-username]/agentforge`
> 2. Install dependencies: `npm install`
> 3. Copy the env template: `cp .env.example .env.local`
> 4. Fill in your values in `.env.local` (see each variable's comment for where to find it)
> 5. Run the Supabase migrations in the SQL editor (files in `supabase/migrations/`)
> 6. Start the dev server: `npm run dev`
> 7. Open [http://localhost:3000](http://localhost:3000)
> ```
>
> *8. Create `.env.example` in the repo root — a copy of `.env.local` with every real value replaced by a placeholder string. This IS committed to Git (unlike `.env.local` which is gitignored):*
> ```bash
> # Supabase — dashboard.supabase.com → your project → Settings → API
> NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
> NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
> SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
>
> # Anthropic — console.anthropic.com → API Keys
> ANTHROPIC_API_KEY=sk-ant-your-key-here
>
> # Stripe — stripe.com → Developers → API Keys
> NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
> STRIPE_SECRET_KEY=sk_test_your_key
> STRIPE_PRO_PRICE_ID=price_your_price_id
> STRIPE_WEBHOOK_SECRET=whsec_placeholder
>
> # App URL — http://localhost:3000 in dev; your Vercel URL in production
> NEXT_PUBLIC_APP_URL=http://localhost:3000
>
> # Upstash Redis — upstash.com → your database → REST API
> UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
> UPSTASH_REDIS_REST_TOKEN=your_token
>
> # Resend — resend.com → API Keys and Audiences
> RESEND_API_KEY=re_your_key
> RESEND_AUDIENCE_ID=aud_your_id
>
> # Sentry — sentry.io → your project → Settings → Client Keys
> SENTRY_DSN=https://your_key@org.ingest.sentry.io/project_id
> ```
> *Explain: `.env.example` serves as a self-documenting template so contributors know exactly which variables to create without exposing any real credentials. It is intentionally committed to Git.*
>
> *9. Contributing section: link to `CONTRIBUTING.md`.*
>
> *10. License section: confirm `LICENSE` file exists (MIT license — the most permissive open-source license, allowing anyone to use, copy, modify, and distribute the code freely) and link to it.*
>
> *After building, verify by testing:*
> - *Happy path: push to GitHub and open `github.com/[username]/agentforge` → the demo GIF plays automatically in the rendered README → badges are visible → Quick Start commands are in fenced code blocks*
> - *Failure path: run `git diff HEAD .env.example` → the diff contains only placeholder strings, not real API keys. Also run `git log --all --full-history -- .env.local` → no commits listed (`.env.local` was never committed)*
> *Do not mark complete until both pass."*

---

### Step 11 — Submit to Product Directories

Each directory submission is a permanent backlink (a link from another website pointing to yours — valuable for search rankings because it signals to Google that other sites consider you credible) and a source of ongoing organic traffic.

Ask Claude Code:
> *"Help me prepare the ProductHunt submission content. Generate the following text — I'll paste each into ProductHunt's form:*
>
> *- **Name:** AgentForge*
> *- **Tagline** (60 characters maximum — ProductHunt enforces this hard limit): 'Build AI agents visually — no code required'*
> *- **Description** (260 characters maximum): trim the medium description from the press kit to exactly 260 characters. Count precisely — ProductHunt rejects submissions that exceed the limit.*
> *- **First comment** (the personal note I'll post as the first comment on launch day — not part of the submission form, but draft it now while the thinking is fresh): 3 short paragraphs — who I am, why I built this, and a specific ask from the PH community*
> *- **Topics** (choose 3 from ProductHunt's category list): Artificial Intelligence · Developer Tools · No-Code*
>
> *Timing note: ProductHunt resets daily at midnight PST (Pacific Standard Time — UTC-8 in winter, UTC-7 in summer). Schedule the launch for a Tuesday or Wednesday, at 12:01am PST for maximum visibility across the full 24-hour voting window. Avoid Mondays (lower traffic) and Fridays (people leave early).*
>
> *After drafting, verify by testing:*
> - *Happy path: count the tagline — it is 60 characters or fewer. Count the description — it is 260 characters or fewer.*
> - *Failure path: if either is over the limit → trim to the most important clause. On ProductHunt, concise always beats comprehensive.*
> *Do not mark complete until both fit within their character limits."*

Go to [producthunt.com](https://producthunt.com) and schedule your launch after preparing this content.

**Directory 2 — There's An AI For That:**
Go to [theresanaiforthat.com](https://theresanaiforthat.com) → Submit. Fill in: product name, URL, tagline, description, category (AI Agents), pricing. Approval typically takes 1–3 days.

**Directory 3 — Futurepedia or AI Tools Directory:**
Go to [futurepedia.io](https://futurepedia.io) → Submit Tool, or [aitoolsdirectory.com](https://aitoolsdirectory.com) → Add Tool. Use the same content prepared for the press kit — you've already written it.

---

### Step 12 — Execute the Launch

With all content written and directories submitted, here is the precise launch day execution order.

Ask Claude Code:
> *"Help me create a time-ordered launch day checklist. Timestamps are relative to 9:00am EST (Eastern Standard Time — the timezone when Hacker News traffic peaks on weekday mornings):*
>
> *9:00am EST — Post the Hacker News 'Show HN':*
> - *Go to news.ycombinator.com → Submit → paste the best title from Step 6 → URL: your live Vercel URL*
> - *Within 2 minutes: post your prepared first comment as a direct reply to your own submission*
> - *Bookmark the post URL immediately — you need it to reply to comments quickly*
>
> *9:05am EST — Post the Twitter/X thread:*
> - *Post Tweet 1 first (with the demo GIF attached) → wait 30 seconds → reply to Tweet 1 with Tweet 2 → continue replying down the thread*
> - *Pin the thread to your profile immediately after the final tweet*
>
> *9:15am EST — Post on LinkedIn:*
> - *Post the drafted content from Step 8*
> - *Tag 1–2 people who've supported you during the build (colleagues, peers, mentors) — their engagement in the first hour increases LinkedIn's algorithmic distribution significantly*
>
> *9:20am EST — Send the newsletter to the Resend Audience:*
> - *Resend dashboard → Broadcasts → New Broadcast → audience: AgentForge Waitlist*
> - *Subject: 'AgentForge is live 🚀'*
> - *Body: 3 sentences — what it does, the live link, and a personal note from the founder*
>
> *9:30am–11:30am EST — Reply to everything:*
> - *Check HN every 10 minutes and reply to every comment, including critical ones*
> - *The HN ranking algorithm factors in comment velocity (how quickly comments are posted and replied to) in the first 2 hours. A post with 20 replies in 2 hours stays on the front page longer than one with 200 upvotes and 2 comments.*
> - *Tone for critical HN comments: direct and honest, never defensive. If someone criticises a technical choice, say: 'Fair point — here's the trade-off I made, and here's what I'd do differently now.'*
>
> *11:30am EST — Record the first metrics snapshot:*
> - *Vercel Analytics: unique visitors in the past 2 hours*
> - *Supabase: `SELECT COUNT(*) FROM auth.users WHERE created_at > now() - interval '3 hours'`*
> - *GitHub: star count*
> - *Resend: waitlist subscriber count*
>
> *Format as a printable time-ordered table with a checkbox for each action.*
>
> *After drafting, verify by testing:*
> - *Happy path: every item has a specific, actionable step with no ambiguity — you can execute this list under pressure without having to think*
> - *Failure path: identify every external service you'll need to be logged into on launch day (HN, Twitter/X, LinkedIn, Resend, ProductHunt, Supabase). Log into all of them today — not on launch morning. A locked account or forgotten password on launch day is avoidable.*
> *Do not mark complete until both pass."*

---

### ✅ Before You Commit — Directories + Launch

| Test | Expected result |
|---|---|
| `.env.example` in repo root | File exists; `git diff HEAD .env.example` shows only placeholder strings |
| `git log --all --full-history -- .env.local` | No commits listed — `.env.local` was never committed |
| Open `github.com/[username]/agentforge` | Demo GIF plays automatically; badges render; Quick Start visible |
| `npm run build` passes after README changes | No new errors from public file additions |
| MIT `LICENSE` file | `cat LICENSE` shows MIT license text with current year |
| ProductHunt tagline | ≤ 60 characters — count precisely |
| ProductHunt description | ≤ 260 characters — count precisely |

Do not commit until every row passes.

---

### 💾 Commit Checkpoint — Directories + Launch Complete

```bash
git add -A
git commit -m "feat: launch-ready README (demo GIF, badges, .env.example), ProductHunt and directories submitted"
```

---

## ✨ Stretch Tasks (+4–5 hrs, if you have time)

None of these block Week 13. But each one compounds the value of launch day and creates infrastructure for long-term growth.

---

### Stretch 1 — Post-Launch Analytics Review (1 hr)

Do this 48 hours after posting the HN "Show HN" — not immediately. You need real data, not the first hour's spike.

Ask Claude Code:
> *"Help me run a post-launch analytics review, 48 hours after the Hacker News post. Pull data from each source:*
>
> *1. Vercel Analytics (in the Vercel dashboard → Analytics tab):*
>    - *Total unique visitors in the past 48 hours*
>    - *Top referrer sources — where did traffic originate? (Hacker News, Twitter, direct, Google)*
>    - *Most visited pages*
>
> *2. Supabase (run these SQL queries directly in the Supabase SQL Editor — Dashboard → SQL Editor → New query. Verify the project ID is `gqqglsttnfkftsdcbcsz` before running):*
> ```sql
> -- New user signups in the last 48 hours
> SELECT COUNT(*) AS new_users
> FROM auth.users
> WHERE created_at > now() - interval '48 hours';
>
> -- New agents created in the last 48 hours
> SELECT COUNT(*) AS new_agents
> FROM agents
> WHERE created_at > now() - interval '48 hours';
>
> -- Total messages sent in the last 48 hours
> SELECT SUM(message_count) AS messages_sent
> FROM usage
> WHERE updated_at > now() - interval '48 hours';
>
> -- Pro upgrades in the last 48 hours
> SELECT COUNT(*) AS pro_upgrades
> FROM subscriptions
> WHERE tier = 'pro'
>   AND updated_at > now() - interval '48 hours';
> ```
>
> *3. Sentry: any new errors that real users triggered — errors that didn't appear in your own smoke testing*
>
> *4. Resend Audiences: total waitlist subscriber count*
>
> *5. GitHub: star count and any new issues or pull requests opened*
>
> *Compile into a snapshot table: Metric | Value | Goal. My launch goals were: 100 signups, 10 Pro trials started, 50 GitHub stars.*
>
> *After running, verify by testing:*
> - *Happy path: all SQL queries execute without errors and return rows (even if the count is 0 — that's a valid result)*
> - *Failure path: any query returning an error → check you're in the correct Supabase project (`gqqglsttnfkftsdcbcsz`) and that the table name matches exactly*
> *Do not mark complete until both pass."*

---

### Stretch 2 — Write POST_MORTEM.md (1 hr)

A post-mortem is honest documentation of what actually happened — not a press release. Make it public in your repo.

Ask Claude Code:
> *"Help me draft `POST_MORTEM.md` at the root of the AgentForge repo. This file will be public — contributors and future employers will read it. Honest is better than impressive.*
>
> *Sections:*
>
> *## What Shipped (12 weeks, one sentence each)*
> - *One factual sentence per week. Not feelings — shipped features.*
>
> *## What Went Well*
> - *3–5 specific incidents: not 'good code quality' but 'Using Claude Code for the Supabase migration SQL saved ~3 hours per table in Week 4'. Concrete and quotable.*
>
> *## What Took Longer Than Expected*
> - *3–5 honest examples. The places that ate time you didn't budget. Specific enough that someone could learn from them.*
>
> *## What I'd Do Differently*
> - *3 architecture or process decisions you'd change with hindsight. Not 'plan better' — specific: 'I'd set up Zod env validation in Week 1 instead of Week 6, because the cryptic crashes from missing vars wasted hours of debugging time across multiple weeks.'*
>
> *## What Claude Code Did vs. What I Still Had to Learn*
> - *This section will be the most-read part by other self-learners. Be precise: 'Claude Code wrote 90% of the database query logic but I had to deeply understand RLS policies to write correct prompts. It could not write Supabase RLS correctly until I understood what RLS enforced and why.'*
>
> *## What's Next (v2)*
> - *Based on real launch feedback — HN comments, Tally responses, DMs. Not assumptions. Use placeholders if it's too early: 'TO FILL IN — will update from launch feedback'*
>
> *## Metrics (48 hrs post-launch)*
> - *Placeholder table: Signups | Agents Created | Messages Sent | Pro Trials | GitHub Stars | Waitlist Size*
>
> *Draft the document with placeholders for real numbers I'll fill in from launch data. Write in first person. No corporate passive voice.*
>
> *After drafting, verify by testing:*
> - *Happy path: read the 'What I'd Do Differently' section to someone who wasn't involved in the build — do they learn something specific and actionable from it?*
> - *Failure path: does any section use vague language ('challenging', 'rewarding', 'learnings', 'journey')? Replace each instance with a specific incident or concrete example.*
> *Do not mark complete until both pass."*

---

### Stretch 3 — Plan v2 from User Feedback (1 hr)

Don't plan v2 in a vacuum. Wait for real feedback, then let it dictate the roadmap.

Ask Claude Code:
> *"Help me structure `ROADMAP.md` at the repo root — a v2 feature backlog driven purely by launch day feedback.*
>
> *Instructions:*
> 1. *Collect feedback from: HN comments, Tally form responses (export CSV from Tally dashboard), Twitter replies, any direct messages*
> 2. *Group by recurring theme — most feedback clusters around 3–5 repeated requests*
> 3. *For each theme: (a) the exact quote from a user, (b) how many separate people mentioned it, (c) the proposed feature in one sentence, (d) effort estimate: Low (< 4hrs) / Medium (4–16hrs) / High (> 16hrs)*
> 4. *Sort by impact/effort: High impact + Low effort goes first (the classic prioritisation matrix — a 2×2 grid of impact vs. effort used to sequence a backlog)*
>
> *Add a 'Won't Build' section: feedback you've read and intentionally decided not to act on, with a one-line reason. This signals product focus — as important as what you will build.*
>
> *Add this comment at the top of ROADMAP.md:*
> ```markdown
> <!-- Prioritisation matrix: High impact + Low effort = build next
>      High impact + High effort = plan carefully and break into phases
>      Low impact = defer indefinitely or reject -->
> ```
>
> *Create the ROADMAP.md template with placeholder content I can fill in from real feedback. If feedback hasn't arrived yet, mark every item as: [TO FILL IN AFTER 48HRS].*
>
> *After drafting, verify by testing:*
> - *Happy path: the template structure is complete and I can fill in real feedback without restructuring or rewriting the format*
> - *Failure path: if there's no feedback yet (it's still launch day or the post hasn't gone up) → create the template and mark it blocked: add a comment at the top: 'Filling in after 48 hours of real feedback. Do not plan based on assumptions.'*
> *Do not mark complete until both pass."*

---

### Stretch 4 — Draft the Dev.to Article (1.5 hrs)

This article will drive GitHub stars, attract contributors, and may be your first piece of content that ranks on Google. The outline was created in Step 8 — now write the full piece.

Ask Claude Code:
> *"Draft the full Dev.to article from the outline in Step 8: 'How I Built an Open-Source AI Agent Builder in 12 Weeks as a UX Designer with No Coding Background'.*
>
> *Length target: 2,000–2,500 words. Audience: developers curious about the non-developer founder perspective.*
>
> *Draft guidelines:*
> - *Lead with a surprising specific admission — not 'I was a beginner' but something concrete: the first error message that stopped you cold, or the first time Claude Code surprised you*
> - *Each section answers: what happened, what I was thinking at the time, what I learned*
> - *Include at least 3 real code snippets from the project — actual TypeScript from the codebase that illustrates a specific decision*
> - *Be honest about what Claude Code could and couldn't do — this is what developer readers will find most valuable and most uncommon to read*
> - *Close with: what you're building next, a genuine invitation to try the product and give feedback, and thanks to the communities that helped (HN, Anthropic Discord, Supabase Discord)*
>
> *Dev.to tags to add on publishing: `claude` · `anthropic` · `nextjs` · `opensource` · `saas` · `webdev` · `beginners` · `buildlog`*
>
> *Save the draft as `docs/devto_article_draft.md` in the repo so it's ready to paste into Dev.to.*
>
> *After drafting, verify by testing:*
> - *Happy path: read the introduction section out loud — does it make a developer who's never built a SaaS product want to read the rest within the first 30 seconds?*
> - *Failure path: does the article use any of these phrases: 'game-changer', 'revolutionary', 'disrupting', 'the future of', 'thought leader'? If yes, replace them with specific claims backed by what was actually built.*
> *Do not mark complete until both pass."*

---

### 💾 Commit Checkpoint — Stretch Tasks (if attempted)

```bash
git add -A
git commit -m "feat: POST_MORTEM.md, ROADMAP.md v2 backlog, Dev.to article draft — post-launch retrospective"
```

---

## 💾 Sprint Close — Week 12 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, and update `CLAUDE.md`'s Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 12 complete — changelog, press kit, feedback, waitlist, launch content, HN posted, directories submitted"
```

After committing, open `CLAUDE.md` and move "Week 12" from Current Focus into Completed Work with a two-sentence summary of what shipped. Update the Current Focus to Week 13: *"Testing foundation — Vitest unit tests for critical paths, API route tests, CI integration so every future feature ships with confidence."*

---

## ✅ Completion Checklist

Work through these top to bottom. Don't mark anything done until you've actually tested it.

- [ ] `npm run build` passes cleanly before any launch activity
- [ ] Live Vercel URL smoke-tested (auth, chat, share, Stripe) within 24 hours of launch day
- [ ] `src/app/changelog/page.tsx` built — all 12 entries, newest (v0.12) at top
- [ ] `/changelog` link visible in site footer on every page
- [ ] `src/app/press/page.tsx` built — all 8 sections present
- [ ] `/press` link visible in site footer
- [ ] Tally.so form created with 6 feedback fields
- [ ] `src/app/feedback/page.tsx` built with Tally iframe embed
- [ ] Test submission in Tally form → appears in Tally dashboard
- [ ] `/feedback` link visible in site footer
- [ ] `RESEND_AUDIENCE_ID` added to Zod env validator in `src/lib/env.ts`
- [ ] `RESEND_AUDIENCE_ID` added to Vercel environment variables
- [ ] `POST /api/waitlist` returns 201 for new email, 409 for duplicate, 400 for invalid format
- [ ] `WaitlistSignup` component embedded in landing page hero
- [ ] Test email submitted via landing page → appears in Resend Audiences dashboard
- [ ] Duplicate email submission → 'Already subscribed ✓' message; form not in error state
- [ ] Loom demo video recorded (≤ 3 minutes) — shareable URL saved
- [ ] Demo GIF created (≤ 5MB) — saved to `public/demo.gif`
- [ ] Hacker News "Show HN" post drafted — 3 title options, 1 first-comment body
- [ ] Twitter/X thread drafted — 8–10 tweets, Tweet 1 includes GIF note
- [ ] LinkedIn post drafted (300–500 words)
- [ ] Dev.to article outline drafted (section headers + bullets)
- [ ] `.env.example` committed to Git — only placeholder values, no real API keys
- [ ] README updated with demo GIF, badges, Quick Start, `.env.example` reference
- [ ] README demo GIF plays automatically on github.com
- [ ] MIT `LICENSE` file exists in repo root
- [ ] ProductHunt submission scheduled (tagline ≤ 60 chars, description ≤ 260 chars)
- [ ] There's An AI For That submitted
- [ ] Futurepedia or AI Tools Directory submitted
- [ ] Launch day checklist prepared — all required services pre-authenticated before launch morning
- [ ] HN "Show HN" post published + first comment posted within 2 minutes
- [ ] Twitter/X thread live + pinned to profile
- [ ] LinkedIn post live
- [ ] Resend broadcast sent to waitlist
- [ ] Replied to every HN comment in the first 2 hours

**Stretch 1 — Post-Launch Analytics (if attempted)**
- [ ] Vercel Analytics: visitor count and top referrers captured 48hrs post-launch
- [ ] Supabase SQL queries run — new users, agents, messages, upgrades returned without error
- [ ] Sentry checked for new post-launch errors
- [ ] Metrics snapshot table completed

**Stretch 2–4 — Post-Mortem / Roadmap / Dev.to (if attempted)**
- [ ] `POST_MORTEM.md` committed — 'What I'd Do Differently' section is specific, not vague
- [ ] `ROADMAP.md` committed — v2 features ranked by impact/effort from real feedback
- [ ] `docs/devto_article_draft.md` committed — ≥ 2,000 words, no banned buzzwords

---

## 🧪 Validation Tests

Work through the groups **in order** — each group shares the same app state so you never need to backtrack or make the same change twice.

---

### Group 1 — Environment & Build

No app changes needed. Confirm the foundation is solid before testing any features.

| Test | Expected result |
|---|---|
| `npm run build` | Completes with `✓ Generating static pages` — no errors |
| `npx tsc --noEmit` | Exits cleanly — zero TypeScript errors |
| `npm run dev` with all env vars present | Starts cleanly — Zod validation passes |
| Remove `RESEND_AUDIENCE_ID` from `.env.local`, restart | Clear error naming the missing variable — not a cryptic crash |

---

### Group 2 — Launch Pages (unauthenticated)

Open an incognito window for all tests in this group — none of these pages require authentication.

| Test | Expected result |
|---|---|
| Navigate to `/changelog` | All 12 entries visible, v0.12 at the top |
| `/changelog` with JavaScript disabled (DevTools → Settings → Debugger → Disable JavaScript) | Page still renders — server-rendered HTML is visible without JavaScript |
| Navigate to `/press` | All 8 sections visible |
| `/press` on mobile viewport (375px in DevTools) | No horizontal overflow; all text readable without zooming |
| Click a logo download button on `/press` | Browser download dialog appears — file saves to disk |
| Navigate to `/feedback` | Tally form loads inside the page; fields are interactive |
| Submit a test response in the Tally form | Submission appears in Tally dashboard within 30 seconds |
| Footer on any page | Links to `/changelog`, `/press`, `/feedback` all present and functional |

---

### Group 3 — Waitlist Signup

Use the live landing page for these tests. No Supabase changes needed.

| Test | Expected result |
|---|---|
| Submit a new, unused email on the landing page | 201 Created; success message appears; email visible in Resend Audiences |
| Submit the same email again | 409 Conflict; 'Already subscribed ✓' message appears; form not in error state |
| Type `notanemail` and click 'Get notified' | 400 Bad Request; inline error message; email field retains the typed value |
| Submit with a completely empty email field | Browser native validation fires — no network request sent |

---

### Group 4 — GitHub Repository

Manual checks on github.com — no app state changes.

| Test | Expected result |
|---|---|
| Open `github.com/[username]/agentforge` | Demo GIF plays automatically in the rendered README |
| Shields.io badges in README | All badges render as coloured chips — no broken image icons |
| `.env.example` in repo root | File exists; contains only placeholder values |
| `git log --all --full-history -- .env.local` | No commits listed — `.env.local` was never committed |
| `LICENSE` file in repo root | MIT license text with the current year (2026) |

---

### Group 5 — Launch Content Quality

Manual review — no app changes.

| Test | Expected result |
|---|---|
| Read the HN title out loud to someone unfamiliar with the project | They understand what it does within 5 seconds |
| Count the HN title characters | Under 80 total, including 'Show HN:' |
| Count the ProductHunt tagline | ≤ 60 characters |
| Count the ProductHunt description | ≤ 260 characters |
| Open `public/demo.gif` in a browser | Plays automatically on loop; compelling streaming moment is visible |
| Check GIF file size | Under 5MB (Twitter hard limit) |

---

### Group 6 — Stretch Tasks (if attempted)

*Only run if the corresponding stretch tasks were completed.*

| Test | Expected result |
|---|---|
| **(Stretch 1)** Supabase SQL — new users in 48hrs | Query runs without error; returns a count (0 is valid) |
| **(Stretch 1)** Vercel Analytics tab | Visitor data visible; top referrers show HN and/or Twitter |
| **(Stretch 2)** `POST_MORTEM.md` in repo root | File committed; 'What I'd Do Differently' contains specific incidents, not vague language |
| **(Stretch 3)** `ROADMAP.md` in repo root | v2 features have impact/effort scores; 'Won't Build' section present |
| **(Stretch 4)** `docs/devto_article_draft.md` | File committed; word count ≥ 2,000; no banned buzzwords |

---

## 📚 Resources

- [Hacker News Show HN guidelines](https://news.ycombinator.com/showhn.html) — the official format and rules for Show HN posts
- [How to get your first 1,000 users](https://www.ycombinator.com/library/G6-how-to-apply-to-y-combinator) — YC's guidance on early traction
- [ProductHunt launch guide](https://blog.producthunt.com/how-to-launch-on-product-hunt-7c1843e06399) — the official step-by-step from the PH team
- [Loom](https://loom.com) — free screen recording with instant shareable links (no account required for viewers)
- [Tally.so](https://tally.so) — free form builder with clean embeds and CSV export
- [Resend Audiences docs](https://resend.com/docs/api-reference/contacts/create-contact) — how to create contacts and send broadcasts
- [Shields.io](https://shields.io) — generate custom README badges for license, version, status
- [Cloudconvert MP4 to GIF](https://cloudconvert.com/mp4-to-gif) — free web-based GIF export with trimming
- [There's An AI For That — submit](https://theresanaiforthat.com/submit/) — AI tool directory
- [Futurepedia — submit](https://www.futurepedia.io/submit-tool) — AI tools directory
- [Dev.to new post](https://dev.to/new) — developer blogging platform; built-in audience for open-source launches
- [awesome-readme](https://github.com/matiassingers/awesome-readme) — curated list of excellent README examples to reference
- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — the security context from Week 10 if you're writing about it in the Dev.to article

---

*Week 12 of 14 · AgentForge · Phase 4: Production & Launch · Updated May 2026*
