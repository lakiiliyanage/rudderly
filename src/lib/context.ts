import Anthropic from '@anthropic-ai/sdk'

type Message = Anthropic.MessageParam

// Extract plain text from a message regardless of whether content is a string
// or an array of content blocks. Tool-result blocks are skipped.
function messageToText(msg: Message): string {
  const label = msg.role === 'user' ? 'User' : 'Assistant'
  let text: string

  if (typeof msg.content === 'string') {
    text = msg.content
  } else {
    text = (msg.content as Anthropic.ContentBlockParam[])
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlockParam).text)
      .join(' ')
  }

  return `${label}: ${text.slice(0, 500)}`  // cap each message at 500 chars for the summary prompt
}

/**
 * Ensures the messages array fits comfortably within the model's context window.
 *
 * - If messages.length <= maxMessages: returned unchanged.
 * - If messages.length > maxMessages:
 *   1. Splits into earlyMessages (all but the 30 most recent) and recentMessages (last 30).
 *   2. Summarises earlyMessages with a single non-streaming Claude call.
 *   3. Prepends two synthetic turns (summary + acknowledgement) to recentMessages.
 *   4. Falls back to recentMessages alone if the summarisation call fails.
 */
export async function prepareMessagesForContext(
  messages: Message[],
  maxMessages: number,
  anthropic: Anthropic,
): Promise<Message[]> {
  console.log(`[context] input messages: ${messages.length}`)

  if (messages.length <= maxMessages) {
    console.log('[context] within limit — no truncation')
    return messages
  }

  const RECENT_COUNT  = 30
  const earlyMessages = messages.slice(0, messages.length - RECENT_COUNT)
  const recentMessages = messages.slice(-RECENT_COUNT)

  const historyText = earlyMessages.map(messageToText).join('\n')

  let summaryMessages: Message[]

  try {
    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages:   [{
        role:    'user',
        content: `Summarise the following conversation history in 3–5 sentences. Focus on: key topics discussed, decisions made, information the user shared, and any ongoing tasks. Be concise.\n\n${historyText}`,
      }],
    })

    const firstBlock = response.content[0]
    const summary = firstBlock.type === 'text' ? firstBlock.text.trim() : ''

    summaryMessages = [
      { role: 'user',      content: `[Earlier conversation summary: ${summary}]` },
      { role: 'assistant', content: 'Understood — I have the context from our earlier conversation.' },
    ]
  } catch (err) {
    console.error('[context] summarisation failed — falling back to recent messages only:', err)
    console.log(`[context] prepared ${recentMessages.length} messages (fallback, no summary)`)
    return recentMessages
  }

  const prepared = [...summaryMessages, ...recentMessages]
  console.log(`[context] prepared ${prepared.length} messages (${summaryMessages.length} summary + ${recentMessages.length} recent)`)
  return prepared
}
