import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveOnespecDir } from '@onespec-dev/shell/detect-mode'

export function resolveProjectPaths(cwd: string) {
  const onespecDir = resolveOnespecDir(cwd)
  if (!existsSync(join(onespecDir, 'spec.json'))) {
    throw new Error(`No onespec/spec.json found under ${cwd}`)
  }
  return { cwd, onespecDir }
}
