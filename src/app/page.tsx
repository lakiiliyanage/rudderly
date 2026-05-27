import Link from "next/link"
import { Button } from "@/components/ui/button"
import HashRedirect from "./HashRedirect"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <HashRedirect />


      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
          Now in Development!
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Build AI Agents
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            Without Code
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed mb-10">
          The visual, no-code builder for non-developers. Create, configure,
          and share AI agents in minutes.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/auth/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="#">View on GitHub</Link>
          </Button>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-gray-800" />
      </div>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">

        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Everything you need to ship an agent</h2>
          <p className="text-gray-400">No engineering degree required.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Card 1 — Visual Builder */}
          <div className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all duration-200">
            <div className="w-10 h-10 bg-violet-600/15 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Visual Builder</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Point and click to configure agents. No syntax required — just describe what you want your agent to do.
            </p>
          </div>

          {/* Card 2 — Tool Integrations */}
          <div className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all duration-200">
            <div className="w-10 h-10 bg-violet-600/15 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-4.614m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Tool Integrations</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connect web search, email, calendar, and more. Give your agent the tools it needs to get things done.
            </p>
          </div>

          {/* Card 3 — Shareable Links */}
          <div className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all duration-200">
            <div className="w-10 h-10 bg-violet-600/15 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Shareable Links</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Share any agent with a public URL — anyone can use it, no account needed. Clone it and make it your own.
            </p>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-gray-500 text-sm">Rudderly</span>
          <span className="text-gray-600 text-sm">MIT Licence · Open Source</span>
        </div>
      </footer>

    </main>
  )
}
