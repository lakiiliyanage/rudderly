import { describe, it, expect, vi } from 'vitest'
import { prepareMessagesForContext } from '../context'
import type Anthropic from '@anthropic-ai/sdk'

function makeMessages(count: number): Anthropic.MessageParam[] {
  return Array.from({ length: count }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `Message ${i + 1}`,
  }))
}

function makeAnthropicMock(summary = 'Mock conversation summary.'): Anthropic {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: summary }],
      }),
    },
  } as unknown as Anthropic
}

describe('prepareMessagesForContext', () => {
  it('returns the array unchanged when under 40 messages', async () => {
    const msgs = makeMessages(39)
    const result = await prepareMessagesForContext(msgs, 40, makeAnthropicMock())
    expect(result).toBe(msgs)
    expect(result).toHaveLength(39)
  })

  it('returns unchanged at exactly 40 messages (boundary — must not trigger truncation)', async () => {
    const msgs = makeMessages(40)
    const result = await prepareMessagesForContext(msgs, 40, makeAnthropicMock())
    expect(result).toBe(msgs)
    expect(result).toHaveLength(40)
  })

  it('returns 32 items when given 41 messages (2 synthetic summary turns + 30 recent)', async () => {
    const msgs = makeMessages(41)
    const result = await prepareMessagesForContext(msgs, 40, makeAnthropicMock())

    expect(result).toHaveLength(32)

    // First two items are the synthetic summary exchange
    expect(result[0].role).toBe('user')
    expect(result[0].content).toMatch(/\[Earlier conversation summary:/)
    expect(result[1].role).toBe('assistant')

    // The remaining 30 are the most recent original messages
    expect(result.slice(2)).toEqual(msgs.slice(-30))
  })

  it('falls back to the 30 most recent messages with no crash when summarisation throws', async () => {
    const msgs = makeMessages(41)
    const anthropic = {
      messages: {
        create: vi.fn().mockRejectedValue(new Error('Anthropic API unavailable')),
      },
    } as unknown as Anthropic

    const result = await prepareMessagesForContext(msgs, 40, anthropic)

    expect(result).toHaveLength(30)
    expect(result).toEqual(msgs.slice(-30))
  })
})
