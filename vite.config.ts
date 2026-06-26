import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { wireframePlugin } from './src/plugin/wireframe-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wireframePlugin(),
    {
      enforce: 'pre',
      ...mdx({
        // MDX files live in src/content/; resolves to src/mdx-components.ts
        providerImportSource: '../mdx-components.ts',
      }),
    },
    react({
      include: /\.(jsx|js|mdx|md|tsx|ts)$/,
    }),
    tailwindcss(),
  ],
})
