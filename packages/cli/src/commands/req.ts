import { loadProductSpec, showReq } from '@onespec-dev/spec'
import { resolveProjectPaths } from '../resolve-project.js'

export async function runReqShow(opts: { cwd: string; id: string }): Promise<number> {
  const { onespecDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(onespecDir)
  const output = showReq(spec, opts.id)
  console.log(output)
  return 0
}
