import { loadProductSpec, showReq } from '@storyboard/spec'
import { resolveProjectPaths } from '../resolve-project.js'

export async function runReqShow(opts: { cwd: string; id: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const output = showReq(spec, opts.id)
  console.log(output)
  return 0
}
