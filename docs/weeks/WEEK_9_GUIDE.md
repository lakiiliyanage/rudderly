# 💬 Week 9 — Conversation Persistence, Context Management & Shareable Agents

**Phase:** 3 — Building the Product  
**Dates:** Add your own start date  
**Total time:** 8–10 hrs core · +4–5 hrs stretch  
**Goal:** Right now, every chat with your agent evaporates the moment you close the tab. This week you fix that permanently. Conversations are saved to Supabase, loaded when you return, grouped in a sidebar, and given auto-generated titles. You'll also handle the context window problem — what happens when a conversation grows so long that you'd hit token limits. Then you'll unlock the feature that makes AgentForge genuinely shareable: public agent pages with a URL anyone can visit, chat with your agent, and clone the config to their own account. By the end of the week, AgentForge has memory and a front door.

---

## 📋 Before You Start

Run these commands to confirm your environment is healthy before touching any new code:

```bash
cd agentforge
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and run a quick smoke test:

1. **Log in** — Supabase auth still working
2. **Open a saved agent's chat** — streaming responses and tool calls still working from Week 8
3. **Check the thinking indicator** — appears when a tool runs, disappears when text streams
4. **Close the chat tab and reopen it** — confirm message history disappears on reload (this is the problem you're fixing today)

If 1–3 work but 4 confirms history is lost — you're in exactly the right starting state. If anything is broken, paste the error into Claude Code before starting: *"Before I begin Week 9, my [login / chat / tools] is broken — here's the error: [paste error]. Fix this first."*

---

## 🧠 Key Concepts for This Week

Before you write a single line, read this table. These mental models will make every step click instead of blur.

| Concept | What it is | Design analogy |
|---|---|---|
| **Conversation** | A single chat session between a user and an agent — a named container that groups related messages | Like a Figma file — it holds multiple frames (messages), you can name it, return to it, and share it |
| **Message persistence** | Saving each user and assistant message to Supabase in real time so they survive page reloads and device switches | Like Figma's auto-save — changes are committed continuously so nothing is lost |
| **Foreign key** | A column in one database table that points to the `id` column in another table — creating a verifiable link between related rows. If the parent row disappears, the database either blocks the delete or cascades it | Like a Figma component instance — it references a master component by ID. If the master is deleted, the instance breaks |
| **Cascade delete** | When a parent row is deleted, all related child rows are automatically deleted — e.g. deleting a conversation removes all its messages | Like deleting a Figma page — all frames inside it disappear too |
| **Context window** | The total amount of text Claude can process in a single API call — measured in tokens (roughly 0.75 words each). `claude-sonnet-4-6` has a 200,000-token context window — large, but not infinite, and sending all of it costs money every call | Like a Figma canvas that can hold a limited number of objects before performance degrades |
| **Token budget** | The portion of context you're willing to spend on conversation history — you need to leave room for the system prompt, tool definitions, and the new message | Like a Figma file size budget — you can't import unlimited images without affecting load time |
| **Sliding window** | A strategy for managing long conversations: keep the most recent N messages and discard the oldest. The "window" slides forward as the conversation grows | Like Figma's version history cutoff — you keep the last 60 days; older versions are archived |
| **Conversation summary** | A compressed version of dropped early messages — Claude reads the old messages and writes a brief summary that's prepended to the context, so important early context isn't completely lost | Like a design brief at the top of a Figma file — it captures intent so new collaborators understand the history without reading every decision |
| **Slug** | A URL-friendly version of a name, lowercase with hyphens replacing spaces — `"My Research Agent"` becomes `"my-research-agent"` | Like a Figma file's URL identifier — readable, shareable, and unique within the workspace |
| **Public route** | A Next.js page that doesn't require authentication — anyone with the URL can access it, logged in or not | Like a Figma public share link — anyone with the link can view the file without a Figma account |
| **Optimistic UI** | Showing a result in the UI immediately (before the server confirms) to make the app feel instant, then reconciling silently with the server | Like Figma's live cursors — you see collaborators move in real time, even before the server confirms the position |
| **Clone (agent)** | Copying another user's public agent configuration into your own account so you can customise and use it — the original is untouched | Like duplicating a shared Figma component into your own library — you own the copy, the original stays with its creator |
| **Open Graph** | A set of HTML `<meta>` tags that control how a URL looks when shared on Twitter, Slack, iMessage, or any chat app — defining the title, description, and preview image | Like a Figma prototype's cover thumbnail — it's what people see before they click your link |
| **`?c=` query param** | A URL parameter used to identify the active conversation — `/agents/[id]?c=[conversationId]`. When present, the page loads that specific conversation; when absent, the page starts a new one | Like a Figma file with a `?node-id=` param — the URL encodes exactly which frame is in view |

---

## 🔐 HTTP Status Codes Reference

You'll encounter these codes throughout this week's API routes.

| Code | Name | Meaning | When to use |
|------|------|---------|-------------|
| 200 | OK | Request succeeded | Loading conversations, loading messages, fetching a public agent |
| 201 | Created | New resource created | Creating a conversation, saving a message |
| 400 | Bad Request | Client sent malformed/incomplete data | Missing agent ID, empty message content |
| 401 | Unauthorised | Not logged in | No valid Supabase session on a protected route |
| 403 | Forbidden | Logged in but not allowed | Trying to load another user's conversation |
| 404 | Not Found | Resource doesn't exist | Agent slug doesn't match any agent; conversation ID doesn't exist |
| 500 | Internal Server Error | Server-side failure | Supabase insert failed, unhandled exception |

---

## 🌐 HTTP Request Types Reference

| Request type | Intention | Real-world analogy | When used |
|---|---|---|---|
| GET | "Give me data" | Reading a menu | Loading conversations, loading messages, fetching public agent data |
| POST | "Here is new data, store it" | Placing an order | Creating a conversation, saving a message, cloning an agent |
| PATCH | "Update part of existing data" | Changing one item on an existing order | Updating conversation title, toggling `is_public` on an agent |
| DELETE | "Remove this data" | Cancelling an order | Deleting a conversation and all its messages |

---

## ⚙️ Session 1 — Saturday 3–5pm (Hours 1–2): Schema + API Routes

### Step 1 — Audit What Already Exists

Before creating any new tables, understand what's already in your database. You built a `messages` table in Week 4 — but it was designed for a different purpose. You need to check its structure before building on top of it.

Ask Claude Code:
> *"Run the following SQL in the Supabase SQL editor and show me the output — do not change anything yet:*
> ```sql
> SELECT column_name, data_type, is_nullable, column_default
> FROM information_schema.columns
> WHERE table_name = 'messages'
> ORDER BY ordinal_position;
> ```
> *Also run:*
> ```sql
> SELECT column_name, data_type, is_nullable, column_default
> FROM information_schema.columns
> WHERE table_name = 'agents'
> ORDER BY ordinal_position;
> ```
> *From the output, answer: Does the `messages` table have a `conversation_id` column? Does the `agents` table have `is_public` or `slug` columns? Report exactly what's there without modifying anything."*

Study the output. This tells you exactly what migration you need to write in Step 2.

---

### Step 2 — Create the Conversations Table + Migrate Messages

Now create the `conversations` table and add the missing columns. Run each SQL block in the Supabase SQL editor (Dashboard → SQL Editor → New query).

Ask Claude Code:
> *"Write a SQL migration for the AgentForge Supabase project (`gqqglsttnfkftsdcbcsz` — always verify this ID before any Supabase operation). The migration must:*
>
> *1. Create the `conversations` table if it doesn't already exist:*
> ```sql
> CREATE TABLE IF NOT EXISTS conversations (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
>   agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
>   title TEXT,
>   created_at TIMESTAMPTZ DEFAULT now()
> );
> ```
> *Explain each column:*
> - *`id UUID PRIMARY KEY DEFAULT gen_random_uuid()` — auto-generates a unique ID for every row using UUID v4 (a 32-character random identifier)*
> - *`user_id ... REFERENCES auth.users(id) ON DELETE CASCADE` — a foreign key (a column that points to another table's primary key) linking this conversation to a Supabase user. `ON DELETE CASCADE` means if the user is deleted, all their conversations are deleted automatically*
> - *`agent_id ... REFERENCES agents(id) ON DELETE CASCADE` — links this conversation to a specific agent. If the agent is deleted, the conversations go with it*
> - *`title TEXT` — nullable so it can be auto-generated after the first reply*
>
> *2. Add `conversation_id` to the existing `messages` table (only if the column doesn't already exist — check the audit output from Step 1):*
> ```sql
> ALTER TABLE messages
> ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
> ```
>
> *3. Add `is_public` and `slug` to the `agents` table if they don't exist:*
> ```sql
> ALTER TABLE agents
> ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
> ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
> ```
> *`UNIQUE` means no two rows can have the same slug — the database enforces this so two agents can't share the same public URL.*
>
> *4. Enable RLS (Row Level Security — the Supabase policies that control which rows each user can access) on `conversations`:*
> ```sql
> ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
>
> CREATE POLICY "Users can only access their own conversations"
>   ON conversations FOR ALL
>   USING (auth.uid() = user_id);
> ```
>
> *5. Add an index (a database lookup optimisation — think of it as an index at the back of a textbook) on `conversations(agent_id)` so the sidebar query stays fast even with thousands of conversations:*
> ```sql
> CREATE INDEX IF NOT EXISTS conversations_agent_id_idx ON conversations(agent_id);
> CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
> ```
>
> *After running the migration, confirm in the Supabase table editor that:*
> - *`conversations` table exists with all 5 columns*
> - *`messages` table has a `conversation_id` column*
> - *`agents` table has `is_public` (boolean) and `slug` (text, unique)*
> *Do not mark complete until all three are confirmed."*

---

### Step 3 — Build the Conversations and Messages API Routes

Create the server-side routes that the chat UI will call to persist conversations and messages.

Ask Claude Code:
> *"Using Next.js 16.2.4 App Router with `proxy.ts` (not `middleware.ts`), React 19, and `@supabase/ssr 0.10.2` (always `await cookies()` — synchronous access throws). Publishable key = `NEXT_PUBLIC_SUPABASE_ANON_KEY`.*
>
> *Create these four API route files:*
>
> **File 1 — `src/app/api/conversations/route.ts`**
>
> *POST handler — creates a new conversation:*
> - *Require auth — return 401 (Unauthorised — not logged in) if no session*
> - *Read `agent_id` from request body — return 400 (Bad Request — required field missing) if absent*
> - *Verify the agent belongs to the current user by checking `agents` table — return 403 (Forbidden — agent belongs to another user) if not*
> - *Insert into `conversations`: `{ user_id, agent_id }`. `title` is left null — it's auto-generated later in Step 7*
> - *Return 201 (Created — new resource saved) with the full conversation row*
>
> *GET handler — lists conversations for an agent (for the sidebar):*
> - *Require auth — return 401 (Unauthorised) if no session*
> - *Read `agentId` from URL query params (the part of a URL after `?`, e.g. `/api/conversations?agentId=abc`)*
> - *Return 400 if `agentId` is missing*
> - *Query: `SELECT id, title, created_at FROM conversations WHERE agent_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 50`*
> - *Return 200 with the array of conversations*
>
> **File 2 — `src/app/api/conversations/[id]/route.ts`**
>
> *GET handler — loads a conversation with all its messages:*
> - *Require auth — return 401 if no session*
> - *Load the conversation row. Return 404 (Not Found — the conversation doesn't exist or was deleted) if not found*
> - *Return 403 if `conversation.user_id` doesn't match the session user*
> - *Load all messages for this conversation: `SELECT id, role, content, tool_calls, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`*
> - *Return 200 with `{ conversation, messages }`*
>
> *PATCH handler — updates the conversation title (used by auto-title in Step 7):*
> - *Require auth — return 401 (Unauthorised) if no session*
> - *Read `title` from body — return 400 (Bad Request) if missing*
> - *Verify ownership — return 403 (Forbidden) if not owner*
> - *Update the title — return 200 (OK) with the updated conversation row*
>
> *DELETE handler — deletes a conversation and all its messages:*
> - *Require auth — return 401 (Unauthorised) if no session*
> - *Verify ownership — return 403 (Forbidden) if not owner*
> - *Delete the conversation row (messages cascade automatically via the foreign key)*
> - *Return 200 with `{ deleted: true }`*
>
> **File 3 — `src/app/api/conversations/[id]/messages/route.ts`**
>
> *POST handler — saves a single message:*
> - *Require auth — return 401 if no session*
> - *Read `role` (`'user'` | `'assistant'`), `content` (the message text), and optional `tool_calls` (a JSON object — nullable, only present on assistant messages that called a tool) from body*
> - *Return 400 (Bad Request) if `role` or `content` is missing*
> - *Load the parent conversation — return 404 (Not Found) if not found, 403 (Forbidden) if not owner*
> - *Insert into `messages`: `{ conversation_id, user_id, agent_id, role, content, tool_calls }`*
> - *Return 201 with the saved message row*
>
> *After building all four files, verify by testing:*
> - *Happy path (create conversation): `POST /api/conversations` with `{ agent_id: '[your agent id]' }` while logged in → returns 201 with a new conversation row containing an `id`*
> - *Happy path (list conversations): `GET /api/conversations?agentId=[your agent id]` → returns 200 with an array (may be empty if no conversations yet)*
> - *Happy path (save message): `POST /api/conversations/[new conversation id]/messages` with `{ role: 'user', content: 'Hello' }` → returns 201 with the saved message*
> - *Happy path (load conversation): `GET /api/conversations/[id]` → returns 200 with `{ conversation, messages }`, messages array contains the one you just saved*
> - *Failure path (no auth): any route without a session → returns 401*
> - *Failure path (wrong user): `GET /api/conversations/[conversation belonging to user A]` while logged in as user B → returns 403*
> *Do not mark complete until all six pass."*

#### 🧪 How to run these tests

Ask Claude Code to write a test script that runs all six checks automatically:

> *"Write a test script at `src/lib/tools/test-routes.ts` that tests the conversation API routes. For each test, log the HTTP status code and response body with a clear PASS/FAIL label. Tests to run:*
> - *POST `/api/conversations` with a valid agent ID — expect 201*
> - *GET `/api/conversations?agentId=[id]` — expect 200*
> - *POST `/api/conversations/[id]/messages` with `{ role: 'user', content: 'Hello' }` — expect 201*
> - *GET `/api/conversations/[id]` — expect 200 with messages array*
> - *All five routes called with no auth — expect 401 each*
>
> *Use the Supabase service role client (the admin client that bypasses RLS — Row Level Security — so it can create a real test user and session without going through the signup flow) to create a test user, run all tests as that user, then delete everything created during the test so the database stays clean. Print a summary: `X passed, Y failed`. Run with `npx tsx src/lib/tools/test-routes.ts`."*

Before running the script, make sure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local`. Get it from: **Supabase dashboard → Settings → API Keys → Legacy anon, service_role API keys tab → `service_role` row → click Reveal → copy**.

