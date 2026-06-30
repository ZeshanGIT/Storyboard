import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectStoryboardMode } from './detect-mode.js'

describe('detectStoryboardMode', () => {
  it('returns json when only storyboard/spec.json exists', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-json-'))
    mkdirSync(join(root, 'storyboard'), { recursive: true })
    writeFileSync(join(root, 'storyboard', 'spec.json'), '{}')
    expect(detectStoryboardMode(root)).toBe('json')
  })

  it('returns mdx when src/content has mdx files', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-mdx-'))
    mkdirSync(join(root, 'src', 'content'), { recursive: true })
    writeFileSync(join(root, 'src', 'content', 'app.mdx'), '---\ntitle: App\n---\n')
    expect(detectStoryboardMode(root)).toBe('mdx')
  })
})
