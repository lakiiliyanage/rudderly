# 🔥 Week 6 — Claude API: Making Your First AI Agent Work

**Phase:** 2 — Backend & AI
**Dates:** Add your own start date
**Total time:** 8–10 hrs core · +4–5 hrs stretch
**Goal:** Wire the Claude API into AgentForge so users can have a real conversation with an AI agent they built. This is the milestone the whole plan has been building toward — your MVP core feature goes live this week.

---

## 📋 Before You Start

Run these commands in your terminal to confirm your environment is healthy. Your terminal is the text-based window where you type commands to control your computer — on Mac it's called Terminal, on Windows it's called Command Prompt or PowerShell.

```bash
# Navigate into your project folder
cd agentforge

# Start the development server (the local version of your app that runs on your computer)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser — you should see your app running. If you get an error, ask Claude Code: *"My Next.js app won't start — here's the error: [paste error]"*

Also confirm your Supabase connection is alive:
- Log in to your app
- Create a test agent
- Confirm it appears in your Supabase dashboard under the `agents` table

If both work, you're ready. If not, fix those first before touching the Claude API.

---

## 🧠 Key Concepts for This Week

Before you start building, read this table. These are the ideas your brain needs to hold while you work.

| Concept | What it is | Design analogy |
|---|---|---|
| **API key** | A secret password that proves to Anthropic you're authorised to use their AI | Like a Figma access token — without it, the API won't let you in |
| **Environment variable** | A secret value stored outside your code so it never ends up in GitHub | Like keeping your Figma account password in 1Password, not written in a design file |
| **System prompt** | The hidden instructions you give the AI before the user says anything | Like setting up constraints in Figma before handing a file to a client |
| **User message** | What the person types into the chat | Like a Figma comment left by a stakeholder |
| **Streaming** | Sending the AI's response word-by-word as it generates, instead of waiting | Like watching Figma's auto-layout recalculate live instead of refreshing |
| **Context window** | The total amount of text the AI can "hold in mind" at once (past messages + reply) | Like Figma's memory — if the file gets too big it slows down |
| **Tokens** | The units the AI uses to count text — roughly 1 token ≈ ¾ of a word | Like Figma's vector nodes — not exactly pixels, but a unit of complexity |
| **API route** | A URL in your Next.js app that runs server code when called — never exposed to the browser | Like a Figma plugin that runs in the background, not visible to the viewer |
| **Message history** | Sending all previous messages back to the AI on each request so it remembers the conversation | Like keeping all frames in one Figma page instead of separate files |

---

## 🔐 HTTP Status Codes Reference

You'll use these in your API route this week. Keep this table handy.

| Code | Name | Meaning | When to use |
|---|---|---|---|
| 200 | OK | Request succeeded | Generic success |
| 201 | Created | New resource created | After a successful save |
| 400 | Bad Request | Client sent bad/incomplete data | Missing fields, empty message |
| 401 | Unauthorised | Not logged in | No valid session detected |
| 403 | Forbidden | Logged in but not allowed | User accessing another user's agent |
| 405 | Method Not Allowed | Wrong HTTP method used | GET hitting a POST-only route |
| 500 | Internal Server Error | Server-side failure | Anthropic API down, unhandled crash |

---

## 🌐 HTTP Request Types Reference

Your chat API route this week will use `POST` — because the user is sending new data (their message) to the server.

| Request type | Intention | Real-world analogy | When used |
|---|---|---|---|
| GET | "Give me data" | Reading a menu | Loading pages, fetching lists |
| POST | "Here is new data, store it" | Placing an order | Sending a message, creating resources |
| PUT / PATCH | "Update existing data" | Changing your order | Editing resources |
| DELETE | "Remove this data" | Cancelling an order | Deleting resources |

---

## ⚙️ Session 1 — Saturday 3–5pm (Hours 1–2): API Key Setup + First API Call

### Step 1 — Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in (or create a free account).
2. You'll land inside your **default workspace** — you do not need to create a new one. Workspaces are for teams that want to separate API keys and billing across multiple projects or departments. As a solo founder, the default workspace is exactly right.
3. Click **API Keys** in the left sidebar.
4. Click **Create Key**, name it `agentforge-dev`, and copy the key — it starts with `sk-ant-`.

⚠️ **Treat this key like a bank password.** Anyone who has it can make API calls billed to your account.

### Step 2 — Store It as an Environment Variable

An environment variable is a secret value your app can read at runtime (when it's running) without the value ever appearing in your code files. This keeps it out of GitHub, where it would be publicly visible.

**You only need `.env.local` — that's correct.** Next.js projects use several `.env` file types, but you don't need all of them:

| File | Committed to GitHub? | Used for |
|---|---|---|
| `.env.local` | ❌ No — in `.gitignore` automatically | **Secrets** — API keys, passwords, anything private |
| `.env` | ✅ Yes — publicly visible | Non-secret defaults safe to share with teammates |
| `.env.production` | ✅ Yes | Non-secret production-only defaults |

`.env.local` alone is the right setup for a solo project like AgentForge. All your secrets live there and it never touches GitHub. You only need a `.env` file if you want to commit non-sensitive default config for teammates — which you don't need right now.

Open your `.env.local` file and add your API key on a new line:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then ask Claude Code to verify:
> *"Confirm my `.env.local` is listed in `.gitignore` so it will never be committed to GitHub. Also check whether I have any other `.env` files in my project and whether I need them."*

After adding it, **restart your dev server** (stop it with `Ctrl+C`, then run `npm run dev` again) — Next.js only reads environment variables on startup.

---

### Step 3 — Validate Environment Variables with Zod

Before making any API calls, set up a validation layer that catches missing environment variables immediately — not five layers deep when something breaks.

**Important: there are two separate audiences for errors here, and they need completely different things.**

| Audience | Error type | What they should see |
|---|---|---|
| **You (developer)** | Missing/wrong env var | `Missing env var: ANTHROPIC_API_KEY` — precise, technical, in your terminal or Vercel logs |
| **Your users** | AI service unavailable | "We're having trouble connecting to our AI service. Please try again in a moment." — apologetic, non-technical, no raw error details |

A missing API key is an **infrastructure error** — the developer broke something in the config. The user did nothing wrong and cannot fix it. They should never see a stack trace or a Zod error message. The Zod validation is entirely a **developer tool**: it fires on server startup, goes to your terminal (locally) or Vercel's deployment logs (in production), and is invisible to users.

Ask Claude Code:
> *"Create `src/lib/env.ts` that uses Zod (the validation library we used for forms in Week 5) to validate all required environment variables at startup: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `ANTHROPIC_API_KEY`. If any are missing or malformed, throw a clear error message listing exactly which variables are wrong — this output goes to the terminal/server logs only, never to the user. Export the validated `env` object and explain when I should import this instead of using `process.env` directly.*
>
> *Separately, explain how errors should be handled in two layers: (1) this startup validation for the developer, and (2) a user-facing graceful message in the API route itself for when the AI service fails at runtime — something like 'We're having trouble connecting to our AI service right now. Please try again in a moment.' The user should never see a stack trace, a Zod error, or any technical detail. In Vercel production, where do I actually see the server-side error logs?"*

**How error visibility works in production (Vercel):**
- Zod validation errors appear in your **Vercel deployment logs** and **function logs** (Vercel dashboard → your project → Logs tab)
- Your users see nothing about the technical cause — only the friendly message your API route returns
- Later (Week 10), you'll add proper error monitoring with a tool like Sentry, which sends you an email/alert the moment a server error happens in production

Ask Claude Code to follow up: *"Why validate environment variables with Zod instead of just checking `if (!process.env.X)`? What's the difference in developer experience?"*

---

### Step 4 — Create the Claude API Route

An API route in Next.js is a file that becomes a URL endpoint your frontend can call. It runs on the server (not in the browser), so it can safely use your secret API key.

**When is this route called?** Only from the `/agents/[id]` page — the chat interface that sits beneath an already-saved agent. By the time a user reaches that page, the agent exists in Supabase with a real ID. Agent *creation* (`/agents/new`) uses a completely different route and never calls Claude — it just saves config to the database. The "test before saving" case in the Week 7 builder will need its own separate preview route.

**Why the browser sends `agentId`, not `agentConfig`**

You might expect to send the full agent config (name, description, personality) from the browser to the API route. Don't — that's a security problem. If the browser sends the system prompt, a malicious user could craft their own POST request with any system prompt they like, hijacking your API key to impersonate anything.

The secure pattern is to send only the `agentId` (the agent's unique database ID) and let the server fetch the config itself:

```
Browser sends:   { agentId: "abc-123", messages: [...] }
                          ↓
