# 🔧 Week 8 — Tool Integrations & Agent Capabilities

**Phase:** 3 — Building the Product
**Dates:** Add your own start date
**Total time:** 8–10 hrs core · +6–8 hrs stretch
**Goal:** Give your agents real-world superpowers. Right now they can only chat — this week you add the ability to search the web, do maths, know the current date and time, and read documents from Google Drive. You'll also wire up the tool toggles you built in Week 7 so they actually do something. By the end, a "Research Assistant" agent will find real information on the internet *and* draw on your own documents to answer questions. This is the "wow" moment for demos.

---

## 📋 Before You Start

Run these commands in your terminal to confirm your environment is healthy before touching any new code.

```bash
# Navigate into your project folder
cd agentforge

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see your app. Then run a quick smoke test (a smoke test is a fast, surface-level check that the critical path still works — like turning the ignition before inspecting the engine):

1. **Log in** — confirm your Supabase auth still works
2. **Open the agent builder** — go to `/agents/new` and confirm the 5-step builder from Week 7 loads correctly
3. **Open a saved agent's chat** — confirm the Claude API still responds
4. **Check the capability toggles** — go through the builder to Step 3 and confirm the 4 toggles are still visible and saveable

If all four work, you're ready. If any are broken, paste the error into Claude Code before starting: *"Before I begin Week 8, my [login / builder / chat / toggles] is broken — here's the error: [paste error]. Fix this first."*

---

## 🧠 Key Concepts for This Week

Before you write a single line, read this table. These mental models will make every step this week click instead of blur.

| Concept | What it is | Design analogy |
|---|---|---|
| **Tool use / function calling** | A way to give Claude the ability to call external functions — like a web search or calculator — instead of guessing the answer | Like a designer who doesn't just sketch but also has access to a live Figma plugin that fetches real data |
| **Tool definition** | A JSON object you write that describes a tool to Claude: its name, what it does, and what inputs it accepts | Like a component spec in Figma — the description tells the design system what the component is for and what props it accepts |
| **Input schema** | The formal definition of what data a tool accepts — written in JSON Schema format (a standard way to describe the shape of data) | Like defining a component's required props in Figma: `title: string`, `count: number` |
| **Tool call lifecycle** | The 4-step conversation: (1) you define tools + send a message, (2) Claude replies with a `tool_use` block requesting to call a tool, (3) you run the tool and send back a `tool_result`, (4) Claude reads the result and writes its final reply | Like a Figma handoff loop: designer sends spec → dev builds it → dev sends back the component → designer reviews and approves the final |
| **`tool_use` block** | The part of Claude's API response that says "I want to run this tool with these inputs" — it's not a text reply, it's an instruction | Like a comment in Figma saying "pull real data here" — it's a signal to take an action |
| **`tool_result` block** | What you send back to Claude after running the tool — the raw output that Claude will use to write its final answer | Like adding a sticky note in Figma with the actual value: "the real price is $42" |
| **Agentic loop** | The cycle of Claude thinking → calling a tool → reading the result → thinking again, potentially calling more tools before giving a final answer | Like a Figma prototype with multiple states — the flow isn't linear; it can branch based on what's discovered |
| **Tavily Search API** | A web search service built specifically for AI agents — returns clean, citation-ready text results rather than raw HTML, with a free tier of 1,000 searches/month | Like a plugin that pulls real product images into Figma instead of you manually uploading them |
| **Google Drive API key** | A credential from Google Cloud Console that lets your server read publicly-shared Google Drive files — no user login required as long as the file sharing is set to "anyone with the link" | Like a read-only Figma viewer link — the file is accessible to anyone who has the link, without them needing your account |
| **Document reader tool** | A tool that takes a Google Drive file ID and fetches its text content — Claude can then reason about the document's contents to answer questions | Like a Figma plugin that reads the text layers from a file and returns them as a list — Claude is the designer who then uses that information |
| **RAG (Retrieval-Augmented Generation)** | Fetching relevant content from an external source (like a document) and inserting it into Claude's context before asking it a question — so Claude's answer is grounded in your actual data, not just general training | Like adding a detailed brief to a Figma file before asking a designer to review it — they now answer based on your specific context, not generic assumptions |
| **Environment variable** | A value stored outside your code (in `.env.local`) that gets injected at runtime — used for API keys and secrets that must never be committed to GitHub | Like a Figma library token kept in a password manager, not hardcoded into every file |
| **Graceful degradation** | When a tool fails, the agent falls back to answering from its own knowledge instead of crashing or going silent | Like a Figma component with a fallback placeholder — if the image doesn't load, show a grey rectangle, not a broken layout |

---

## 🔐 HTTP Status Codes Reference

You'll encounter these codes when building the tool API routes and handling external API responses this week.

| Code | Name | Meaning | When to use |
|------|------|---------|-------------|
| 200 | OK | Request succeeded | Tool ran successfully |
| 400 | Bad Request | Client sent bad/incomplete data | Missing tool input, invalid Google Drive URL |
| 401 | Unauthorised | Not logged in | No valid Supabase session when calling chat route |
| 403 | Forbidden | Logged in but not allowed | Using someone else's agent; Google Drive file is private (not "anyone with link") |
| 404 | Not Found | Resource doesn't exist | Google Drive file ID doesn't exist or was deleted |
| 429 | Too Many Requests | Rate limit hit | Brave Search free tier limit reached |
| 500 | Internal Server Error | Server-side failure | Search API down, tool threw an unhandled error |
| 503 | Service Unavailable | Upstream service is down | Brave Search or Google Drive API is temporarily offline |

---

## 🌐 HTTP Request Types Reference

This week your chat API route will evolve from a simple POST to a multi-turn conversation handler with tool results.

| Request type | Intention | Real-world analogy | When used |
|---|---|---|---|
| GET | "Give me data" | Reading a menu | Fetching the agent config; fetching a document from Google Drive |
| POST | "Here is new data, store it" | Placing an order | Sending a user message; sending a tool result back to Claude |
| PUT / PATCH | "Update existing data" | Changing an existing order | Updating tool usage logs |
| DELETE | "Remove this data" | Cancelling an order | Not used this week |

---

## 🛠️ How Claude Tool Use Works — The Full Picture

This is the most important concept of the week. Read this before touching any code.

When you make a normal Claude API call, the conversation looks like this:

```
You → Claude: "What's 847 × 23?"
Claude → You: "That's 19,481." (answered from memory, possibly wrong)
```

With tool use, the conversation looks like this:

```
You → Claude: "What's 847 × 23?" (+ you define a calculator tool)
Claude → You: [tool_use block] "Run calculator({ expression: '847 * 23' })"
You run the calculator → get 19481
You → Claude: [tool_result block] "The calculator returned: 19481"
Claude → You: "847 × 23 is 19,481." (now 100% correct)
```

The same loop applies to documents:

```
You → Claude: "Summarise the key risks from the project brief" (+ document_reader tool + "You have access to: 'Project Brief Q3'")
Claude → You: [tool_use block] "Run document_reader({ fileId: 'abc123' })"
You fetch the Google Doc → get its text content
You → Claude: [tool_result block] "The document contains: [full text]"
Claude → You: "The three key risks are..." (grounded in the actual document)
```

Claude doesn't run tools itself. It *asks* you to run them. Your code runs the tool, then sends the result back. Claude then writes its final reply using that real data.

---

## ⚙️ Session 1 — Saturday 3–5pm (Hours 1–2): Understand Tool Use + Set Up Infrastructure

### Step 1 — Read the Claude Tool Use Docs

Read both of these before writing any code. Budget 25–30 minutes total.

**Resource 1 — How tool use works (the mechanism):**
[https://docs.anthropic.com/en/docs/tool-use](https://docs.anthropic.com/en/docs/tool-use)

Read the first three sections: "How tool use works", "Tool use examples", and "Best practices for tool definitions". This covers the request/response cycle you'll be implementing.

**Resource 2 — The three types of tools (the taxonomy):**
[https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works)

This page explains that not all tools are the same kind of thing. Read it to understand the three categories:

| Tool type | What it is | Example |
|---|---|---|
| **Client tools** | Tools your own application code defines and runs — you write the function, Claude asks for it, you execute it and send the result back | Calculator, document reader, word counter — everything you're building this week |
| **Anthropic-defined tools** | Tools Anthropic has pre-built and ships with the API — you just enable them by name, no runner code needed | Computer use, text editor, bash (available on certain API tiers) |
| **Server tools (MCP)** | Tools hosted on external MCP servers (Model Context Protocol — the open standard for connecting AI models to external services) that Claude connects to at runtime — you configure the connection, the server handles execution | A Slack MCP server, a GitHub MCP server, a Supabase MCP server |

**This week you are building client tools** — the most common type and the right starting point. Understanding that Anthropic-defined and server tools also exist means you'll recognise them when you encounter them in the docs or in other people's code.

Then come back to Claude Code and ask:
> *"Explain how Claude tool use works in plain English — what is function calling, how does Claude decide when to use a tool, and what does the full API request and response look like when a tool is called? Also explain the difference between client tools, Anthropic-defined tools, and server/MCP tools — and which type we're building this week. Show me a minimal working example of a client tool definition and the API call that uses it, using the Anthropic SDK for TypeScript. Explain each field."*

Study the example it gives you. Notice: the tool definition has a `name`, `description`, and `input_schema`. The description is written in plain English — Claude reads this to decide when to use the tool.

---

### Step 2 — Sign Up for Tavily Search API

> ⚠️ **Note on Brave Search:** The guide originally recommended Brave Search API, but Brave removed its free tier in February 2026. New accounts now require a credit card and cost $5 per 1,000 queries. Don't use it for this week.

**Tavily** is now the right choice for this project. It's built specifically for AI agents — it returns clean, citation-ready text results rather than raw HTML, which means less parsing work and better quality answers from Claude. Free tier: **1,000 searches/month, no credit card required**.

**Alternative if Tavily ever goes down or changes pricing:** [Serper](https://serper.dev/) gives you 2,500 free queries upfront with no credit card, then charges $1 per 1,000 queries. Its API is similarly simple.

**Set up Tavily:**

1. Go to [https://tavily.com](https://tavily.com) and create a free account
2. Once signed in, go to your dashboard — your API key is shown on the main page (it starts with `tvly-`)
3. Copy your API key

Then add it to `.env.local`:

```bash
TAVILY_API_KEY=tvly-your_key_here
```

---

### Step 2B — Set Up Google Drive API Key

Google Drive API access for publicly-shared files requires a single API key from Google Cloud Console. This is free and takes about 10 minutes to set up.

**Why an API key, not OAuth?** OAuth (Open Authorisation — the standard where users log in to Google and grant your app permission to read their private files) is the right choice if you want to read *any* user file regardless of sharing settings. An API key works for files that have been shared as "anyone with the link can view" — which is the simpler approach for this week. You can add OAuth in a later sprint if needed. For now, the API key approach lets agents read any document the agent owner deliberately shares with the agent.

**Set up the Google Cloud Console project:**

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/) and sign in with your Google account
2. Click "Select a project" at the top → "New Project" → name it `agentforge-dev` → Create
3. In the left sidebar, go to **APIs & Services** → **Library**
4. Search for "Google Drive API" → click it → click **Enable**
5. In the left sidebar, click **Credentials** — the standalone menu item, not the "Credentials" tab that appears inside the Drive API's own details page (that tab only shows OAuth and Service Account options, not API keys)
6. At the top of the Credentials page, click **+ Create Credentials** → **API key** (this fourth option only appears from this top-level Credentials page)
7. The key is generated immediately — copy it (it will look like `AIzaSy...`)
8. Click **Edit API key** → under "API restrictions", select "Restrict key" → choose "Google Drive API" — this limits the key to Drive only, reducing risk if it's ever exposed

> ⚠️ **Do NOT tick "Authenticate API calls through a service account"** — this option appears on the key editing screen and is required only for Google's Vertex AI Agent Platform and other APIs that mandate service account authentication. For a standard Drive API key used to read publicly-shared files, leave this unticked. Ticking it adds unnecessary complexity with no benefit for this use case.

Add it to `.env.local`:

```bash
GOOGLE_DRIVE_API_KEY=your_key_here
```

Then ask Claude Code to add both new keys to the Zod env validation:
> *"Open `src/lib/env.ts` (the Zod environment validation file we created in Week 6 — it validates all required environment variables at startup and throws a clear error if any are missing). Add two new fields: `TAVILY_API_KEY: z.string().min(1)` and `GOOGLE_DRIVE_API_KEY: z.string().min(1)`. `z.string().min(1)` means 'must be a non-empty string'. Export both alongside the existing validated env values."*

> 💡 **How to share a Google Doc so your agent can read it:** Open any Google Doc → click Share (top right) → change access from "Restricted" to "Anyone with the link" → set the role to "Viewer". Copy the URL — the ID is the long string between `/d/` and `/edit` in the URL. For example, in `https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit`, the ID is `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`.

---

### Step 3 — Create the Tool Definitions File

Rather than scattering tool definitions across your codebase, centralise them in one file — the single source of truth, like a Figma component library.

Ask Claude Code:
> *"Create a new file `src/lib/tools/definitions.ts`. In it, define and export five tool definitions using the Anthropic SDK's `Tool` type:*
>
> *1. `webSearchTool` — name: 'web_search', description: 'Search the internet for current information. Use this for facts, news, prices, weather, and anything that might have changed recently.', input schema: `{ query: string }` (required)*
>
> *2. `calculatorTool` — name: 'calculator', description: 'Evaluate a mathematical expression and return the result. Use this for any arithmetic, percentages, or unit conversions.', input schema: `{ expression: string }` (required)*
>
> *3. `dateTimeTool` — name: 'get_datetime', description: 'Get the current date and time. Use this whenever the user asks about today's date, the current time, the day of the week, or anything time-sensitive.', input schema: `{}` (no inputs)*
>
> *4. `documentReaderTool` — name: 'document_reader', description: 'Read the full text content of a specific document that this agent has been given access to. Use this when the user asks a question that could be answered by the agent's configured documents. Returns the document text which you should use to ground your answer.', input schema: `{ fileId: string }` (required, description: 'The Google Drive file ID of the document to read')*
>
> *5. `wordCounterTool` — name: 'word_counter', description: 'Count the number of words, characters, and sentences in a given piece of text.', input schema: `{ text: string }` (required)*
>
> *Also export an `AGENT_TOOLS` record (a TypeScript Record — an object with fixed keys and typed values, like a dictionary) mapping each `AgentConfig.capabilities` key to its matching tool:*
> ```typescript
> export const AGENT_TOOLS: Record<string, Tool> = {
>   webSearch: webSearchTool,
>   calculator: calculatorTool,
>   documents: documentReaderTool,
>   // dateTime is always enabled — no toggle needed
> };
> ```
>
> *Explain: (1) why `dateTimeTool` is not in `AGENT_TOOLS` — because knowing the current date is a basic capability that should always be available, no toggle required. (2) why `documentReaderTool` uses a `fileId` parameter rather than a URL — because the agent config stores file IDs, and we validate which IDs the agent is allowed to access server-side before running the tool."*

---

### Step 4 — Create the Tool Runner File

Now create the functions that actually *execute* each tool when Claude requests them.

Ask Claude Code:
> *"Create `src/lib/tools/runner.ts`. This file contains the logic for actually running each tool. Implement five runner functions:*
>
> *1. `runWebSearch(query: string): Promise<string>` — install the Tavily SDK (`npm install @tavily/core`), initialise it with `tavily({ apiKey: TAVILY_API_KEY })`, and call `tvly.search(query, { maxResults: 5, includeAnswer: false })`. Tavily returns an array of `results`, each with `title`, `url`, and `content` fields. Format and return the top 5 as a numbered list showing title, URL, and the first 200 characters of content. If the call throws (network error, invalid API key, rate limit), throw an error with a message that includes the word 'web_search' so the chat route's error handler can identify it.*
>
> *2. `runCalculator(expression: string): Promise<string>` — install and use the `mathjs` library (`npm install mathjs`). Call `math.evaluate(expression)` and return the result as a string. Do NOT use JavaScript's `eval()` — `eval` executes any arbitrary JavaScript code, not just maths expressions, which is a serious security vulnerability called code injection that would allow malicious users to run code on your server. If the expression is invalid or throws, return the safe fallback: 'I couldn't calculate that — please check the expression.'*
>
> *3. `runDateTime(): Promise<string>` — return the current date and time formatted as: 'Monday, 12 May 2026 at 14:35 AEST' using `Intl.DateTimeFormat` (JavaScript's built-in internationalisation API — it formats dates and times according to locale conventions and timezone). Include the day of week, full date, 12-hour time, and timezone abbreviation.*
>
> *4. `runDocumentReader(fileId: string, allowedFileIds: string[]): Promise<string>` — this function takes an extra `allowedFileIds` parameter (a list of file IDs that the agent's config has declared it can access). Before fetching anything:*
>    - *Check that `fileId` is in `allowedFileIds`. If not, return: 'Access denied — this document has not been configured for this agent.' This is an important security check: it prevents Claude from being manipulated into reading arbitrary Drive files by a user who crafts a clever prompt (called a prompt injection attack — when a user's message tricks the AI into taking actions beyond its intended scope).*
>    - *Fetch the document content from the Google Drive export endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain&key=${GOOGLE_DRIVE_API_KEY}` — this endpoint exports Google Docs as plain text. The `mimeType=text/plain` parameter tells Drive to convert the document to plain text before returning it. The `key` parameter authenticates the request.*
>    - *If the fetch returns 403 (Forbidden — the file is not shared with 'anyone with the link'), return: 'This document is not publicly accessible. Please ensure the Google Drive file sharing is set to Anyone with the link → Viewer.'*
>    - *If the fetch returns 404 (Not Found — the file ID doesn't exist or was deleted), return: 'Document not found — the file may have been deleted or the ID is incorrect.'*
>    - *If successful, truncate the content to a maximum of 15,000 characters (to avoid using too much of Claude's context window — Claude's context window is the total amount of text it can process at once; very large documents would crowd out the rest of the conversation). Prepend: 'Document content:\n\n' before the text.*
>    - *Return the content string.*
>
> *5. `runWordCounter(text: string): Promise<string>` — count words (split by whitespace), total characters, characters without spaces, and sentences (split by `.`, `!`, `?`). Return a formatted summary.*
>
> *Also export `dispatchToolCall(toolName: string, toolInput: Record<string, unknown>, context: { allowedFileIds: string[] }): Promise<string>` — routes to the correct runner. Pass `context.allowedFileIds` through to `runDocumentReader`. If the tool name is not recognised, return: 'Unknown tool.'*
>
> *After building, verify by testing:*
> *- Happy path (calculator): `dispatchToolCall('calculator', { expression: '847 * 23' }, { allowedFileIds: [] })` → '19481'*
> *- Happy path (datetime): `dispatchToolCall('get_datetime', {}, { allowedFileIds: [] })` → properly formatted date string*
> *- Failure path (bad calculator input): `dispatchToolCall('calculator', { expression: 'not math' }, { allowedFileIds: [] })` → safe fallback message, does not throw*
> *- Failure path (document not in allowed list): `dispatchToolCall('document_reader', { fileId: 'unauthorised-id' }, { allowedFileIds: ['allowed-id'] })` → 'Access denied' message*
> *- Failure path (unknown tool): `dispatchToolCall('unknown_tool', {}, { allowedFileIds: [] })` → 'Unknown tool.'*
> *Do not mark complete until all five pass."*

---

### ✅ Before You Commit — Tool Infrastructure

All of the following must pass before committing. Ask Claude Code to run them if you haven't verified them yet during Steps 3 and 4:

| Test | Expected result |
|---|---|
| `dispatchToolCall('calculator', { expression: '847 * 23' }, { allowedFileIds: [] })` | Returns `'19481'` |
| `dispatchToolCall('get_datetime', {}, { allowedFileIds: [] })` | Returns a properly formatted date string, e.g. `'Monday, 12 May 2026 at 14:35 AEST'` |
| `dispatchToolCall('calculator', { expression: 'not math' }, { allowedFileIds: [] })` | Returns the safe fallback message — does not throw |
| `dispatchToolCall('document_reader', { fileId: 'unauthorised-id' }, { allowedFileIds: ['allowed-id'] })` | Returns `'Access denied — this document has not been configured for this agent.'` |
| `dispatchToolCall('unknown_tool', {}, { allowedFileIds: [] })` | Returns `'Unknown tool.'` |

If your API keys are already in `.env.local`, also run these live tests:

| Test | Expected result |
|---|---|
| `dispatchToolCall('web_search', { query: 'AI news today' }, { allowedFileIds: [] })` | Returns a numbered list of real web results with titles and URLs |
| `dispatchToolCall('document_reader', { fileId: '[a real public Google Doc ID]' }, { allowedFileIds: ['[same ID]'] })` | Returns `'Document content:\n\n...'` with the first 15,000 characters of the document |

Do not commit until every row in both tables shows the expected result. If a live API test fails, fix the key or the runner before moving on — a broken web search or document reader will cause silent failures in every step that follows.

> 💡 **How to run these without the UI:** Ask Claude Code: *"Write a temporary `src/lib/tools/test-runner.ts` script that imports `dispatchToolCall` and runs all the tests in the pre-commit verification table. Log each result with a PASS/FAIL label. Run it with `npx ts-node src/lib/tools/test-runner.ts` and show me the output. Delete the file after all tests pass."*

---

## 💾 Commit Checkpoint — Tool Infrastructure Complete

You've set up the environment keys, tool definitions, and the runner functions (including the secure document reader). This is the foundation everything else this week builds on — commit it before wiring things together.

```bash
git add -A
git commit -m "feat: add tool definitions and runner — web search, calculator, datetime, document reader, word counter"
```

---

## ⚙️ Session 2 — Saturday 5–7pm (Hours 3–4): Upgrade the Chat Route + Documents Capability

### Step 5 — Update the AgentConfig Type for Documents

Before touching the chat route, the TypeScript type for your agent config needs to know about the new `documents` capability. Without updating the type first, TypeScript (the language layer that adds type safety — think of it as a set of rules that catch mistakes before they run, like a spell-checker for code) will throw errors everywhere you try to use `documents`.

Ask Claude Code:
> *"Open `src/lib/types/agent.ts` and update the `AgentConfig` interface. In the `capabilities` block, add:*
> ```typescript
> documents: {
>   enabled: boolean;
>   files: Array<{ id: string; name: string }>;
> };
> ```
>
> *`files` is an array of objects — each object has an `id` (the Google Drive file ID) and a `name` (the human-readable filename, used to tell Claude which documents are available). After updating the type, search `src/` for any place that initialises a default `AgentConfig` object and add a `documents: { enabled: false, files: [] }` default there too, so no existing code breaks."*

---

### Step 6 — Add the Documents Toggle to the Builder (Step 3)

In Week 7 you built the capability toggles in Step 3 of the builder. Documents is a richer capability than a simple ON/OFF toggle — when enabled, the user also needs to add their Google Drive files. This step adds the toggle plus the file management UI below it.

Ask Claude Code:
> *"In the agent builder's Step 3 (the capability toggles step at `src/app/agents/new/page.tsx` or the relevant component file), add a fifth capability row for Documents:*
>
> *1. Add a `Switch` toggle labelled 'Documents — query files from Google Drive'. When toggled, update `agentConfig.capabilities.documents.enabled`.*
>
> *2. Below the toggle, show a collapsible sub-panel (visible only when documents is toggled ON — use a conditional render: `{agentConfig.capabilities.documents.enabled && <panel>}`). The sub-panel contains:*
>    - *A text input labelled 'Add a Google Drive document URL' with a helper note: 'Share the document as Anyone with the link → Viewer, then paste the URL here.'*
>    - *An 'Add document' button. On click: call a new API route `GET /api/drive/metadata?fileId=[extracted ID]` (a server-side route that fetches the file name from Google Drive — explained in Step 6B below). Show a loading spinner on the button while fetching.*
>    - *Happy path: the route returns `{ id: string, name: string }` → add the file to `agentConfig.capabilities.documents.files` → file appears in the list below as a `Badge` with the document name and an × remove button*
>    - *Failure path (file not shared correctly): the route returns 403 → show inline error 'This document isn't publicly accessible. Please check the sharing settings.' — do NOT add the file to the list*
>    - *Failure path (bad URL): if the URL doesn't contain a recognisable Google Drive file ID pattern, show inline error 'Please paste a valid Google Drive document URL' before even calling the API route*
>    - *A list of added files shown as `Badge` components (from shadcn/ui — the pre-built components installed in Week 7) with the document name and an × remove button*
>    - *A note below the list: 'Your agent can read these documents when answering questions.'*
>
> *After building, verify by testing:*
> *- Happy path: toggle Documents ON → paste a valid public Google Doc URL → click Add → document name appears as a Badge*
> *- Failure path (bad URL): paste a random string → inline error before API call*
> *- Failure path (private file): paste a private Google Doc URL → 403 response → inline error, file not added*
> *- Remove test: add a file → click × → file disappears from list → removed from `agentConfig.capabilities.documents.files`*
> *Do not mark complete until all four pass."*

---

### Step 6B — Build the Drive Metadata Route

The builder needs to look up a document's human-readable name from its ID — so the user sees "Q3 Research Brief" in the file list, not `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`.

Ask Claude Code:
> *"Create a new API route at `src/app/api/drive/metadata/route.ts`. This is a `GET` route (a route that receives a request and returns data without storing anything) that:*
>
> *1. Reads the `fileId` query parameter from the request URL (a query parameter is the value after `?` in a URL — for example, in `/api/drive/metadata?fileId=abc123`, the query parameter is `fileId` with value `abc123`)*
> *2. Requires authentication — return 401 (Unauthorised — not logged in) if no session*
> *3. Calls the Google Drive metadata endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType&key=${GOOGLE_DRIVE_API_KEY}` — `fields=id,name,mimeType` tells Drive to return only those three fields instead of the full metadata object (faster and cheaper in quota terms). `mimeType` is the file type identifier — e.g. `application/vnd.google-apps.document` for Google Docs.*
> *4. If the Drive API returns 403 (Forbidden — the file is private): return your own 403 response with `{ error: 'file_not_public' }`*
> *5. If the Drive API returns 404 (Not Found — wrong ID or deleted): return your own 404 with `{ error: 'file_not_found' }`*
> *6. On success: return 200 with `{ id: string, name: string }` — the builder uses `name` to display the document in the Badge list*
>
> *Also: in the builder's 'Add document' click handler, write the URL parsing function that extracts a file ID from a Google Drive URL. Google Drive document URLs follow this pattern: `https://docs.google.com/document/d/[FILE_ID]/edit`. Extract the FILE_ID using a regex (a regular expression — a pattern-matching mini-language for strings) like `/\/d\/([a-zA-Z0-9_-]+)/`. If the URL doesn't match this pattern, trigger the validation error before calling the API route.*
>
> *After building, verify by testing:*
> *- Happy path: call `GET /api/drive/metadata?fileId=[a valid public Google Doc ID]` → returns `{ id: '...', name: 'Your Document Title' }`*
> *- Failure path (private file): use a private file ID → returns `{ error: 'file_not_public' }`*
> *- Failure path (no session): call without being logged in → returns 401*
> *Do not mark complete until all three pass."*

---

### Step 7 — Upgrade the Chat Route to Handle Tool Use + Documents

Your current chat route sends one message to Claude and streams back text. With tool use, it needs to handle Claude's tool requests. And with documents, it needs to build a richer system prompt that tells Claude which documents are available.

First, ask Claude Code to understand the current state:
> *"Read `src/app/api/chat/route.ts` in full and summarise: (1) how the current route builds the system prompt from the agent config, (2) how it handles streaming, (3) whether it currently supports tool use at all. Do not change anything yet — just describe what's there."*

Study the summary. Then upgrade:

Ask Claude Code:
> *"Upgrade `src/app/api/chat/route.ts` to support Claude tool use and the new documents capability. Here is the exact behaviour required:*
>
> *1. **Load the agent config** — the route already receives the agent ID. Load the agent's full `config` object from Supabase. Read `config.capabilities` to determine which tools to attach.*
>
> *2. **Build the tools array** — always include `dateTimeTool`. Add `webSearchTool` if `capabilities.webSearch === true`. Add `calculatorTool` if `capabilities.calculator === true`. Add `documentReaderTool` if `capabilities.documents.enabled === true` AND `capabilities.documents.files.length > 0` (there's no point attaching the tool if no documents have been configured).*
>
> *3. **Enhance the system prompt for documents** — if documents are enabled and files exist, append this block to the system prompt:*
>
> ```
> You have access to the following documents via the document_reader tool:
> [list each file as: - "[name]" (ID: [id])]
>
> When the user asks a question that could be answered by these documents, always use the document_reader tool first to read the relevant document before answering. Ground your response in the actual document content.
> ```
>
> *4. **Build the `allowedFileIds` list** — extract `config.capabilities.documents.files.map(f => f.id)` and pass this to `dispatchToolCall` as the `context.allowedFileIds` parameter. This is the security boundary: Claude can only request documents that are in this list.*
>
> *5. **First Claude call** — send the messages with the tools array. If `stop_reason` is `'end_turn'` (Claude's signal that it is finished — no more tool calls to make), stream the text content blocks back to the client as before.*
>
> *6. **Handle `tool_use` stop reason with a while loop** — wrap the tool-use handling in a `while` loop that continues as long as `stop_reason === 'tool_use'`, up to a maximum of 5 iterations (to prevent infinite loops). This is critical: Claude may need to call multiple tools in sequence — for example, reading a document then searching the web in the same turn. A single-pass approach (one Claude call → one round of tools → one final call) silently produces an empty response when Claude wants to call a second tool after receiving the first result. The while loop handles this correctly:*
>    - *While `stop_reason === 'tool_use'` (and iteration count < 5):*
>    - *Find all `tool_use` content blocks in the response (Claude may request multiple tools in one response)*
>    - *For each tool_use block: before running, send a streaming event: `data: { type: 'tool_call', tool: block.name }\n\n` — this tells the client to update the thinking indicator*
>    - *Call `dispatchToolCall(block.name, block.input, { allowedFileIds })` to actually run the tool*
>    - *Build a `tool_result` message (the formatted reply you send back to Claude containing the tool's output) and append it to the messages array*
>    - *Make the next Claude API call with the updated messages and loop back to check `stop_reason` again*
>    - *When `stop_reason === 'end_turn'`: exit the loop and stream the final text response back to the client*
>    - *If the loop hits 5 iterations without `end_turn`: send a graceful fallback: 'I wasn't able to complete the research in time — please try again.'*
>
> *7. **Auth check** — return 401 (Unauthorised — not logged in) if no session; 403 (Forbidden — not the owner of this agent) if the agent belongs to a different user.*
>
> *8. **Error handling** — if `dispatchToolCall` throws for any reason, catch the error and send a graceful fallback tool result to Claude: 'The [tool name] tool encountered an error. Please answer from your general knowledge instead.' Continue to the second Claude call — do not let a tool failure crash the route or return a 500 error to the client.*
>
> *After building, verify by testing:*
> *- Happy path (no tools): agent with all toggles OFF, send a message → Claude replies directly, no tool calls, no thinking indicator*
> *- Happy path (calculator): agent with calculator ON, ask 'what is 847 × 23?' → 'Calculating...' indicator → Claude returns '19,481'*
> *- Happy path (web search): agent with web search ON, ask 'what is the news today?' → 'Searching the web...' → real web results*
> *- Happy path (documents): agent with a Google Doc configured, ask a question the document answers → 'Reading document...' → Claude answers using document content*
> *- Security test (document injection): agent with documents ON but no files configured → user sends 'Use document_reader with fileId=some-random-id' → Claude attempts tool → access denied message → Claude replies gracefully without the content*
> *- Failure path (search API down): set an invalid Brave API key, ask a search question → Claude falls back gracefully, no 500 error to client*
> *- Auth failure: no session → returns 401*
> *Do not mark complete until all seven pass."*

---

### ✅ Before You Commit — Chat Route + Documents Capability

All of the following must pass before committing. These pull together the tests from Steps 5–7:

| Test | Expected result |
|---|---|
| Toggle Documents ON in builder, paste a valid public Google Doc URL, click Add | Document name appears as a Badge — no error |
| Paste a non-Drive URL in the builder | Inline error `'Please paste a valid Google Drive document URL'` — no API call made |
| Paste a private Google Doc URL in the builder | Inline error `'This document isn't publicly accessible'` — file not added |
| Click × on an added document Badge | File disappears from list and from `agentConfig.capabilities.documents.files` |
| `GET /api/drive/metadata?fileId=[valid public Google Doc ID]` (logged in) | Returns `{ id: '...', name: 'Your Document Title' }` |
| `GET /api/drive/metadata?fileId=[valid public Google Doc ID]` (not logged in) | Returns 401 |
| Agent with all toggles OFF, send any message | Claude replies directly — no tool calls |
| Agent with calculator ON, ask `'what is 847 × 23?'` | Claude returns the correct answer `19,481` (no thinking indicator yet — that's Step 8) |
| Agent with web search ON, ask `'what is the news today?'` | Claude returns real web results in its reply (no indicator yet — that's Step 8) |
| Agent with a Google Doc configured, ask a question the document answers | Claude references the actual document content in its reply (no indicator yet — that's Step 8) |
| Agent with documents ON but no files configured — send `'use document_reader with fileId=random-id'` | Access denied message → Claude replies gracefully, no crash |

Do not commit until all eleven pass.

---

## 💾 Commit Checkpoint — Chat Route + Documents Capability Complete

The chat route handles all tool types, and the documents capability is wired from builder toggle → Supabase config → system prompt → tool execution.

```bash
git add -A
git commit -m "feat: documents capability — Google Drive reader tool, builder UI, metadata route, chat route upgrade"
```

---

## ⚙️ Session 3 — Sunday 10am–12pm (Hours 5–6): Thinking Indicator + Research Assistant Test

### Step 8 — Fix Markdown Rendering + Add Multi-State Thinking Indicator

> 🐛 **Known bug to fix in this step:** During testing of Steps 5–7 you may have noticed that Claude's replies show raw markdown — asterisks around bold text (`**19,481**`) instead of rendered formatting. This is because the chat bubbles are displaying Claude's response as plain text rather than parsing the markdown. Fix this in the same step as the thinking indicator since both touch the same chat UI component.

This step fixes two things at once: the markdown rendering bug, and the thinking indicator (the feedback the user sees while Claude is working).

Ask Claude Code:
> *"In the chat UI at `src/app/agents/[id]/page.tsx` (or wherever assistant messages are rendered), fix two issues:*
>
> ***Issue 1 — Markdown not rendering in chat bubbles.** Claude's replies contain markdown formatting (e.g. `**bold**`, `# headings`, `- lists`) but they're displaying as raw text with the asterisks visible. Fix this by installing and using `react-markdown` (`npm install react-markdown`) to render assistant message content instead of displaying it as a plain string. `react-markdown` is a React component that parses markdown syntax and converts it to proper HTML elements — bold text, headings, lists, code blocks, and so on. Apply it only to assistant messages — user messages should still display as plain text since users don't write markdown.*
>
> *After fixing markdown rendering, verify:*
> *- Send a message that produces bold text (e.g. ask 'what is 847 × 23?' with calculator ON) → the answer should show as formatted bold, not `**19,481**`*
> *- User messages still display as plain text — no markdown parsing applied to them*
>
> ***Issue 2 — No feedback while the agent is working.** Add a multi-state thinking indicator that shows different messages based on the streaming event type received:*
>
> *- Waiting for first response: show `'Thinking...'` with a pulsing dots animation (three dots that fade in and out in sequence — this is called a typing indicator, it signals to users that text output is coming soon). Implement by applying Tailwind's `animate-pulse` class to each dot with a different `animation-delay` value: 0ms, 150ms, 300ms — this staggers the pulse so they animate one after another, not all at once.*
> *- `tool_call` event with `tool: 'web_search'`: switch to `'Searching the web...'`*
> *- `tool_call` event with `tool: 'calculator'`: switch to `'Calculating...'`*
> *- `tool_call` event with `tool: 'get_datetime'`: switch to `'Checking the time...'`*
> *- `tool_call` event with `tool: 'document_reader'`: switch to `'Reading document...'`*
> *- Final text stream begins: hide the indicator entirely and show the streaming text*
>
> *Use a `thinkingState` state variable typed as: `'idle' | 'thinking' | 'searching' | 'calculating' | 'checking_time' | 'reading_document'`. The Send button must be disabled (greyed out and unclickable, `disabled={thinkingState !== 'idle'}`) while the agent is working — this prevents the user from sending a second message before the first response is complete.*
>
> *After building both fixes, verify by testing:*
> *- Markdown fix: ask 'what is 847 × 23?' with calculator ON → answer renders as bold formatted text, not raw asterisks*
> *- Happy path (indicator): send a message → 'Thinking...' appears → if a tool runs, the label updates to the specific label → text starts streaming → indicator disappears*
> *- Failure path (send button): send a message and immediately click Send again → button is disabled until full response is complete*
> *- Document read: ask a question answered by a configured document → 'Reading document...' appears while the document is fetched*
> *Do not mark complete until all four pass."*

---

### Step 9 — Wire Tool Toggle Verification

Before building the test agent, verify the full end-to-end chain is intact.

Ask Claude Code:
> *"Trace the complete path of the Documents capability toggle:*
> *1. Where in the builder does the user toggle 'Documents' ON and add a file?*
> *2. What value gets saved to Supabase — show me the exact column name and the JSON structure stored in it*
> *3. Where in the chat route does it read that value from Supabase?*
> *4. Where in the chat route does it use that value to include `documentReaderTool` in the API call?*
> *5. Where does it build the `allowedFileIds` list for the security check in `dispatchToolCall`?*
>
> *Show me the line numbers for steps 2–5. If any step in the chain is broken or missing, fix only that step."*

---

### 🐛 Known Issues & Defensive Fixes (apply before Step 10)

Two bugs surface during testing that must be fixed before the Research Assistant test will work reliably. Apply both now.

**Fix A — Old agents crash when `documents` is undefined**

Agents created before Week 8 don't have a `documents` key in their Supabase config. When the chat route or the builder loads one of these agents and tries to access `capabilities.documents.enabled`, JavaScript throws `Cannot read properties of undefined (reading 'enabled')` — crashing the page or the API route silently.

Ask Claude Code:
> *"There is a runtime crash: `Cannot read properties of undefined (reading 'enabled')`. The root cause is that agents saved to Supabase before the `documents` capability was added don't have a `documents` key in their `capabilities` object — so `capabilities.documents` is `undefined` everywhere it's accessed.*
>
> *Fix this in two places:*
>
> *1. In `src/app/api/chat/route.ts`, on the line that does `const { documents } = capabilities`, replace it with:*
> ```typescript
> const documents = capabilities.documents ?? { enabled: false, files: [] }
> ```
> *The `??` operator (nullish coalescing — returns the right-hand value when the left side is `null` or `undefined`) ensures `documents` always has a safe default shape even for old agents.*
>
> *2. In `src/app/agents/new/AgentWizard.tsx`, find every place that accesses `capabilities.documents` or `agentConfig.capabilities.documents` and add optional chaining (`?.`) or a fallback:*
> - *`capabilities.documents.enabled` → `capabilities.documents?.enabled`*
> - *`capabilities.documents.files` → `capabilities.documents?.files ?? []`*
> - *Any spread like `{ ...capabilities.documents }` → `{ ...(capabilities.documents ?? { enabled: false, files: [] }) }`*
> - *In `AgentPreviewPanel`: `agentConfig.capabilities.documents.enabled` → `agentConfig.capabilities.documents?.enabled`*
>
> *After fixing, verify:*
> - *Open the chat page for an agent created before Week 8 → page loads without crash, chat works*
> - *Open `/agents/new` → builder loads without console errors*
> - *Send a message requiring web search on an agent with documents configured → response completes successfully*
> *Do not mark complete until all three pass."*

**Fix B — Edit mode fails to save on old agents (validation crash)**

When editing an agent in the wizard, `AgentWizard` initialises its state with `initialConfig ?? defaultConfig`. Since `initialConfig` exists (it's the agent's stored config object), the wizard uses it as-is — but old configs missing `documents` fail Zod validation on save, showing "Something went wrong saving your agent."

Ask Claude Code:
> *"In `src/app/agents/new/AgentWizard.tsx`, the `useState` initialisation for `agentConfig` uses `initialConfig ?? defaultConfig`. This breaks in edit mode when `initialConfig` is an old agent config missing the `documents` field — Zod validation on PATCH fails with a 400. Fix by deep-merging `initialConfig` with `defaultConfig` so missing fields get safe defaults:*
> ```typescript
> useState<AgentConfig>(
>   initialConfig
>     ? {
>         ...defaultConfig,
>         ...initialConfig,
>         capabilities: {
>           ...defaultConfig.capabilities,
>           ...initialConfig.capabilities,
>           documents: initialConfig.capabilities?.documents ?? { enabled: false, files: [] },
>         },
>       }
>     : defaultConfig
> )
> ```
> *After fixing, verify:*
> - *Edit an old agent → change any capability → click Save Agent → saves successfully, redirects to chat page*
> - *Edit a new agent that has documents configured → documents toggle is still ON with files intact*
> - *Create a brand new agent → wizard still works normally*
> *Do not mark complete until all three pass."*

---

### Step 10 — Test the Full Research Assistant Agent

This is the milestone moment. Create a test agent that combines web search and documents.

**First, prepare a test document:**
1. Open Google Docs and create a new document — title it "AgentForge Research Notes"
2. Add a few paragraphs of content: some recent AI news, a few statistics, a product description — make it something you'd actually want an agent to reference
3. Share it: click Share → change from "Restricted" to "Anyone with the link" → Viewer → Copy link

**Then, create the agent through the builder:**
1. Go to `/agents/new`
2. Step 1: Choose "Research"
3. Step 3: Toggle ON Web Search, Calculator, and Documents → paste your Google Doc URL → click Add → confirm the document name appears
4. Step 5: Name it "Research Assistant" → click Save Agent

**Then test these three scenarios in the chat:**
1. Ask: *"What AI news came out this week?"* — watch it search, then reply with real web results
2. Ask: *"What does my research document say about [topic you wrote about]?"* — watch "Reading document..." appear, then Claude answers using your actual document
3. Ask: *"Based on my research notes and current news, what trends are you seeing?"* — watch it potentially call both web search AND the document reader in the same response

If all three work — **this is the "wow" moment. Your agent is combining live internet data with your own documents.** 🎉

---

## ⚙️ Session 4 — Sunday 2–4pm (Hours 7–8): Polish + Verification

### Step 11 — Add Tool Call Attribution to Chat Messages

When an agent searches the web, users should see the sources. When it reads a document, they should see which document was consulted.

Ask Claude Code:
> *"After a tool call completes, attach attribution data to the assistant's message in the chat UI state:*
>
> *- After `web_search`: extract the URLs from the Brave Search results and store as `sources: string[]`. Show a collapsible 'Sources ›' section below the message with the URLs as clickable links.*
> *- After `document_reader`: store the document name as `documentUsed: string`. Show a subtle `Badge` below the message: '📄 Read from [document name]'. Use the `files` list from the agent config to look up the name from the file ID.*
>
> *Only show attribution when it exists — no Sources section or document badge on messages where no tool was used.*
>
> *After building, verify by testing:*
> *- Happy path (web search): ask a question → 'Sources ›' appears below reply → clicking expands URL list*
> *- Happy path (document): ask a question the doc answers → '📄 Read from [doc name]' badge appears below reply*
> *- Happy path (no tools): pure chat question → no attribution shown*
> *Do not mark complete until all three pass."*

---

### Step 12 — Capability Badges in Agent Chat Header

Let users know what their agent is capable of at a glance.

Ask Claude Code:
> *"On the agent chat page, below the agent name in the header, add a small row of capability `Badge` components showing what's enabled. Rules:*
> *- Show '🔍 Web search' if `capabilities.webSearch` is true*
> *- Show '🧮 Calculator' if `capabilities.calculator` is true*
> *- Show '📄 Documents ([N])' if `capabilities.documents.enabled` is true, where N is the number of configured files*
> *- Don't show a badge for date/time — it's always on and would lose meaning*
> *- If nothing is enabled, show '💬 Chat only'*
>
> *After building, verify by testing:*
> *- Agent with web search + 2 documents → '🔍 Web search' + '📄 Documents (2)' in the header*
> *- Agent with no capabilities → '💬 Chat only' badge*
> *Do not mark complete until both pass."*

---

### Step 13 — Verify the Preview Route Supports Tools

The builder's "Test your agent" dialog (built in Week 7) uses a separate route at `src/app/api/chat/preview/route.ts`. It needs tool support too — including document reading — so what users preview in the builder matches what the agent does in production.

Ask Claude Code:
> *"Read `src/app/api/chat/preview/route.ts` and check whether it currently supports tool use and the new document capability. It should: (1) pass a `tools` array to Claude based on `agentConfig.capabilities`, including `documentReaderTool` when documents are enabled; (2) handle the `tool_use` stop reason with the same agentic loop pattern as the main chat route; (3) pass `allowedFileIds` correctly to `dispatchToolCall`.*
>
> *If any of the three are missing, add only what's missing — don't rewrite the whole route.*
>
> *After building, verify by testing:*
> *- In the builder Step 5 test dialog, with documents configured, ask a question the document answers → Claude uses `document_reader` and returns content from the actual document*
> *- In the builder Step 5 test dialog, with documents NOT configured, ask the same question → Claude answers from general knowledge only*
> *Do not mark complete until both pass."*

---

### Step 14 — Fix the Edit Button + Create the Agent Edit Route

The Edit button on the agent chat page links to `/agents/${id}/edit` but that route doesn't exist — it returns a 404. This is a critical UX gap: users have no way to modify an agent after creating it.

Ask Claude Code:
> *"The Edit button on the agent chat page (`src/app/agents/[id]/page.tsx`) links to `/agents/${id}/edit` but that route doesn't exist. Create `src/app/agents/[id]/edit/page.tsx` that:*
> 1. *Loads the agent's full record from Supabase using the `id` param — return 404 if not found, redirect to `/auth/login` if not authenticated, return 403 if the agent belongs to another user*
> 2. *Renders `AgentWizard` pre-populated with the agent's existing `name`, `description`, and `config` using the `initialName`, `initialDescription`, `initialConfig`, and `agentId` props*
> 3. *On save, the wizard already uses `PATCH /api/agents/${agentId}` when `agentId` is set — confirm this is wired correctly and redirects to `/agents/${id}` on success*
>
> *After building, verify:*
> - *Click Edit on any agent → wizard opens with the agent's existing name, description, personality, and capabilities pre-filled*
> - *Change a capability and click Save Agent → redirects back to the chat page with the updated settings*
> - *Visiting `/agents/[other-user-id]/edit` → returns 403 or 404, never shows another user's agent*
> *Do not mark complete until all three pass."*

---

### Step 15 — Make Dashboard Agent Cards Clickable

On the dashboard, users can only navigate to an agent by clicking the small "Edit" button — clicking the card itself does nothing. This is the opposite of expected behaviour: the card should be the primary navigation target.

Ask Claude Code:
> *"In `src/components/AgentCard.tsx`, the card body is not clickable — only the Edit button navigates to the agent. Fix this so clicking anywhere on the card navigates to `/agents/${id}`. Wrap the card's outer container in a `Link` from `next/link` pointing to `/agents/${id}`. Keep the Edit and Delete buttons functional — add `e.stopPropagation()` to the Delete button's `onClick` handler so clicking Delete doesn't also trigger the card navigation. The Edit button can remain as-is or be updated to link to `/agents/${id}/edit` now that that route exists.*
>
> *After building, verify:*
> - *Click the card body (not the buttons) on the dashboard → navigates to the agent chat page*
> - *Click the Edit button → navigates to the edit page*
> - *Click Delete → deletes the agent, no navigation triggered*
> *Do not mark complete until all three pass."*

---

### ✅ Before You Commit — Tool UI + Attribution + Preview Route

All of the following must pass before committing. These pull together the tests from Steps 8, 11, 12, and 13:

| Test | Expected result |
|---|---|
| Ask 'what is 847 × 23?' with calculator ON | Answer renders as bold formatted text — not raw `**19,481**` with asterisks |
| Send a user message with asterisks e.g. `**test**` | Displays as plain text — user messages are not markdown-parsed |
| Send a message → watch the indicator | `'Thinking...'` appears, then tool-specific label if a tool runs, then disappears when text streams |
| Send a message and immediately click Send again | Send button is disabled — cannot double-send while waiting |
| Ask a document question | `'Reading document...'` label appears while document is fetched |
| Ask a web search question, check below the reply | `'Sources ›'` section appears — clicking it expands a URL list |
| Ask a document question, check below the reply | `'📄 Read from [doc name]'` badge appears below the reply |
| Ask a pure chat question (no tools) | No Sources section and no document badge shown |
| Agent with web search + 2 documents — check the chat header | `'🔍 Web search'` and `'📄 Documents (2)'` badges visible |
| Agent with no capabilities — check the chat header | `'💬 Chat only'` badge visible |
| Builder Step 5 test dialog — documents configured, ask about document | Claude reads the document and references it in the preview |
| Builder Step 5 test dialog — no documents configured, ask the same question | Claude answers from general knowledge only — no document tool call |

Do not commit until all ten pass.

---

## 💾 Commit Checkpoint — Tool UI + Attribution + Preview Route Complete

```bash
git add -A
git commit -m "feat: tool attribution, document read badges, capability header badges, preview route tool support"
```

---

## ✨ Stretch Tasks (+4–5 hrs, if you have time)

These are optional. They don't block Week 9.

---

### Stretch 1 — Build a Word Counter Tool From Scratch (1 hr)

You already defined `wordCounterTool` in Step 3. Wire it to a toggle so users can enable it.

Ask Claude Code:
> *"Add a sixth capability to the builder: 'Word Counter — counts words, characters, and sentences in any text'. Add it to Step 3 as a toggle. Add `wordCounter: boolean` to `AgentConfig.capabilities`. Add `wordCounterTool` to `AGENT_TOOLS`. Update the chat route to attach it when `capabilities.wordCounter === true`. Add a '📝 Word counter' capability badge to the agent header.*
>
> *After building, verify by testing:*
> *- Happy path: agent with Word Counter ON, paste a paragraph, ask 'how many words is that?' → Claude calls the tool and returns the exact count*
> *- Failure path: Word Counter OFF → Claude estimates from memory, no tool call*
> *Do not mark complete until both pass."*

Then ask Claude Code: *"Walk me through the complete lifecycle of a tool call one more time — from the moment the user clicks Send to the moment the tool result appears in Claude's reply — using the word counter as the example."*

---

### Stretch 2 — Build a Tool Testing Panel (1 hr)

A private debug page at `/tools/test` where you can test each tool in isolation.

Ask Claude Code:
> *"Build a new page at `src/app/tools/test/page.tsx`. Protect it: check if the logged-in user's email is `liyanage.lakii@gmail.com`; redirect anyone else to `/dashboard`. The page has five sections — one per tool. Each section has inputs for that tool, a 'Run' button, a panel showing the raw result and any error, and the time taken in milliseconds (thousandths of a second — `Date.now()` before and after the call gives you the duration). Wire each button to a new API route at `src/app/api/tools/test/route.ts` that calls `dispatchToolCall`.*
>
> *For the document_reader section: add a text input for the file ID. The test route should pass `allowedFileIds: [fileId]` (allow whatever ID you're testing — this is your private debug tool, not for users). Display both the raw result and a preview of the first 500 characters of the fetched document.*
>
> *After building, verify by testing:*
> *- Happy path (web search): enter a query → results appear within 2 seconds*
> *- Happy path (document): enter a valid public Google Doc ID → document text appears*
> *- Edge case (private document): enter a private Google Doc ID → 403 error message, no crash*
> *- Edge case (bad calculator): enter 'banana' → safe fallback message, no crash*
> *Do not mark complete until all four pass."*

---

### Stretch 3 — Tool Error Logging to Supabase (1 hr)

Log every tool call — including document reads — to Supabase for usage analytics.

Ask Claude Code:
> *"Create a Supabase table `tool_logs` with columns: `id` (uuid, primary key, auto-generated), `user_id` (uuid, foreign key to auth.users), `agent_id` (uuid, foreign key to agents), `tool_name` (text), `tool_input` (jsonb — the inputs Claude passed, where jsonb is Postgres's binary JSON format that supports indexing), `success` (boolean), `error_message` (text, nullable — only populated when success is false), `duration_ms` (integer — how long the tool took in milliseconds), `created_at` (timestamptz — a timezone-aware timestamp, auto-generated). Enable RLS (Row Level Security — the Supabase rules that control who can access which rows): users can only insert and read their own rows.*
>
> *Update `dispatchToolCall` to log every call as a fire-and-forget Supabase insert (fire-and-forget means: start the insert without `await` so the logger doesn't add latency to the user's experience — it runs in the background). If the insert itself throws, catch it and `console.error` only — never let analytics logging break actual tool execution.*
>
> *For the document_reader tool, also log which `fileId` was requested in `tool_input` (but not the document's content — logging the full document text could be a data privacy risk and would bloat the table).*
>
> *After building, verify by testing:*
> *- Happy path: trigger a web search → open Supabase → tool_logs → confirm a row with `tool_name: 'web_search'`, `success: true`, reasonable `duration_ms`*
> *- Happy path (document): trigger a document read → confirm a row with `tool_name: 'document_reader'`, the `file_id` in `tool_input`, `success: true`*
> *- Failure path: trigger a tool failure (invalid API key) → confirm a row with `success: false` and an `error_message`*
> *- Auth check: log in as a different user → confirm they cannot see the first user's tool_logs rows*
> *Do not mark complete until all four pass."*

---

### Stretch 4 — CLAUDE.md Archival System (30 min)

By Week 8, `CLAUDE.md` has grown past 8,000 characters. Claude Code reads this file on every session startup — a bloated file wastes context window space on stale history instead of current architecture. This stretch task sets up a sustainable archival process that keeps `CLAUDE.md` lean without losing important decisions.

**Why this matters:** `CLAUDE.md` should answer "what is this codebase *right now*?" — not "what did we build over time?" Git history already answers the latter. The principle is: *signal density over length*.

**What stays in CLAUDE.md:** current architecture, active coding decisions that affect daily work, non-obvious patterns Claude would otherwise get wrong, environment setup, current week's focus.

**What gets archived:** week-by-week build summaries beyond one-liners, decisions that are now just normal code patterns, context that is self-evident from reading the code.

Ask Claude Code:
> *"Set up a CLAUDE.md archival system for this project:*
>
> *1. Create `docs/CLAUDE_ARCHIVE.md`. Populate it by extracting content from `CLAUDE.md` that is historical rather than operational. For each archived item, keep:*
> ```markdown
> # AgentForge — Decision Archive
>
> > Reference this file with @docs/CLAUDE_ARCHIVE.md when debugging legacy
> > behaviour or revisiting architectural decisions from earlier weeks.
> > Do not @-import this file by default — load it on demand only.
>
> ## Week N — [Topic]
> **Decision:** ...
> **Why:** ...
> **Still relevant:** yes / no / partial
> ```
> *The 'Why' is what makes archived content worth keeping — the code shows the what, the archive preserves the reasoning.*
>
> *2. After populating the archive, trim `CLAUDE.md` to under 4,000 characters. Do not remove: the stack version table, key patterns, env vars, the Supabase project ID warning, memory rules, current focus, or the prompt template. The one-line week summaries in Completed Work stay — only detail beyond that gets archived.*
>
> *3. Add this block to `CLAUDE.md` under a new `## Reference Docs` section:*
> ```markdown
> ## Reference Docs
> - @AGENTS.md — Next.js version warning (always loaded)
> - `docs/CLAUDE_ARCHIVE.md` — trimmed decisions and historical context.
>   Load with @docs/CLAUDE_ARCHIVE.md when debugging legacy behaviour or
>   revisiting earlier architectural decisions. Do not load by default.
> - `docs/weeks/WEEK_X_GUIDE.md` — load only the current week's guide, never older ones.
> ```
>
> *Before making any changes, show me a list of what you plan to move to the archive and why. Wait for my confirmation before editing either file.*
>
> *After confirming and applying changes, report: (a) final character count of `CLAUDE.md`, (b) what was moved and why, (c) anything you chose NOT to archive and why."*

> 💡 **When to use the archive going forward:** At each sprint-close, if `CLAUDE.md` exceeds 6,000 characters, run this process again — move the oldest week's detail into the archive and trim. The archive grows over time; `CLAUDE.md` stays lean.

---

## 💾 Commit Checkpoint — Stretch Tasks (if attempted)

```bash
git add -A
git commit -m "feat: tool testing panel, word counter capability, tool usage logging to Supabase"
```

---

## 💾 Sprint Close — Week 8 Complete

Run `/sprint-close` in Claude Code first to let it review the week's work, clean up any loose ends, and update `CLAUDE.md`'s Completed Work section. Then commit the full week:

```bash
git add -A
git commit -m "feat: week 8 complete — tool use, web search, calculator, Google Drive document reader, thinking indicator, tool attribution"
```

After committing, open `CLAUDE.md` and move "Week 8" from Current Focus into Completed Work with a two-sentence summary of what shipped.

---

## ✅ Completion Checklist

Work through these top to bottom. Don't mark anything done until you've actually tested it.

- [ ] Tavily API key signed up (free tier, no credit card) and added to `.env.local` and Zod env validation
- [ ] `@tavily/core` npm package installed
- [ ] Google Cloud Console project created, Drive API enabled, API key created and restricted to Drive API only
- [ ] `GOOGLE_DRIVE_API_KEY` added to `.env.local` and Zod env validation
- [ ] `mathjs` installed (`npm install mathjs`)
- [ ] `src/lib/tools/definitions.ts` created with all 5 tool definitions
- [ ] `src/lib/tools/runner.ts` created with all 5 runners + `dispatchToolCall`
- [ ] Calculator uses `mathjs`, not `eval()` — safe for user input
- [ ] `runDocumentReader` validates `fileId` against `allowedFileIds` before fetching — security check in place
- [ ] `runDocumentReader` handles 403 (private file) and 404 (not found) with human-readable messages
- [ ] Document content truncated to 15,000 characters before sending to Claude
- [ ] `AgentConfig.capabilities` TypeScript type updated to include `documents: { enabled, files }`
- [ ] Builder Step 3 has Documents toggle + sub-panel with file URL input
- [ ] File URL parser extracts Google Drive file ID from URL before calling the API
- [ ] `/api/drive/metadata` route returns file name for valid public files; 403 for private files; 401 if not logged in
- [ ] Added documents display as `Badge` with file name and × remove button in builder
- [ ] `src/app/api/chat/route.ts` upgraded to handle `tool_use` stop reason (agentic loop)
- [ ] Chat route attaches tools based on `config.capabilities` values from Supabase
- [ ] Chat route system prompt enhanced with document list when documents are enabled
- [ ] `allowedFileIds` passed to `dispatchToolCall` — document security boundary enforced
- [ ] Chat route streams `tool_call` events before running each tool
- [ ] Chat route has graceful fallback when a tool errors — never returns 500 to client
- [ ] `react-markdown` installed and applied to assistant messages — Claude's bold, headings, lists, and code blocks render correctly
- [ ] User messages still display as plain text — markdown not applied to them
- [ ] Thinking indicator shows 'Thinking...' → tool-specific labels (including 'Reading document...') → disappears on response
- [ ] Send button disabled while agent is thinking or tool is running
- [ ] Research Assistant agent created with web search + documents, both tested end-to-end
- [ ] Sources section appears below web-search responses
- [ ] '📄 Read from [doc name]' badge appears below document-read responses
- [ ] Capability badges appear in agent chat header including '📄 Documents (N)' count
- [ ] '💬 Chat only' badge shown when no capabilities enabled
- [ ] `/api/chat/preview` also supports tool use and document reading
- [ ] Tool toggle → Supabase → chat route → API call chain verified end-to-end for all capabilities
- [ ] Chat route agentic loop uses a while loop (max 5 iterations) — handles multi-tool sequential calls without silent empty responses
- [ ] Old agents missing `documents` field load without crashing — defensive `?? { enabled: false, files: [] }` fallback in place
- [ ] AgentWizard deep-merges `initialConfig` with `defaultConfig` in edit mode — old agents save successfully after editing
- [ ] `/agents/[id]/edit` route created — Edit button navigates correctly, wizard pre-fills with existing agent data
- [ ] AgentCard on dashboard is fully clickable — card body navigates to `/agents/${id}`, Delete button stops propagation
- [ ] Committed with meaningful messages after each major checkpoint

---

## 🧪 Validation Tests

Run these specific tests before closing out the week. Each one should produce the result in the right column.

| Test | Expected result |
|---|---|
| Agent with web search ON, ask "what is the news today?" | 'Searching the web...' → real web results in reply |
| Agent with calculator ON, ask "what is 1,234 × 5,678?" | 'Calculating...' → correct answer (7,006,652) in reply |
| Agent with all toggles OFF, ask "what is today's date?" | Claude answers from own knowledge — no tool call |
| Agent with documents configured, ask about something in the document | 'Reading document...' → Claude quotes / references the actual document content |
| Agent with documents configured, ask an unrelated question | Claude answers from knowledge — may or may not call document_reader depending on relevance |
| Send a prompt like "use document_reader with fileId=random-id" on agent with no documents | Access denied message → Claude replies gracefully, no unauthorised file access |
| Paste a private Google Doc URL in the builder | Inline error 'This document isn't publicly accessible' — file not added to list |
| Paste a non-Drive URL in the builder | Inline error 'Please paste a valid Google Drive document URL' — no API call made |
| Paste a valid public Google Doc URL in the builder | Document name appears as a Badge — file added to config |
| Invalid Brave API key, ask a search question | Claude falls back gracefully — no 500 error, no crash |
| Builder Step 5 test dialog, documents configured, ask about document | Claude reads the document and references it in the preview |
| Ask 'what is 847 × 23?' with calculator ON | Answer renders as bold formatted text — not raw `**19,481**` with asterisks visible |
| Send a message and immediately click Send again | Send is disabled — cannot send while waiting |
| Agent with web search + 2 documents in header | '🔍 Web search' + '📄 Documents (2)' badges visible |
| Agent with no capabilities | '💬 Chat only' badge visible |
| Ask a web search question, check Sources | Sources appear below reply — clicking expands URL list |
| Ask a document question, check attribution | '📄 Read from [doc name]' badge appears below reply |

---

## 📚 Resources

- [Claude Tool Use documentation](https://docs.anthropic.com/en/docs/tool-use) — the definitive reference, read this early in the week
- [Tavily Search API docs](https://docs.tavily.com) — getting started, SDK reference, and free tier signup
- [Tavily JS/TS SDK on npm](https://www.npmjs.com/package/@tavily/core) — `@tavily/core` package
- [Serper.dev](https://serper.dev/) — backup option: 2,500 free queries, no credit card required
- [Google Drive API — Files: export](https://developers.google.com/drive/api/reference/rest/v3/files/export) — how to export Google Docs as plain text
- [Google Drive API — Files: get](https://developers.google.com/drive/api/reference/rest/v3/files/get) — fetching file metadata (name, mimeType)
- [Google Cloud Console](https://console.cloud.google.com/) — where you create your API key and enable APIs
- [mathjs documentation](https://mathjs.org/docs/) — safe mathematical expression evaluation
- [JSON Schema specification](https://json-schema.org/understanding-json-schema/) — how to write tool `input_schema` definitions
- [Server-Sent Events — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — the streaming format used for tool status events
- [Anthropic SDK TypeScript reference](https://github.com/anthropics/anthropic-sdk-typescript) — `Tool`, `ContentBlock`, `ToolUseBlock` types

---

*Week 8 of 13 · AgentForge · Phase 3: Building the Product · Updated May 2026*
