import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@storyboard/shell/json/build-json-document': path.resolve(
        __dirname,
        '../shell/dist/json/build-json-document.js',
      ),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