Server:          1. Verifies user is authenticated
                 2. Fetches agent from Supabase WHERE id = agentId
                 3. Verifies agent.user_id === authenticated user's id → 403 if not
                 4. Builds system prompt from trusted DB data
                 5. Calls Claude API
```

The system prompt is always sourced from your database — never from whatever the browser decides to send.

**Which model to use**

For development and testing, use `claude-haiku-4-5-20251001` (Claude Haiku) — it's significantly faster and cheaper than Sonnet, which matters when you're sending dozens of test messages. You can swap in `claude-sonnet-4-6` for production later, or make it configurable by plan tier (this ties directly into your Week 10 Stripe freemium model — free users get Haiku, paid users get Sonnet).

| Model | Speed | Cost | Use for |
|---|---|---|---|
| `claude-haiku-4-5-20251001` | Fastest | Cheapest | ✅ Development, testing, high-volume features |
| `claude-sonnet-4-6` | Balanced | Mid-range | Production features needing quality |
| `claude-opus-4-6` | Slowest | Most expensive | Complex reasoning, flagship features |

Ask Claude Code:
> *"Create a Next.js API route at `src/app/api/chat/route.ts` that:*
> 1. *Accepts a `POST` request (reject other methods with 405 — Method Not Allowed) with a JSON body containing `agentId` (the agent's unique ID from the database) and `messages` (the conversation history as an array)*
> 2. *Checks the user is authenticated via Supabase — return 401 (Unauthorised — not logged in) if there's no session*
> 3. *Fetches the agent from Supabase using the `agentId` — return 404 (Not Found) if it doesn't exist*
> 4. *Verifies the agent belongs to the authenticated user — return 403 (Forbidden — logged in but not allowed) if `agent.user_id` doesn't match the session user's id*
> 5. *Builds a system prompt from the fetched agent: 'You are [agent.name]. [agent.description]. Goal: [agent.goal]. Personality: [agent.personality].'*
> 6. *Calls the Anthropic SDK using `claude-haiku-4-5-20251001` (Claude Haiku — the fast, cost-efficient model, good for development)*
> 7. *Returns the AI's reply as JSON with a 200 (OK — success) status*
> 8. *Catches errors properly: if the Anthropic API fails, return 500 (Internal Server Error) with a human-readable message — never the raw error stack trace*
> *Use the `env.ts` file to access the API key, not `process.env.ANTHROPIC_API_KEY` directly."*

Read what Claude Code generates. You don't need to memorise it — just look for these four things:
- Where the `agentId` is used to fetch from Supabase
- Where the ownership check (`agent.user_id === user.id`) happens
- Where the system prompt is built from the fetched agent fields
- Where errors are caught and returned as readable messages

---

### Step 5 — Test the API Route in Isolation

Before building any UI, test that the route works on its own. Use your **browser's dev tools console** — not `curl` in the terminal.

**Why the console, not `curl`?** Your `/api/chat` route requires a Supabase auth session. Getting that session into a `curl` command means manually extracting your JWT token (a long encoded string that proves who you are) and pasting it into a header flag every time it expires — unnecessary complexity. The browser console sidesteps all of this: because you're already logged into your app in that tab, the session is sent automatically with every request.

| Method | Auth handling | When to use |
|---|---|---|
| **Browser dev tools console** | ✅ Automatic — session already in browser | ✅ Now — testing authenticated routes during development |
| `curl` (terminal) | ❌ Manual — must extract and paste JWT token | Later (Week 10–11) — automation, CI/CD, unauthenticated routes |

**How to test:**

1. Make sure your dev server is running and you're logged into your app at `http://localhost:3000`
2. Open dev tools: press `F12` (Windows) or `Cmd+Option+I` (Mac)
3. Click the **Console** tab
4. Find a real `agentId` from your Supabase dashboard (Table Editor → agents → copy any `id` value)
5. Paste this into the console and press Enter:

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'paste-your-real-agent-id-here',
    messages: [{ role: 'user', content: 'Hello, what can you help me with?' }]
  })
});
const data = await response.json();
console.log(data);
```

**Expected result:** You should see a JSON object logged in the console containing the AI's reply.

**If you see `{ error: 'Unauthorised' }` (401):** You're not logged in. Log into your app in the same browser tab first, then retry.

**If you see `{ error: 'Not found' }` (404):** The `agentId` you pasted doesn't exist. Double-check it in your Supabase agents table.

**If you see `{ error: 'Something went wrong' }` (500):** Check that your `.env.local` has the correct API key and that you restarted the dev server after adding it.

---

### 💾 Commit Checkpoint — API Key + Route Complete

You've done something significant: your app can now call a real AI. Before building UI on top of it, commit what you have.

```bash
git add -A
git commit -m "feat: Claude API route with auth check, system prompt builder, and Zod env validation"
```

---

## 💬 Session 2 — Sunday 3–5pm (Hours 3–4): Build the Chat Interface

### Step 6 — Build the Chat UI on the Agent Page

Your `/agents/[id]` page (the page that shows a single agent — the `[id]` part means it's a dynamic route where the URL contains the agent's unique ID) currently probably just shows agent details. Now you're going to add a live chat interface below it.

Ask Claude Code:
> *"Update `src/app/agents/[id]/page.tsx` to add a chat interface below the agent details. It should have:*
> - *A scrollable message list showing the conversation (messages from the user on the right, AI replies on the left)*
> - *A text input at the bottom*
> - *While idle: a Send button. While waiting for the AI's reply: the Send button is replaced by a **Stop** button that cancels the in-progress request using the browser's built-in `AbortController` API (a way to cancel a fetch request mid-flight). After stopping, the input becomes active again immediately.*
> - *The message input must NOT clear if the API call fails or is stopped — the user's typed text should stay so they can retry or rephrase*
> - *Send the agent's `id` (already available from the URL — the `[id]` in `/agents/[id]`) as `agentId` to the API route — the server will fetch the full config securely from Supabase*
> - *Show a human-readable error message at the top of the chat if the API returns an error — not a raw error object*
> - *If the user clicks Stop, do NOT show an error message — stopping is intentional, not a failure"*

**Happy path:** User types → clicks Send → Send becomes Stop button → AI reply arrives → Stop becomes Send → input clears ready for next message.

**Stop path:** User clicks Stop mid-request → fetch is cancelled → Stop becomes Send → input text is preserved → no error message shown.

**Failure paths to build (not stretch — these are core):**
- API call fails → show "Something went wrong. Please try again." → button resets to Send → input text stays
- User submits empty message → prevent the request from being sent at all (check `message.trim() === ''`)
- User submits while a reply is loading → the Stop button handles this — no need to disable Send separately

---

### Step 7 — Add Message History (Memory)

Right now, every message you send is standalone — the AI doesn't remember what was said earlier. Fix this by storing the conversation in state (temporary memory held in the browser while the page is open) and sending the full history on each request.

Ask Claude Code:
> *"Update the chat component to maintain message history in React state (the `useState` hook — a way to store values that trigger a re-render when they change). On each new message:*
> 1. *Add the user's message to the history array*
> 2. *Send the full array to the API route*
> 3. *Add the AI's reply to the history array*
> *The API route should forward the full `messages` array to the Anthropic SDK so the AI has context of the whole conversation.*
> *Make sure the message list scrolls to the bottom automatically when a new message arrives."*

**Test it:** Have a multi-turn conversation — ask the agent its name, then in the next message say "What did I just ask you?" — it should remember.

---

### 💾 Commit Checkpoint — Chat UI + Memory Complete

```bash
git add -A
git commit -m "feat: live chat interface on agent page with message history and error handling"
```

---

## 🧪 Session 3 — Saturday 3–5pm (Hours 5–6): Real-World Testing

### Step 8 — Create and Test a Real Agent

This is the moment. Build a real agent and have a real conversation with it.

1. Go to your app's `/agents/new` page
2. Fill in the form:
   - **Name:** Finance Advisor
   - **Description:** Helps people understand personal budgeting and investing
   - **Goal:** Help users make confident, informed decisions about their personal finances
   - **Personality:** Direct *(select from the dropdown)*
3. Save the agent and navigate to its page
4. Ask it: *"I have £500 left after bills each month. What should I do with it?"*
5. Follow up: *"You mentioned an emergency fund — how many months of expenses should that cover?"*
6. **Test the Stop button:** Ask "Give me a 10-step personal budgeting plan", then click Stop halfway through — input should reappear immediately with no error message

The AI should remember your previous message, answer in a direct style, and stay within the personal finance domain.

**What each field does in the system prompt the server builds:**

| Field | What it contributes |
|---|---|
| Name | "You are Finance Advisor." |
| Description | "Helps people understand personal budgeting and investing." |
| Goal | "Goal: Help users make confident, informed decisions about their personal finances." |
| Personality | "Personality: Direct" — the dropdown value maps directly into this line |

### Step 9 — Deliberate Failure Testing

Don't just test the happy path. Every real product is defined by how it handles failure.

Run through each of these tests deliberately:

| Test | How to trigger it | Expected behaviour |
|---|---|---|
| Empty message | Click Send with empty input | Nothing happens — no request sent |
| Double-send | Click Send twice quickly | Second click is disabled while first is loading |
| API failure | Temporarily delete `ANTHROPIC_API_KEY` from `.env.local`, restart server, send a message | Human-readable error shown, input text preserved |
| Very long message | Paste 5,000+ words into the input | Ideally a warning appears (we'll build this in stretch tasks) |
| Page refresh mid-conversation | Have a conversation, then refresh | History clears (this is expected — persistence comes later) |

Fix anything that doesn't behave as expected before moving to stretch tasks.

---

### 💾 Commit Checkpoint — Testing Complete

```bash
git add -A
git commit -m "feat: week 6 core complete — working AI agent chat with auth, memory, and error handling"
```

---

## ➕ Stretch Tasks (+4–5 hrs) — Push Further This Week

These tasks upgrade your MVP from "it works" to "it feels professional."

---

### Stretch 1 — Streaming Responses + Enhanced Stop Button (1 hr)

Right now, the AI's full reply arrives all at once after a delay. Streaming sends each word as it's generated — like watching someone type. This is how ChatGPT works, and it dramatically improves the perceived speed of your app. It also makes the Stop button (built in Step 6) much more satisfying — the user can see text generating and stop it at any point, keeping whatever arrived so far.

Ask Claude Code:
> *"Update my `/api/chat/route.ts` to stream the Claude response using the Anthropic SDK's streaming API. Use Next.js's `Response` with a `ReadableStream` (a browser-native way to send data in chunks) to send each chunk as it arrives.*
>
> *Update the chat UI to:*
> - *Read the stream — appending each chunk to a growing string in state as it arrives, so the text appears word by word*
> - *Pass the `AbortController` signal (from Step 6's Stop button) into the streaming fetch — so clicking Stop immediately halts the stream*
> - *When the user clicks Stop mid-stream: stop appending chunks, mark the message as complete with whatever text arrived, and reset the button to Send. The partial response should stay visible — do not clear it.*
> - *If the stream drops due to a network error (not user-initiated): show 'Response interrupted — please retry' below the partial reply*
> - *If the user deliberately clicks Stop: show nothing — no error, no message. Stopping is intentional."*

Ask Claude Code to follow up: *"What is streaming in HTTP and why do AI apps use it instead of waiting for the full response? What is a `ReadableStream`?"*

**Test it:** Ask for a long response ("Write me a 10-step personal budgeting plan"), then click Stop halfway through. The partial text should remain visible and the input should become active immediately.

---

### Stretch 2 — System Prompt Engineering Workshop (1.5 hrs)

This is research, not a code task — and it's one of the most important things you'll do this week. Understanding how system prompts work will directly shape how you design AgentForge's Week 7 personality builder UI.

**What is prompt engineering?**

Prompt engineering is the practice of crafting instructions to get consistent, predictable, high-quality outputs from an LLM. It's not magic — it's communication design. The design analogy is precise: a system prompt is like a brief handed to a contractor before any work starts. A vague brief ("make it look nice") produces inconsistent work. A specific brief ("use Inter, 16px body, never use red except for errors") produces consistent, predictable output.

LLMs are probabilistic — the same question can return meaningfully different answers depending on how the model was set up. The system prompt is your primary lever for reducing that variance and making behaviour predictable enough to ship as a product. **For AgentForge, the system prompt is the agent.** Everything else is scaffolding.

**The core techniques you're testing today:**

| Technique | What it does | Example |
|---|---|---|
| Role definition | Tells the AI who it is | "You are a senior financial advisor" |
| Domain constraints | Limits what it will engage with | "Only answer questions about personal budgeting" |
| Tone/persona | Controls *how* it communicates | "Be direct. Lead with the answer." |
| Negative constraints | Explicit no-go rules | "Never recommend specific stocks" |
| Goal framing | Sets what success looks like | "Your goal is confident, informed users" |
| Opinionated stance | Forces a consistent worldview | "You believe all debt is destructive" |

**The experiment:** Create five agents with identical names but wildly different system prompts. Ask each the same question: *"How should I invest my first £1,000?"* Controlling the question isolates the variable — the prompt.

| Agent type | System prompt to test |
|---|---|
| Very formal | "You are a senior financial advisor at a London investment firm. Use precise financial terminology and cite regulatory standards." |
| Very casual | "You're a friendly finance buddy. Keep it simple, use everyday language, and throw in encouragement." |
| Restricted | "You ONLY answer questions about personal budgeting for people earning under £30,000. For any other topic, politely redirect." |
| Opinionated | "You believe all consumer debt is destructive and say so strongly. You advocate for zero-debt living above all financial goals." |
| Multi-lingual | "Always respond in the same language the user writes in. If they mix languages, match the dominant language." |

**For each agent, observe and note:**
- Did it maintain the persona consistently, or did it slip?
- Was the restriction respected when you pushed against it? (Test it: ask a follow-up that's off-topic)
- Was the response more or less *useful* to an actual user?
- Did anything surprise you — did the AI behave differently than you expected?

**Documenting your findings**

A template `PROMPT_ENGINEERING_NOTES.md` has been created for you at `agentforge/docs/PROMPT_ENGINEERING_NOTES.md`. Open it and fill in your observations for each agent as you test. The file has a structured format covering: the response received, observations, key insight, and a final UI implications section that translates your findings into Week 7 design decisions.

**Why this matters for your UI design:**

Every observation is a potential design decision. Some examples of how findings translate:

| Finding | Potential UI decision |
|---|---|
| Tone is the most impactful variable | Make personality the most prominent step in the builder |
| Restrictions work better when specific | Offer a "Topics to avoid" text field, not just a toggle |
| Opinionated agents feel more engaging | Add a "Stance strength" slider to the personality section |
| The AI ignores vague instructions | Add guidance copy in the builder: "Be specific — 'avoid jargon' works better than 'be friendly'" |

These notes feed directly into Week 7. Don't skip them.

---

### Stretch 3 — Error Handling + Edge Cases (1 hr)

Ask Claude Code:
> *"Add these specific error states to the chat component:*
> 1. *If the API returns a 429 error (Too Many Requests — meaning you've hit Anthropic's rate limit, which controls how many calls you can make per minute), show: 'Too many messages — please wait a moment before sending again'*
> 2. *If the API returns a 500 (Internal Server Error), show: 'Something went wrong on our end. Try again in a moment.'*
> 3. *If the user's message is over 4,000 characters long, show an inline warning: 'Your message is very long — this may affect response quality' — but still allow sending*
> 4. *If the fetch (the browser's built-in tool for making HTTP requests) itself fails (network offline), show: 'Connection lost — check your internet and retry'*
> *In every failure case: the Send button must reset to its normal state. The input must keep the user's typed text. The error message must be dismissible (a small ✕ button)."*

Test each error state by deliberately triggering it.

---

### Stretch 4 — Conversation Reset + Token Awareness (30 min)

Ask Claude Code:
> *"Add two things to the chat interface:*
> 1. *A 'New Conversation' button in the top-right of the chat panel. When clicked, clear the message history from state and show the empty chat with a 'Start a new conversation' placeholder. Add a confirmation dialog (a small pop-up asking 'Are you sure? This will clear the conversation') before clearing.*
> 2. *A character counter below the message input that shows how many characters are typed (e.g., '142 / 4000'). Turn the counter amber (warning colour) at 3,000 characters and red at 3,800. Explain what tokens and context windows are in a comment inside the component code."*

Ask Claude Code to follow up: *"What is a context window and what happens when a conversation gets too long for it? How do production AI apps solve this?"*

---

### 💾 Stretch Commit — If You Attempted Stretch Tasks

```bash
git add -A
git commit -m "feat: streaming responses, error edge cases, conversation reset, and token counter"
```

---

## 💾 Sprint Close — Week 6 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, then update CLAUDE.md's Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 6 complete — live AI agent chat with streaming, system prompt engine, and defensive error handling"
```

