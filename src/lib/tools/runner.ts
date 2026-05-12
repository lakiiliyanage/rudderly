import { tavily } from '@tavily/core'
import { create, all } from 'mathjs'
import { env } from '@/lib/env'

const math = create(all)

// ─── 1. Web search ───────────────────────────────────────────────────────────

export async function runWebSearch(query: string): Promise<string> {
  try {
    const tvly = tavily({ apiKey: env.TAVILY_API_KEY })
    const response = await tvly.search(query, { maxResults: 5, includeAnswer: false })

    return response.results
      .slice(0, 5)
      .map((r, i) => {
        const snippet = (r.content ?? '').slice(0, 200)
        return `${i + 1}. ${r.title}\n   ${r.url}\n   ${snippet}`
      })
      .join('\n\n')
  } catch (err) {
    // Include 'web_search' in the message so the chat route's error handler
    // can identify which tool failed.
    throw new Error(
      `web_search failed: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

// ─── 2. Calculator ───────────────────────────────────────────────────────────

export async function runCalculator(expression: string): Promise<string> {
  // mathjs.evaluate() is safe — it only understands mathematical syntax.
  // Never use JavaScript's eval() here: eval() executes arbitrary JS, which
  // would allow a malicious user to run server-side code (code injection).
  try {
    const result = math.evaluate(expression)
    return String(result)
  } catch {
    return "I couldn't calculate that — please check the expression."
  }
}

// ─── 3. Date / time ──────────────────────────────────────────────────────────

export async function runDateTime(): Promise<string> {
  const now = new Date()

  // Intl.DateTimeFormat is the built-in JS internationalisation API.
  // It formats dates/times according to locale and timezone conventions,
  // producing a human-readable string like 'Monday, 12 May 2026 at 2:35 pm AEST'.
  const formatted = new Intl.DateTimeFormat('en-AU', {
    weekday:      'long',
    day:          'numeric',
    month:        'long',
    year:         'numeric',
    hour:         'numeric',
    minute:       '2-digit',
    hour12:       true,
    timeZone:     'Australia/Sydney',
    timeZoneName: 'short',
  }).format(now)

  return formatted
}

// ─── 4. Document reader ──────────────────────────────────────────────────────

const MAX_DOC_CHARS = 15_000

export async function runDocumentReader(
  fileId: string,
  allowedFileIds: string[]
): Promise<string> {
  // Security check: only allow file IDs that the agent config explicitly listed.
  // This prevents prompt injection — a user crafting a message to trick Claude
  // into reading an arbitrary Drive file that wasn't configured for this agent.
  if (!allowedFileIds.includes(fileId)) {
    return 'Access denied — this document has not been configured for this agent.'
  }

  // Google Drive export endpoint: converts a Google Doc to plain text.
  // mimeType=text/plain tells Drive to strip formatting before returning.
  const url =
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export` +
    `?mimeType=text%2Fplain&key=${env.GOOGLE_DRIVE_API_KEY}`

  const res = await fetch(url)

  if (res.status === 403) {
    return (
      'This document is not publicly accessible. ' +
      "Please ensure the Google Drive file sharing is set to Anyone with the link → Viewer."
    )
  }

  if (res.status === 404) {
    return 'Document not found — the file may have been deleted or the ID is incorrect.'
  }

  if (!res.ok) {
    return `Failed to read document (HTTP ${res.status}).`
  }

  const text = await res.text()

  // Truncate to avoid crowding out the conversation in Claude's context window.
  // Claude's context window is the total text it can process at once — very large
  // documents would leave little room for the rest of the conversation.
  const truncated = text.length > MAX_DOC_CHARS ? text.slice(0, MAX_DOC_CHARS) + '…' : text

  return `Document content:\n\n${truncated}`
}

// ─── 5. Word counter ─────────────────────────────────────────────────────────

export async function runWordCounter(text: string): Promise<string> {
  const words      = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const chars      = text.length
  const charsNoSp  = text.replace(/\s/g, '').length
  const sentences  = (text.match(/[.!?]+/g) ?? []).length

  return (
    `Word count: ${words}\n` +
    `Characters (with spaces): ${chars}\n` +
    `Characters (without spaces): ${charsNoSp}\n` +
    `Sentences: ${sentences}`
  )
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export async function dispatchToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: { allowedFileIds: string[] }
): Promise<string> {
  switch (toolName) {
    case 'web_search':
      return runWebSearch(toolInput.query as string)

    case 'calculator':
      return runCalculator(toolInput.expression as string)

    case 'get_datetime':
      return runDateTime()

    case 'document_reader':
      return runDocumentReader(
        toolInput.fileId as string,
        context.allowedFileIds
      )

    case 'word_counter':
      return runWordCounter(toolInput.text as string)

    default:
      return 'Unknown tool.'
  }
}
