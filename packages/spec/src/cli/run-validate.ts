import { loadProductSpec } from '../load.js'
import { validateProductSpec } from '../validate.js'

export async function runValidate(cwd: string): Promise<number> {
  const { resolveStoryboardDir } = await import('./resolve-storyboard-dir.js')
  const spec = await loadProductSpec(resolveStoryboardDir(cwd))
  const result = validateProductSpec(spec)
  for (const e of result.errors) console.error(`error: ${e.message}`)
  for (const w of result.warnings) console.warn(`warn: ${w.message}`)
  if (result.ok) {
    console.log('storyboard validate: ok')
    return 0
  }
  return 1
}
