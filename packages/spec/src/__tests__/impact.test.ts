import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { impact } from '../impact.js'
import { loadProductSpec } from '../load.js'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('impact', () => {
  it('lists bindings for shared BR', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const result = impact(spec, 'BR-PASSWORD-VALIDATE')
    expect(result.bindings.length).toBeGreaterThan(0)
    expect(result.screens).toContain('edit-task')
    expect(result.srs).toContain('SR-020')
  })

  it('lists all BRs bound to a screen', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const result = impact(spec, 'home')
    expect(result.bindings.length).toBe(4)
    expect(result.bindings.map((b) => b.brId).sort()).toEqual([
      'BR-001',
      'BR-002',
      'BR-003',
      'BR-004',
    ])
  })
})
