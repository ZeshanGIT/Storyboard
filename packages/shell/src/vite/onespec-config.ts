import { existsSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import type { UserConfig } from 'vite'
import { mdxVitePlugin } from '../plugin/mdx-vite-plugin'
import { wireframePlugin } from '../plugin/wireframe-plugin'
import { detectStoryboardMode } from './detect-mode'

export type OnespecConfigOptions = {
  root: string
  port?: number
  onespecDir?: string
}

export function defineOnespecConfig(options: OnespecConfigOptions): UserConfig {
  const mode = detectStoryboardMode(options.root)
  const templateRoot = path.resolve(import.meta.dirname, '../../template')
  const shellRoot = path.resolve(import.meta.dirname, '../..')
  const workspaceRoot = path.resolve(shellRoot, '../..')
  const consumerApp = path.join(options.root, '.onespec', 'OnespecApp.tsx')
  const onespecApp = existsSync(consumerApp)
    ? consumerApp
    : path.join(templateRoot, 'OnespecApp.tsx')

  const plugins = [
    {
      name: 'onespec-codegen-state',
      resolveId(id: string) {
        if (id === 'virtual:wireframe-codegen-state') return '\0wireframe-codegen-state'
        return undefined
      },
      load(id: string) {
        if (id === '\0wireframe-codegen-state') {
          return 'export const codegenErrors = []; export const codegenError = null;'
        }
        return undefined
      },
    },
    ...(mode === 'mdx' ? [wireframePlugin()] : []),
    {
      enforce: 'pre' as const,
      ...mdxVitePlugin({
        providerImportSource: path.resolve(templateRoot, 'mdx-components.ts'),
        remarkPlugins: [remarkFrontmatter],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ]

  return {
    root: templateRoot,
    envDir: options.root,
    define: {
      'import.meta.env.ONESPEC_ROOT': JSON.stringify(options.root),
    },
    plugins,
    server: {
      port: options.port ?? 5173,
      fs: {
        allow: [options.root, templateRoot, path.join(templateRoot, '..')],
      },
    },
    resolve: {
      alias: [
        { find: '@onespec-app', replacement: onespecApp },
        { find: '@onespec/template', replacement: templateRoot },
        { find: '@onespec-dev/shell', replacement: path.join(shellRoot, 'src/client.ts') },
        { find: /^@shell\/(.*)/, replacement: `${path.join(shellRoot, 'src')}/$1` },
        { find: /^@\/(.*)/, replacement: `${path.join(workspaceRoot, 'src')}/$1` },
      ],
    },
  }
}
