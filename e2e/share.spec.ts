import { test, expect } from '@playwright/test'

test.describe('public share pages', () => {

  test('Share page loads without auth', async ({ browser }) => {
    // browser.newContext() has no cookies — simulates an incognito window.
    const context = await browser.newContext()
    const page    = await context.newPage()

    // Navigate to a share URL without being logged in.
    // We use a non-existent slug because we have no seed data in CI.
    // The assertion is that the proxy does NOT redirect to /auth/login —
    // proving share pages are publicly accessible regardless of slug validity.
    await page.goto('/share/this-slug-does-not-exist')
    await page.waitForLoadState('networkidle')

    expect(page.url()).not.toContain('/auth/login')

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
