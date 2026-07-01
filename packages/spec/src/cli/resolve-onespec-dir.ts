import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function resolveOnespecDir(cwd: string): string {
  const dir = join(cwd, 'onespec')
  if (!existsSync(join(dir, 'spec.json'))) {
    throw new Error(`No onespec/spec.json under ${cwd}`)
  }
  return dir
}
