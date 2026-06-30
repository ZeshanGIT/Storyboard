import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadProductSpec } from '../load.js'
import { validateProductSpec } from '../validate.js'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('validateProductSpec', () => {
  it('passes todo fixture', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const result = validateProductSpec(spec)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('errors when SR in spec missing from requirements', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const broken = {
      ...spec,
      requirements: {
        ...spec.requirements,
        structural: { ...spec.requirements.structural },
      },
    }
    delete (broken.requirements.structural as Record<string, unknown>)['SR-001']
    const result = validateProductSpec(broken)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.code === 'SR_MISSING_DEFINITION')).toBe(true)
  })
})
