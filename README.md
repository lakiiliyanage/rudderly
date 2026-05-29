# Rudderly

<!-- Demo GIF will be added in Week 16 after UX polish -->

**Rudderly — Build, share, and clone AI agents without writing code**

> Live Demo: _coming soon — Vercel URL here_

---

## Features

- **Visual 5-step builder** — name, personality, tools, documents, and publish in one flow; no code required
- **Tool integrations** — web search (Tavily), calculator, word counter, and Google Drive document reader built in
- **Conversation history** — every chat is persisted; pick up any previous conversation from the sidebar
- **Public sharing and cloning** — publish an agent to a shareable URL; visitors can clone it to their own account with one click
- **View counter** — public agent pages show how many conversations have been started

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) + TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Database + Auth | Supabase |
| AI | Claude API (claude-sonnet-4-6) |
| Payments | Stripe |
| Deployment | Vercel |
| Email | Resend |
| Rate limiting + cache | Upstash Redis |
| Error monitoring | Sentry |
| CI/CD | GitHub Actions |

---

## Quick Start

**Prerequisites:** Node.js v20+, a Supabase project, an Anthropic API key.

```bash
# Clone the repository
git clone https://github.com/lakiiliyanage/rudderly.git
cd rudderly

# Install dependencies
npm install

# Set up environment variables — create .env.local and fill in your keys

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/dashboard` | Your agents and activity |
| `/agents/new` | Visual agent builder |
| `/agents/[id]` | View, edit, and share an agent |
| `/share/[slug]` | Public agent page (no login required) |
| `/auth/login` | Sign in |
| `/auth/signup` | Create an account |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of releases.

---

Built by [Lakii](https://github.com/lakiiliyanage) — UX designer learning to build in public.
Timeline: April 2026 → July 2026
