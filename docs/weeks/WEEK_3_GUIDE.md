# Week 3 Guide — Git Mastery + Your Project Scaffolded 🏗️

> **Goal:** Commit Git to muscle memory, scaffold a professional Next.js project structure for AgentForge, and ship the first real pages of your app — a landing page, navbar, footer, and environment setup.
> **Time:** 7–9 hours total — Saturday 3pm–7pm (4 hrs) + Sunday 3pm–6pm (3 hrs) + stretch tasks (+2 hrs if you have them)
> **Prerequisite:** Week 2 complete — you can read a React component, modify it without panic, and have Tailwind intuitions activated

---

## Why This Week Matters

Week 1 got your tools installed. Week 2 got your brain tuned to code. Week 3 is where your actual product begins to exist.

By Sunday night you'll have a folder on your computer and a URL on GitHub that says: **this is AgentForge**. It will have a real landing page, a professional folder structure, a navbar, a footer, and environment variables set up — ready for the database and AI work that starts in Week 4.

This is also the week Git goes from "confusing version control thing" to second nature. Every developer you'll ever work with uses Git constantly. Getting it into muscle memory now means you'll never lose work and you'll collaborate confidently.

**The Git mental model for designers:** think of Git like Figma's Version History, but with superpowers. Every `commit` is a named save state you can return to. Every `branch` is a duplicate file you can experiment on without touching the original. Every `push` sends your work to the cloud. The commands feel cryptic at first — but there are only about 8 you'll use 95% of the time, and you'll do them today.

---

## 7–9 Hour Overview

| Session | Hours | Focus |
|---------|-------|-------|
| Saturday 3–5pm | 1–2 | Git fundamentals — the 8 commands, branches, and commit hygiene |
| Saturday 5–7pm | 3–4 | Scaffold AgentForge with Claude Code, explore the folder structure |
| Sunday 3–5pm | 5–6 | Build the real AgentForge landing page + component architecture |
| Sunday 5–6pm | 7 | Environment variables + Next.js App Router deep dive |
| Stretch (+1–2 hrs) | 8–9 | Git muscle memory drills + design polish |

---

## What You're Learning This Week

| Concept | What it is | Why you need it |
|---------|------------|-----------------|
| Git branches | Parallel versions of your code | Safe experimentation without breaking what works |
| Git commits | Named save snapshots | Every state of your app is recoverable |
| Pull requests | Proposed code changes for review | How teams collaborate before merging code |
| Next.js scaffold | The skeleton of your full app | All 12 weeks of building happen inside this structure |
| App Router | Next.js routing system (file = URL) | How your pages connect to each other |
| `.env.local` | Environment variable file | Keeps API keys out of your public code |
| Component architecture | Organised folder structure for UI pieces | Makes your codebase navigable and reusable |

---

## Hours 1–2: Git — The 8 Commands That Rule Everything

### The Core Loop (do this until automatic)

Every coding session follows this loop:

```bash
git status          # → What has changed since my last save?
git diff            # → Show me exactly what changed line by line
git add .           # → Stage all changes (queue them for saving)
git commit -m "msg" # → Save a named snapshot
git push            # → Upload to GitHub
```

That's it. That's 80% of what you'll do with Git every day.

### Setting the Scene

Open your terminal, navigate to your `agentforge` folder, and make sure you're starting clean:

```bash
cd ~/agentforge
git status
```

You should see either "nothing to commit" or a list of untracked files from Week 2 experiments. If you have leftover files from Week 2, commit them now with a message like `"chore: week 2 experiments"` before continuing.

### Task 1 — Your First Branch

Branches are the feature that makes Git genuinely powerful. The concept: `main` is your stable, working code. You never experiment directly on `main`. You create a branch, make changes, and only merge back when it's ready.

```bash
git checkout -b feature/week3-scaffold
```

This creates a new branch called `feature/week3-scaffold` and switches you to it. You're now working on a copy — `main` is untouched.

Verify it worked:
```bash
git branch
```

You'll see a list of branches with a `*` next to your current one.

