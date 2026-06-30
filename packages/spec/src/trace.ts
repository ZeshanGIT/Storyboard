import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { isBehavioralReqId, isStructuralReqId } from './sr-id.js'
import type { ProductSpec, TraceMatch, TraceResult } from './types.js'

const execFileAsync = promisify(execFile)

const RG_NOT_FOUND = 'ripgrep (rg) is required for traceReq but was not found on PATH'

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildPattern(target: string): string {
  if (target.includes('__')) {
    return escapeRegexLiteral(target)
  }
  if (isStructuralReqId(target)) {
    const id = escapeRegexLiteral(target)
    return `sb-req=["']${id}["']`
  }
  const parentId = target.split('/')[0] ?? ''
  if (isBehavioralReqId(parentId)) {
    return `@sb-req:\\s*${escapeRegexLiteral(target)}`
  }
  throw new Error(`Unknown trace target: ${target}`)
}

type RgJsonLine = {
  type: string
  data?: {
    path?: { text?: string }
    lines?: { text?: string }
    line_number?: number
    submatches?: { start?: number }[]
  }
}

export function parseRgJson(stdout: string): TraceMatch[] {
  const matches: TraceMatch[] = []
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue
    let parsed: RgJsonLine
    try {
      parsed = JSON.parse(line) as RgJsonLine
    } catch {
      continue
    }
    if (parsed.type !== 'match' || !parsed.data) continue
    const { path, lines, line_number, submatches } = parsed.data
    if (!path?.text || line_number === undefined || !lines?.text) continue
    matches.push({
      file: path.text,
      line: line_number,
      column: (submatches?.[0]?.start ?? 0) + 1,
      text: lines.text.replace(/\n$/, ''),
    })
  }
  return matches
}

export async function traceReq(
  _spec: ProductSpec,
  target: string,
  opts: { implRoot: string; testRoot?: string },
): Promise<TraceResult> {
  const root = target.includes('__') ? (opts.testRoot ?? opts.implRoot) : opts.implRoot
  const pattern = buildPattern(target)

  try {
    const { stdout } = await execFileAsync('rg', ['--json', '-n', pattern, root], {
      maxBuffer: 10 * 1024 * 1024,
    })
    return { target, matches: parseRgJson(stdout) }
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException & { code?: number | string; stdout?: string }
    if (error.code === 'ENOENT') {
      throw new Error(RG_NOT_FOUND)
    }
    if (typeof error.code === 'number' && error.code === 1 && error.stdout) {
      return { target, matches: parseRgJson(error.stdout) }
    }
    throw err
  }
}
