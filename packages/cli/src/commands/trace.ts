import { join } from 'node:path'
import { loadProductSpec, traceReq } from '@storyboard/spec'
import { resolveProjectPaths } from '../resolve-project.js'

export async function runTrace(opts: { cwd: string; target: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const implRoot = join(opts.cwd, 'src')
  const result = await traceReq(spec, opts.target, { implRoot })
  console.log(JSON.stringify(result, null, 2))
  return 0
}