**Design analogy:** `main` is your master Figma file. A branch is a "duplicate" of that file that you can freely experiment on. When it's good, you merge the duplicate's changes back into the master.

### Task 2 — Write Good Commit Messages

Bad commit message: `"update"` or `"fix stuff"` or `"asdfgh"`

Good commit messages follow a simple convention:

```
type: short description of what changed

Types:
feat:     a new feature
fix:      a bug fix
chore:    maintenance (install packages, config)
style:    visual/formatting changes only
refactor: code restructure, no behaviour change
docs:     documentation
```

Examples of good commits:
- `feat: add AgentForge landing page hero section`
- `chore: scaffold Next.js 16 project with TypeScript`
- `fix: correct navbar link to dashboard page`
- `style: apply dark theme to auth pages`

You'll thank yourself in Week 9 when you're writing your GitHub README and can read a clear commit history.

### Task 3 — Fix New Branch Pushes Once and For All (do this first)

Before running the practice loop, run this one-time setup command:

```bash
git config --global push.autoSetupRemote true
```

This tells Git: *"whenever I push a new branch for the first time, automatically link it to GitHub — no flags needed."*

From now on, `git push` on any new branch just works. No more `fatal: The current branch has no upstream branch` errors. You'll never need to type `git push -u origin branch-name` manually again.

Verify it saved:
```bash
git config --global push.autoSetupRemote
# should print: true
```

> **Why this isn't the default:** Git is conservative by design — it won't push to a remote unless you've explicitly told it where. The `push.autoSetupRemote` flag changes that behaviour permanently for your machine. It's safe and almost universally recommended for solo developers.

---

### Task 3b — Practice the Full Loop

Now make a tiny change — add a comment to any file — then run the full loop:

```bash
git status        # should show the modified file
git diff          # press q to exit the diff viewer
git add src/components/practice/MessageCounter.tsx   # stage only what you changed
git commit -m "docs: practice commit from week 3"
git push          # works automatically now — no -u flag needed
```

> **Stage specific files, not `git add .`** — `git add .` stages everything changed, including files you didn't intend to touch. Get into the habit of staging by filename. When you're certain every changed file belongs in the same commit, `git add .` is fine — but always run `git status` first so there are no surprises.

### Task 4 — Merge It Back to Main

```bash
git checkout main                    # switch back to main
git merge feature/week3-scaffold     # bring the branch changes in
git push                             # push main to GitHub
git branch -d feature/week3-scaffold # clean up the branch
```

Check your history after:
```bash
git log --oneline
```

You'll see every commit in a single clean line each. A readable history is a sign of a professional project.

> **Pull Requests (PRs):** On GitHub, instead of merging locally like above, teams often use Pull Requests — you push your branch to GitHub, then open a PR in the browser where teammates can review it before it merges. This is the standard team workflow and what you'll use when working with collaborators in later weeks.

---

## Hours 3–4: Scaffold AgentForge with Claude Code

This is the moment your project gets real. You're replacing the Week 1 placeholder folder with a professional, production-ready Next.js project structure.

### Task 5 — Scaffold the Full Project

Open Claude Code in your terminal from the `agentforge` folder:

```bash
claude
```

Then give it this prompt — copy it exactly:

> *"Create a new Next.js 16 project in this folder with TypeScript, Tailwind CSS v4, and the App Router enabled. Set up the folder structure for a SaaS app with the following routes: a landing page at `/`, a dashboard at `/dashboard`, an auth section at `/auth/login` and `/auth/signup`, and an agents section at `/agents/new` and `/agents/[id]`. Create placeholder page.tsx files for each. Add a `src/components/` folder with `ui/` and `layout/` subdirectories. Include a README.md with a brief description of the project."*

Claude Code will generate a significant amount of file structure. Let it run completely before you touch anything.

### Task 6 — Explore What Claude Code Built

Once it's done, ask Claude Code to explain the folder structure:

> *"Walk me through every folder and file you just created. Explain what each one does and when I'd touch it while building AgentForge."*

Then manually open each folder in VS Code and read the explanation as you look at the actual file. The goal is to build a mental map — not memorise, just orient.

