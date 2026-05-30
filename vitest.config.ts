import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/lib/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
      exclude: [
        'src/app/**',
        'src/lib/__tests__/**',
        '*.config.*',
        'node_modules/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
