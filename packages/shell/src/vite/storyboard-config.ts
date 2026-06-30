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

  const plugins = [
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
    root: options.root,
    plugins,
    server: { port: options.port ?? 5173 },
    resolve: {
      alias: {
        '@storyboard-app': path.join(options.root, '.storyboard', 'StoryboardApp.tsx'),
        '@storyboard/template': templateRoot,
      },
    },
  }
}