After committing, open `CLAUDE.md` and move "Week 6" from Current Focus into Completed Work with a two-sentence summary of what shipped.

---

## ✅ Completion Checklist

Work through this before calling Week 6 done.

- [ ] Anthropic API key stored in `.env.local` and NOT committed to GitHub
- [ ] `src/lib/env.ts` validates all environment variables with Zod at startup
- [ ] `/api/chat/route.ts` exists and requires an authenticated Supabase session
- [ ] API route builds a system prompt from agent config (name, description, personality)
- [ ] Chat UI renders on the `/agents/[id]` page
- [ ] Messages appear correctly (user on right, AI on left)
- [ ] Send button shows a loading state while waiting for the AI
- [ ] Empty message is blocked — no request is sent
- [ ] Failed API call shows a human-readable error — input text is preserved
- [ ] AI remembers earlier messages in the same conversation
- [ ] I tested a real multi-turn conversation with a real agent
- [ ] All deliberate failure tests passed (empty message, double-send, API error)

**Stretch tasks completed (mark if done):**
- [ ] Streaming: text appears word-by-word in the UI
- [ ] System prompt workshop: 5 agents tested and notes documented in `PROMPT_ENGINEERING_NOTES.md`
- [ ] Error states: 429, 500, network failure, and long message all handled
- [ ] New Conversation button working with confirmation dialog
- [ ] Character counter visible with amber/red thresholds