Key things to understand:

**`src/app/` — The App Router directory**
Every folder inside here is a URL. `src/app/dashboard/page.tsx` = the page at `yoursite.com/dashboard`. This is the core mental model for Next.js. No configuration needed — just create a folder with a `page.tsx` and you have a route.

**`src/components/` — Your reusable UI pieces**
Anything you build more than once lives here. The `ui/` subfolder is for atomic components (Button, Card, Badge). The `layout/` subfolder is for page-level wrappers (Navbar, Footer, Sidebar).

**`src/app/layout.tsx` — The master wrapper**
This file wraps every page in your app. Whatever you put here — your Navbar, your global fonts, your dark theme — appears everywhere. It's like the master layout in Figma that every frame inherits from.

**`public/` — Static assets**
Images, SVGs, fonts that don't need processing go here. Reference them as `/logo.svg` not with a relative path.

**`globals.css` — Tailwind customisation (Tailwind v4)**
In older tutorials you'll see a `tailwind.config.ts` file — Tailwind v3 required one to tell it where your files were. Tailwind v4 (which your Next.js 16 project uses) removes it entirely. Configuration now lives in `src/app/globals.css`. Open it and you'll see:
```css
@import "tailwindcss";
```
That single line replaces the entire config file. When you need to add custom brand colours or fonts in later weeks, you add them here — not in a separate config file. So if you can't find `tailwind.config.ts`, that's correct — it doesn't exist in your project.

**`.gitignore` — Files Git ignores**
`node_modules/`, `.env.local`, and build files are listed here. Never manually delete from `.gitignore`.

### Task 7 — Commit Your Scaffold

```bash
git add .
git commit -m "chore: scaffold Next.js 16 project for AgentForge"
git push
```

Check GitHub — you should see all the new files there.

---

## Hours 5–6: Build the Real AgentForge Landing Page

This is where your UX instincts kick in. You're not just scaffolding — you're building the first real screen someone will see.

### Task 8 — Build the Landing Page

Ask Claude Code:

> *"Replace `src/app/page.tsx` with a real AgentForge landing page. Include: a hero section with the headline 'Build AI Agents Without Code', a subtitle 'The visual, no-code builder for non-developers. Create, configure, and share AI agents in minutes.', and two CTA buttons — 'Get Started Free' (primary, links to /auth/signup) and 'View on GitHub' (secondary, links to #). Below that, a features section with three cards: 'Visual Builder' (users point and click to configure agents, no syntax required), 'Tool Integrations' (connect web search, email, calendar, and more), and 'Shareable Links' (share any agent with a public URL — anyone can use it). Use a dark theme throughout. Use Tailwind CSS for all styling. Make it polished."*

