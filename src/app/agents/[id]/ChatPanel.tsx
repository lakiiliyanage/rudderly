'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const TOOL_LABELS: Record<string, string> = {
  web_search:      'Searching the web...',
  calculator:      'Calculating...',
  get_datetime:    'Checking the time...',
  document_reader: 'Reading document...',
  word_counter:    'Counting words...',
}

export default function ChatPanel({
  agentId,
  agentName,
}: {
  agentId: string
  agentName: string
}) {
  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [interrupted,   setInterrupted]   = useState(false)
  const [thinkingLabel, setThinkingLabel] = useState<string | null>(null)
  const bottomRef                         = useRef<HTMLDivElement>(null)
  const abortRef                          = useRef<AbortController | null>(null)

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
    setInterrupted(false)
    setThinkingLabel(null)

    const controller  = new AbortController()
    abortRef.current  = controller

    // Declared outside try so the catch block can read it to decide whether
    // a network error interrupted a partial reply or a blank response.
    let fullContent = ''

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId, messages: nextMessages }),
        signal:  controller.signal,
      })

      // Error responses are still JSON — parse them before reading the body
      // as a stream, because you can only consume a response body once.
      if (!res.ok) {
        const data = await res.json()
        setMessages(messages)
        setInput(text)
        if (res.status === 429) {
          setError('Too many messages — please wait a moment before sending again.')
        } else if (res.status === 500) {
          setError('Something went wrong on our end. Try again in a moment.')
        } else {
          setError(data.error ?? 'Something went wrong. Please try again.')
        }
        return
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()

      // Buffer incomplete SSE lines across chunk boundaries.
      // The route emits: data: {"type":"text","text":"…"}\n\n
      //                  data: {"type":"tool_call","tool":"…"}\n\n
      let sseBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // { stream: true } keeps the decoder's internal buffer across calls
        // so multi-byte characters split across chunk boundaries decode correctly.
        sseBuffer += decoder.decode(value, { stream: true })

        // Split on double-newline (SSE event boundary). The final element is
        // an incomplete event — keep it in the buffer for the next chunk.
        const parts = sseBuffer.split('\n\n')
        sseBuffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const event = JSON.parse(part.slice(6)) as { type: string; text?: string; tool?: string }
            if (event.type === 'text' && event.text) {
              fullContent += event.text
              setMessages([...nextMessages, { role: 'assistant', content: fullContent }])
            } else if (event.type === 'tool_call' && event.tool) {
              setThinkingLabel(TOOL_LABELS[event.tool] ?? 'Thinking...')
            }
          } catch {
            // Malformed SSE event — ignore and continue.
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User clicked Stop — keep whatever arrived, no error, no rollback.
        // The input was already cleared when Send was clicked; leave it clear.
        return
      }

      if (fullContent) {
        // Stream dropped mid-reply — keep the partial text, flag it as interrupted.
        setInterrupted(true)
      } else {
        // Nothing arrived at all — connection failed before the stream opened.
        setMessages(messages)
        setInput(text)
        setError('Connection lost — check your internet and retry.')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleNewConversation() {
    if (!window.confirm('Are you sure? This will clear the conversation.')) return
    setMessages([])
    setError(null)
    setInterrupted(false)
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
        {messages.length > 0 && (
          <Button
            variant="ghost"
            onClick={handleNewConversation}
            disabled={loading}
            className="ml-auto h-auto p-0 text-xs text-gray-500 hover:bg-transparent hover:text-gray-300"
          >
            New conversation
          </Button>
        )}
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 bg-red-950/50 border border-red-900/60 rounded-xl text-sm text-red-300 shrink-0 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="shrink-0 text-red-400 hover:text-red-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

        {/* Interrupted notice — shown inline below a partial AI reply after a
            network drop, not for user-initiated stops. Clears on next send. */}
        {interrupted && messages.at(-1)?.role === 'assistant' && (
          <div className="flex justify-start">
            <p className="text-xs text-gray-500 italic pl-1">Response interrupted — please retry.</p>
          </div>
        )}

        {/* Thinking indicator — shown while loading, before the first text chunk
            arrives. Shows plain dots for direct replies; shows a tool label
            (e.g. "Calculating...") while a tool is executing between calls. */}
        {loading && messages.at(-1)?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3.5">
              <div className="flex gap-1.5 items-center">
                {thinkingLabel && (
                  <span className="text-xs text-gray-400 mr-0.5">{thinkingLabel}</span>
                )}
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
            <Button
              variant="outline"
              onClick={handleStop}
              className="gap-2 border-gray-600 bg-gray-700 text-white hover:bg-gray-600 hover:text-white min-w-[90px] shrink-0 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="gap-2 bg-violet-600 hover:bg-violet-500 min-w-[90px] shrink-0 active:scale-95"
            >
              Send
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </Button>
          )}
        </div>
        {/*
          TOKENS & CONTEXT WINDOW
          LLMs don't process raw characters — they break text into tokens (roughly
          3-4 characters each for English). Every message in the conversation history
          is sent to the API on each request and counts toward the model's context
          window: the maximum amount of text it can hold in "working memory" at once.
          claude-haiku-4-5 has a 200 000-token context window (~150 000 words), so a
          normal conversation won't hit it. The 4 000-character limit here is a
          per-message guardrail: a single massive input would consume a
          disproportionate share of the window and degrade the quality of replies.
        */}
        <div className="flex items-center justify-between mt-2 px-1">
          {input.trim().length > 4000 ? (
            <p className="text-xs text-yellow-500/80">
              Your message is very long — this may affect response quality.
            </p>
          ) : (
            <p className="text-gray-600 text-xs">Enter to send · Shift+Enter for a new line</p>
          )}
          <p className={`text-xs tabular-nums ${
            input.length >= 3800 ? 'text-red-400'         :
            input.length >= 3000 ? 'text-yellow-500/80'   :
                                   'text-gray-600'
          }`}>
            {input.length} / 4000
          </p>
        </div>
      </div>

    </div>
  )
}
