'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

export default function ShareDialog({
  agentId,
  initialIsPublic,
  initialSlug,
}: {
  agentId:         string
  initialIsPublic: boolean
  initialSlug:     string | null
}) {
  const [open,     setOpen]     = useState(false)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [slug,     setSlug]     = useState(initialSlug)
  const [loading,  setLoading]  = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [origin] = useState(() => typeof window !== 'undefined' ? window.location.origin : '')

  const publicUrl = slug
    ? (origin ? `${origin}/share/${slug}` : `/share/${slug}`)
    : null

  async function handleToggle(next: boolean) {
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/share`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isPublic: next }),
      })
      if (!res.ok) return
      const data = await res.json() as { is_public: boolean; slug: string }
      setIsPublic(data.is_public)
      setSlug(data.slug)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!slug) return
    await navigator.clipboard.writeText(window.location.origin + '/share/' + slug)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3.5 py-2 rounded-lg transition-all active:scale-95">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Share agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Status badge */}
          <div>
            {isPublic ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/25 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                Public — anyone with the link can chat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-700/50 border border-gray-700 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                Private — only you can access this agent
              </span>
            )}
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Make this agent public</p>
              <p className="text-xs text-gray-500 mt-0.5">Anyone with the link can chat with this agent.</p>
            </div>
            <Switch
              checked={isPublic}
              disabled={loading}
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Public URL — only shown when public */}
          {isPublic && publicUrl && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Public link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-sm font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 px-3 py-2 rounded-lg transition-all whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
