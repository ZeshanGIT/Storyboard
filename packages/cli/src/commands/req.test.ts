import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runReqShow } from './req.js'

const FIXTURE = join(import.meta.dirname, '../../../spec/src/__tests__/fixtures/todo')

function scaffoldTodoFixture(cwd: string): void {
  mkdirSync(join(cwd, 'onespec'), { recursive: true })
  for (const file of ['spec.json', 'requirements.json', 'bindings.json']) {
    writeFileSync(join(cwd, 'onespec', file), readFileSync(join(FIXTURE, file), 'utf8'))
  }
}

describe('runReqShow', () => {
  it('prints SR-011 for todo fixture', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'sb-req-'))
    scaffoldTodoFixture(cwd)
    const logs: string[] = []
    const spy = console.log
    console.log = (msg: string) => {
      logs.push(msg)
    }
    try {
      const code = await runReqShow({ cwd, id: 'SR-011' })
      expect(code).toBe(0)
      expect(logs.join('\n')).toContain('SR-011')
      expect(logs.join('\n')).toContain('Add task input')
    } finally {
      console.log = spy
    }
  })
})
