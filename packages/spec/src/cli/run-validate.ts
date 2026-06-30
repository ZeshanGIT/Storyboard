import { loadProductSpec } from '../load.js'
import { validateProductSpec } from '../validate.js'

export async function runValidate(cwd: string): Promise<number> {
  const { resolveOnespecDir } = await import('./resolve-onespec-dir.js')
  const spec = await loadProductSpec(resolveOnespecDir(cwd))
  const result = validateProductSpec(spec)
  for (const e of result.errors) console.error(`error: ${e.message}`)
  for (const w of result.warnings) console.warn(`warn: ${w.message}`)
  if (result.ok) {
    console.log('onespec validate: ok')
    return 0
  }
  return 1
}
