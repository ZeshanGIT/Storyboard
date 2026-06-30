import { loadProductSpec } from '../load.js'
import { showReq } from '../req-show.js'

export async function runReqShow(cwd: string, id: string): Promise<number> {
  const { resolveOnespecDir } = await import('./resolve-onespec-dir.js')
  const spec = await loadProductSpec(resolveOnespecDir(cwd))
  const output = showReq(spec, id)
  console.log(output)
  return 0
}