Let it run. Then open `localhost:3000` (run `npm run dev` in your terminal if it's not already running) and look at what it built.

### Task 9 — Make Two Design Changes Yourself

This is important: do NOT ask Claude Code to make these changes. Do them yourself.

Look at the landing page and pick two things to change — maybe:
- The hero headline colour (try `text-violet-400` instead of whatever it generated)
- The card border radius (try `rounded-2xl`)
- The button padding (try `px-8 py-4`)
- The background gradient (try `from-slate-950 to-slate-900`)

Find the relevant Tailwind class in the code, change it, save the file, watch the browser hot-reload. Repeat until you feel what it's like to edit a real component.

> **Why this matters:** The act of making a small manual change builds the most important skill you'll need as a non-developer founder — confidence that the code is yours to touch, not a fragile thing to leave alone.

### Task 10 — Explain the Code Back to Yourself

Pick any one section of the generated `page.tsx` and ask Claude Code:

> *"Explain this component section by section like I'm a designer who understands logic but not syntax: [paste the section]"*

Then write three sentences in your own words (in a comment at the top of the file if you like) describing what it does. This forces you to actually absorb it rather than just skim.

---

## Hour 6 (continued): Build the Navbar and Footer Components

### Task 11 — Build the Navbar

Ask Claude Code:

> *"Build a `Navbar` component at `src/components/layout/Navbar.tsx`. It should contain: the AgentForge logo (text-based for now — 'AgentForge' with a small icon or emoji before it), navigation links to Home (`/`), Dashboard (`/dashboard`), and GitHub (external, opens in new tab), and a 'Get Started' CTA button that links to `/auth/signup`. Use a dark background, sticky positioning so it stays at the top while scrolling, and a subtle bottom border. Mark it as a client component with 'use client' at the top."*

### Task 12 — Build the Footer

Ask Claude Code:

> *"Build a `Footer` component at `src/components/layout/Footer.tsx`. It should show: the Rudderly name and a one-line description, links grouped into two columns — Product (Dashboard, Explore, Pricing) and Company (Changelog, Feedback, Press) — and a bottom row with copyright text and 'Built with Claude API'. Dark background, clean layout."*

### Task 13 — Wire Them Into the Layout

Open `src/app/layout.tsx`. Ask Claude Code:

> *"Import and add the Navbar and Footer components to `src/app/layout.tsx` so they appear on every page. Make sure the main content area has appropriate top padding to account for the sticky navbar."*

Open `localhost:3000` and navigate between pages — the navbar and footer should appear everywhere.

---

## Hour 7: Environment Variables + App Router Deep Dive

### Task 14 — Set Up Environment Variables

Environment variables are how you keep secrets out of your code. API keys, database URLs, payment keys — none of these ever go in your actual code files. They go in a special file called `.env.local` that Git ignores.

**Step 1 — Create the file:**

```bash
touch .env.local
```

**Step 2 — Open it in VS Code:**

```bash
code .env.local
```

**Step 3 — Paste in these placeholder values and save (`Cmd + S`):**

```
# Supabase (Week 4)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Anthropic (Week 6)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Stripe (Week 10)
STRIPE_SECRET_KEY=your_stripe_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_here
```

These are placeholders — you'll replace them with real values when you set up each service (Supabase in Week 4, Anthropic in Week 6, Stripe in Week 10). Having the keys named and ready now means you won't have to hunt for the right variable name later.

**Step 4 — Confirm it's gitignored:**

Open `.gitignore` in VS Code (or run `cat .gitignore` in terminal). Look for this line:

```
.env*
```

You won't see `.env.local` listed explicitly — Next.js uses the wildcard `.env*` instead, which covers `.env.local`, `.env.development`, `.env.production`, and any other `.env` file you ever create. This is broader and better than listing each file individually.

Confirm it's working by running `git status` — `.env.local` should **not** appear in the list of tracked or changed files. If it does appear, add `.env.local` manually to `.gitignore` on its own line and run:

```bash
git rm --cached .env.local
```

That removes it from Git's tracking without deleting the file from your computer.

**Step 5 — Ask Claude Code to explain what you just set up:**

> *"Explain what `.env.local` is for in Next.js, what is the difference between `NEXT_PUBLIC_` prefixed variables and regular ones, and what would happen if I accidentally pushed API keys to GitHub? Use my AgentForge setup as the example."*

> **The rule:** secret → no `NEXT_PUBLIC_` prefix, never commit it. Public config (like a Supabase URL or Stripe publishable key) → `NEXT_PUBLIC_` prefix is fine. When in doubt, leave the prefix off — it's always safer for a value to be server-only.

### Task 15 — Next.js App Router: The Four Special Files

Ask Claude Code to explain all four — but you'll only **build** `loading.tsx` this week:

> *"Explain the difference between `layout.tsx`, `page.tsx`, `loading.tsx`, and `error.tsx` in the Next.js App Router. Show me a simple example of each one and explain when Next.js uses each file."*

**What each file does and when you build it:**

| File | What it does | When you build it |
|------|-------------|------------------|
| `layout.tsx` | Wraps every page — Navbar and Footer live here | Done — already wired up in Task 13 |
| `page.tsx` | The actual page content at a given URL | Done — every route has one |
| `loading.tsx` | Shown automatically while a page is loading | **Today — Task 15** |
| `error.tsx` | Shown if a page crashes — catches errors gracefully | Week 11 — custom error pages |

**Now build `loading.tsx` only:**

1. Ask Claude Code:
   > *"Create a `loading.tsx` for the dashboard page at `src/app/dashboard/loading.tsx` — a full-page centred loading spinner using Tailwind's `animate-spin` class"*

2. Navigate to `localhost:3000/dashboard` — you'll see the spinner briefly as the page renders.

3. Ask Claude Code: *"What is the purpose of having a `loading.tsx` separate from the page? How does this improve perceived performance for users?"*

> **Don't create `error.tsx` yet.** It's worth knowing it exists, but building it properly (with AgentForge branding and a retry button) is a Week 11 task.

---

### Task 16 — Commit Everything from Today

Before stretch tasks, commit all the work from Hour 7:

```bash
git add .
git commit -m "feat: env variables setup and dashboard loading state"
git push
```

Then check your full history:

```bash
git log --oneline
```

You should see a clean record of today's work — scaffold, landing page, navbar, footer, env setup, loading state. That's a solid Week 3.

---

## Stretch Tasks (+1–2 hrs, if you have them)

### Git Muscle Memory Drills (30 min)

Run through this sequence **twice** without looking at notes:

```bash
# Round 1: Create → Edit → Commit → Push → Merge
git checkout -b feature/test-run-one
# Make any tiny edit to any file
git status
git diff          # press q to exit
git add .
git commit -m "test: muscle memory drill one"
git push          # no -u flag needed — autoSetupRemote handles it
git checkout main
git merge feature/test-run-one
git branch -d feature/test-run-one
git push

# Round 2: Same thing with feature/test-run-two
```

Then run:
```bash
git log --oneline
```

You should see a clean history of meaningful commit messages. This is what your GitHub repo will look like when contributors come to evaluate it in Week 9.

### Build a Reusable Button Component (30 min)

Ask Claude Code:

> *"Build a reusable `Button` component at `src/components/ui/Button.tsx`. It should support: a `variant` prop with values 'primary', 'secondary', and 'ghost', a `size` prop with values 'sm', 'md', 'lg', an optional `href` prop that renders an anchor tag instead of a button, and a `disabled` prop. Use Tailwind for all styles. Show all variants in a demo."*

**Then replace the hardcoded buttons on your landing page:**

1. Add this import at the top of `src/app/page.tsx` (if not already there):
   ```tsx
   import Button from "@/components/ui/Button"
   ```

2. Find the CTA buttons section (the `{/* CTA buttons */}` comment) and delete the two hardcoded elements inside the wrapper div — the `<Link>` and the `<a>` tag with all their Tailwind classes.

3. Replace them with:
   ```tsx
   <Button variant="primary" size="lg" href="/auth/signup">
     Get Started Free
   </Button>
   <Button variant="secondary" size="lg" href="#">
     View on GitHub
   </Button>
   ```

4. Keep the wrapping `<div className="flex flex-col sm:flex-row items-center justify-center gap-3">` — it controls the layout between buttons, not the button styles themselves.

5. Remove `import Link from "next/link"` from the top of the file since you're no longer using `<Link>` directly.

Notice how much cleaner the code is — 30+ Tailwind classes replaced with two clear prop-driven lines. Change button styles across the whole app by editing `Button.tsx` once. This is the practical payoff of the Week 2 props/state mental model.

### Responsive Check (30 min)

In Chrome, open DevTools (F12) and click the device toolbar icon (looks like a phone/tablet). Check your landing page at:
- iPhone SE (375px wide)
- iPad (768px wide)
- Desktop (1280px wide)

Find any layout issues (text overflowing, buttons too cramped, cards stacking badly) and ask Claude Code to fix them. This is where Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) become real — not abstract. Ask Claude Code to explain any responsive class it adds.

