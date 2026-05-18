'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Menu } from 'lucide-react'
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
// 'counting_words'   → word_counter tool running
type ThinkingState =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'calculating'
  | 'checking_time'
  | 'reading_document'
  | 'counting_words'

// Maps the tool name from the SSE event to the ThinkingState value.
const TOOL_TO_STATE: Record<string, ThinkingState> = {
  web_search:      'searching',
  calculator:      'calculating',
  get_datetime:    'checking_time',
  document_reader: 'reading_document',
  word_counter:    'counting_words',
}

// Human-readable label shown in the thinking indicator bubble.
const STATE_LABELS: Record<Exclude<ThinkingState, 'idle'>, string> = {
  thinking:         'Thinking...',
  searching:        'Searching the web...',
  calculating:      'Calculating...',
  checking_time:    'Checking the time...',
  reading_document: 'Reading document...',
  counting_words:   'Counting words...',
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
  onMenuOpen,
  onConversationCreated,
  onTitleGenerated,
}: {
  agentId:                string
  agentName:              string
  onMenuOpen?:            () => void
  onConversationCreated?: (conv: { id: string; created_at: string }) => void
  onTitleGenerated?:      (id: string, title: string) => void
}) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [messages,        setMessages]        = useState<Message[]>([])
  const [input,           setInput]           = useState('')
  const [thinkingState,   setThinkingState]   = useState<ThinkingState>('idle')
  const [error,           setError]           = useState<string | null>(null)
  const [interrupted,     setInterrupted]     = useState(false)
  const [isLoading,       setIsLoading]       = useState(!!searchParams.get('c'))
  const [saveToast,       setSaveToast]       = useState<string | null>(null)
  const [chatError,       setChatError]       = useState<{ type: 'upgrade' | 'enterprise'; message: string } | null>(null)
  // Tracks which assistant message indices have their Sources panel expanded.
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())
  const bottomRef             = useRef<HTMLDivElement>(null)
  const abortRef              = useRef<AbortController | null>(null)
  // Tracks which conversation ID is currently driving the send handler.
  const conversationIdRef     = useRef<string | null>(searchParams.get('c'))
  // Tracks which conversation's messages are already in React state, so the
  // load effect can skip a fetch when the send handler just created this
  // conversation (rather than the user navigating here via the sidebar).
  const loadedConversationRef = useRef<string | null>(null)

  const conversationId = searchParams.get('c')
  const isWorking      = thinkingState !== 'idle'

  // Reactive conversation loader — runs when the ?c= URL param changes.
  // Distinguishes sidebar navigation (different ID → fetch) from the send
  // handler setting the URL after creating a conversation (same ID, already
  // in state → skip).
  useEffect(() => {
    if (!conversationId) {
      // ?c= was cleared — "New conversation" in the sidebar.
      if (loadedConversationRef.current !== null) {
        setMessages([])
        setError(null)
        setInterrupted(false)
        loadedConversationRef.current = null
        conversationIdRef.current     = null
      }
      setIsLoading(false)
      return
    }

    // Send handler already put this conversation's messages into state — skip.
    if (conversationId === loadedConversationRef.current) {
      setIsLoading(false)
      return
    }

    // Navigated here from the sidebar (or page load with ?c=).
    abortRef.current?.abort()        // cancel any in-flight stream
    abortRef.current        = null
    conversationIdRef.current = conversationId
    setIsLoading(true)
    setMessages([])
    setThinkingState('idle')

    fetch(`/api/conversations/${conversationId}`)
      .then(async res => {
        if (res.status === 404) {
          conversationIdRef.current = null
          router.replace(`/agents/${agentId}`, { scroll: false })
          return
        }
        if (res.status === 403) {
          router.replace('/dashboard')
          return
        }
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.messages)) {
          setMessages(data.messages.map((m: {
            role: 'user' | 'assistant'
            content: string
            sources?: string[]
            documentUsed?: string
          }) => ({
            role:    m.role,
            content: m.content,
            ...(m.sources      && { sources:      m.sources }),
            ...(m.documentUsed && { documentUsed: m.documentUsed }),
          })))
          loadedConversationRef.current = conversationId
        }
      })
      .finally(() => setIsLoading(false))
  // router and agentId are stable references; conversationId is the trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    if (!saveToast) return
    const t = setTimeout(() => setSaveToast(null), 5000)
    return () => clearTimeout(t)
  }, [saveToast])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinkingState])

  async function handleSend() {
    const text = input.trim()
    if (!text || isWorking) return

    // ── Ensure a conversation exists ──────────────────────────────────
    if (!conversationIdRef.current) {
      const res = await fetch('/api/conversations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agent_id: agentId }),
      })
      if (res.status === 201) {
        const conv = await res.json() as { id: string; created_at: string }
        conversationIdRef.current     = conv.id
        loadedConversationRef.current = conv.id  // prevent effect from re-fetching
        router.replace(`/agents/${agentId}?c=${conv.id}`, { scroll: false })
        onConversationCreated?.(conv)
      }
    }

    const userMessage: Message = { role: 'user', content: text }
    const nextMessages         = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setThinkingState('thinking')
    setError(null)
    setInterrupted(false)

    // Await the user save so we know whether it succeeded, but catch the
    // error and show a toast rather than blocking or aborting the chat.
    if (conversationIdRef.current) {
      try {
        const saveRes = await fetch(`/api/conversations/${conversationIdRef.current}/messages`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ role: 'user', content: text }),
        })
        if (!saveRes.ok) throw new Error(`status ${saveRes.status}`)
      } catch {
        setSaveToast("Message couldn't be saved — your chat is still working but history may not persist.")
      }
    }

    const controller = new AbortController()
    abortRef.current = controller

    // Accumulated text — read by the catch block to decide interrupted vs failed.
    let fullContent = ''
    // Attribution from the most recent tool call — attached to the assistant
    // message once text starts arriving from the second Claude call.
    let pendingAttribution: Pick<Message, 'sources' | 'documentUsed'> | null = null
    // All tools invoked during this response — persisted alongside the message.
    const toolsUsed: { tool: string }[] = []

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
        if (res.status === 402) {
          setChatError({
            type:    data.cta === 'enterprise' ? 'enterprise' : 'upgrade',
            message: data.message ?? 'Message limit reached.',
          })
        } else if (res.status === 429) {
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
              toolsUsed.push({ tool: event.tool })
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

      // Stream complete — persist the assistant reply (fire-and-forget).
      if (fullContent && conversationIdRef.current) {
        const cid = conversationIdRef.current

        fetch(`/api/conversations/${cid}/messages`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            role:       'assistant',
            content:    fullContent,
            tool_calls: toolsUsed.length > 0 ? toolsUsed : null,
          }),
        }).catch(console.error)

        // Auto-title — only on the first exchange (nextMessages had just the
        // one user message before this reply). Fire-and-forget; errors are
        // logged but never surfaced to the user.
        if (nextMessages.length === 1) {
          fetch(`/api/conversations/${cid}/title`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ userMessage: text, assistantMessage: fullContent }),
          })
            .then(res => res.ok ? res.json() : null)
            .then((data: { title: string } | null) => {
              if (data?.title) onTitleGenerated?.(cid, data.title)
            })
            .catch(console.error)
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
    conversationIdRef.current     = null
    loadedConversationRef.current = null
    router.replace(`/agents/${agentId}`, { scroll: false })
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
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            aria-label="Open conversation history"
            className="md:hidden text-gray-500 hover:text-gray-300 transition-colors -ml-1 shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
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

      {/* ── Save-failure toast (amber — chat still works) ──────────────── */}
      {saveToast && (
        <div className="mx-4 mt-3 px-4 py-3 bg-amber-950/50 border border-amber-800/60 rounded-xl text-sm text-amber-300 shrink-0 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="flex-1">{saveToast}</span>
          <button
            onClick={() => setSaveToast(null)}
            aria-label="Dismiss"
            className="shrink-0 text-amber-400 hover:text-amber-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse [animation-delay:0ms]"   />
              <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        ) : null}

        {!isLoading && messages.length === 0 && !isWorking && (
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

        {/* ── Limit reached cards ─────────────────────────────────────── */}
        {chatError?.type === 'upgrade' && (
          <div className="flex justify-center">
            <div className="bg-gray-800/80 border border-amber-700/40 rounded-2xl px-5 py-4 max-w-sm text-center">
              <div className="w-9 h-9 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white mb-1">Monthly limit reached</p>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{chatError.message}</p>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-all active:scale-95"
              >
                Upgrade to Pro for 5,000 messages/month →
              </a>
            </div>
          </div>
        )}

        {chatError?.type === 'enterprise' && (
          <div className="flex justify-center">
            <div className="bg-gray-800/80 border border-purple-700/40 rounded-2xl px-5 py-4 max-w-sm text-center">
              <div className="w-9 h-9 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white mb-1">Pro limit reached</p>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{chatError.message}</p>
              <a
                href="mailto:liyanage.lakii@gmail.com?subject=AgentForge Enterprise"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all active:scale-95"
              >
                Contact us for Enterprise →
              </a>
            </div>
          </div>
        )}

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
            disabled={isWorking || isLoading || !!chatError}
            placeholder={chatError ? 'Upgrade to continue chatting' : `Message ${agentName}…`}
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
              disabled={!input.trim() || thinkingState !== 'idle' || isLoading || !!chatError}
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
