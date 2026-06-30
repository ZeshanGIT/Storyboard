import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveStoryboardDir } from '@storyboard/shell/detect-mode'

export function resolveProjectPaths(cwd: string) {
  const storyboardDir = resolveStoryboardDir(cwd)
  if (!existsSync(join(storyboardDir, 'spec.json'))) {
    throw new Error(`No storyboard/spec.json found under ${cwd}`)
  }
  return { cwd, storyboardDir }
}