---

## The Mental Models to Lock In This Week

**Git is a time machine, not a file syncer.** Every commit is a named moment you can return to. Push is just uploading that time machine to the cloud. Branches are parallel timelines. Merging is collapsing two timelines into one.

**Next.js folder = URL.** `src/app/agents/new/page.tsx` → `yoursite.com/agents/new`. That's the whole routing system. No config files, no router setup. Just create a folder.

**`layout.tsx` is the master frame.** Your navbar and footer live here. Everything wrapped inside `{children}` is the page-specific content. Change the layout once → it applies everywhere.

**`.env.local` is sacred.** It never gets committed. It never gets shared. It's the vault where secrets live. Future you will be grateful that past you treated this seriously.

**Components are the unit of work.** Everything you build is either a page (in `src/app/`) or a component (in `src/components/`). Pages are composed of components. When something gets used twice — it becomes a component.

---

## What the AI Ecosystem Looks Like From Here

Now that you're in a real Next.js project, it's worth knowing what else is out there:

**LangChain.js** — A framework for chaining AI calls. Think of it as a library of pre-built "blocks" for common AI patterns (search → summarise → respond). It's powerful but complex. You'll touch it in Phase 3 if you want multi-step agent chains beyond what Claude's native tool use provides. For now, Claude API alone is more than enough.

