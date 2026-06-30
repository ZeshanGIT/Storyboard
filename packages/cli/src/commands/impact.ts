import { impact, loadProductSpec } from '@storyboard/spec'
import { resolveProjectPaths } from '../resolve-project.js'

export async function runImpact(opts: { cwd: string; target: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const result = impact(spec, opts.target)
  console.log(JSON.stringify(result, null, 2))
  return 0
}