```bash
# Add to .env.local:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> ⚠️ The service role key bypasses all Row Level Security — it has full unrestricted access to your database. Never commit it to GitHub (`.env.local` is already in `.gitignore` so you're safe) and never use it in frontend code — only in server-side routes and test scripts like this one.

Then run the script from your `agentforge` folder (make sure `npm run dev` is running in a separate terminal tab first — the script sends real HTTP requests to `localhost:3000`):

```bash
set -a && source .env.local && set +a && npx tsx src/lib/tools/test-routes.ts
```

A passing run looks like this:

```
Test user : test-routes-1778854595016@agentforge.test
User ID   : 95eeecd6-b364-466b-98bc-e356fb097beb
Agent ID  : a9e3c284-a201-4313-8731-63a29cde4eb4

PASS — POST /api/conversations → 201 with new conversation row
PASS — GET /api/conversations?agentId=[id] → 200 with array
PASS — POST /api/conversations/[id]/messages → 201 with saved message
PASS — GET /api/conversations/[id] → 200 with { conversation, messages }
PASS — GET /api/conversations?agentId=... (no auth) → 401
PASS — POST /api/conversations (no auth) → 401
PASS — GET /api/conversations/[id] (no auth) → 401
PASS — PATCH /api/conversations/[id] (no auth) → 401
PASS — DELETE /api/conversations/[id] (no auth) → 401
PASS — POST /api/conversations/[id]/messages (no auth) → 401

