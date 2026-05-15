import Anthropic from '@anthropic-ai/sdk'
import { prepareMessagesForContext } from './context'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const fakeMessages: Anthropic.MessageParam[] = Array.from({ length: 45 }, (_, i) => ({
  role:    i % 2 === 0 ? 'user' : 'assistant',
  content: `Message ${i + 1}`,
}))

function assert(label: string, pass: boolean) {
  console.log(pass ? `PASS — ${label}` : `FAIL — ${label}`)
}

async function main() {
  const result = await prepareMessagesForContext(fakeMessages, 40, anthropic)

  assert('returned array has fewer than 45 items', result.length < 45)

  const firstContent = typeof result[0].content === 'string'
    ? result[0].content
    : JSON.stringify(result[0].content)
  assert(
    'first item contains "summary" or "Earlier conversation"',
    /summary|Earlier conversation/i.test(firstContent),
  )

  const lastOriginal = fakeMessages[fakeMessages.length - 1]
  const lastResult   = result[result.length - 1]
  const lastContent  = typeof lastResult.content === 'string' ? lastResult.content : JSON.stringify(lastResult.content)
  const expectedLast = typeof lastOriginal.content === 'string' ? lastOriginal.content : JSON.stringify(lastOriginal.content)
  assert('last item matches last item of original array', lastContent === expectedLast)

  console.log(`\nresult.length = ${result.length}`)
  console.log(`result[0].content = ${firstContent.slice(0, 120)}`)
}

main().catch(err => { console.error(err); process.exit(1) })
