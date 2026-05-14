'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Badge }   from '@/components/ui/badge'

type Message = {
  role:          'user' | 'assistant'
  content:       string
  sources?:      string[]    // web_search: source URLs to show below the reply
  documentUsed?: string      // document_reader: name of the doc that was read
}

// ── Thinking state machine ────────────────────────────────────────────────────
// 'idle'             → no request in flight
// 'thinking'         → request sent, waiting for first event
// 'searching'        → web_search tool running
// 'calculating'      → calculator tool running
// 'checking_time'    → get_datetime tool running
// 'reading_document' → document_reader tool running
type ThinkingState =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'calculating'
  | 'checking_time'
  | 'reading_document'

// Maps the tool name from the SSE event to the ThinkingState value.
const TOOL_TO_STATE: Record<string, ThinkingState> = {
  web_search:      'searching',
  calculator:      'calculating',
  get_datetime:    'checking_time',
  document_reader: 'reading_document',
}

// Human-readable label shown in the thinking indicator bubble.
const STATE_LABELS: Record<Exclude<ThinkingState, 'idle'>, string> = {
  thinking:         'Thinking...',
  searching:        'Searching the web...',
  calculating:      'Calculating...',
  checking_time:    'Checking the time...',
  reading_document: 'Reading document...',
}

// ── Markdown components ───────────────────────────────────────────────────────
// Applied only to assistant messages. Provides minimal Tailwind styling so that
// markdown elements (bold, lists, code, headings) render correctly inside the
// dark chat bubble rather than inheriting unstyled browser defaults.
const markdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p:          ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong:     ({ children }) => <strong className="font-semibold">{children}</strong>,
  em:         ({ children }) => <em className="italic">{children}</em>,
  h1:         ({ children }) => <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-sm font-semibold mt-1 mb-1">{children}</h3>,
  ul:         ({ children }) => <ul className="list-disc list-outside pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal list-outside pl-4 mb-2 space-y-0.5">{children}</ol>,
  li:         ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-600 pl-3 italic text-gray-400 my-1">{children}</blockquote>,
  pre:        ({ children }) => <pre className="bg-gray-950/60 rounded-lg p-2.5 my-1.5 overflow-x-auto text-xs font-mono">{children}</pre>,
  // className is present on block code (language-xxx), absent on inline code.
  code: ({ className, children }) =>
    className
      ? <code className={className}>{children}</code>
      : <code className="bg-gray-950/60 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
}

export default function ChatPanel({
  agentId,
  agentName,
}: {
  agentId: string
  agentName: string
}) {
  const [messages,        setMessages]        = useState<Message[]>([])
  const [input,           setInput]           = useState('')
  const [thinkingState,   setThinkingState]   = useState<ThinkingState>('idle')
  const [error,           setError]           = useState<string | null>(null)
  const [interrupted,     setInterrupted]     = useState(false)
  // Tracks which assistant message indices have their Sources panel expanded.
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())
  const bottomRef                             = useRef<HTMLDivElement>(null)
  const abortRef                              = useRef<AbortController | null>(null)

  const isWorking = thinkingState !== 'idle'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinkingState])

  async function handleSend() {
    const text = input.trim()
    if (!text || isWorking) return

    const userMessage: Message = { role: 'user', content: text }
    const nextMessages         = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setThinkingState('thinking')
    setError(null)
    setInterrupted(false)

    const controller = new AbortController()
    abortRef.current = controller

    // Accumulated text — read by the catch block to decide interrupted vs failed.
    let fullContent = ''
    // Attribution from the most recent tool call — attached to the assistant
    // message once text starts arriving from the second Claude call.
    let pendingAttribution: Pick<Message, 'sources' | 'documentUsed'> | null = null

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentId, messages: nextMessages }),
        signal:  controller.signal,
      })

      // Error responses are JSON — parse before reading as stream (body can only
      // be consumed once).
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

      const reader    = res.body!.getReader()
      const decoder   = new TextDecoder()
      let   sseBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })

        // Split on SSE event boundary. Keep the trailing incomplete event in
        // the buffer so multi-chunk events decode correctly.
        const parts = sseBuffer.split('\n\n')
        sseBuffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const event = JSON.parse(part.slice(6)) as {
              type:          string
              text?:         string
              tool?:         string
              sources?:      string[]
              documentUsed?: string
            }

            if (event.type === 'text' && event.text) {
              fullContent += event.text
              setMessages([
                ...nextMessages,
                { role: 'assistant', content: fullContent, ...pendingAttribution },
              ])
            } else if (event.type === 'tool_call' && event.tool) {
              setThinkingState(TOOL_TO_STATE[event.tool] ?? 'thinking')
            } else if (event.type === 'attribution') {
              pendingAttribution = {
                ...(event.sources      && { sources:      event.sources }),
                ...(event.documentUsed && { documentUsed: event.documentUsed }),
              }
            }
          } catch {
            // Malformed SSE event — skip and continue.
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User clicked Stop — keep whatever arrived, no error shown.
        return
      }

      if (fullContent) {
        setInterrupted(true)
      } else {
        setMessages(messages)
        setInput(text)
        setError('Connection lost — check your internet and retry.')
      }
    } finally {
      setThinkingState('idle')
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
    setExpandedSources(new Set())
  }

  function toggleSources(index: number) {
    setExpandedSources(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
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
            disabled={isWorking}
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

        {messages.length === 0 && !isWorking && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">Send a message to start the conversation.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              // User bubbles: plain text, no markdown parsing.
              <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words bg-violet-600 text-white">
                {msg.content}
              </div>
            ) : (
              // Assistant bubbles: markdown + optional attribution footer.
              <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed break-words bg-gray-800 text-gray-200">
                <ReactMarkdown components={markdownComponents}>
                  {msg.content}
                </ReactMarkdown>

                {/* ── Sources (web search) ──────────────────────────────── */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700/60">
                    <button
                      onClick={() => toggleSources(i)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <span>Sources</span>
                      <span className={`transition-transform duration-150 ${expandedSources.has(i) ? 'rotate-90' : ''}`}>
                        ›
                      </span>
                    </button>
                    {expandedSources.has(i) && (
                      <ul className="mt-1.5 space-y-1">
                        {msg.sources.map((url, j) => (
                          <li key={j}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-400 hover:text-violet-300 hover:underline break-all"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* ── Document badge (document_reader) ─────────────────── */}
                {msg.documentUsed && (
                  <div className="mt-2">
                    <Badge
                      variant="secondary"
                      className="text-xs text-gray-400 bg-gray-700/50 border-gray-600/40"
                    >
                      📄 Read from {msg.documentUsed}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Interrupted notice */}
        {interrupted && messages.at(-1)?.role === 'assistant' && (
          <div className="flex justify-start">
            <p className="text-xs text-gray-500 italic pl-1">Response interrupted — please retry.</p>
          </div>
        )}

        {/* ── Thinking indicator ──────────────────────────────────────────
            Visible while working and before the first text chunk arrives.
            Once setMessages adds the assistant bubble the condition flips
            (messages.at(-1)?.role becomes 'assistant') and this hides. */}
        {isWorking && messages.at(-1)?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3.5">
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-gray-400 mr-0.5">
                  {STATE_LABELS[thinkingState as Exclude<ThinkingState, 'idle'>]}
                </span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:0ms]"   />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:300ms]" />
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
            disabled={isWorking}
            placeholder={`Message ${agentName}…`}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
          {isWorking ? (
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
              disabled={!input.trim() || thinkingState !== 'idle'}
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
