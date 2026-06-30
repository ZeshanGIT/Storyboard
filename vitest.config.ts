import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shell': path.resolve(__dirname, './packages/shell/src'),
      '@storyboard/shell': path.resolve(__dirname, './packages/shell/src/index.ts'),
      'virtual:wireframe-codegen-state': path.resolve(
        __dirname,
        './src/test/codegen-state-mock.ts',
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
