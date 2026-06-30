import { existsSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import type { UserConfig } from 'vite'
import { mdxVitePlugin } from '../plugin/mdx-vite-plugin'
import { wireframePlugin } from '../plugin/wireframe-plugin'
import { detectStoryboardMode } from './detect-mode'

export type StoryboardConfigOptions = {
  root: string
  port?: number
  storyboardDir?: string
}

export function defineStoryboardConfig(options: StoryboardConfigOptions): UserConfig {
  const mode = detectStoryboardMode(options.root)
  const templateRoot = path.resolve(import.meta.dirname, '../../template')
  const shellRoot = path.resolve(import.meta.dirname, '../..')
  const workspaceRoot = path.resolve(shellRoot, '../..')
  const consumerApp = path.join(options.root, '.storyboard', 'StoryboardApp.tsx')
  const storyboardApp = existsSync(consumerApp)
    ? consumerApp
    : path.join(templateRoot, 'StoryboardApp.tsx')

  const plugins = [
    {
      name: 'storyboard-codegen-state',
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
      'import.meta.env.STORYBOARD_ROOT': JSON.stringify(options.root),
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
        { find: '@storyboard-app', replacement: storyboardApp },
        { find: '@onespec-dev/template', replacement: templateRoot },
        { find: '@onespec-dev/shell', replacement: path.join(shellRoot, 'src/client.ts') },
        { find: /^@shell\/(.*)/, replacement: `${path.join(shellRoot, 'src')}/$1` },
        { find: /^@\/(.*)/, replacement: `${path.join(workspaceRoot, 'src')}/$1` },
      ],
    },
  }
}
