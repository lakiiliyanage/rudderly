# 🚀 Week 18 — Public Launch

**Phase:** 6 — Public Launch  
**Dates:** Add your own start date  
**Total time:** 8–10 hrs across the week  
**Goal:** Rudderly is publicly live. This week you execute the launch you have been building toward for 18 weeks. Every post, email, and submission was written in Week 16. Every screen is polished from Week 15. The template library is live from Week 17. Security and payments are hardened. Beta feedback is incorporated. Week 18 has nothing to write — only decisions to make and buttons to press. The goal is 200+ real signups in the first 7 days.

---

## 📋 Before You Start — Pre-Launch Sanity Check (1 hr)

Do this the day before you plan to post. Not on launch day — launch day will be busy enough.

**Product verification:**

1. **Watch your demo video** end-to-end at [your Loom link]. Does it still accurately show the current product? If Week 15 UX polish changed any screen you recorded, re-record that segment. A demo video that doesn't match the live product is worse than no demo video.
2. **Export a fresh GIF** (if the UI changed in Week 15):
   ```bash
   ffmpeg -i demo-v2.mp4 -ss 10 -t 20 -vf "scale=800:-1" -r 10 demo.gif
   cp demo.gif public/demo.gif
   git add public/demo.gif && git commit -m "chore: update demo GIF for public launch" && git push
   ```
3. **Update press kit screenshots** if the UI changed in Week 15. Copy fresh screenshots to `public/press/` and `docs/press-kit/screenshots/`.

**Live site verification:**

```bash
cd rudderly
npm run build         # must pass cleanly
npx tsc --noEmit      # must return 0 errors
```

Then on the live production URL:
- [ ] Sign up, create an agent, chat with it, share it — the full happy path in one flow
- [ ] Stripe test checkout completes (`4242 4242 4242 4242`)
- [ ] All 12 templates load in the gallery and pre-fill the builder correctly
- [ ] `/changelog`, `/press`, `/feedback` pages all load without auth
- [ ] Waitlist form captures email (test with a throwaway address)
- [ ] Vercel Analytics is recording page views
- [ ] Sentry has 0 open unresolved errors

**Content review:**

- [ ] Read `docs/HN_POST_DRAFT.md` — make any final tweaks. Read it aloud. It should sound like a real person talking to developers, not a marketing pitch.
- [ ] Read `docs/PH_DRAFT.md` — confirm tagline is ≤60 chars, description ≤260 chars, maker comment is personal.
- [ ] Read `docs/TWITTER_DRAFT.md` — confirm Tweet 1 hook is strong and the GIF link is updated.
- [ ] Read `docs/LINKEDIN_DRAFT.md` — confirm the story arc works and ends with a clear CTA.
- [ ] Open `docs/LAUNCH_METRICS.md` — review your Week 12 baseline numbers so you know what you're comparing against on Day 7.

> ⚠️ **Do not improvise on launch day.** Every word you post was written in Week 16 when you weren't stressed. Trust your past self. Copy, paste, and send.

---

## Day 1 — Go Live (4–5 hrs)

### Step 1 — Post to Hacker News: Show HN

**Timing:** 8–10am EST on a Tuesday or Wednesday. This is non-negotiable — HN's most active window. Posts that miss this window rarely recover.

**Post your Show HN:**

