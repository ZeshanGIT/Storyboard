import { join } from 'node:path'
import { loadProductSpec } from '../load'
import { traceReq } from '../trace'

export async function runTrace(cwd: string, target: string): Promise<number> {
  const { resolveStoryboardDir } = await import('./resolve-storyboard-dir')
  const spec = await loadProductSpec(resolveStoryboardDir(cwd))
  const implRoot = join(cwd, 'src')
  const result = await traceReq(spec, target, { implRoot })
  console.log(JSON.stringify(result, null, 2))
  return 0
}
