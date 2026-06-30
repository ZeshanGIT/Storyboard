import { join } from 'node:path'
import { loadProductSpec } from '../load.js'
import { traceReq } from '../trace.js'

export async function runTrace(cwd: string, target: string): Promise<number> {
  const { resolveOnespecDir } = await import('./resolve-onespec-dir.js')
  const spec = await loadProductSpec(resolveOnespecDir(cwd))
  const implRoot = join(cwd, 'src')
  const result = await traceReq(spec, target, { implRoot })
  console.log(JSON.stringify(result, null, 2))
  return 0
}
