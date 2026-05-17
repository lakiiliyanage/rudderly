import { test, expect } from '@playwright/test'
import fs from 'fs'

// Agent ID is written by auth.setup.ts and deleted by teardown.ts.
function getAgentId(): string {
  const raw = fs.readFileSync('e2e/.auth/test-data.json', 'utf8')
  return (JSON.parse(raw) as { agentId: string }).agentId
}

test.describe('conversation persistence', () => {

  test('URL updates to ?c= on first message', async ({ page }) => {
    await page.goto(`/agents/${getAgentId()}`)

    const input = page.locator('input[placeholder*="Message"]')
    await input.waitFor({ state: 'visible', timeout: 10_000 })

    await input.fill('Hi')
    await page.click('button:has-text("Send")')

    // URL gains ?c=<uuid> when the conversation row is created.
    await page.waitForURL(/[?&]c=/, { timeout: 30_000 })
    expect(page.url()).toContain('?c=')
  })

  test('History persists on reload', async ({ page }) => {
    const msg = 'Playwright persistence check'

    await page.goto(`/agents/${getAgentId()}`)

    const input = page.locator('input[placeholder*="Message"]')
    await input.waitFor({ state: 'visible', timeout: 10_000 })

    await input.fill(msg)
    await page.click('button:has-text("Send")')

    // Wait for the conversation to be created.
    await page.waitForURL(/[?&]c=/, { timeout: 30_000 })

    // The user message is persisted before the stream starts — wait for the
    // exchange to finish (Send button re-appears when thinkingState → 'idle').
    await page.locator('button:has-text("Send")').waitFor({ timeout: 60_000 })

    await page.reload()

    // exact:true = case-sensitive full-element match → avoids matching the assistant
    // reply which echoes similar words with different capitalisation.
    await expect(page.getByText(msg, { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('New conversation button clears URL', async ({ page }) => {
    await page.goto(`/agents/${getAgentId()}`)

    const input = page.locator('input[placeholder*="Message"]')
    await input.waitFor({ state: 'visible', timeout: 10_000 })

    await input.fill('Hi')
    await page.click('button:has-text("Send")')
    await page.waitForURL(/[?&]c=/, { timeout: 30_000 })

    // Wait for the exchange to complete before the button is visible.
    await page.locator('button:has-text("Send")').waitFor({ timeout: 60_000 })

    // handleNewConversation calls window.confirm() — accept before clicking.
    page.once('dialog', dialog => dialog.accept())
    await page.click('button:has-text("New conversation")')

    // URL drops the ?c= param after router.replace().
    await page.waitForURL(url => !url.searchParams.has('c'), { timeout: 10_000 })
    expect(page.url()).not.toContain('?c=')
  })

})
