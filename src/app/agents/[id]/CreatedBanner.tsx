'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface CreatedBannerProps {
  agentName: string
  capabilityCount: number
}

export default function CreatedBanner({ agentName, capabilityCount }: CreatedBannerProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Strip ?created=true from history immediately so a refresh doesn't re-show the banner.
    router.replace(pathname, { scroll: false })

    const timer = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(timer)
  }, [router, pathname])

  if (!visible) return null

  const capabilityNote =
    capabilityCount === 0 ? '' :
    capabilityCount === 1 ? ' with 1 capability enabled' :
    ` with ${capabilityCount} capabilities enabled`

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-xl border border-green-800/60 bg-green-950/50 px-4 py-3 text-sm text-green-300"
    >
      {/* Checkmark icon */}
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>

      <p className="flex-1">
        Your agent <strong className="font-semibold text-green-200">{agentName}</strong> was
        created{capabilityNote}. Start chatting below.
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="shrink-0 text-green-600 transition-colors hover:text-green-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