**LlamaIndex** — Specialises in letting AI read *your own documents* — PDFs, Notion pages, Google Docs. Powerful for building knowledge-base agents. Not needed until well after launch.

**Hugging Face** — A massive library of AI models (image generation, text classification, speech recognition). When you eventually want to add features beyond language (like analysing uploaded images or generating thumbnails for agents), this is where you'll look.

**OpenAI SDK** — Structurally almost identical to Claude API. Parameters are slightly different, but the mental model — system prompt + user messages + tool definitions — is the same. Learning Claude API deeply makes the OpenAI SDK trivial to pick up later, which matters if Rudderly eventually supports multiple AI providers.

For now, everything you build in Weeks 6–12 uses Claude API. It's the most capable model available and the simplest to start with.

---

## Resources for This Week

> **These are reference docs — not things to install.** Your environment is already set up. Use these links when you hit something you don't understand while building, not as step-by-step guides to follow.

- **Git visual explainer** (best one on the internet): https://learngitbranching.js.org — spend 20 minutes here, it will solidify everything
- **Next.js App Router docs**: https://nextjs.org/docs/app — specifically the "Routing Fundamentals" page. Not the installation guide — you're already installed.
- **Tailwind responsive design**: https://tailwindcss.com/docs/responsive-design
- **Environment variables in Next.js**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

---

## Claude Code Prompts Reference — Week 3

Save these for when you get stuck or want to go deeper.

**To understand any generated code:**
> *"Explain what this component does, section by section, like I'm a UX designer who understands design systems and component thinking but is still learning code syntax: [paste code]"*

**To fix a layout issue:**
> *"The [navbar/hero/cards] layout breaks on mobile — the [describe the issue]. Fix it using Tailwind's responsive prefixes. Explain each responsive class you add."*

**To understand a Next.js concept:**
> *"I'm learning Next.js App Router. Explain [concept] to me with a concrete example from AgentForge — not a generic todo app."*

**To debug a Git issue:**
> *"I ran [command] and got this error: [paste error]. What does this mean and how do I fix it? Don't just give me the command — explain why it happened."*

---

## Milestone Check ✅

By end of Week 3 you should be able to:

- Run `git status → git add . → git commit → git push` without thinking
- Create a branch, make changes, and merge it back to main
- Read your AgentForge folder structure and explain what each folder is for
- Open `localhost:3000` and see a real, styled landing page with working navbar and footer
- Explain what `.env.local` is for and why it never goes in Git
- Describe the difference between `layout.tsx` and `page.tsx`

**If you can do all of those: Week 3 is done. You're ready for Supabase in Week 4.**

---

## What's Coming in Week 4

Next week you connect your app to a real database. Users will be able to sign up, log in, and have their data saved. You'll learn what SQL is (it's simpler than it sounds), set up Supabase auth, and by the end of the weekend you'll have a working login page with real user accounts stored in a real database.

The landing page you built this week will have real users signing up to it by Week 9.

---

*Week 3 of 12 · AgentForge · Phase 1: Foundations*
*Built with Claude Code + Cowork by Lakii*