Cleaning up...
Done.

10 passed, 0 failed
```

If any test shows FAIL, read the error next to it — it will tell you which route is broken and what it returned instead. Fix that route, then re-run until all pass.

---

### ✅ Before You Commit — Schema + API Routes

All of the following must pass before committing:

| Test | Expected result |
|---|---|
| `conversations` table visible in Supabase table editor | Has 5 columns: `id`, `user_id`, `agent_id`, `title`, `created_at` |
| `messages` table in Supabase | Has `conversation_id` column (UUID, nullable) |
| `agents` table in Supabase | Has `is_public` (boolean, default false) and `slug` (text, unique) |
| `POST /api/conversations` (logged in, valid agent ID) | Returns 201 with a new conversation object |
| `GET /api/conversations?agentId=[id]` (logged in) | Returns 200 with an array |
| `POST /api/conversations/[id]/messages` with role + content | Returns 201 with the saved message |
| `GET /api/conversations/[id]` | Returns 200 with `{ conversation, messages }` |
| Any route called without a session | Returns 401 |
| `GET /api/conversations/[id]` called by a different user | Returns 403 |

Do not commit until every row passes.

---

## 💾 Commit Checkpoint — Schema + API Routes Complete

The persistence foundation is in place — conversations table, messages wired with conversation IDs, and all four API routes. Everything else this week builds on this.

```bash
git add -A
git commit -m "feat: conversations table, messages migration, conversation CRUD API routes"
```

---

## ⚙️ Session 2 — Saturday 5–7pm (Hours 3–4): Wire Persistence to the Chat UI

### Step 4 — Update the Chat Page to Create and Load Conversations

The chat page at `src/app/agents/[id]/page.tsx` currently holds all messages in React state (`useState`) — they vanish on refresh. This step wires it to Supabase.

The approach uses a `?c=` URL query parameter to identify the active conversation:
- Visit `/agents/[id]` with no query param → empty chat (conversation created on first message sent)
- Visit `/agents/[id]?c=[conversationId]` → load that conversation's messages from Supabase

Ask Claude Code:
> *"Update `src/app/agents/[id]/page.tsx`. The page currently manages messages in React state. Add conversation persistence using these rules:*
>
> *1. Read `conversationId` from the URL's search params: `const searchParams = useSearchParams()` (a Next.js 19 hook that reads query params from the current URL), then `const conversationId = searchParams.get('c')`.*
>
> *2. On mount (inside `useEffect` — the React hook that runs side effects after a component renders, like fetching data), if `conversationId` is present:*
>    - *Call `GET /api/conversations/[conversationId]`*
>    - *If it returns 200: set the `messages` state to the loaded messages array. Show a loading state (spinner or skeleton) while this fetch is in progress*
>    - *If it returns 404 (Not Found — the conversation was deleted): clear the URL param using `router.replace('/agents/[id]')` and start with an empty chat*
>    - *If it returns 403 (Forbidden — not your conversation): redirect to `/dashboard`*
>
> *3. Create a `conversationIdRef = useRef<string | null>(conversationId)` (a ref is a mutable container that doesn't trigger re-renders when changed — unlike state — used here to track the conversation ID across the send handler without causing extra renders). Initialise it with the URL param if present.*
>
> *4. Update the send handler (the function that runs when the user clicks Send or presses Enter). At the start of the function, before sending to Claude:*
>    - *If `conversationIdRef.current` is null (no conversation exists yet): call `POST /api/conversations` with `{ agent_id: agentId }`. On 201: set `conversationIdRef.current` to the new conversation ID, and call `router.replace('/agents/[agentId]?c=[newConversationId]', { scroll: false })` — the `{ scroll: false }` option prevents the page from jumping to the top when the URL updates*
>    - *If `conversationIdRef.current` already has a value: skip this step — the conversation exists*
>
> *After building, verify by testing:*
> - *Happy path: navigate to `/agents/[id]` (no query param) → empty chat. Type and send a message → URL updates to `/agents/[id]?c=[id]` without page reload*
> - *Happy path (reload): with `?c=[id]` in the URL, reload the page → previously sent message appears in the chat*
> - *Failure path (deleted conversation): manually put a non-existent conversation ID in the URL → conversation param is cleared, page shows empty chat*
> *Do not mark complete until all three pass."*

---

### Step 5 — Persist Messages in Real Time

Now save each message to Supabase as the conversation happens — both user messages (immediately on send) and assistant messages (after streaming completes).

Ask Claude Code:
> *"In the chat page's send handler, add message persistence around the existing chat logic. The goal is to save every message to Supabase without slowing down the streaming experience:*
>
> *1. **Save the user message immediately** (optimistic — before Claude responds):*
>    - *After confirming `conversationIdRef.current` is set (from Step 4), call `POST /api/conversations/[conversationId]/messages` with `{ role: 'user', content: userMessage }`.*
>    - *Use `await` here — if the save fails, catch the error and show a toast notification: 'Message couldn't be saved — your chat is still working but history may not persist.' Do not block the Claude API call.*
>
> *2. **Save the assistant message after streaming completes**:*
>    - *The current send handler already accumulates the streamed response into a string (or should). After the stream is fully received and the final `assistantMessage` string is built:*
>    - *Call `POST /api/conversations/[conversationId]/messages` with `{ role: 'assistant', content: assistantMessage }`. This is fire-and-forget (use `.catch(console.error)` — don't `await` — so it runs in the background without blocking the UI from showing the message).*
>
> *3. **Persist tool attribution alongside the assistant message**:*
>    - *If the assistant message used any tools (web search, calculator, etc.), the chat UI already tracks this in some form — sources, document badges. Capture this as a `tool_calls` array: `[{ tool: 'web_search', query: '...' }]` or similar structure. Pass it as the `tool_calls` field in the POST body (it's nullable so it's fine to omit when no tools were called).*
>
> *After building, verify by testing:*
> - *Happy path (full flow): send a message → user message appears immediately → Claude streams reply → open Supabase → `messages` table → confirm two rows exist for this conversation (one user, one assistant), both with the correct `conversation_id`*
> - *Happy path (reload): after the exchange above, reload the page → both messages load from Supabase and appear in the chat*
> - *Failure path (network loss): disconnect from the internet → send a message → toast appears 'Message couldn't be saved' → Claude still responds from the API (the save failure doesn't block the chat)*
> *Do not mark complete until all three pass."*

---

### Step 6 — Add the Conversation History Sidebar

Give users a way to navigate between past conversations.

Ask Claude Code:
> *"Add a conversation history sidebar to the agent chat page (`src/app/agents/[id]/page.tsx` or a new `ConversationSidebar` component at `src/components/ConversationSidebar.tsx`).*
>
> *The sidebar:*
> - *Fetches the conversation list on mount: `GET /api/conversations?agentId=[agentId]`. Show a loading skeleton (a placeholder — grey animated bars where the content will be) while loading*
> - *Renders each conversation as a clickable row: show the `title` if it exists, otherwise show 'New conversation' in grey italic text. Show the date formatted as 'May 14' (month + day only) in small text below the title*
> - *Clicking a conversation row calls `router.push('/agents/[agentId]?c=[conversationId]')` — this loads that conversation. Highlight the currently active conversation with a different background colour*
> - *Shows a 'New conversation' button at the top. Clicking it calls `router.push('/agents/[agentId]')` — this clears the `?c=` param and starts a fresh empty chat*
> - *Shows a delete icon (trash icon from lucide-react — a lightweight icon library already used in the project) on hover of each conversation row. Clicking it calls `DELETE /api/conversations/[id]`, then removes it from the list. Ask for confirmation first: a simple `window.confirm('Delete this conversation?')` — no modal needed here*
> - *On mobile screens (below `md:` breakpoint — Tailwind's name for screens wider than 768px), collapse the sidebar to a toggleable drawer with a ☰ button in the chat header*
>
> *After building, verify by testing:*
> - *Happy path (navigation): have two conversations with the same agent → sidebar shows both → clicking switches between them and the URL updates*
> - *Happy path (new): click 'New conversation' → URL clears to `/agents/[id]` → empty chat*
> - *Happy path (delete): hover a conversation → trash icon appears → click → confirm dialog → conversation removed from sidebar*
> - *Failure path (empty state): new agent with no conversations → sidebar shows 'No conversations yet' and the 'New conversation' button*
> *Do not mark complete until all four pass."*

---

### ✅ Before You Commit — Chat Persistence + Sidebar

| Test | Expected result |
|---|---|
| Navigate to `/agents/[id]`, send a message | URL updates to `?c=[id]` without page reload |
| Reload the page with `?c=[id]` in URL | Both messages (user + assistant) load from Supabase |
| Check Supabase `messages` table after a chat exchange | Two rows exist with correct `conversation_id`, `role`, and `content` |
| Open the sidebar | Past conversations listed with title or 'New conversation' placeholder |
| Click a past conversation in sidebar | Chat loads that conversation's messages from Supabase |
| Click 'New conversation' | URL clears, empty chat shown |
| Hover a conversation + click delete | Conversation removed after confirmation |
| Navigate to `/agents/[id]?c=[deleted-id]` | URL clears, empty chat shown — no crash |

---

## 💾 Commit Checkpoint — Chat Persistence + Sidebar Complete

Conversations now survive page reloads. The sidebar makes navigation between past chats discoverable.

```bash
git add -A
git commit -m "feat: conversation persistence — save messages to Supabase, sidebar with conversation history"
```

---

## ⚙️ Session 3 — Sunday 10am–12pm (Hours 5–6): Context Management + Auto-Titles

### Step 7 — Auto-Generate Conversation Titles

A conversation titled "New conversation" is not helpful. After the first assistant reply, automatically generate a short, descriptive title using Claude.

Ask Claude Code:
> *"After the first assistant message is saved in a new conversation (you can detect 'first assistant message' by checking if the messages array had only 1 item — the user's message — before this reply), trigger an auto-title generation:*
>
> *1. Create a new API route at `src/app/api/conversations/[id]/title/route.ts`. POST handler:*
>    - *Require auth — return 401 (Unauthorised — not logged in) if no session*
>    - *Verify ownership of the conversation — return 403 (Forbidden — not your conversation) if not*
>    - *Read `userMessage` and `assistantMessage` from the request body*
>    - *Call the Claude API (using the Anthropic SDK) with this prompt (no streaming needed, just a regular single-turn call):*
> ```
> Human: Here is the first exchange from a chat conversation:
>
> User: [userMessage]
>
> Assistant: [first 200 characters of assistantMessage]
>
> Generate a short title for this conversation. Rules:
> - 3 to 6 words maximum
> - Descriptive of the topic, not generic (not "Chat" or "Conversation")
> - No punctuation at the end
> - Return only the title, nothing else
> ```
>    - *Extract the text from the response and trim whitespace*
>    - *Update the conversation title: `PATCH /api/conversations/[id]` with `{ title: generatedTitle }`*
>    - *Return 200 with `{ title: generatedTitle }`*
>
> *2. In the chat page's send handler, after saving the first assistant message (and only for the very first exchange — check with `messages.length === 1` before the reply is added), call `POST /api/conversations/[conversationId]/title` with the user and assistant messages. This is fire-and-forget (`.catch(console.error)` — don't `await`). When the route responds, update the sidebar's title for this conversation using a local state update — no full sidebar reload needed.*
>
> *After building, verify by testing:*
> - *Happy path: new conversation → send 'What are the latest developments in quantum computing?' → assistant replies → wait 2–3 seconds → sidebar title updates from 'New conversation' to something like 'Quantum computing latest developments'*
> - *Happy path (subsequent messages): send a second message in the same conversation → title does not change (only generated once)*
> - *Failure path (title API error): if the title API call throws (e.g. API key issue), log the error but do not surface it to the user — the conversation continues working, just with no title*
> *Do not mark complete until all three pass."*

---

### Step 8 — Context Window Management

Long conversations are expensive to send in full with every API call. This step adds a smart truncation strategy so the chat stays fast and affordable as conversations grow.

Ask Claude Code:
> *"Add a context window management layer to the chat API route at `src/app/api/chat/route.ts`. This runs before the messages array is sent to Claude.*
>
> *The strategy:*
> - *Define `MAX_HISTORY_MESSAGES = 40` (a constant — a value that never changes at runtime, declared with `const` at the top of the file). 40 messages is roughly 15,000–25,000 tokens depending on length, leaving ample room for the system prompt, tool definitions, and new message within the 200,000-token context window.*
> - *If `messages.length <= MAX_HISTORY_MESSAGES`: send all messages as-is. No truncation needed.*
> - *If `messages.length > MAX_HISTORY_MESSAGES`:*
>    - *Split the messages: `earlyMessages = messages.slice(0, messages.length - 30)` and `recentMessages = messages.slice(-30)` (keep the 30 most recent)*
>    - *Generate a summary of the early messages by calling Claude with a short summarisation prompt (non-streaming):*
> ```
> Summarise the following conversation history in 3–5 sentences. Focus on: key topics discussed, decisions made, information the user shared, and any ongoing tasks. Be concise.
>
> [format each early message as "User: ..." or "Assistant: ..."]
> ```
>    - *Prepend a synthetic system message to `recentMessages`:*
> ```typescript
> { role: 'user', content: `[Earlier conversation summary: ${summary}]` },
> { role: 'assistant', content: 'Understood — I have the context from our earlier conversation.' }
> ```
>    - *Use `recentMessages` (with the summary prepended) as the messages array for the Claude API call*
>
> *Create a utility function `prepareMessagesForContext(messages: Message[], maxMessages: number): Promise<Message[]>` in `src/lib/context.ts` and import it in the chat route. The function handles the split, summarise, and prepend logic.*
>
> *After building, verify by testing:*
> - *Happy path (short conversation): fewer than 40 messages → no truncation → all messages sent (confirm by checking the messages array length in a console.log before the Claude API call)*
> - *Happy path (long conversation): create a test with 45 mock messages (you can temporarily hardcode them in the route for testing) → function returns 32 items (2 summary messages + 30 recent) → Claude responds correctly*
> - *Failure path (summary API fails): if the Claude summarisation call throws, catch the error and fall back to sending only the 30 most recent messages with no summary — the conversation continues, just without early context. Log the error with `console.error`*
> *Do not mark complete until all three pass."*

---

### ✅ Before You Commit — Context Management + Auto-Titles

| Test | Expected result |
|---|---|
| Send first message in new conversation, wait 3 seconds | Sidebar title updates from 'New conversation' to a descriptive 3–6 word title |
| Send a second message in same conversation | Sidebar title does not change again |
| Conversation with fewer than 40 messages | All messages sent to Claude — no truncation |
| Conversation with 45+ messages (test with mock data) | Summary prepended, only 30 recent messages sent |
| Summary API call fails (invalid key in test) | Chat continues working, falls back to 30 most recent messages |

---

## 💾 Commit Checkpoint — Context Management + Auto-Titles Complete

Long conversations no longer risk token overflow. Every new chat gets a meaningful title automatically.

```bash
git add -A
git commit -m "feat: auto-generated conversation titles, context window management with sliding window + summary"
```

---

## ⚙️ Session 4 — Sunday 2–4pm (Hours 7–8): Share Feature + Public Agent Pages

### Step 9 — Add the Share Feature to Agents

Give each agent a toggle that makes it publicly accessible via a unique URL.

Ask Claude Code:
> *"Add a share/public toggle to the agent chat page and build the API route that powers it.*
>
> *1. In `src/app/agents/[id]/page.tsx`, add a 'Share' button to the chat header (alongside the existing Edit button). Use a Share icon from lucide-react.*
>
> *2. Clicking Share opens a shadcn/ui `Dialog` (a modal overlay — a panel that appears on top of the page, blocking interaction with the rest of the page until dismissed) with:*
>    - *A toggle switch labelled 'Make this agent public'. Below it: 'Anyone with the link can chat with this agent.'*
>    - *When toggled ON for the first time, call `PATCH /api/agents/[id]/share` to generate a slug and set `is_public = true`*
>    - *When toggled OFF, call the same route to set `is_public = false` (slug is kept so the same URL works if they re-enable)*
>    - *After toggling ON: show a read-only text input with the public URL: `https://[domain]/share/[slug]` and a 'Copy link' button that calls `navigator.clipboard.writeText(url)` and shows a brief 'Copied!' confirmation*
>    - *Show the current share status: 'Public — anyone with the link can chat' (green badge) or 'Private — only you can access this agent' (grey badge)*
>
> *3. Create `src/app/api/agents/[id]/share/route.ts`. PATCH handler:*
>    - *Require auth — return 401 (Unauthorised — not logged in) if no session*
>    - *Load the agent — return 404 (Not Found) if missing, 403 (Forbidden — not your agent) if not owner*
>    - *Read `isPublic: boolean` from the request body*
>    - *If `isPublic === true` and `agent.slug` is null: generate a slug. Install `slugify` (`npm install slugify`). Convert the agent name: `slugify(agent.name, { lower: true, strict: true })`. Check if slug already exists in `agents` table. If a conflict exists (two agents with the same slugified name), append `-[4 random hex chars]` to make it unique: `slug + '-' + Math.random().toString(16).slice(2, 6)`*
>    - *Update the agent: `{ is_public: isPublic, slug: generatedSlug }` (only set slug if it's being generated for the first time — don't overwrite it on subsequent toggles)*
>    - *Return 200 with `{ is_public, slug, publicUrl: '/share/' + slug }`*
>
> *After building, verify by testing:*
> - *Happy path (first share): click Share on an agent → toggle ON → route generates a slug → dialog shows the public URL → Copy link button copies the URL*
> - *Happy path (toggle off): toggle OFF → agent status updates to Private — link still shown but inactive*
> - *Happy path (re-enable): toggle ON again on a previously-shared agent → same slug reused — same URL as before*
> - *Failure path (duplicate slug): create two agents with the same name → share both → slugs are different (second has a suffix)*
> *Do not mark complete until all four pass."*