---

## 🧪 Validation Tests

| Test | Steps | Pass condition |
|---|---|---|
| API key security | Open GitHub, search your repo for `sk-ant` | Not found — key is in `.env.local` only |
| Auth gate | Log out of your app, call `/api/chat` via curl | Receives 401 (Unauthorised) |
| Basic chat | Send "Hello" to any agent | Receives coherent reply in the agent's personality |
| Memory | Ask agent its name, then ask "what did I just ask?" | Agent correctly references previous message |
| Empty block | Click Send with no text typed | Nothing happens — no loading state, no request |
| Error recovery | Delete API key, restart, send a message | Readable error displayed, input text preserved |
| Streaming (if built) | Ask for a 10-step plan | Text appears incrementally, not all at once |

---

## 📚 Resources

- **Anthropic API docs:** [docs.anthropic.com](https://docs.anthropic.com) — reference for the SDK, models, and parameters
- **Claude model names:** Use `claude-sonnet-4-6` for quality, `claude-haiku-4-5-20251001` for speed/cost
- **Anthropic console:** [console.anthropic.com](https://console.anthropic.com) — manage API keys and view usage
- **Next.js API routes docs:** [nextjs.org/docs/app/building-your-application/routing/route-handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- **Understanding streaming:** Search YouTube: "AI streaming responses explained"
- **Prompt engineering guide:** [docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

---

## 🌟 What You've Built This Week

When you finish Week 6, you have something genuinely impressive:

A web app where a user can sign up, create a named AI agent with a custom personality, and have a real multi-turn conversation with it — with proper authentication, error handling, and streaming text.

That is not a tutorial project. That is an MVP.

Phase 3 starts next week: you'll build the visual, no-code builder that makes AgentForge actually different from everything else out there.

---

*Week 6 of 12 · AgentForge · Phase 2: Backend & AI · Updated May 2026*
