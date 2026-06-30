import { loadProductSpec, validateProductSpec } from '@onespec-dev/spec'
import { resolveProjectPaths } from '../resolve-project.js'

export async function runValidate(opts: { cwd: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const result = validateProductSpec(spec)
  for (const issue of result.errors) {
    console.error(`error: ${issue.message}`)
  }
  for (const issue of result.warnings) {
    console.warn(`warn: ${issue.message}`)
  }
  if (result.ok) {
    console.log('onespec validate: ok')
    return 0
  }
  return 1
}
