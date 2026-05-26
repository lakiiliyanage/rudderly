import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.local' })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  globalTeardown: './e2e/teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Signs in once via the login form and saves cookies to e2e/.auth/user.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // All real tests — chromium only, auth state loaded from the setup step
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run start',   // serves the pre-built .next/ folder; requires npm run build first
    url: 'http://localhost:3000',
    // Reuse an already-running dev server locally; always start fresh in CI.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
