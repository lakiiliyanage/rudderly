# 🎨 Week 7 — The Visual Agent Builder UI

**Phase:** 3 — Building the Product
**Dates:** Add your own start date
**Total time:** 8–10 hrs core · +4–5 hrs stretch
**Goal:** Replace the basic "Create Agent" form with a beautiful, step-by-step visual builder — the experience that makes AgentForge feel like a real product, not a developer prototype. This is where your UX superpower pays off.

---

## 📋 Before You Start

Run these commands in your terminal to confirm your environment is healthy before touching any new code.

```bash
# Navigate into your project folder
cd agentforge

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see your app. Then run a quick smoke test (a smoke test is a fast check that the critical path works — like checking the lights turn on before inspecting the wiring):

1. **Log in** — confirm your Supabase auth still works
2. **Create a test agent** using the existing form — confirm it saves to Supabase
3. **Chat with that agent** — confirm the Claude API route still returns a response

If all three work, you're ready. If any are broken, paste the error into Claude Code before starting: *"Before I begin Week 7, my [login/agent save/chat] is broken — here's the error: [paste error]. Fix this first."*

---

## 🧠 Key Concepts for This Week

Before you write a single line, read this table. These are the mental models you'll use all week.

| Concept | What it is | Design analogy |
|---|---|---|
| **Component library** | A collection of pre-built, styled UI pieces (buttons, cards, dialogs) you install and use like LEGO bricks | Like using a Figma UI kit — you don't redraw every button from scratch |
| **shadcn/ui** | A component library that copies component code *into your project* so you can customise every pixel | Like having an editable Figma UI kit, not a locked library — you own the source |
| **Multi-step form / wizard** | A long form broken into distinct pages/steps, showing only one section at a time | Like a Figma prototype with separate screens wired together as a user flow |
| **Step state** | A variable (a stored value in your component) that tracks which step the user is currently on | Like a Figma prototype's "current screen" — determines what's shown |
| **JSON config object** | A structured piece of data (like a settings file) that stores all the agent's options in one place | Like a design token file in Figma — one source of truth for all the values |
| **localStorage** | A small storage space in the user's browser that persists between page reloads — survives closing a tab | Like Figma auto-saving your work to the cloud while you type — nothing is lost if you accidentally close |
| **Framer Motion** | A React animation library for smooth transitions, slide-ins, and fade effects | Like Figma's Smart Animate — defines how elements move between states |
| **Responsive prefix (Tailwind)** | Prefixes like `sm:`, `md:`, `lg:` that apply styles only at certain screen widths | Like using different Figma frames for mobile, tablet, and desktop in the same component |
| **Preview panel** | A live side panel showing what the agent looks like based on current builder settings | Like Figma's inspect panel — shows the current state in real time as you configure |

---

## 🔐 HTTP Status Codes Reference

You'll use these when building the "test agent" API call inside the builder (the preview before saving).

| Code | Name | Meaning | When to use |
|------|------|---------|-------------|
| 200 | OK | Request succeeded | Generic success |
| 400 | Bad Request | Client sent bad/incomplete data | Missing required fields in the builder |
| 401 | Unauthorised | Not logged in | No valid Supabase session |
| 403 | Forbidden | Logged in but not allowed | User trying to preview another user's agent |
| 404 | Not Found | Resource doesn't exist | Agent ID not found in Supabase |
| 500 | Internal Server Error | Server-side failure | Claude API down, unhandled crash |

---

## 🌐 HTTP Request Types Reference

The builder will use `POST` when saving a new agent config to Supabase, and `PATCH` when updating an existing draft.

| Request type | Intention | Real-world analogy | When used |
|---|---|---|---|
| GET | "Give me data" | Reading a menu | Loading the existing agent config to edit |
| POST | "Here is new data, store it" | Placing a new order | Saving a brand-new agent |
| PUT / PATCH | "Update existing data" | Changing an existing order | Updating a draft or editing a saved agent |
| DELETE | "Remove this data" | Cancelling an order | Deleting an agent |

---

## ⚙️ Session 1 — Saturday 3–5pm (Hours 1–2): Install shadcn/ui + Redesign the Builder Page Structure

### Step 1 — Install shadcn/ui

shadcn/ui is different from most component libraries. Instead of importing from an external package (like a locked Figma library), it copies the component source code *directly into your project* — so you can read, edit, and customise every piece. This is intentional: you own your UI.

Ask Claude Code:
> *"Install shadcn/ui in my Next.js project. Walk me through the setup command, what each option means, and confirm the default `components.json` configuration is correct for our Tailwind + TypeScript setup. After installation, add these 5 components: Button, Card, Dialog, Badge, and Progress. Show me where the files land in the project."*

After installation, open one of the generated component files (e.g. `src/components/ui/button.tsx`) and just read it for 2 minutes. Notice how it's real React code you could change — not a black box. Ask Claude Code: *"What is shadcn/ui and how is it different from regular component libraries like MUI or Ant Design? Why do developers prefer copying component code into the project?"*

---

### Step 2 — Plan the Builder Before You Build It

**This step has no code.** You are not opening your terminal. You are not touching Supabase. You are spending 15 minutes understanding what the builder collects — because when Claude Code asks "what data should this form capture?", you need to know the answer before it starts generating.

This is the step most developers skip, and it's why their UIs become unmanageable. You're a UX designer — use that skill here.

Think of it like a Figma onboarding flow — 5 screens, each asking the user something different:

| Screen | Title | What the user does | What gets saved |
|---|---|---|---|
| 1 | Choose type | Select one of 4 agent archetypes | `type: "research"` |
| 2 | Define personality | Set tone sliders + add example phrases | `tone: 70, verbosity: 40, examplePhrases: [...]` |
| 3 | Add capabilities | Toggle switches for tools | `webSearch: true, calculator: false` |
| 4 | Set limits | Max message length, topics to avoid | `maxMessageLength: 1000, avoidTopics: [...]` |
| 5 | Name & test | Name the agent, preview it, save | `name: "My Research Bot"` |

When the user clicks **Save** on screen 5, all of that gets bundled into **one JSON object** (a structured data format — like a settings file with labelled values) and saved to a single column in Supabase. That object looks like this:

```json
{
  "type": "research",
  "personality": {
    "tone": 70,
    "verbosity": 40,
    "examplePhrases": ["Let me look that up for you"]
  },
  "capabilities": {
    "webSearch": true,
    "email": false,
    "calendar": false,
    "calculator": true
  },
  "limits": {
    "maxMessageLength": 1000,
    "avoidTopics": ["politics", "religion"]
  }
}
```

Once you understand that all 5 screens feed into that single object, you're done with Step 2. Move on.

---

### Step 3 — Set Up the TypeScript Types for the Builder

**Before running anything:** Check whether a `config` column already exists in your Supabase `agents` table. Open your Supabase dashboard → Table Editor → `agents` table and look at the column list. If you see a `config` column with type `jsonb`, the database part is already done — skip Part A below and go straight to Part B.

---

**Part A — Add the `config` column (skip if it already exists)**

If the column does not exist, ask Claude Code:
> *"Write a Supabase SQL migration to add a `config` column of type `jsonb` (JSON Binary — Postgres's format for storing structured JSON data with indexing support) to the `agents` table with a default of `'{}'::jsonb` (an empty JSON object — `::jsonb` is Postgres cast syntax, meaning 'treat this string as a jsonb value'). Run the migration. Make sure RLS (Row Level Security — the Supabase rules that control who can read/write which rows) still applies to this column."*

---

**Part B — Create the shared TypeScript types (always required)**

Your codebase currently has a minimal `AgentConfig` type defined locally inside `src/app/agents/[id]/page.tsx` — it only has `personality` and `goal` as simple strings. That needs to be replaced with the full builder structure, and moved to a shared location so all files can import it.

Ask Claude Code:
> *"I already have a `config jsonb` column in my Supabase `agents` table — no migration needed. But I need the TypeScript types set up properly:*
>
> *1. Create a new file `src/lib/types/agent.ts` with an `AgentConfig` interface:*
>
> ```typescript
> export interface AgentConfig {
>   type: 'customer-support' | 'research' | 'personal-assistant' | 'custom';
>   personality: {
>     tone: number;        // 0–100 (0 = very formal, 100 = very casual)
>     verbosity: number;   // 0–100 (0 = very concise, 100 = very detailed)
>     examplePhrases: string[];
>   };
>   capabilities: {
>     webSearch: boolean;
>     email: boolean;
>     calendar: boolean;
>     calculator: boolean;
>   };
>   limits: {
>     maxMessageLength: number;
>     avoidTopics: string[];
>   };
> }
> ```
>
> *2. Also export an `Agent` interface representing a full row from the `agents` Supabase table: `id` (string), `user_id` (string), `name` (string), `description` (string), `config` (typed as `AgentConfig`), `is_public` (boolean), `created_at` (string), `updated_at` (string).*
>
> *3. Delete the local `type AgentConfig` defined in `src/app/agents/[id]/page.tsx` and replace it with an import from `src/lib/types/agent.ts`.*
>
> *4. Search the whole `src/` folder for any other local `AgentConfig` or `Agent` types and update those to import from the shared file too.*"*

This is the TypeScript equivalent of a single source of truth — like a shared Figma library. Every part of your app will use the same `AgentConfig` definition so they can never drift out of sync.

---

### Step 4 — Scaffold the Multi-Step Builder Component

Now ask Claude Code to build the step-by-step builder as a new page. Don't build the whole thing at once — scaffold the structure first, then fill each step.

Ask Claude Code:
> *"Create a new page at `src/app/agents/new/page.tsx` that replaces the current 'Create Agent' form with a 5-step visual builder. For now, scaffold the structure only — each step can show a placeholder heading and a 'Next' button. Requirements:*
>
> 1. *Use a `currentStep` state variable (a React state value — a variable managed by React that re-renders the component when it changes) to track which step (1–5) the user is on.*
> 2. *Show a `Progress` component from shadcn/ui at the top indicating '2 of 5 steps', '3 of 5 steps', etc.*
> 3. *Show 'Back' and 'Next' buttons at the bottom — 'Back' is hidden on step 1, 'Next' becomes 'Save Agent' on step 5.*
> 4. *Store all the user's choices in a single `agentConfig` state object matching the `AgentConfig` TypeScript interface.*
> 5. *Wrap each step in a `Card` component from shadcn/ui.*
> 6. *Do not connect to Supabase or Claude yet — just get the navigation working.*"

Test it: open the page, click through all 5 steps, confirm the progress bar advances and the Back/Next buttons work. If anything is broken, paste the error: *"My builder scaffolding has this error: [paste error]."*

---

## 💾 Commit Checkpoint — Scaffold + shadcn/ui Setup Complete

You've installed shadcn/ui and have a working 5-step navigation scaffold. This is a clean, stable base — commit it before building the individual steps.

```bash
git add -A
git commit -m "feat: install shadcn/ui and scaffold 5-step visual agent builder"
```

---

## ⚙️ Session 2 — Saturday 5–7pm (Hours 3–4): Build Steps 1–3

### Step 5 — Agent Type Selector

Ask Claude Code:
> *"Build Step 1 of the agent builder: a type selector. Use 4 `Card` components from shadcn/ui arranged in a 2×2 grid. Each card should show:*
> - *An emoji icon (🤝 Customer Support, 🔍 Research, 🧑‍💼 Personal Assistant, ✨ Custom)*
> - *The type name as a bold heading*
> - *One sentence describing what this agent is for*
> - *A selected state: when clicked, the card gets a blue border and a checkmark badge. Only one can be selected at a time.*
>
> *When a card is clicked, update `agentConfig.type` in the parent state. The 'Next' button should be disabled (greyed out and unclickable) until a type is selected — return 400 (Bad Request — required field missing) style validation on the client side: show an inline message 'Please choose an agent type to continue' under the grid if Next is pressed without a selection."*

**Both paths to test:**
- Happy path: click a card → it highlights → click Next → moves to Step 2
- Failure path: click Next without selecting → inline validation message appears, does not advance

---

### Step 6 — Personality Sliders

Ask Claude Code:
> *"Build Step 2: personality configuration. Include:*
>
> 1. *Two sliders using Tailwind's native `<input type='range'>` styled with Tailwind classes:*
>    - *Tone: 'Very formal' on the left (0), 'Very casual' on the right (100)*
>    - *Verbosity: 'Very concise' on the left (0), 'Very detailed' on the right (100)*
>    - *Each slider should show the current value numerically next to it, and update `agentConfig.personality.tone` and `agentConfig.personality.verbosity` in real time as the user drags.*
>
> 2. *An 'Example phrases' text input where the user can type a phrase and press Enter or click an 'Add' button. Each phrase appears as a `Badge` component (from shadcn/ui) below the input, with an × button to remove it. Store these in `agentConfig.personality.examplePhrases` as an array of strings.*
>
> *Example phrases are optional — the Next button should always be enabled on Step 2. Sliders default to 50 (middle)."*

---

### Step 7 — Capability Toggles

Ask Claude Code:
> *"Build Step 3: capability toggles. Show 4 rows, each with:*
> - *A label and short description (e.g. 'Web Search — finds current information online')*
> - *A toggle switch using shadcn/ui's `Switch` component (run `npx shadcn@latest add switch` to install it — this gives a proper visual on/off state: filled and moved right when ON, empty and moved left when OFF, with a colour change so the state is unambiguous)*
>
> *All toggles default to OFF. When toggled, update the matching boolean in `agentConfig.capabilities` — e.g. `agentConfig.capabilities.webSearch = true`. Show a `Badge` at the top that summarises how many capabilities are enabled: '2 of 4 capabilities enabled'.*
>
> *Note: these toggles define the agent's *intent* — Week 8 will wire them to real tools. For now, the values just get saved to the database. No validation needed — all OFF is a valid choice."*

---

## 💾 Commit Checkpoint — Steps 1–3 Built

Steps 1–3 are functional and connected to the shared config state.

```bash
git add -A
git commit -m "feat: builder steps 1-3 — type selector, personality sliders, capability toggles"
```

---

## ⚙️ Session 3 — Sunday 10am–12pm (Hours 5–6): Build Steps 4–5 + Save to Supabase

### Step 8 — Limits

Ask Claude Code:
> *"Build Step 4: agent limits.*
>
> 1. *A number input for 'Max message length' — the maximum number of characters a user can send per message. Default to 1000. Show a note: 'Recommended: 500–2000 characters'. Update `agentConfig.limits.maxMessageLength`.*
>
> 2. *An 'Avoid topics' input — same pattern as example phrases in Step 2: type a topic, press Enter or 'Add', it appears as a dismissible `Badge`. Store in `agentConfig.limits.avoidTopics`.*
>
> *Validation: if max message length is below 50 or above 10,000, show an inline error 'Please enter a number between 50 and 10,000' and keep the Next button disabled. Do not clear the input on error."*

**Both paths to test:**
- Happy path: enter 1000 → click Next → advances to Step 5
- Failure path: enter 20 → inline error appears, cannot advance → fix the value → can now advance

---

### Step 9 — Name, Test, and Save

This is the final step — the user names their agent, previews it in a chat dialog, and saves.

Ask Claude Code:
> *"Build Step 5: name, test, and save.*
>
> 1. *A text input for the agent's name (required, max 50 characters). Show a live character counter: '12 / 50'. Update a `agentName` state variable.*
>
> 2. *A text area for optional description (max 200 characters), with a live character counter.*
>
> 3. *A 'Test your agent' button that opens a `Dialog` component (from shadcn/ui — a Dialog is a modal overlay, like a popup panel that appears over the current page without navigating away) containing a simple chat interface. Inside the dialog:*
>    - *A scrollable message list showing the conversation so far*
>    - *A text input and 'Send' button*
>    - *On Send: call a new API route at `src/app/api/chat/preview/route.ts` (a separate preview route — distinct from the main `/api/chat` route that requires a saved agent ID) with `POST` (sending new data), passing `agentConfig`, `agentName`, and the `messages` array*
>    - *The preview route should build a system prompt from the config object directly (since no Supabase agent exists yet) and call Claude with `claude-haiku-4-5-20251001`. Require the user to be authenticated — return 401 (Unauthorised — no valid session) if not logged in.*
>    - *Happy path: Claude replies and the message appears in the dialog*
>    - *Failure path: if the preview API fails, show 'Preview unavailable — try again in a moment' inside the dialog. Do not close the dialog on error. The test input and Send button should re-enable after a failure so the user can try again.*
>
> 4. *A 'Save Agent' button (replace the normal 'Next' button on Step 5) that:*
>    - *Validates the name is not empty — show inline error 'Please give your agent a name' if blank*
>    - *Sends a `POST` request to `src/app/api/agents/route.ts` with `{ name, description, config: agentConfig }`*
>    - *Shows a loading spinner on the button while saving ('Saving...')*
>    - *On success: redirects to `/agents/[newAgentId]` (the chat page for the new agent)*
>    - *On failure (500 — server error): shows 'Something went wrong saving your agent. Your progress is not lost — try again.' The form fields must NOT clear. The button resets to 'Save Agent' so they can retry.*"*

> 💡 **As the product owner — will you be notified when these failures happen in production?**
> Right now, no. The error is caught and the user sees the friendly message, but it disappears silently. If you wanted to check, you'd have to manually open Vercel Dashboard → your project → Logs tab and look for it. **Week 10** introduces Sentry — an error monitoring service that catches every server-side crash, captures the full stack trace (the chain of code that caused the error), and sends you an email or Slack alert within seconds. After Week 10, you'll know your API is down before your users have even refreshed. For now, the user experience is protected — the observability gap is intentional and gets closed at the right time.

---

### Step 10 — Verify the Save API Route

**Before asking Claude Code to write anything**, ask it to verify whether the route already meets all requirements — it may have been wired up correctly in a previous sprint. This avoids rewriting code that's already correct.

Ask Claude Code:
> *"Read `src/app/api/agents/route.ts` and confirm whether it already meets all 5 of these requirements. For each one, tell me the line number where it's handled, or tell me it's missing:*
> 1. *Accepts `config` (an `AgentConfig` object) in the POST request body alongside `name` and `description`*
> 2. *Validates that `config` is present — returns 400 (Bad Request — required field missing) if absent*
> 3. *Saves `config` to the `config` jsonb column in the `agents` Supabase table*
> 4. *Returns the full created agent object (including its new `id`) with status 201 (Created — new resource saved successfully)*
> 5. *Requires authentication — returns 401 (Unauthorised) if the user is not logged in*
>
> *If all 5 are already met, tell me nothing needs to change. If any are missing, add only what's missing."*

If Claude Code confirms all 5 are already satisfied, move on — Step 10 is done. If anything is missing, ask it to add only what's needed rather than rewriting the whole route.

**Both paths to test:**
- Happy path: complete all 5 steps → click Save Agent → redirected to chat page → agent exists in Supabase with `config` column populated
- Failure paths: submit without a name (inline error); simulate a slow connection; confirm button shows 'Saving...' then resets on error

---

## 💾 Commit Checkpoint — Full Builder + Save Flow Complete

The complete 5-step builder is functional and saves to Supabase.

```bash
git add -A
git commit -m "feat: 5-step visual agent builder with preview dialog and Supabase save"
```

---

## ⚙️ Session 4 — Sunday 2–4pm (Hours 7–8): Validation + Polish

### Step 11 — Replace All Plain Buttons Across the App

Now that you have shadcn/ui installed, do a quick sweep of your existing pages.

Ask Claude Code:
> *"Do a search across all `.tsx` files in `src/` for plain `<button>` HTML elements that are not using the shadcn/ui `Button` component. List every file and location. Then replace them all with the shadcn/ui `Button` component, matching the appropriate variant: use `variant='default'` for primary actions, `variant='outline'` for secondary actions, and `variant='destructive'` for delete/danger actions. Explain what a variant is in the context of shadcn/ui — how is it different from just changing a CSS class?"*

---

### Step 12 — Add a Builder Completion Summary Page

After the agent saves and the user is redirected to the chat page, show a one-time banner at the top confirming what was created.

Ask Claude Code:
> *"On the `/agents/[id]` chat page, check for a `?created=true` query parameter (a value appended to the URL, like `/agents/abc-123?created=true` — the `?` introduces query parameters and `=` separates key from value). If present, show a dismissible green success banner at the top: 'Your agent [name] was created with [X] capabilities enabled. Start chatting below.' Auto-dismiss the banner after 6 seconds. Remove the `?created=true` from the URL after the banner appears (so refreshing doesn't re-show it) by using `router.replace`. Update the Save Agent flow in Step 9 to append `?created=true` to the redirect URL."*

### Step 13 — Build the Password Reset Flow

This step fixes two real gaps discovered during testing: (1) there is no `/auth/callback` route, so clicking any Supabase email link drops the user on `localhost:3000` with nothing catching the token, and (2) there is no page to actually set a new password. Both must exist before you go live.

**How the full flow works end to end:**
1. User clicks "Forgot password" → app calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '...callback?next=/auth/reset-password' })`
2. Supabase sends email → user clicks link → Supabase verifies the token on their servers → redirects to your `/auth/callback?code=XXXX&next=/auth/reset-password`
3. Your `/auth/callback` route catches the `code`, calls `exchangeCodeForSession(code)` to create a real session, then redirects to `/auth/reset-password`
4. The reset page shows a new password form → user submits → `supabase.auth.updateUser({ password })` → done

