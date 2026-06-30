import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadProductSpec, validateProductSpec } from '../index.js'

const fixtures = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('loadProductSpec', () => {
  it('loads todo sample trio', async () => {
    const spec = await loadProductSpec(fixtures)
    const result = validateProductSpec(spec)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
