'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPanel({
  agentId,
  agentName,
}: {
  agentId: string
  agentName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const abortRef                = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message  = { role: 'user', content: text }
    const nextMessages          = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(null)

    const controller  = new AbortController()
    abortRef.current  = controller

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId, messages: nextMessages }),
        signal:  controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(messages)
        setInput(text)
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      // AbortError = user clicked Stop intentionally — roll back silently.
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages(messages)
        setInput(text)
        return
      }
      setMessages(messages)
      setInput(text)
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[560px]">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
        <div className="w-2 h-2 rounded-full bg-violet-500" />
        <span className="text-sm font-medium text-white">Chat with {agentName}</span>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 bg-red-950/50 border border-red-900/60 rounded-xl text-sm text-red-300 shrink-0 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Message list ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">Send a message to start the conversation.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator while waiting for AI reply */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3.5">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]"   />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-gray-800 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={`Message ${agentName}…`}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
          {loading ? (
            <button
              onClick={handleStop}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium text-white transition-all active:scale-95 shrink-0 flex items-center gap-2 min-w-[90px] justify-center"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all active:scale-95 shrink-0 flex items-center gap-2 min-w-[90px] justify-center"
            >
              Send
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-gray-600 text-xs mt-2 pl-1">Enter to send · Shift+Enter for a new line</p>
      </div>

    </div>
  )
}
