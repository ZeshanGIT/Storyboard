import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function resolveStoryboardDir(cwd: string): string {
  const dir = join(cwd, 'storyboard')
  if (!existsSync(join(dir, 'spec.json'))) {
    throw new Error(`No storyboard/spec.json under ${cwd}`)
  }
  return dir
}
