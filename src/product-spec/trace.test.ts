import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadProductSpec } from './load'
import { buildPattern, parseRgJson, traceReq } from './trace'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

function rgAvailable(): boolean {
  try {
    execFileSync('rg', ['--version'])
    return true
  } catch {
    return false
  }
}

const hasRg = rgAvailable()

describe.skipIf(!hasRg)('traceReq', () => {
  it('finds sb-req attribute matches', async () => {
    const implRoot = mkdtempSync(join(tmpdir(), 'sb-trace-'))
    mkdirSync(join(implRoot, 'features'), { recursive: true })
    writeFileSync(
      join(implRoot, 'features', 'Home.tsx'),
      '<Input sb-req="SR-011" placeholder="Task" />\n',
    )
    const spec = await loadProductSpec(FIXTURE)
    const result = await traceReq(spec, 'SR-011', { implRoot })
    expect(result.matches.length).toBeGreaterThan(0)
    expect(result.matches[0].file).toContain('Home.tsx')
  })
})

if (!hasRg) {
  console.warn('Skipping traceReq tests: ripgrep (rg) not installed')
}

describe('buildPattern', () => {
  it('builds SR attribute pattern', () => {
    expect(buildPattern('SR-011')).toBe('sb-req=["\']SR-011["\']')
  })

  it('builds BR comment pattern', () => {
    expect(buildPattern('BR-001')).toBe('@sb-req:\\s*BR-001')
  })

  it('builds occurrence literal pattern', () => {
    expect(buildPattern('home__BR-001')).toBe('home__BR-001')
  })
})

describe('parseRgJson', () => {
  it('parses match lines from ripgrep --json output', () => {
    const stdout = [
      '{"type":"begin","data":{"path":{"text":"src/Home.tsx"}}}',
      '{"type":"match","data":{"path":{"text":"src/Home.tsx"},"lines":{"text":"<Input sb-req=\\"SR-011\\" />\\n"},"line_number":3,"absolute_offset":0,"submatches":[{"match":{"text":"sb-req=\\"SR-011\\""},"start":7,"end":22}]}}',
      '{"type":"end","data":{"path":{"text":"src/Home.tsx"}}}',
    ].join('\n')
    const matches = parseRgJson(stdout)
    expect(matches).toEqual([
      {
        file: 'src/Home.tsx',
        line: 3,
        column: 8,
        text: '<Input sb-req="SR-011" />',
      },
    ])
  })

  it('returns empty array for summary-only output', () => {
    const stdout =
      '{"data":{"elapsed_total":{"human":"0.008533s","nanos":8532583,"secs":0},"stats":{"bytes_printed":0,"bytes_searched":45,"elapsed":{"human":"0.000708s","nanos":707959,"secs":0},"matched_lines":0,"matches":0,"searches":1,"searches_with_match":0}},"type":"summary"}'
    expect(parseRgJson(stdout)).toEqual([])
  })
})
