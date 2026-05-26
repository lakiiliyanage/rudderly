// Temporary test script — delete after verifying runner.ts behaviour.
// Run with: set -a && source .env.local && set +a && npx tsx src/lib/tools/test-runner.ts
import { dispatchToolCall } from './runner'

let passed = 0
let failed = 0

async function check(
  label: string,
  actual: string,
  predicate: (result: string) => boolean
) {
  const ok = predicate(actual)
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`)
  if (!ok) console.log(`       got: ${JSON.stringify(actual)}`)
  if (ok) { passed++ } else { failed++ }
}

async function main() {
  // 1. Calculator happy path
  const calc = await dispatchToolCall(
    'calculator',
    { expression: '847 * 23' },
    { allowedFileIds: [] }
  )
  await check('calculator happy path → "19481"', calc, r => r === '19481')

  // 2. DateTime happy path
  const dt = await dispatchToolCall(
    'get_datetime',
    {},
    { allowedFileIds: [] }
  )
  await check(
    'datetime returns a formatted date string',
    dt,
    r => /\d{4}/.test(r) && /(am|pm)/i.test(r)
  )
  console.log(`       got: "${dt}"`)

  // 3. Calculator failure path — must return safe fallback, not throw
  const badCalc = await dispatchToolCall(
    'calculator',
    { expression: 'not math' },
    { allowedFileIds: [] }
  )
  await check(
    'calculator bad input → safe fallback (no throw)',
    badCalc,
    r => r.includes("couldn't calculate")
  )

  // 4. Document reader — file not in allowed list
  const denied = await dispatchToolCall(
    'document_reader',
    { fileId: 'unauthorised-id' },
    { allowedFileIds: ['allowed-id'] }
  )
  await check(
    'document_reader unauthorised → "Access denied"',
    denied,
    r => r.startsWith('Access denied')
  )

  // 5. Unknown tool
  const unknown = await dispatchToolCall(
    'unknown_tool',
    {},
    { allowedFileIds: [] }
  )
  await check('unknown tool → "Unknown tool."', unknown, r => r === 'Unknown tool.')

  console.log(`\n${passed} passed, ${failed} failed`)
}

main()