1. Log in to [news.ycombinator.com](https://news.ycombinator.com) — use an account that has posting history (a brand-new account with no history will be shadow-filtered)
2. Click **Submit**
3. Title: copy from `docs/HN_POST_DRAFT.md` — must start with `Show HN:`
4. URL: your production URL
5. Text: copy the body from `docs/HN_POST_DRAFT.md`
6. Submit

**Your first comment — post within 5 minutes of going live:**

Copy the technical notes section from `docs/HN_POST_DRAFT.md` and post it as your first comment. This gets pinned to the top of the comment thread and is seen by everyone who reads the post. It signals that the builder is technically confident and open to scrutiny — exactly what the HN audience wants to see.

**Stay present for the first 2 hours:**

- Check the post every 10–15 minutes
- Respond to **every** comment with genuine engagement — ask follow-up questions, acknowledge criticism honestly, never get defensive
- Early velocity is the primary signal HN uses to decide whether to surface a post. A post with 15 upvotes and 12 comments in the first hour is far more likely to front-page than one with 15 upvotes and 2 comments

**What not to do:**
- Do not post your HN link in Slack groups, Discord servers, or anywhere asking people to upvote. Vote manipulation is against HN rules and can get your account banned.
- Do not rewrite the post mid-day. The edit window is limited and changes look desperate.
- Do not respond to critical comments with defensiveness. "That's a fair point — here's why we made that tradeoff" is always the right frame.

> **Term: Hacker News (HN)** — A technology news and discussion site run by Y Combinator. The audience is developers, founders, and technically sophisticated readers. A front-page Show HN post typically drives 5,000–50,000 visitors in a single day. The front page is determined by upvote velocity in the first hour or two.

### Step 2 — Go Live on ProductHunt

You scheduled your ProductHunt post in Week 16 for 12:01am PST on today's date. Confirm it went live:

1. Go to [producthunt.com](https://producthunt.com) — your product should appear under today's date
2. If it's not live yet: submit it now using `docs/PH_DRAFT.md`. It may not appear in the day's leaderboard rankings if submitted late, but it will still be public.

**Respond to every comment within 30 minutes for the first 4 hours:**

ProductHunt's ranking algorithm heavily weights early comment engagement. The maker's response rate is a visible signal to voters — an active maker gets more upvotes than a silent one.

- Copy your maker comment from `docs/PH_DRAFT.md` and post it immediately as your first comment
- For every new comment: a genuine personal response, not a template reply. Read what they said and reply to it specifically.
- If someone upvotes and says nothing: you don't need to reply, but a 👋 emoji reaction takes 2 seconds and they'll remember it

> **Term: ProductHunt** — A community platform where makers post new products and the community upvotes their favourites. Products compete in a 24-hour window (midnight to midnight PST). The top 5 products of each day are featured in a newsletter sent to 500,000+ subscribers. A #1 Product of the Day badge drives signups for months.

### Step 3 — Send the Waitlist Email Blast

Send to your full Resend Audiences list — everyone who signed up via the waitlist form on the landing page.

**Write this email now (not from a template — personal and short):**

```
Subject: Rudderly is live 🚀

Hey,

You signed up for the Rudderly waitlist a while back — today's the day.

Rudderly is a visual AI agent builder for non-developers. Build an agent in 
minutes, share a public link, no code required.

Try it: [your-production-url]

If something breaks or confuses you, there's a feedback form at [url]/feedback.
Every response gets read.

Thanks for waiting.

[Your name]
```

To send from the Resend dashboard:
1. Go to Resend → Broadcasts → New Broadcast
2. Select your "Rudderly Waitlist" Audience
3. Write the email, set From to your verified domain address
4. Send

**Also send a separate personal email to your beta users** (the 10–20 from Week 12). Not a broadcast — individual emails. Something like: "We're public today — thank you for the feedback that made this better. Here's the announcement link if you want to share it."

---

## Day 2–3 — Social Posts & Directories (2–3 hrs)

### Step 4 — Post Your Twitter/X Thread

Post between **9–11am EST** or **7–9pm EST** for maximum reach.

1. Copy from `docs/TWITTER_DRAFT.md`
2. Attach the demo GIF to Tweet 1 — it autoplays and is the strongest hook
3. Post the full thread (don't schedule — post now while HN momentum is live)
4. Reply to every response within the first hour. The algorithm surfaces threads with high engagement in the first 60 minutes.
5. Pin the thread to your profile

> **Cross-pollinate carefully:** It's acceptable to post your HN link in your Twitter bio or as a reply to your own thread ("Also discussing on HN: [link]"). It is NOT acceptable to post "Please upvote on HN" anywhere.

### Step 5 — Post Your LinkedIn Article

LinkedIn organic posts decay slower than Twitter — this one can go a day after HN/PH without losing much.

1. Copy from `docs/LINKEDIN_DRAFT.md`
2. Add 3–5 of your best screenshots inline (LinkedIn displays inline images well)
3. Post and add 5 hashtags at the bottom: #AI #NoCode #ProductLaunch #SaaS #IndieHackers
4. Cross-post a condensed version (100 words max) to relevant LinkedIn groups: "AI Tools & Applications", "No-Code Community", "SaaS Founders"

### Step 6 — Submit to Directories

Work through this list over 2–3 hours. Most have simple forms. Your press kit has everything they'll ask for.

| Directory | URL | Priority |
|---|---|---|
| **There's An AI For That** | theresanaiforthat.com/submit | High — most traffic |
| **Futurepedia** | futurepedia.io/submit-tool | High |
| **AI Tools Directory** | aitoolsdirectory.com | Medium |
| **Toolify** | toolify.ai/submit | Medium |
| **TopAI.tools** | topai.tools/submit | Medium |
| **BetaList** | betalist.com | Medium |
| **Launching Next** | launchingnext.com | Low |
| **Ben's Bites** | newsletter — email a one-liner | High (if accepted) |
| **No-Code HQ** | nocodehq.com/submit | Medium |

**Directory submission template** (adapt for each form):

- **Name:** Rudderly
- **Short description (50 chars):** AI agent builder for non-developers
- **Long description (200 chars):** Rudderly lets anyone build, configure, and deploy AI agents without writing code. Create agents that search the web, run calculations, and answer questions — in under 5 minutes.
- **Category:** AI Tools / No-Code / Productivity / Automation
- **Website:** your production URL
- **Screenshot:** use `docs/press-kit/screenshots/screenshot-builder.png`
- **Demo/Video:** your Loom share link

---

## Day 4–7 — Read the Signal, Act Fast (2 hrs)

### Step 7 — 48-Hour Analytics Review

Open Vercel Analytics and Supabase and answer these specific questions with real data:

```
Traffic:
- Total unique visitors in first 48 hours?
- Traffic sources breakdown (HN? PH? Twitter? Direct?) — check UTM data in Supabase users table
- Landing page bounce rate?

Conversion:
- Landing page visitors → clicked signup: [%]
- Clicked signup → completed signup: [%]
- Signed up → created first agent: [%]  ← this is the most important number
- Created agent → started conversation: [%]
- Used free tier → viewed Pro upgrade page: [%]

Engagement:
- Average conversation length (messages per session)?
- Most-used template?
- Most-used tool (web search, calculator, etc.)?
- Total waitlist emails collected since launch?

Compare against LAUNCH_METRICS.md baseline:
- Registered users now vs. Week 12 baseline: +[N]
- Are the ratios better or worse than beta?
```

Ask Claude Code to help read the data:
> *"I have these analytics from my first 48 hours post-launch: [paste numbers]. My Week 12 baseline was: [paste from LAUNCH_METRICS.md]. What stands out as surprising or concerning? What's the single highest-leverage thing to fix or double down on based on this data?"*

### Step 8 — Read and Synthesise All Feedback

Read every HN comment, every PH comment, every Tally response submitted since launch. Open `docs/BETA_FEEDBACK.md` and add a "Post-Launch" section.

Ask Claude Code to synthesise:
> *"I have [N] pieces of feedback from launch day (HN comments + PH comments + Tally form responses). Here they are: [paste all feedback]. Please: (1) extract every distinct issue or request, (2) group by theme, (3) count frequency, (4) classify each as Bug / UX Confusion / Feature Request / Positive Signal / Marketing Signal. Rank by frequency × severity. Output the top 10 as a prioritised list."*

### Step 9 — Ship a Hotfix Within 48 Hours (if needed)

If 3+ people hit the same bug or confusion point — fix it today. A 48-hour hotfix signals that you're actively building and listening. Post a reply on HN and PH: "We just shipped a fix for [specific issue] based on your feedback — thank you."

```bash
git checkout -b fix/launch-[short-description]
# make the fix
git add -A
git commit -m "fix: [description] — reported by multiple users at launch"
git push origin fix/launch-[short-description]
# merge to main → auto-deploys to Vercel
```

### Step 10 — Begin Closed Beta Outreach

Now that the product is fully built and publicly launched, start personal outreach to 10–20 hand-picked early users. These aren't random signups — they're people you've chosen because they're in your target audience and will give honest feedback.

**Who to invite:** non-technical people (designers, marketers, small business owners, freelancers) who represent your target users. Avoid other developers. Avoid people who will just say "looks great!"

**The invite (personal email — not a mass blast):**

```
Subject: Want early access to something I built?

Hey [Name],

I recently launched Rudderly — a visual AI agent builder for non-developers.
The idea: describe what an agent should do, pick its tools, and publish it
in minutes. No code required.

It's live now and I'd love your honest take. Not looking for encouragement
— looking for what confuses you or breaks.

Try it: [your-production-url]
Feedback form: [your-production-url]/feedback

Takes about 20 minutes to build your first agent.

Thanks,
[Your name]
```

Personalise the opening line for each person. As feedback arrives, use `docs/BETA_FEEDBACK.md` (created in Week 12) to track and synthesise it. See the Week 12 guide for the Claude Code synthesis prompt.

### Step 11 — Write Your Launch Retrospective

Create `docs/LAUNCH_RETROSPECTIVE.md`:

```markdown
# Rudderly — Launch Retrospective

**Launch date:** [date]
**Written:** [date + 7 days]

## Numbers (First 7 Days)
- Total signups: [N] (baseline was [M])
- HN peak position: [N] · Total upvotes: [N] · Comments: [N]
- ProductHunt final votes: [N] · Final ranking: #[N] of the day
- Twitter/X thread impressions: [N] · Profile link clicks: [N]
- Landing page conversion (visit → signup): [%]
- Signup → first agent created: [%]
- Waitlist email blast open rate: [%]
- Pro upgrades in first 7 days: [N]

## What Worked (keep doing this)

## What Didn't Work (don't repeat)

## Most Surprising Thing

## Top 3 Feature Requests from Launch Feedback

## Immediate Priorities (next 2 weeks)
1. 
2. 
3. 
```

---

## ✅ Completion Checklist

Complete these before closing Week 18.

- [ ] Pre-launch sanity check passed — all pages and flows working
- [ ] Demo video and GIF verified/updated to match current UI
- [ ] Show HN post live at 8–10am EST (Tuesday or Wednesday)
- [ ] First HN comment with technical notes posted within 5 minutes
- [ ] ProductHunt post live (scheduled or submitted same day)
- [ ] Maker comment posted on PH within 5 minutes of going live
- [ ] Waitlist email blast sent via Resend Audiences
- [ ] Personal emails sent to beta users from Week 12
- [ ] Twitter/X thread posted with demo GIF
- [ ] LinkedIn post published
- [ ] At least 5 directories submitted
- [ ] 48-hour analytics review completed
- [ ] All launch feedback read and synthesised in `BETA_FEEDBACK.md`
- [ ] Hotfix shipped for any P0 launch bugs (if applicable)
- [ ] `docs/LAUNCH_RETROSPECTIVE.md` written and committed
- [ ] `docs/LAUNCH_METRICS.md` updated with Day 7 numbers vs. Week 12 baseline
- [ ] 10–20 personal beta outreach emails sent to hand-picked early users
- [ ] `docs/BETA_FEEDBACK.md` first entries added as responses arrive

---

## 🧪 Validation Tests

| Group | Test | Expected result |
|---|---|---|
| **Pre-launch** | `npm run build` on day before launch | Exits with 0 errors |
| **Pre-launch** | `npx tsc --noEmit` on day before launch | 0 TypeScript errors |
| **HN** | Check HN submission page after posting | Post live under "Show HN" with your first comment pinned |
| **HN** | Check post after 2 hours | At least 5 upvotes and 2 comments |
| **PH** | Check PH launch page | Product visible under today's launches with gallery and video |
| **Email** | Check Resend Broadcasts dashboard | Blast sent, open rate > 20% |
| **Social** | Twitter thread | Full thread posted, GIF autoplays on Tweet 1 |
| **Analytics** | Vercel Analytics | Traffic spike visible on Day 1 |
| **Analytics** | Supabase auth.users | At least 20 new signups in first 48 hours |
| **Retro** | `docs/LAUNCH_RETROSPECTIVE.md` | File exists, Day 7 numbers filled in |
| **Metrics** | `docs/LAUNCH_METRICS.md` | Post-launch numbers filled in alongside Week 12 baseline |

---

## 📚 Resources

- [Hacker News Show HN guidelines](https://news.ycombinator.com/showhn.html) — official rules and etiquette
- [ProductHunt maker guide](https://www.producthunt.com/posts/how-to-launch-on-product-hunt) — official launch checklist
- [There's An AI For That](https://theresanaiforthat.com) — highest-traffic AI directory
- [Resend Broadcasts documentation](https://resend.com/docs/dashboard/broadcasts/introduction) — how to send to your Audience list
- [Vercel Analytics](https://vercel.com/docs/analytics) — track traffic sources and conversion
- [Twitter/X analytics](https://analytics.twitter.com) — impressions, profile visits, link clicks per tweet
- [UTM builder (Google)](https://ga-dev-tools.google/campaign-url-builder/) — build tracking URLs for each channel so Supabase UTM data is clean

---

*Week 18 of 18 · Rudderly · Phase 6: Public Launch · Updated May 2026*
