<!-- Week 12 baseline: DO NOT EDIT these numbers after initial fill-in. Add Week 18 post-launch numbers in the designated section only. -->

# Rudderly — Launch Metrics Baseline

**Snapshot date:** 2026-05-28  
**Phase:** Pre-launch / Closed Beta  
**Next comparison point:** Week 18 post-public-launch

---

## Infrastructure Health

| Check | Week 12 Baseline | Week 18 |
|---|---|---|
| TypeScript errors (`npx tsc --noEmit`) | 0 | |
| Production build (`npm run build`) | ✅ passing | |
| CI — GitHub Actions | ✅ green | |
| Vercel deployment | ✅ live | |
| Open Sentry errors | Resolve before beta invite | |

---

## Product Usage (Supabase — Production `gqqglsttnfkftsdcbcsz`)

| Metric | Week 12 Baseline | Week 18 |
|---|---|---|
| Registered users | 4 | |
| Monthly active users (last 30 days) | 4 | |
| Pro subscribers | 0 | |
| Agents created (total) | 9 | |
| Agents created (last 7 days) | 5 | |
| Public / shareable agents | 3 | |
| Conversations started | 3 | |
| Total messages sent | 5 | |
| Tool calls logged | 4 | |
| Avg tool response time | 32 ms | |
| Templates used | — (not live yet) | |

> First user registered: 2026-04-25 · Most recent: 2026-05-25

---

## Acquisition

| Metric | Week 12 Baseline | Week 18 |
|---|---|---|
| Waitlist signups (Supabase `waitlist` table) | 1 ¹ | |
| Tally feedback responses | 0 (form just launched) | |
| HN Show HN upvotes | — (not posted yet) | |
| Product Hunt votes | — (not listed yet) | |
| Product directory submissions | — (not submitted yet) | |

> ¹ The 1 existing waitlist row is a dev test email — real pre-launch signups = **0**.

---

## Vercel Analytics

*Pull from Vercel dashboard → Analytics tab after the first full week of traffic.*

| Metric | Week 12 Baseline | Week 18 |
|---|---|---|
| Weekly page views | [check Vercel] | |
| Unique visitors (weekly) | [check Vercel] | |
| Bounce rate — landing page | [check Vercel] | |
| Top page #1 | [check Vercel] | |
| Top page #2 | [check Vercel] | |
| Top page #3 | [check Vercel] | |
| Avg response time (p99) | [check Vercel] | |

---

## Page Performance (Lighthouse)

*Run against the live Vercel URL. Use Chrome DevTools → Lighthouse → Mobile.*

| Page | Metric | Week 12 Baseline | Week 18 |
|---|---|---|---|
| Landing (`/`) | Performance | [run Lighthouse] | |
| Landing (`/`) | Accessibility | [run Lighthouse] | |
| Landing (`/`) | SEO | [run Lighthouse] | |
| Landing (`/`) | LCP | [run Lighthouse] | |
| Agent builder (`/agents/new`) | Performance | [run Lighthouse] | |
| Share page (`/share/[slug]`) | Performance | [run Lighthouse] | |

---

## Week 18 Launch Targets

*Set now so the comparison is honest — fill actual numbers in the Week 18 column above.*

| Metric | Target |
|---|---|
| Signups in first 7 days after launch | 50 |
| Waitlist → signup conversion rate | 30% |
| HN Show HN upvotes | 50 |
| Product Hunt votes (Day 1) | 100 |
| Weekly active users | 25 |
| Agents created (post-launch week) | 30 |
| Tally feedback responses | 10 |

---

## Notes

- **Waitlist baseline is 0** — 1 row exists but it's a dev test entry (`waitlist-test-*@example.com`). Purge it before the public launch announcement.
- **Templates not yet live** — that metric will start counting from whenever the template gallery ships.
- **MAU = registered users right now** because all 4 users are active; this ratio will drop as the user base grows — track separately once you have 50+ users.
- **Tool call count is low** because most test conversations were short; this will grow quickly once real users start multi-step workflows.
- **Sentry** — check the Sentry dashboard for any open issues before sending beta invites. Zero errors in production is the pre-invite bar.

---

*Created Week 12 · Updated 2026-05-28 · Compare against Week 18 post-launch numbers*
