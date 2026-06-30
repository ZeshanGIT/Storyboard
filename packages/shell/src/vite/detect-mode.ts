import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function resolveStoryboardDir(root: string): string {
  return join(root, 'storyboard')
}

export function detectStoryboardMode(root: string): 'mdx' | 'json' {
  const contentDir = join(root, 'src', 'content')
  if (existsSync(contentDir)) {
    const hasMdx = readdirSync(contentDir).some((name) => name.endsWith('.mdx'))
    if (hasMdx) return 'mdx'
  }
  return 'json'
}
