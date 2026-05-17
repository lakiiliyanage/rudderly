# Contributing to AgentForge

Thanks for your interest in contributing. This guide covers everything you need to get a local environment running and open a pull request.

---

## Fork and clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/agentforge.git
cd agentforge

# Add the upstream remote so you can pull in future changes
git remote add upstream https://github.com/lakiiliyanage/agentforge.git
```

---

## Run locally

**Prerequisites:** Node.js v20+, a Supabase project, an Anthropic API key.

```bash
npm install

cp .env.example .env.local
# Fill in .env.local with your own keys (see .env.example for all required variables)

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Code style

- **TypeScript** — all new files must be `.ts` / `.tsx`; `npx tsc --noEmit` must pass
- **Tailwind v4** — style via utility classes in JSX; no `tailwind.config.js`
- **No comments on obvious code** — only add a comment when the *why* is non-obvious
- **No unused variables** — ESLint (`npm run lint`) must pass with zero errors
- **Server components by default** — only add `"use client"` when interactivity requires it

---

## Opening a pull request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and commit with a clear message:
   ```bash
   git commit -m "feat: describe what you added"
   ```
3. Push and open a PR against `main` on the upstream repo
4. In the PR description: what it does, how to test it, and any screenshots for UI changes

---

## What to work on

Check the open issues on GitHub for ideas. If you want to tackle something not listed, open an issue first to discuss it before investing time in the implementation.
