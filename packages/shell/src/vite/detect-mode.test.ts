import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectOnespecMode, resolveOnespecDir } from './detect-mode.js'

describe('resolveOnespecDir', () => {
  it('resolveOnespecDir returns join(root, "onespec")', () => {
    expect(resolveOnespecDir('/tmp/app')).toBe('/tmp/app/onespec')
  })
})

describe('detectOnespecMode', () => {
  it('returns json when only onespec/spec.json exists', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-json-'))
    mkdirSync(join(root, 'onespec'), { recursive: true })
    writeFileSync(join(root, 'onespec', 'spec.json'), '{}')
    expect(detectOnespecMode(root)).toBe('json')
  })

  it('returns mdx when src/content has mdx files', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-mdx-'))
    mkdirSync(join(root, 'src', 'content'), { recursive: true })
    writeFileSync(join(root, 'src', 'content', 'app.mdx'), '---\ntitle: App\n---\n')
    expect(detectOnespecMode(root)).toBe('mdx')
  })
})
