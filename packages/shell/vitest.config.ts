import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@shell\/(.*)/, replacement: `${path.resolve(__dirname, './src')}/$1` },
      { find: /^@\/(.*)/, replacement: `${path.resolve(__dirname, '../../src')}/$1` },
      {
        find: 'virtual:wireframe-codegen-state',
        replacement: path.resolve(__dirname, '../../src/test/codegen-state-mock.ts'),
      },
    ],
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
