import { impact } from '../impact.js'
import { loadProductSpec } from '../load.js'

export async function runImpact(cwd: string, target: string): Promise<number> {
  const { resolveStoryboardDir } = await import('./resolve-storyboard-dir.js')
  const spec = await loadProductSpec(resolveStoryboardDir(cwd))
  const result = impact(spec, target)
  console.log(JSON.stringify(result, null, 2))
  return 0
}
