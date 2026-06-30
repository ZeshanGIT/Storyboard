import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import { defineConfig } from 'vite'
import { mdxVitePlugin } from './packages/shell/src/plugin/mdx-vite-plugin'
import { wireframePlugin } from './packages/shell/src/plugin/wireframe-plugin'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const pagesBase = process.env.GITHUB_PAGES === 'true' && repoName ? `/${repoName}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base: pagesBase,
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shell': path.resolve(__dirname, './packages/shell/src'),
      '@onespec-dev/shell': path.resolve(__dirname, './packages/shell/src/client.ts'),
    },
  },
  plugins: [
    wireframePlugin(),
    {
      enforce: 'pre',
      ...mdxVitePlugin({
        // MDX files live in src/content/; resolves to src/mdx-components.ts
        providerImportSource: '../mdx-components.ts',
        remarkPlugins: [remarkFrontmatter],
      }),
    },
    react({
      include: /\.(jsx|js|mdx|md|tsx|ts)$/,
    }),
    tailwindcss(),
  ],
})
