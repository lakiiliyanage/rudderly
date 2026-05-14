'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RunResult {
  result?: string
  error?:  string
  ms:      number
}

// ── Shared helpers ────────────────────────────────────────────────────────────

async function runTool(
  tool:  string,
  input: Record<string, unknown>
): Promise<RunResult> {
  const start = Date.now()
  try {
    const res = await fetch('/api/tools/test', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tool, input }),
    })
    const ms   = Date.now() - start
    const body = await res.json() as { result?: string; error?: string }
    if (!res.ok) return { error: body.error ?? `HTTP ${res.status}`, ms }
    return { result: body.result, ms }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error.', ms: Date.now() - start }
  }
}

// ── Result panel ──────────────────────────────────────────────────────────────

function ResultPanel({ data, docPreview }: { data: RunResult | null; docPreview?: string }) {
  if (!data) return null

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-3">
        {data.error
          ? <span className="text-xs font-medium text-red-400">Error</span>
          : <span className="text-xs font-medium text-green-400">OK</span>
        }
        <span className="text-xs text-gray-500">{data.ms} ms</span>
      </div>

      {data.error && (
        <pre className="rounded-lg bg-red-950/40 border border-red-900/40 px-3 py-2 text-xs text-red-300 whitespace-pre-wrap break-words">
          {data.error}
        </pre>
      )}

      {data.result && (
        <pre className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-gray-200 whitespace-pre-wrap break-words max-h-72 overflow-y-auto">
          {data.result}
        </pre>
      )}

      {docPreview && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Document preview (first 500 chars)</p>
          <pre className="rounded-lg bg-gray-800 border border-violet-800/40 px-3 py-2 text-xs text-gray-300 whitespace-pre-wrap break-words">
            {docPreview}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="text-sm font-semibold text-white mb-4">
        <span className="mr-2">{emoji}</span>{title}
      </h2>
      {children}
    </section>
  )
}

// ── Input + button shared styles ──────────────────────────────────────────────

const inputCls =
  'w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500'

const btnCls =
  'mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors active:scale-95'

// ── 1. Web Search ─────────────────────────────────────────────────────────────

function WebSearchSection() {
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [data,    setData]    = useState<RunResult | null>(null)

  async function run() {
    if (!query.trim()) return
    setLoading(true)
    setData(await runTool('web_search', { query: query.trim() }))
    setLoading(false)
  }

  return (
    <Section emoji="🔍" title="Web Search">
      <input
        className={inputCls}
        placeholder="Search query"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && run()}
      />
      <button className={btnCls} disabled={loading || !query.trim()} onClick={run}>
        {loading ? 'Running…' : 'Run'}
      </button>
      <ResultPanel data={data} />
    </Section>
  )
}

// ── 2. Calculator ─────────────────────────────────────────────────────────────

function CalculatorSection() {
  const [expr,    setExpr]    = useState('')
  const [loading, setLoading] = useState(false)
  const [data,    setData]    = useState<RunResult | null>(null)

  async function run() {
    if (!expr.trim()) return
    setLoading(true)
    setData(await runTool('calculator', { expression: expr.trim() }))
    setLoading(false)
  }

  return (
    <Section emoji="🧮" title="Calculator">
      <input
        className={inputCls}
        placeholder="Expression, e.g. 15% of 240"
        value={expr}
        onChange={e => setExpr(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && run()}
      />
      <button className={btnCls} disabled={loading || !expr.trim()} onClick={run}>
        {loading ? 'Running…' : 'Run'}
      </button>
      <ResultPanel data={data} />
    </Section>
  )
}

// ── 3. Date / Time ────────────────────────────────────────────────────────────

function DateTimeSection() {
  const [loading, setLoading] = useState(false)
  const [data,    setData]    = useState<RunResult | null>(null)

  async function run() {
    setLoading(true)
    setData(await runTool('get_datetime', {}))
    setLoading(false)
  }

  return (
    <Section emoji="🕐" title="Date / Time">
      <p className="text-xs text-gray-500 mb-1">No input required — returns current Sydney time.</p>
      <button className={btnCls} disabled={loading} onClick={run}>
        {loading ? 'Running…' : 'Run'}
      </button>
      <ResultPanel data={data} />
    </Section>
  )
}

// ── 4. Document Reader ────────────────────────────────────────────────────────

function DocumentReaderSection() {
  const [fileId,  setFileId]  = useState('')
  const [loading, setLoading] = useState(false)
  const [data,    setData]    = useState<RunResult | null>(null)
  const [preview, setPreview] = useState<string | undefined>()

  async function run() {
    if (!fileId.trim()) return
    setLoading(true)
    setPreview(undefined)
    const res = await runTool('document_reader', { fileId: fileId.trim() })
    setData(res)
    if (res.result?.startsWith('Document content:')) {
      const body = res.result.slice('Document content:\n\n'.length)
      setPreview(body.slice(0, 500))
    }
    setLoading(false)
  }

  return (
    <Section emoji="📄" title="Document Reader">
      <input
        className={inputCls}
        placeholder="Google Drive file ID"
        value={fileId}
        onChange={e => setFileId(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && run()}
      />
      <p className="mt-1 text-xs text-gray-600">
        Extract the ID from a Drive URL: /d/<span className="text-gray-500">FILE_ID</span>/…
      </p>
      <button className={btnCls} disabled={loading || !fileId.trim()} onClick={run}>
        {loading ? 'Running…' : 'Run'}
      </button>
      <ResultPanel data={data} docPreview={preview} />
    </Section>
  )
}

// ── 5. Word Counter ───────────────────────────────────────────────────────────

function WordCounterSection() {
  const [text,    setText]    = useState('')
  const [loading, setLoading] = useState(false)
  const [data,    setData]    = useState<RunResult | null>(null)

  async function run() {
    if (!text.trim()) return
    setLoading(true)
    setData(await runTool('word_counter', { text }))
    setLoading(false)
  }

  return (
    <Section emoji="📝" title="Word Counter">
      <textarea
        className={`${inputCls} min-h-[100px] resize-y`}
        placeholder="Paste text to analyse"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button className={btnCls} disabled={loading || !text.trim()} onClick={run}>
        {loading ? 'Running…' : 'Run'}
      </button>
      <ResultPanel data={data} />
    </Section>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────

export default function ToolTestPanel() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tool Test Bench</h1>
        <p className="text-sm text-gray-500 mt-1">Admin only — tests each dispatchToolCall handler directly.</p>
      </div>

      <div className="space-y-6">
        <WebSearchSection />
        <CalculatorSection />
        <DateTimeSection />
        <DocumentReaderSection />
        <WordCounterSection />
      </div>
    </div>
  )
}
