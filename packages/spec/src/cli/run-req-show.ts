import { loadProductSpec } from '../load.js'
import { showReq } from '../req-show.js'

export async function runReqShow(cwd: string, id: string): Promise<number> {
  const { resolveStoryboardDir } = await import('./resolve-storyboard-dir.js')
  const spec = await loadProductSpec(resolveStoryboardDir(cwd))
  const output = showReq(spec, id)
  console.log(output)
  return 0
}