---

### Step 10 — Build the Public Agent Page

The page anyone can visit to chat with a public agent — no login required.

Ask Claude Code:
> *"Create `src/app/share/[slug]/page.tsx` — a public Next.js page (no auth check — this route is intentionally accessible to anyone).*
>
> *The page:*
>
> *1. Loads the agent by slug: `SELECT id, name, description, config, user_id FROM agents WHERE slug = $1 AND is_public = true`. If no result: show a 404 page with a friendly message: 'This agent is no longer available. It may have been made private or deleted.' and a link to agentforge's homepage.*
>
> *2. Displays the agent's name, description, and a capability badge row (same format as the chat page — '🔍 Web search', '🧮 Calculator', '📄 Documents (N)', or '💬 Chat only').*
>
> *3. Shows a live chat interface — identical to the private chat in UX. This chat:*
>    - *Sends messages to a new API route: `POST /api/share/[agentId]/chat` (built below)*
>    - *Does NOT persist conversation history to Supabase — public conversations are in-memory only, for privacy reasons. The user's messages are never stored.*
>    - *Shows a banner at the top: '🔒 This is a public demo. Your messages are not saved.'*
>
> *4. Shows a footer CTA below the chat:*
>    - *If logged in: a 'Clone this agent to your account' button (Step 11)*
>    - *If not logged in: 'Want to build your own AI agents? Sign up free →' with a link to `/auth/signup`*
>
> *Create `src/app/api/share/[agentId]/chat/route.ts` — the public chat API route:*
>    - *No auth check — this route is public*
>    - *Load the agent by ID and verify `is_public === true`. Return 403 (Forbidden — this agent is private) if not*
>    - *Build the tools array and system prompt exactly like the private chat route*
>    - *Apply the same agentic loop (while loop, max 5 iterations) from Week 8*
>    - *Return a streaming response — identical to the private chat route's streaming*
>    - *Do NOT save any messages to Supabase*
>
> *After building, verify by testing:*
> - *Happy path: make an agent public → copy the `/share/[slug]` URL → open it in an incognito window (to confirm it works without a session) → chat interface loads → send a message → Claude responds with streaming*
> - *Happy path (tools): the public agent has web search enabled → ask a web search question → thinking indicator → real web results*
> - *Failure path (private agent): change `is_public` to false in Supabase → visit the share page → 404 message shown, not a crash*
> - *Failure path (bad slug): visit `/share/nonexistent-slug` → 404 message shown*
> *Do not mark complete until all four pass."*

