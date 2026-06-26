import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { wireframePlugin } from './src/plugin/wireframe-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wireframePlugin(),
    { enforce: 'pre', ...mdx() },
    react({
      include: /\.(jsx|js|mdx|md|tsx|ts)$/,
    }),
    tailwindcss(),
  ],
})
