import { readFile } from 'node:fs/promises'
import { runCodegen } from './codegen'
import { resolveGeneratedDir, resolveWireframePath, WIREFRAME_MDX } from './paths'

const root = process.cwd()
const outDir = resolveGeneratedDir(root)

let source: string
try {
  source = await readFile(resolveWireframePath(root), 'utf8')
} catch {
  console.error(`[wireframe] No wireframe MDX at ${WIREFRAME_MDX}`)
  process.exit(1)
}

const result = await runCodegen(source, outDir)
if (!result.ok) {
  console.error(`[wireframe] Codegen failed: ${result.error.message}`)
  process.exit(1)
}

console.log(`[wireframe] Generated ${result.screens.length} screen(s)`)