---

### Step 11 — Clone Agent Functionality

Let logged-in users copy a public agent's configuration into their own account.

Ask Claude Code:
> *"Add the 'Clone this agent' feature to the public share page.*
>
> *1. The 'Clone this agent to your account' button on `/share/[slug]` calls `POST /api/agents/clone` with `{ sourceAgentId: agentId }`.*
>
> *2. Create `src/app/api/agents/clone/route.ts`. POST handler:*
>    - *Require auth — return 401 (Unauthorised — not logged in) if no session. This route is only for logged-in users.*
>    - *Load the source agent by `sourceAgentId`. Return 404 (Not Found) if missing.*
>    - *Return 403 (Forbidden — this agent is private and can't be cloned) if `is_public === false`.*
>    - *Create a new agent row for the current user:*
> ```typescript
> {
>   user_id: session.user.id,
>   name: sourceAgent.name + ' (clone)',
>   description: sourceAgent.description,
>   config: sourceAgent.config,
>   is_public: false,  // clones start as private
>   slug: null         // no public URL until the user shares it
> }
> ```
>    - *Return 201 (Created — new agent saved) with `{ agentId: newAgent.id }` — the UI will redirect to this agent's chat page.*
>
> *3. In the share page, wire the button: on success (201 response), call `router.push('/agents/[newAgentId]')` to redirect to the cloned agent's private chat. On failure, show a toast notification.*
>
> *After building, verify by testing:*
> - *Happy path: logged-in user visits a public agent's share page → clicks 'Clone this agent' → redirected to `/agents/[new-id]` → new agent appears on dashboard named '[Agent name] (clone)' with same capabilities*
> - *Happy path (not logged in): click Clone → user is redirected to `/auth/login?redirect=/share/[slug]` (or the button is replaced by the sign-up CTA — choose one approach and implement it consistently)*
> - *Failure path (private source): call `POST /api/agents/clone` with a private agent's ID → returns 403 (Forbidden — agent is not public, cannot be cloned)*
> *Do not mark complete until all three pass."*

---

### ✅ Before You Commit — Share Feature + Public Pages + Clone

| Test | Expected result |
|---|---|
| Click Share on a private agent | Dialog opens with toggle OFF and 'Private' status |
| Toggle Share ON | Slug generated, public URL shown, Copy link button works |
| Re-enable share on a previously-shared agent | Same slug (same URL) — no new slug generated |
| Two agents with the same name shared | Different slugs (second has `-[4chars]` suffix) |
| Visit `/share/[slug]` in incognito | Agent name, description, capability badges, and chat load without login |
| Chat in public agent incognito | Claude responds with streaming — same quality as private chat |
| Check Supabase `messages` table after public chat | No new rows — public chat is not persisted |
| Visit `/share/[private-slug]` after toggling private | 404 message shown — not a crash |
| Logged-in user clicks 'Clone this agent' | Redirected to new private agent at `/agents/[id]` |
| New agent appears on dashboard | Named '[Agent name] (clone)', same config, `is_public = false` |

---

## 💾 Commit Checkpoint — Share + Public Pages + Clone Complete

```bash
git add -A
git commit -m "feat: public agent share pages, clone agent, shareable URLs with auto-slug generation"
```

---

## ✨ Stretch Tasks (+4–5 hrs, if you have time)

These are optional. None of them block Week 10.

---

### Stretch 1 — SEO + Open Graph Metadata for Share Pages (1 hr)

When your public agent link is shared on Twitter, Slack, or iMessage, it currently shows a plain URL. Open Graph metadata makes it show a rich preview card instead.

Ask Claude Code:
> *"Add Open Graph metadata to `src/app/share/[slug]/page.tsx`. In Next.js App Router (the new file-system routing system used since Next.js 13), metadata is defined by exporting a `generateMetadata` function from a page file — not by manually writing `<head>` tags.*
>
> *The function signature is:*
> ```typescript
> export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata>
> ```
>
> *Inside it:*
> - *Fetch the agent by slug (same query as the page component)*
> - *If not found: return `{ title: 'Agent not found | AgentForge' }`*
> - *If found: return:*
> ```typescript
> {
>   title: `${agent.name} | AgentForge`,
>   description: agent.description || 'Chat with this AI agent on AgentForge',
>   openGraph: {
>     title: `${agent.name} — AI Agent on AgentForge`,
>     description: agent.description || 'Try this AI agent built with AgentForge',
>     type: 'website',
>     url: `https://[your-vercel-domain]/share/${agent.slug}`,
>   },
>   twitter: {
>     card: 'summary',
>     title: `${agent.name} — AI Agent on AgentForge`,
>     description: agent.description || 'Try this AI agent built with AgentForge',
>   },
> }
> ```
>
> *After building, verify by testing:*
> - *Happy path: deploy a preview to Vercel (push a branch → Vercel auto-builds) → paste the share page URL into https://www.opengraph.xyz — the title and description appear in the preview card*
> - *Failure path (missing description): share an agent with no description → fallback description appears in the Open Graph preview, not an empty field*
> *Do not mark complete until both pass."*

Ask Claude Code: *"What is `generateMetadata` in Next.js App Router and how is it different from the old `<Head>` component from Next.js Pages Router? Why does the new approach work better for social sharing?"*

---

### Stretch 2 — Explore / Gallery Page (1.5 hrs)

Give AgentForge a front door — a public page where anyone can discover agents without needing a link.

Ask Claude Code:
> *"Build `src/app/explore/page.tsx` — a public gallery of public agents.*
>
> *The page:*
> - *Fetches all public agents: `SELECT id, name, description, config, slug, created_at FROM agents WHERE is_public = true ORDER BY created_at DESC LIMIT 30`*
> - *Renders each agent as a card (reuse or extend the existing `AgentCard` component): shows the agent name, a truncated description (max 100 characters, add '...' if longer), the capability badges (🔍 🧮 📄), and a 'Try it →' button linking to `/share/[slug]`*
> - *Shows a search input at the top. Filtering is client-side (in the browser, without a round trip to the server — fast and simple for the current data size) — filter cards as the user types by matching `name` or `description`*
> - *Add a filter row below search: 'All' | 'Web search' | 'Calculator' | 'Documents'. Clicking filters to only show agents with that capability enabled*
> - *Shows an empty state if no public agents exist yet: 'No public agents yet. Be the first to share one!' with a link to the dashboard*
> - *Add 'Explore' to the Navbar so it's discoverable without needing a URL*
>
> *After building, verify by testing:*
> - *Happy path: make at least two agents public → visit `/explore` in incognito → both appear as cards → 'Try it' links work*
> - *Happy path (search): type a keyword that matches one agent's name → only that agent shows*
> - *Happy path (filter): click 'Web search' filter → only agents with web search enabled show*
> - *Failure path (no public agents): all agents private → empty state message shown*
> *Do not mark complete until all four pass."*

---

### Stretch 3 — View Counter (30 min)

Track how many times each public agent's share page is viewed. This is fully testable on localhost — no deployment needed.

Ask Claude Code:
> *"Add a simple view counter to public agent pages.*
>
> *1. The `agents` table already has `is_public` and `slug` columns from Step 9. Add a `public_views` integer column (default 0) to count page views:*
> ```sql
> ALTER TABLE agents ADD COLUMN IF NOT EXISTS public_views INTEGER DEFAULT 0;
> ```
>
> *2. In the public chat API route (`src/app/api/share/[agentId]/chat/route.ts`), after confirming the agent is public, fire a background Supabase increment (a Postgres function that adds 1 to a column atomically — preventing a race condition where two simultaneous visits would both read 0 and both write 1 instead of ending at 2):*
> ```sql
> UPDATE agents SET public_views = public_views + 1 WHERE id = $1
> ```
> *Run this as fire-and-forget (no `await`) using the service role client (which bypasses RLS — needed here because the visitor isn't logged in). If it throws, catch and log only — never let analytics break the API.*
>
> *3. On the public share page, show the view count below the agent name: '2,847 conversations started'. Format with `toLocaleString()` (a JavaScript built-in that formats numbers with locale-appropriate commas: `2847 → '2,847'`).*
>
> *After building, verify by testing:*
> - *Happy path: visit a public agent's share page, send a message → view count in Supabase increments by 1 → reload the share page → updated count shown*
> - *Failure path (counter error): if the SQL update fails, the chat route continues without error — the counter is not critical*
> *Do not mark complete until both pass."*

⏸️ **Vercel Analytics — defer to Week 11.** The `@vercel/analytics` package sends data to Vercel's servers and does nothing on localhost — the dashboard will show zero data until the app is deployed. This is a two-step job once you're on Vercel: enable Analytics in the dashboard (one click) + add `<Analytics />` to `layout.tsx` (one line). Add it then, not now.

---

### Stretch 4 — GitHub Repository Polish (1 hr)

AgentForge is almost ready to share publicly. This stretch makes the GitHub repo look professional.

Ask Claude Code:
> *"Draft a comprehensive `README.md` for the AgentForge project root. It should include:*
> - *A one-line description: 'AgentForge — Build, share, and clone AI agents without writing code'*
> - *A 'Live Demo' link placeholder (you'll fill in the Vercel URL in Week 11)*
> - *A 'Features' section covering: visual 5-step builder, tool integrations (web search, calculator, documents), conversation history, public sharing and cloning, open-source*
> - *A 'Tech Stack' table: Next.js 16 | React 19 | Tailwind CSS v4 | Supabase | Claude API | Vercel*
> - *A 'Quick Start' section: clone repo, install dependencies (`npm install`), copy `.env.example` to `.env.local`, fill in keys, run `npm run dev`*
> - *A 'Contributing' section: link to `CONTRIBUTING.md`*
> - *A MIT License badge placeholder*
>
> *Also create:*
> - *`.env.example` — a copy of `.env.local` with all values replaced by placeholder strings (e.g. `ANTHROPIC_API_KEY=your_anthropic_api_key_here`). This file IS committed to GitHub — it shows new contributors what variables they need without exposing real values*
> - *`CONTRIBUTING.md` — a brief guide: how to fork, how to run locally, code style conventions, how to open a PR*
> - *`CHANGELOG.md` — with a single entry: `## Week 9 (May 2026) — Conversation persistence, shareable agents, clone feature`*
>
> *After building, verify:*
> - *Happy path: view README.md in GitHub — headings, tables, and code blocks render correctly (you can preview this in VS Code with the built-in Markdown preview: Cmd+Shift+V)*
> - *Verify `.env.example` does not contain any real API keys — only placeholder strings*
> *Do not mark complete until both pass."*

