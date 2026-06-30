import type { Plugin, ViteDevServer } from 'vite'
import { resolveGeneratedDir } from './paths'
import { wireframePluginState } from './plugin-state'
import { runFullCodegen } from './run-full-codegen'

export type WireframePluginState = {
  lastErrors: typeof wireframePluginState.lastErrors
}

export const WIREFRAME_CODEGEN_STATE_MODULE = 'virtual:wireframe-codegen-state'
const RESOLVED_WIREFRAME_CODEGEN_STATE_MODULE = `\0${WIREFRAME_CODEGEN_STATE_MODULE}`

function serializeCodegenErrors(): string {
  if (wireframePluginState.lastErrors.length === 0) return '[]'
  return JSON.stringify(
    wireframePluginState.lastErrors.map((error) => ({
      code: error.code,
      message: error.message,
      screenId: error.screenId ?? null,
    })),
  )
}

function loadCodegenStateModule(): string {
  const serialized = serializeCodegenErrors()
  return `export const codegenErrors = ${serialized}\nexport const codegenError = codegenErrors[0] ?? null\n`
}

function invalidateCodegenStateModule(server: ViteDevServer): void {
  const mod = server.moduleGraph.getModuleById(RESOLVED_WIREFRAME_CODEGEN_STATE_MODULE)
  if (mod) {
    server.moduleGraph.invalidateModule(mod)
  }
}

export function wireframePlugin(): Plugin {
  let root = process.cwd()

  async function regenerate(): Promise<boolean> {
    const result = await runFullCodegen(root)
    if (!result.ok) {
      wireframePluginState.lastErrors = result.errors
      for (const error of result.errors) {
        console.error(`[wireframe] Codegen failed: ${error.message}`)
      }
      return false
    }

    wireframePluginState.lastErrors = []
    console.log(`[wireframe] Generated ${result.screens.length} screen(s)`)
    return true
  }

  return {
    name: 'wireframe-codegen',
    enforce: 'pre',

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === WIREFRAME_CODEGEN_STATE_MODULE) {
        return RESOLVED_WIREFRAME_CODEGEN_STATE_MODULE
      }
    },

    load(id) {
      if (id === RESOLVED_WIREFRAME_CODEGEN_STATE_MODULE) {
        return loadCodegenStateModule()
      }
    },

    async buildStart() {
      await regenerate()
    },

    async handleHotUpdate({ file, server }) {
      if (!file.endsWith('.mdx') || !file.includes('/content/')) {
        return
      }
      const ok = await regenerate()
      invalidateCodegenStateModule(server)

      if (!ok) {
        server.ws.send({ type: 'full-reload' })
        return []
      }

      const generatedDir = resolveGeneratedDir(root)
      const modules = [
        ...(server.moduleGraph.getModulesByFile(`${generatedDir}/routes.generated.tsx`) ?? []),
        ...(server.moduleGraph.getModulesByFile(
          `${generatedDir}/content-documents.generated.tsx`,
        ) ?? []),
      ]
      for (const mod of modules) {
        server.moduleGraph.invalidateModule(mod)
      }
      server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
