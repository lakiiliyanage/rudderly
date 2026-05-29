"use client"

import Script from "next/script"

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* ── Heading ── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Help shape Rudderly</h1>
          <p className="text-gray-400">Takes 2 minutes. Every response is read.</p>
        </div>

        {/* ── Tally embed ── */}
        {/* White card so Tally's dark question text is readable against the dark page */}
        <div className="rounded-xl overflow-hidden bg-white">
          <iframe
            src="https://tally.so/embed/MeMeEX?transparentBackground=1&dynamicHeight=1&hideTitle=1"
            width="100%"
            height="500"
            frameBorder={0}
            title="Rudderly Feedback"
          />
        </div>

        {/* Resizes the iframe to fit the form content — must load after the iframe */}
        <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />

      </div>
    </main>
  )
}