### Stretch 5 — Automated Testing Framework (1.5 hrs)

Three layers of testing that all run from the terminal. Each layer covers a different part of the stack — API routes, pure functions, and browser UI. If any layer already exists from earlier weeks, ask Claude Code to validate it still passes before extending it.

| Layer | Tool | What it tests | Command |
|---|---|---|---|
| 1 | test-routes.ts (already installed) | API routes — HTTP status codes, auth, data integrity | `npx tsx src/lib/tools/test-routes.ts` |
| 2 | Vitest | Pure functions — context window logic, slug generation | `npx vitest run` |
| 3 | Playwright | Browser UI — URL params, sidebar, share page in incognito | `npx playwright test` |

---

#### Layer 1 — Extend API Route Tests (~20 min)

You already have `src/lib/tools/test-routes.ts` from Step 3, covering the conversations and messages API routes. Ask Claude Code to extend it:

> *"Extend `src/lib/tools/test-routes.ts` to add Week 9 coverage for the routes built after Step 3. Add tests for:*
> - *POST /api/agents/[id]/share with `{ isPublic: true }` → 200 (OK — request succeeded) + slug returned*
> - *POST /api/agents/[id]/share with `{ isPublic: false }` → 200 + is_public is false in response*
> - *POST /api/agents/clone with a valid public agent ID → 201 (Created — new resource created) + agentId returned*
> - *POST /api/agents/clone with a private agent ID → 403 (Forbidden — logged in but not allowed to clone a private agent)*
> - *POST /api/conversations/[id]/title with { userMessage, assistantMessage } → 200 + title string returned*
> - *Check Supabase messages table after a public chat exchange via /api/share/[agentId]/chat → row count for that agentId should be 0 (public chat is not persisted)*
>
> *Use the existing service role client pattern. Run all tests including the original ones — do not remove any. Print 'X passed, Y failed' at the end.*
>
> *After building, verify by testing:*
> - *Happy path: `set -a && source .env.local && set +a && npx tsx src/lib/tools/test-routes.ts` → all tests pass*
> - *Failure path: temporarily break one route (e.g. comment out auth check) → that test fails with clear output, others still pass*
> *Do not mark complete until both pass."*

