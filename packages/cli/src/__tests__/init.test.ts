import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runInit } from '../commands/init.js'

function collectFiles(dir: string, base = ''): Record<string, string> {
  const files: Record<string, string> = {}
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const rel = base ? `${base}/${name}` : name
    if (statSync(path).isDirectory()) {
      Object.assign(files, collectFiles(path, rel))
    } else {
      files[rel] = readFileSync(path, 'utf8')
    }
  }
  return files
}

describe('runInit cloud', () => {
  it('scaffolds todo-poc/ with app stub and design docs', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'sb-cloud-'))
    await runInit({ cwd, template: 'cloud' })
    await expect(access(join(cwd, 'todo-poc', 'onespec', 'spec.json'))).resolves.toBeUndefined()
    await expect(access(join(cwd, 'todo-poc', 'DESIGN.md'))).resolves.toBeUndefined()
    await expect(access(join(cwd, 'todo-poc', 'ARCHITECTURE.md'))).resolves.toBeUndefined()
    await expect(access(join(cwd, 'todo-poc', 'app', 'README.md'))).resolves.toBeUndefined()
  })
})

describe('runInit embedded', () => {
  it('scaffolds onespec/ and sample mdx', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'sb-init-'))
    await runInit({ cwd, template: 'embedded' })
    await expect(access(join(cwd, 'onespec', 'spec.json'))).resolves.toBeUndefined()
    await expect(access(join(cwd, 'src', 'content', 'onespec.mdx'))).resolves.toBeUndefined()
    expect(collectFiles(cwd)).toMatchSnapshot()
  })

  it('aborts when onespec/ already exists', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'sb-init-dup-'))
    mkdirSync(join(cwd, 'onespec'), { recursive: true })
    writeFileSync(join(cwd, 'onespec', 'spec.json'), '{}')
    await expect(runInit({ cwd, template: 'embedded' })).rejects.toThrow(
      'onespec/ already exists — aborting init',
    )
  })
})
