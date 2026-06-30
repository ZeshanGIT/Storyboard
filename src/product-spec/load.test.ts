import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadProductSpec } from './load'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('loadProductSpec', () => {
  it('loads todo trio after fixtures exist', async () => {
    const spec = await loadProductSpec(FIXTURE)
    expect(spec.wireframe.title).toBe('Todo App')
    expect(spec.requirements.structural['SR-001']).toBeDefined()
    expect(spec.bindings['BR-001']).toBeDefined()
  })
})
