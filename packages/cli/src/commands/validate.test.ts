import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runValidate } from './validate.js'

const FIXTURE = join(import.meta.dirname, '../../../spec/src/__tests__/fixtures/todo')

describe('runValidate', () => {
  it('returns 0 for valid todo fixture', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'sb-val-'))
    mkdirSync(join(cwd, 'storyboard'), { recursive: true })
    for (const file of ['spec.json', 'requirements.json', 'bindings.json']) {
      writeFileSync(join(cwd, 'storyboard', file), readFileSync(join(FIXTURE, file), 'utf8'))
    }
    const code = await runValidate({ cwd })
    expect(code).toBe(0)
  })
})
