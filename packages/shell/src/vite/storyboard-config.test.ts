import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { defineStoryboardConfig } from './storyboard-config'

describe('defineStoryboardConfig', () => {
  it('sets root and plugins for json mode', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-cfg-'))
    mkdirSync(join(root, 'storyboard'), { recursive: true })
    writeFileSync(join(root, 'storyboard', 'spec.json'), '{"title":"T","screens":[]}')
    const config = defineStoryboardConfig({ root })
    expect(config.root).toBe(root)
    expect(config.plugins?.length).toBeGreaterThan(0)
  })
})
