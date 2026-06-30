import { loadProductSpec } from '../load'
import { showReq } from '../req-show'

export async function runReqShow(cwd: string, id: string): Promise<number> {
  const { resolveStoryboardDir } = await import('./resolve-storyboard-dir')
  const spec = await loadProductSpec(resolveStoryboardDir(cwd))
  const output = showReq(spec, id)
  console.log(output)
  return 0
}
