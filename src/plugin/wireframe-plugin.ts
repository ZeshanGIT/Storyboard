import { readFile } from 'node:fs/promises'
import type { Plugin } from 'vite'
import { runCodegen } from './codegen'
import { resolveGeneratedDir, resolveWireframePath, WIREFRAME_MDX } from './paths'
import { wireframePluginState } from './plugin-state'

export type WireframePluginState = {
  lastError: typeof wireframePluginState.lastError
}

export function wireframePlugin(): Plugin {
  let root = process.cwd()

  async function regenerate(): Promise<boolean> {
    const mdxPath = resolveWireframePath(root)
    const outDir = resolveGeneratedDir(root)

    let source: string
    try {
      source = await readFile(mdxPath, 'utf8')
    } catch {
      wireframePluginState.lastError = null
      console.warn(`[wireframe] No wireframe MDX at ${WIREFRAME_MDX} — skipping codegen`)
      return false
    }

    const result = await runCodegen(source, outDir)
    if (!result.ok) {
      wireframePluginState.lastError = result.error
      console.error(`[wireframe] Codegen failed: ${result.error.message}`)
      return false
    }

    wireframePluginState.lastError = null
    console.log(`[wireframe] Generated ${result.screens.length} screen(s)`)
    return true
  }

  return {
    name: 'wireframe-codegen',
    enforce: 'pre',

    configResolved(config) {
      root = config.root
    },

    async buildStart() {
      await regenerate()
    },

    async handleHotUpdate({ file, server }) {
      if (!file.endsWith('.mdx') || !file.includes('/content/')) {
        return
      }
      const ok = await regenerate()
      if (!ok) return

      const generatedDir = resolveGeneratedDir(root)
      const modules = [
        ...(server.moduleGraph.getModulesByFile(`${generatedDir}/screens.generated.tsx`) ?? []),
        ...(server.moduleGraph.getModulesByFile(`${generatedDir}/routes.generated.tsx`) ?? []),
        ...(server.moduleGraph.getModulesByFile(`${generatedDir}/screens-map.generated.ts`) ?? []),
      ]
      for (const mod of modules) {
        server.moduleGraph.invalidateModule(mod)
      }
      server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
