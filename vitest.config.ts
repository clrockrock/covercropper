import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@covercropper/core': new URL('./packages/core/src/index.ts', import.meta.url).pathname,
      '@covercropper/element': new URL('./packages/element/src/index.ts', import.meta.url).pathname
    }
  },
  test: {
    include: ['packages/**/*.spec.ts'],
    environment: 'happy-dom'
  }
})
