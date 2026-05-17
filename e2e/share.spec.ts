import { test, expect } from '@playwright/test'

// Hardcoded public agent slug (Research Agent — id b80e4fef-…).
const PUBLIC_SLUG = 'research-agent'

test.describe('public share pages', () => {

  test('Share page loads without auth', async ({ browser }) => {
    // browser.newContext() has no cookies — simulates an incognito window.
    const context = await browser.newContext()
    const page    = await context.newPage()

    await page.goto(`/share/${PUBLIC_SLUG}`)

    // The agent name should be the <h1> heading on the share page.
    await expect(
      page.getByRole('heading', { name: 'Research Agent' })
    ).toBeVisible({ timeout: 10_000 })

    await context.close()
  })

  test('Non-existent slug shows 404 message', async ({ browser }) => {
    const context = await browser.newContext()
    const page    = await context.newPage()

    await page.goto('/share/this-slug-does-not-exist')

    // The share page renders "This agent is no longer available." when not found.
    await expect(
      page.getByText(/no longer available/i)
    ).toBeVisible({ timeout: 10_000 })

    await context.close()
  })

})