The `/auth/callback` route is the critical missing piece — without it, step 3 never happens and the token expires unused.

---

**Part 1 — Forgot password page**

Ask Claude Code:
> *"Create `src/app/auth/forgot-password/page.tsx` — a client component with an email input and 'Send reset link' button.*
>
> *On submit: call `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:3000/auth/callback?next=/auth/reset-password' })`. The `redirectTo` routes Supabase's response through our callback route first (required by Supabase's PKCE security protocol — explained below) before landing on the reset page.*
>
> *Happy path: show success message 'If that email has an account, a reset link is on its way. Check your inbox.' — this deliberately doesn't confirm whether the email exists (security best practice: never let attackers harvest valid emails by trying your forgot-password form).*
>
> *Failure path: if the Supabase call fails, show inline error and keep the email field populated — do not clear it.*
>
> *Also add a 'Forgot your password?' link to `src/app/auth/login/page.tsx` below the password field, pointing to `/auth/forgot-password`. Check if this link already exists before adding it.*
>
> *After building, verify by testing:*
> *- Happy path: enter a registered email → button shows loading state → success message appears, email field stays populated*
> *- Failure path: disconnect from the internet, submit → inline error appears, email field is NOT cleared*
> *- Security test: enter an unregistered email → same success message appears (no hint the email doesn't exist)*
> *Do not mark complete until all three pass."*

---

**Part 2 — Auth callback route (the critical missing piece)**

Ask Claude Code:
> *"Create `src/app/auth/callback/route.ts` — a Next.js Route Handler (a server-side file that processes HTTP requests directly, without rendering a page) that handles Supabase's PKCE auth callback. PKCE (Proof Key for Code Exchange — a security protocol that prevents auth codes being stolen in transit) requires this route for all email-based auth flows: password reset, magic links, and email confirmation.*
>
> *The route must:*
> 1. *Accept a `GET` request containing a `code` query parameter — this is the one-time code Supabase puts in the email link URL*
> 2. *Read an optional `next` query parameter — the page to redirect to after login (e.g. `/auth/reset-password`)*
> 3. *Call `supabase.auth.exchangeCodeForSession(code)` — this trades the one-time code for a real Supabase session cookie. Without this step, the user is never actually logged in.*
> 4. *On success: redirect to the `next` URL if provided, otherwise redirect to `/dashboard`*
> 5. *On failure (code expired, already used, or missing): redirect to `/auth/login?error=link-expired`*
>
> *After building, verify by testing:*
> *- Happy path: request a password reset email → click the link → should pass through `/auth/callback` and land on `/auth/reset-password` with the form visible*
> *- Failure path: visit `/auth/callback` directly in the browser with no `code` param → should redirect to `/auth/login?error=link-expired` → login page should show the amber 'This link has expired or already been used' banner*
> *Do not mark complete until both pass."*

---

**Part 3 — Reset password page**

Ask Claude Code:
> *"Create `src/app/auth/reset-password/page.tsx` — a client component that lets users set a new password after arriving from the auth callback.*
>
> *The page must show:*
> - *'New password' input and 'Confirm password' input*
> - *Validate that both fields match before submitting — show inline error 'Passwords do not match' if they don't. Do NOT clear either field on error.*
> - *Validate minimum 6 characters — show inline error 'Password must be at least 6 characters'*
> - *On submit: call `supabase.auth.updateUser({ password: newPassword })` — this works because the `/auth/callback` route already established a session before redirecting here*
> - *Show loading state on the button while updating ('Updating...')*
>
> *Happy path: 'Password updated — taking you to your dashboard' message, then redirect to `/dashboard` after 2 seconds.*
>
> *Failure paths:*
> - *Mismatched passwords → inline error, neither field clears*
> - *Under 6 characters → inline error, field stays populated*
> - *User visits this page without a valid session (no prior callback) → `updateUser` will fail → show 'This reset link has expired. Request a new one.' with a link to `/auth/forgot-password`*
>
> *After building, verify by testing:*
> *- Happy path: complete the full flow (forgot password → email → callback → reset page) → enter matching passwords → submit → success message → redirected to dashboard → can log in with new password*
> *- Mismatch test: enter different passwords → inline error appears, neither field clears*
> *- Expired test: navigate to `/auth/reset-password` directly without going through the email link → error message appears with link back to forgot-password*
> *Do not mark complete until all three pass."*

---

**Part 4 — Supabase dashboard URL config**

Ask Claude Code:
> *"Explain what I need to add to Supabase dashboard → Authentication → URL Configuration → Redirect URLs to allow the password reset flow to work both locally (`http://localhost:3000`) and in production (my future Vercel URL). Walk me through exactly where to find this setting and what values to add. Explain what this allowlist does and why Supabase requires it — what would happen if I didn't add these URLs?"*

> 💡 **Why the message says "if that email has an account":** Never confirm whether an email is registered. If you say "no account found" for unregistered emails, someone can use your forgot-password form to discover which emails are in your database one by one. The ambiguous message protects your users' privacy.

---

## ✨ Stretch Tasks (+4–5 hrs, if you have time)

These are optional. Do them if you finished the core tasks and want to go deeper. They don't block Week 8.

---

### Stretch 1 — Step Transition Animations with Framer Motion (1 hr)

Right now the builder snaps between steps instantly. Add smooth transitions to make it feel polished.

Ask Claude Code:
> *"Install `framer-motion` (a React animation library — think of it as Figma's Smart Animate for code: you define start and end states, and it smoothly transitions between them). Add slide transitions between builder steps: when going forward (step increases), the new step slides in from the right and the old step slides out to the left. When going backward, reverse the direction. Also add a subtle fade-in animation when the builder page first loads. Explain what `AnimatePresence` (the Framer Motion wrapper component that enables exit animations) does and why it's needed for this pattern."*

Ask Claude Code to follow up: *"Explain what Framer Motion is and why animation matters for perceived performance — what psychological effect does it have on users?"*

---

### Stretch 2 — Mobile Responsive Builder (1 hr)

This stretch lets you see your app on a real phone screen. Here's how to set it up, step by step.

---

#### Part 1 — Find your computer's local IP address

Your computer and phone are both connected to your home WiFi. Your router assigns each device a private address on that network — called a **local IP address** (a number like `192.168.1.42` that identifies your computer on your home network, but isn't visible to the outside internet). You need this address so your phone knows where to find your dev server.

**On Mac** (which you're on), open a new Terminal window and run:

```bash
ipconfig getifaddr en0
```

`en0` is the name Mac gives to your WiFi adapter. `ipconfig getifaddr` means "get the IP address assigned to this adapter." You'll see output like:

```
192.168.1.42
```

That number is your local IP. If you get a blank result, try `en1` instead (some Macs use a different adapter name):

```bash
ipconfig getifaddr en1
```

If neither works, run this longer command which lists all addresses and you can find the one starting with `192.168`:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

`127.0.0.1` is your computer talking to itself (called localhost) — ignore that one. The `192.168.x.x` number is what you want.

> **On Windows** (for future reference): open Command Prompt and run `ipconfig`. Look for "IPv4 Address" under your WiFi adapter — it will look like `192.168.1.42`.

---

#### Part 2 — Make your dev server visible to the network

By default, `npm run dev` only listens on `localhost` — meaning only your own computer can reach it. To make it reachable from your phone, stop your current dev server (`Ctrl+C` in the terminal running it) and restart it with:

```bash
npm run dev -- --hostname 0.0.0.0
```

`--hostname 0.0.0.0` means "listen on all network interfaces, not just localhost" — it's the flag that makes your dev server reachable from other devices on your WiFi. You'll still see the same terminal output and `http://localhost:3000` still works on your computer too.

---

#### Part 3 — Open the app on your phone

1. Make sure your phone is connected to the **same WiFi network** as your computer (not mobile data — it must be the same network)
2. Open your phone's browser (Safari on iPhone, Chrome on Android)
3. Type this in the address bar — using your actual IP number from Part 1:

```
http://192.168.1.42:3000
```

Replace `192.168.1.42` with whatever number your terminal showed. The `:3000` is the port (the specific "door" on your computer that the dev server is listening on — your computer has thousands of ports, and `3000` is the one Next.js uses by default).

You should see your app load on your phone exactly as it runs on your computer.

> ⚠️ **If it doesn't load:** Check that both devices are on the same WiFi. Check that your Mac's firewall isn't blocking port 3000 — go to System Settings → Network → Firewall → Options and make sure it's not blocking Node.js.

---

#### Part 4 — Look for these specific issues

Once your app is on your phone, navigate to `/agents/new` and work through the builder. Look for:

- **Step 1 (type cards):** Does the 2×2 grid overflow the screen or get squished? On a phone, 2 columns side by side is often too cramped.
- **Next/Back buttons:** Can you reach them without scrolling past all the content? On long steps, these can end up off-screen.
- **Text inputs (Step 5 name field):** When you tap an input, does the whole page zoom in? iOS does this automatically for any input smaller than 16px font size — it's jarring and makes the page feel broken.

Screenshot anything that looks wrong so you have a reference when you ask Claude Code to fix it.

---

#### Part 5 — Ask Claude Code to fix the issues

Ask Claude Code:
> *"Fix the agent builder for mobile screens. Specifically:*
> 1. *Stack the 4 agent type cards into a single column on screens below the `sm` breakpoint (640px wide — in Tailwind, `sm:` means 'apply this style at 640px and above'; anything without a prefix applies below that). On mobile it should be 1 column, on desktop it should be the 2×2 grid.*
> 2. *Make the Next/Back button bar stick to the bottom of the screen on mobile using `fixed bottom-0` Tailwind classes — so it's always visible no matter how long the step content is.*
> 3. *Add `text-base` (which equals 16px) to all text inputs in the builder — iOS Safari automatically zooms into inputs smaller than 16px, which disorients users.*
>
> *Also explain Tailwind's full responsive prefix system: what pixel widths do `sm:`, `md:`, `lg:`, and `xl:` correspond to, and what's the logic of 'mobile-first' styling?"*

---

### Stretch 3 — Auto-Save Draft to localStorage (1 hr)

If a user fills in 3 steps and accidentally closes the tab, they lose everything. Fix that.

Ask Claude Code:
> *"Add auto-save to the agent builder. Every 30 seconds, save the current `agentConfig` and `currentStep` to `localStorage` (the browser's built-in key-value store that persists across page reloads — like a small persistent notepad inside the browser) under the key `'agentforge_draft'`. When the builder page loads, check if a draft exists in localStorage. If it does, show a banner: 'You have an unsaved draft from [timestamp]. Would you like to resume?' with 'Resume draft' and 'Start fresh' buttons. 'Start fresh' should clear the localStorage draft. When the agent is saved successfully, clear the draft from localStorage.*
>
> *Explain what localStorage is, how it differs from a cookie, and what its storage limit is."*

---

### Stretch 4 — Live Preview Panel (1 hr)

Ask Claude Code:
> *"Build a preview panel that appears to the right of the builder steps on desktop screens (md: breakpoint and above — 768px+). The panel should show, in real time as the user fills in the builder:*
> - *The agent's name (or 'Unnamed agent' if blank)*
> - *The selected type as a `Badge`*
> - *A personality summary line: e.g. 'Tone: casual · Style: detailed'*
> - *The enabled capabilities as a list of `Badge` components (hide disabled ones)*
> - *A 'Preview conversation' button that opens the same test Dialog from Step 9*
>
> *On mobile, the preview panel should be hidden (using Tailwind's `hidden md:block` — `hidden` hides it by default, `md:block` overrides that to show it at 768px and above)."*

---

## 💾 Commit Checkpoint — Stretch Tasks (if attempted)

```bash
git add -A
git commit -m "feat: builder stretch — framer motion transitions, mobile responsive, auto-save draft, live preview panel"
```

---

## 💾 Sprint Close — Week 7 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, and update `CLAUDE.md`'s Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 7 complete — visual 5-step agent builder with shadcn/ui, preview dialog, Supabase config save, password reset flow"
```

After committing, open `CLAUDE.md` and move "Week 7" from Current Focus into Completed Work with a two-sentence summary of what shipped.

---

## ✅ Completion Checklist

Work through these top to bottom. Don't mark anything done until you've actually tested it.

- [ ] shadcn/ui installed and 5 components added (Button, Card, Dialog, Badge, Progress)
- [ ] `config jsonb` column added to `agents` table in Supabase
- [ ] `AgentConfig` TypeScript interface created and used across the codebase
- [ ] Step 1: Agent type selector — 4 cards, only one selectable, Next disabled until selected
- [ ] Step 1: Clicking Next without selection shows inline validation error
- [ ] Step 2: Tone and verbosity sliders update config in real time with live numeric readout
- [ ] Step 2: Example phrases can be added and removed as Badges
- [ ] Step 3: All 4 capability toggles save to `agentConfig.capabilities`
- [ ] Step 3: Badge shows live count of enabled capabilities
- [ ] Step 4: Max message length validates between 50–10,000 with inline error
- [ ] Step 4: Avoid topics can be added and removed as Badges
- [ ] Step 5: Agent name input with live character counter
- [ ] Step 5: 'Test your agent' Dialog opens and sends a preview chat to `/api/chat/preview`
- [ ] Step 5: Preview dialog shows error message on API failure — does not close or clear
- [ ] Step 5: Save Agent sends POST to `/api/agents`, shows loading state, redirects on success
- [ ] Step 5: Save failure shows error without clearing form fields
- [ ] `/api/agents` POST saves `config` to Supabase and returns 201 (Created)
- [ ] `/api/chat/preview` route works and requires authentication — returns 401 if not logged in
- [ ] Success banner appears on chat page after redirect from builder (`?created=true`)
- [ ] All plain `<button>` elements replaced with shadcn/ui `Button`
- [ ] 'Forgot your password?' link added to login page, navigates to `/auth/forgot-password`
- [ ] `/auth/forgot-password` page sends reset email via Supabase — shows ambiguous success message regardless of whether email exists
- [ ] `/auth/reset-password` page handles recovery token — shows new password + confirm password form
- [ ] Reset password form validates matching passwords and minimum 6 characters with inline errors
- [ ] Successful reset redirects to `/dashboard` with confirmation message
- [ ] Supabase Redirect URLs configured to allow `http://localhost:3000/auth/reset-password`
- [ ] Committed with meaningful message after each major checkpoint

---

## 🧪 Validation Tests

Run these specific tests before closing out the week. Each one should produce the result in the right column.

| Test | Expected result |
|---|---|
| Click 'Next' on Step 1 without selecting a type | Inline error appears, stays on Step 1 |
| Select a type, click Next, click Back | Returns to Step 1 with type still selected |
| Drag tone slider to 80, advance through all steps, return to Step 2 | Slider still shows 80 |
| Enter '20' in max message length, click Next | Inline error, stays on Step 4 |
| Open test dialog, send a message | Claude responds inside the dialog |
| Open test dialog, simulate API failure (temporarily break the preview route) | Error message inside dialog — dialog does not close |
| Complete all steps, click Save Agent | Redirected to `/agents/[id]?created=true` with success banner |
| Click Save Agent with empty name field | Inline error — 'Please give your agent a name' |
| Open `/agents/new` while logged out | Redirected to login (Supabase middleware should catch this) |
| View the saved agent in Supabase dashboard | `config` column is populated with the full JSON object |
| Click 'Forgot your password?' on login page | Navigates to `/auth/forgot-password` |
| Submit forgot-password form with a valid email | Success message appears — does not confirm whether email exists |
| Submit forgot-password form with an unregistered email | Same success message — no hint that the email isn't registered |
| Click recovery link in email | Lands on `/auth/reset-password` with form visible |
| Submit reset form with mismatched passwords | Inline error — neither field clears |
| Submit reset form with password under 6 characters | Inline error — field stays populated |
| Submit valid matching passwords | Redirected to `/dashboard` — can log in with new password |
| Visit `/auth/reset-password` directly (no token) | Error shown — 'This reset link is invalid or has expired' |

---

## 📚 Resources

- [shadcn/ui documentation](https://ui.shadcn.com) — component list and installation guides
- [Framer Motion docs](https://www.framer.com/motion/) — animation library (for stretch tasks)
- [Tailwind CSS responsive docs](https://tailwindcss.com/docs/responsive-design) — `sm:`, `md:`, `lg:` explained
- [Postgres jsonb documentation](https://www.postgresql.org/docs/current/datatype-json.html) — how Supabase stores JSON
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) — how `route.ts` API files work
- [Supabase Password Recovery docs](https://supabase.com/docs/guides/auth/passwords#reset-password) — how the recovery token flow works end to end

---

*Week 7 of 12 · AgentForge · Phase 3: Building the Product · Updated May 2026*