---

#### Layer 2 — Vitest for Pure Functions (~30 min)

Vitest is a TypeScript-native test runner — it runs your functions directly in Node.js (the JavaScript runtime) without a browser, checks the outputs match what you expect, and reports pass/fail in under a second. Perfect for testing logic that doesn't need the network or a UI.

Install it once:
```bash
npm install -D vitest
```

Ask Claude Code:
> *"Install Vitest (`npm install -D vitest`) and add a `test` script to `package.json`: `\"test\": \"vitest run\"`. Then create `src/lib/__tests__/context.test.ts` to test the `prepareMessagesForContext` function from `src/lib/context.ts`.*
>
> *Write tests for:*
> - *Under 40 messages → function returns the array unchanged, same length*
> - *Exactly 40 messages → function returns unchanged (boundary — the exact limit should not trigger truncation)*
> - *41 messages → function returns 32 items (2 synthetic summary messages + 30 recent)*
> - *Summarisation throws an error → function falls back to returning the 30 most recent messages with no crash*
>
> *Also create `src/lib/__tests__/slug.test.ts` to test slug generation from the share route: 'My Research Agent' → 'my-research-agent', two agents with identical names → different slugs (second has a unique suffix).*
>
> *After building, verify by testing:*
> - *Happy path: `npx vitest run` → all tests pass with green output*
> - *Failure path: change the maxMessages value in one test to an intentionally wrong number → that test fails with a clear diff showing expected vs. received*
> *Do not mark complete until both pass."*

Run tests any time with:
```bash
npx vitest run
```

---

#### Layer 3 — Playwright for Browser/UI Tests (~40 min)

Playwright is an end-to-end (E2E) testing library — it opens a real browser (Chromium by default), navigates pages, clicks elements, reads the DOM (the live HTML tree of the page), and asserts what it finds. This is what can validate the UI behaviours that can't be tested with a script alone: URL updating without a reload, the sidebar refreshing after a reply, the share page loading in incognito.

Install it once (say yes to all prompts, choose Chromium only to keep it fast):
```bash
npm init playwright@latest
```

Ask Claude Code:
> *"Set up Playwright for the AgentForge project (Next.js 16 dev server on port 3000). Create `playwright.config.ts` with: baseURL `http://localhost:3000`, use `chromium` only, `webServer` that runs `npm run dev` automatically before tests. Store test files in `e2e/`.*
>
> *Create `e2e/conversations.spec.ts` with these tests (each is a Playwright test — a function that drives a real browser):*
> - *'URL updates to ?c= on first message': navigate to /agents/[testAgentId] (no query param) → type a message → send → assert URL contains ?c= after reply arrives, and the page did not fully reload (use `page.waitForURL` with a timeout)*
> - *'History persists on reload': after sending a message and getting ?c= in URL → reload page → assert the user message text is visible in the chat*
> - *'New conversation button clears URL': click New Conversation → assert URL no longer contains ?c=*
>
> *Create `e2e/share.spec.ts` with:*
> - *'Share page loads without auth': navigate to /share/[testSlug] in a new browser context (simulates incognito — no cookies) → assert agent name heading is visible*
> - *'Non-existent slug shows 404': navigate to /share/this-slug-does-not-exist → assert page contains 'no longer available' or equivalent 404 message*
>
> *Use a test agent that is already public (hardcode its slug from your Supabase data). Do not create or delete data in E2E tests — read and interact only.*
>
> *After building, verify by testing:*
> - *Happy path: start dev server (`npm run dev` in one terminal) → run `npx playwright test` in another → all tests pass*
> - *Failure path: take the dev server offline → Playwright reports tests as failed with a connection error, not a crash*
> *Do not mark complete until both pass."*

Run E2E tests any time (with the dev server already running):
```bash
npx playwright test
```

Or let Playwright start the server automatically:
```bash
npx playwright test --headed
```
(`--headed` means "show the browser window" — useful when debugging a failing test so you can watch what Playwright is doing.)

---

#### 🧪 Concept Table — Testing Layers

