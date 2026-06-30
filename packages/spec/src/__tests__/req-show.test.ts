import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadProductSpec } from '../load.js'
import { showReq } from '../req-show.js'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('showReq', () => {
  it('shows SR description and placements', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const text = showReq(spec, 'SR-011')
    expect(text).toContain('SR-011')
    expect(text).toContain('home')
  })

  it('pretty-prints BR definition tree', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const text = showReq(spec, 'BR-PASSWORD-VALIDATE')
    expect(text).toContain('"description": "Password must meet policy"')
    expect(text).toContain('"MIN-LEN"')
  })
})
