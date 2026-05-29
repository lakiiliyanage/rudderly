type ChangelogEntry = {
  version: string
  date: string
  title: string
  changes: string[]
}

const entries: ChangelogEntry[] = [
  {
    version: "v1.0.0-beta",
    date: "May 28, 2026",
    title: "Closed beta — production deployment",
    changes: [
      "Production deployment on Vercel with custom domain",
      "Sentry error monitoring and performance tracking",
      "GitHub Actions CI/CD pipeline (type-check, unit tests, Playwright E2E)",
      "Vercel Analytics for usage insights",
      "Staging environment with isolated Supabase project for preview deployments",
    ],
  },
  {
    version: "v0.4.0",
    date: "May 21, 2026",
    title: "Stripe payments — freemium tier and Pro plan",
    changes: [
      "Free tier: up to 3 agents and 20 messages per day",
      "Pro plan at $12/month — unlimited agents and messages",
      "Stripe Checkout and Customer Portal integration",
      "Usage limit enforcement across all API routes",
      "Upstash rate limiting and prompt injection defence",
      "Resend transactional emails and admin dashboard",
    ],
  },
  {
    version: "v0.3.0",
    date: "May 14, 2026",
    title: "Public share pages — shareable links and cloning",
    changes: [
      "Publish any agent to a shareable public URL with an auto-generated slug",
      "Clone a public agent to your own account with one click",
      "View counter shows how many conversations have been started on public agents",
      "OG metadata for rich social link previews",
      "Vitest unit tests and Playwright E2E test suite",
    ],
  },
  {
    version: "v0.2.0",
    date: "May 7, 2026",
    title: "Multi-tool agents — agentic loop and tool attribution",
    changes: [
      "5 built-in tools: web search (Tavily), calculator, word counter, Google Drive reader, weather",
      "Agentic loop — Claude decides which tools to call and chains results automatically",
      "Tool attribution UI shows which tools were used in each response",
      "Agent edit page for updating name, system prompt, and enabled tools",
      "Tool call logging stored in the database for debugging",
    ],
  },
  {
    version: "v0.1.0",
    date: "April 23, 2026",
    title: "First working AI agent chat — Claude API streaming",
    changes: [
      "Claude API streaming via ReadableStream — responses appear word by word",
      "Conversation history persisted in Supabase; pick up any previous chat from the sidebar",
      "AbortController support — cancel a response mid-stream",
      "Zod environment variable validation at server startup",
      "5-step visual agent builder (shadcn/ui) with password reset flow",
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
          <p className="text-gray-400">Every release, from first prototype to closed beta.</p>
        </div>

        <ol className="relative border-l border-gray-800">
          {entries.map((entry) => (
            <li key={entry.version} className="mb-12 ml-6">

              {/* Timeline dot */}
              <span className="absolute -left-2 mt-1 w-4 h-4 bg-violet-600 rounded-full border-2 border-gray-950" />

              {/* Date */}
              <time className="block text-xs text-gray-500 mb-2">{entry.date}</time>

              {/* Version badge + title */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-xs font-mono font-medium bg-violet-600/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
                  {entry.version}
                </span>
                <h2 className="text-lg font-bold text-white">{entry.title}</h2>
              </div>

              {/* Changes list */}
              <ul className="space-y-2">
                {entry.changes.map((change) => (
                  <li key={change} className="flex items-start gap-2.5 text-sm text-gray-400">
                    <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-gray-600" />
                    {change}
                  </li>
                ))}
              </ul>

            </li>
          ))}
        </ol>

      </div>
    </main>
  )
}
