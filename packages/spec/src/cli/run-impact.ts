import { impact } from '../impact.js'
import { loadProductSpec } from '../load.js'

export async function runImpact(cwd: string, target: string): Promise<number> {
  const { resolveOnespecDir } = await import('./resolve-onespec-dir.js')
  const spec = await loadProductSpec(resolveOnespecDir(cwd))
  const result = impact(spec, target)
  console.log(JSON.stringify(result, null, 2))
  return 0
}
