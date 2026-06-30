import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@onespec-dev/spec': path.resolve(__dirname, '../spec/dist/index.js'),
      '@onespec-dev/shell/detect-mode': path.resolve(
        __dirname,
        '../shell/dist/vite/detect-mode.js',
      ),
      '@onespec-dev/shell/json/build-json-document': path.resolve(
        __dirname,
        '../shell/dist/json/build-json-document.js',
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
  },
})
