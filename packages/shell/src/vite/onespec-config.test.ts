import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { defineOnespecConfig } from './onespec-config'

describe('defineOnespecConfig', () => {
  it('sets root and plugins for json mode', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-cfg-'))
    mkdirSync(join(root, 'onespec'), { recursive: true })
    writeFileSync(join(root, 'onespec', 'spec.json'), '{"title":"T","screens":[]}')
    const config = defineOnespecConfig({ root })
    expect(config.root).toContain('template')
    expect(config.define?.['import.meta.env.ONESPEC_ROOT']).toBe(JSON.stringify(root))
    expect(config.plugins?.length).toBeGreaterThan(0)
  })
})