| Concept | What it is | Design analogy |
|---|---|---|
| **Unit test** | Tests a single function in isolation — no network, no browser | Checking a single Figma component renders correctly in isolation |
| **Integration test** | Tests how multiple parts work together (e.g. API route + database) | Checking a component still works after connecting it to real data |
| **E2E test** | Tests a full user journey in a real browser | Running a usability test on the live prototype |
| **Test runner** | The tool that finds and runs your tests and reports results | Like a Figma plugin that audits every component automatically |
| **Assertion** | A statement that something must be true — test fails if it isn't | Like a design spec: "button must be 44px tall" — fails review if not |
| **Headless** | Browser runs in the background with no visible window (faster) | Exporting a Figma file without opening it on screen |
| **`--headed`** | Browser window is visible while the test runs (useful for debugging) | Watching a screen recording of a usability session |

---

## 💾 Commit Checkpoint — Stretch Tasks (if attempted)

```bash
git add -A
git commit -m "feat: Open Graph metadata, explore gallery, view counter, README + contributing docs, automated test framework (Vitest + Playwright)"
```

---

## 💾 Sprint Close — Week 9 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, and update `CLAUDE.md`'s Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 9 complete — conversation persistence, auto-titles, context management, shareable agents, clone"
```

After committing, open `CLAUDE.md` and move "Week 9" from Current Focus into Completed Work with a two-sentence summary of what shipped. Update the Current Focus to Week 10: *"Stripe Checkout freemium model (3 agents / 100 msgs free, Pro $12/month), Stripe webhooks, usage enforcement, email notifications with Resend, security audit."*

---

## ✅ Completion Checklist

Work through these top to bottom. Don't mark anything done until you've actually tested it.

- [ ] `conversations` table created in Supabase with `id`, `user_id`, `agent_id`, `title`, `created_at` columns
- [ ] `messages` table has `conversation_id` UUID column with foreign key to `conversations`
- [ ] `agents` table has `is_public` (boolean, default false) and `slug` (text, unique) columns
- [ ] RLS enabled on `conversations` — users can only access their own rows
- [ ] Indexes created on `conversations(agent_id)` and `messages(conversation_id)` for query performance
- [ ] `POST /api/conversations` creates a conversation and returns 201
- [ ] `GET /api/conversations?agentId=[id]` returns the conversation list for an agent
- [ ] `GET /api/conversations/[id]` returns conversation with all messages
- [ ] `PATCH /api/conversations/[id]` updates the conversation title
- [ ] `DELETE /api/conversations/[id]` deletes conversation and cascades to messages
- [ ] `POST /api/conversations/[id]/messages` saves a message and returns 201
- [ ] All conversation routes return 401 (Unauthorised) with no session
- [ ] All conversation routes return 403 (Forbidden) when accessed by a different user
- [ ] Chat page reads `?c=` query param and loads that conversation's messages on mount
- [ ] Navigating to `/agents/[id]` with no query param shows an empty chat (no conversation created until first message)
- [ ] Sending first message creates a conversation and updates URL to `?c=[id]` without page reload
- [ ] User messages saved to Supabase immediately on send (optimistic)
- [ ] Assistant messages saved to Supabase after streaming completes (fire-and-forget)
- [ ] Reload the chat page — full message history loads from Supabase
- [ ] Conversation history sidebar shows past conversations for the current agent
- [ ] Clicking a sidebar conversation loads its messages
- [ ] 'New conversation' button clears the URL param and shows empty chat
- [ ] Deleting a conversation from sidebar removes it after confirmation
- [ ] Auto-title generates after the first assistant reply — sidebar title updates within 3 seconds
- [ ] Auto-title only runs once per conversation — subsequent messages don't regenerate it
- [ ] Context window management: fewer than 40 messages → all sent; over 40 → sliding window + summary applied
- [ ] Context summary failure falls back to 30 most recent messages — chat continues without error
- [ ] Share dialog opens from the agent chat header
- [ ] Toggling Share ON generates a unique slug and shows a public URL with Copy link button
- [ ] Toggling Share OFF makes the agent private — share page returns 404
- [ ] Re-enabling share on a previously-shared agent reuses the same slug
- [ ] Two agents with the same name get different slugs (second has unique suffix)
- [ ] `/share/[slug]` loads without authentication (tested in incognito)
- [ ] Public chat works end-to-end in incognito — streaming, tool calls, thinking indicator
- [ ] Public chat messages are NOT saved to Supabase (confirmed in table editor)
- [ ] 'Not saved' banner visible on public chat page
- [ ] Logged-out visitor sees 'Sign up' CTA; logged-in visitor sees 'Clone this agent' button
- [ ] Clone creates a new private agent for the logged-in user and redirects to it
- [ ] Cloned agent has same name + '(clone)', same config, `is_public = false`
- [ ] Attempting to clone a private agent via API returns 403
- [ ] Committed with descriptive messages after each major checkpoint

---

## 🧪 Validation Tests

Run these specific tests before closing out the week. Each should produce the result in the right column.

| Test | Expected result |
|---|---|
| Navigate to `/agents/[id]` (no query param), send a message | URL updates to `?c=[id]` without page reload |
| Reload `/agents/[id]?c=[conversationId]` | Full message history loads from Supabase — no messages lost |
| Check Supabase `messages` table after a chat | Two rows: one `role: 'user'`, one `role: 'assistant'`, both with correct `conversation_id` |
| Wait 3 seconds after first assistant reply | Sidebar conversation title updates from 'New conversation' to a descriptive title |
| Send 5 more messages, check sidebar | Conversation title stays the same — not regenerated |
| Conversation with 45+ messages (mock if needed) | Context management kicks in — 30 recent + summary prepended |
| Click Share on a private agent | Dialog shows 'Private' status with toggle OFF |
| Toggle Share ON | Slug generated, public URL shown in text input |
| Open share URL in incognito window | Page loads without auth — agent name, description, chat all visible |
| Send a message in public incognito chat | Claude responds with streaming — same quality as private |
| Check Supabase after public chat exchange | No new rows in `messages` — public chat is not persisted |
| Toggle Share OFF → reload `/share/[slug]` | 404 message shown — no crash |
| Logged-in user clicks 'Clone this agent' | Redirected to `/agents/[newId]` — new agent on dashboard named '[Name] (clone)' |
| Visit `/share/nonexistent-slug` | 404 page with friendly message and homepage link |
| Delete a conversation from sidebar | Conversation and its messages removed from Supabase — confirmed in table editor |

---

## 📚 Resources

- [Supabase Foreign Keys](https://supabase.com/docs/guides/database/tables#joining-tables-with-foreign-keys) — how to create and use relationships between tables
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) — controlling which users can access which rows
- [Next.js `useSearchParams`](https://nextjs.org/docs/app/api-reference/functions/use-search-params) — reading URL query params from a client component
- [Next.js `generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — how to add dynamic Open Graph and title tags
- [slugify on npm](https://www.npmjs.com/package/slugify) — converting any string to a URL-safe slug
- [Vercel Analytics](https://vercel.com/docs/analytics) — free page view tracking, one-click setup from your Vercel dashboard
- [Open Graph protocol](https://ogp.me/) — the standard for social media link previews
- [opengraph.xyz](https://www.opengraph.xyz/) — test what your page looks like when shared on social media
- [Claude API Anthropic SDK — TypeScript](https://github.com/anthropics/anthropic-sdk-typescript) — `stream()`, `Message`, `TextBlock` types
- [react-markdown](https://www.npmjs.com/package/react-markdown) — rendering Claude's markdown responses in the chat UI (installed in Week 8)
- [navigator.clipboard API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) — copying text to clipboard programmatically
- [Vitest](https://vitest.dev/) — fast TypeScript-native test runner; works with Next.js out of the box
- [Playwright](https://playwright.dev/) — end-to-end browser testing; `npm init playwright@latest` to scaffold

---

*Week 9 of 13 · AgentForge · Phase 3: Building the Product · Updated May 2026*
