import Image from "next/image"

const screenshots = [
  {
    src:   "/press/screenshot-builder.png",
    alt:   "Rudderly agent builder — 5-step visual configuration flow",
    label: "Agent Builder",
  },
  {
    src:   "/press/screenshot-chat.png",
    alt:   "Rudderly chat interface — streaming responses with tool attribution",
    label: "Chat Interface",
  },
  {
    src:   "/press/screenshot-share.png",
    alt:   "Rudderly public share page — shareable agent link with clone button",
    label: "Public Share Page",
  },
]

export default function PressPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-16">

        {/* ── Header ── */}
        <div>
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Press Kit</p>
          <h1 className="text-3xl font-bold text-white mb-2">Rudderly</h1>
          <p className="text-gray-400">Resources for journalists, bloggers, and podcasters.</p>
        </div>

        {/* ── About ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">About</h2>
          <p className="text-gray-300 leading-relaxed">
            Rudderly is a visual AI agent builder for non-developers. It lets anyone create, configure,
            and deploy AI agents without writing a single line of code.
          </p>
        </section>

        {/* ── Key Facts ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Key Facts</h2>
          <ul className="space-y-3">
            {[
              { label: "Founded",   value: "2026" },
              { label: "Built with", value: "Next.js, Claude AI (Anthropic), Supabase, Vercel" },
              { label: "Pricing",   value: "Free tier + Pro at $12/month" },
              { label: "Creator",   value: "Lakii (@lakiiliyanage)" },
            ].map(({ label, value }) => (
              <li key={label} className="flex gap-3 text-sm">
                <span className="w-24 shrink-0 text-gray-500">{label}</span>
                <span className="text-gray-300">{value}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Screenshots ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Screenshots</h2>
          <p className="text-sm text-gray-500 mb-6">
            2560 × 1600 px — free to use in editorial coverage of Rudderly.
          </p>
          <div className="space-y-6">
            {screenshots.map(({ src, alt, label }) => (
              <figure key={src}>
                <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                  <Image
                    src={src}
                    alt={alt}
                    width={2560}
                    height={1600}
                    className="w-full h-auto"
                    priority={src.includes("builder")}
                  />
                </div>
                <figcaption className="mt-2 text-xs text-gray-600 text-center">
                  {label}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── Taglines ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Tagline Options</h2>
          <ul className="space-y-3">
            {[
              "Build AI agents without code — Rudderly makes it point-and-click.",
              "The no-code agent builder that turns ideas into working AI tools in minutes.",
              "Anyone can ship an AI agent. Rudderly removes the engineering barrier.",
            ].map((tagline, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0 text-violet-500 font-mono">{i + 1}.</span>
                <span className="text-gray-300 italic">&ldquo;{tagline}&rdquo;</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Contact ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Press Enquiries</h2>
          <p className="text-sm text-gray-400 mb-2">
            For interviews, screenshots, or any other press requests:
          </p>
          <a
            href="mailto:liyanage.lakii@gmail.com"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            liyanage.lakii@gmail.com
          </a>
        </section>

      </div>
    </main>
  )
}
