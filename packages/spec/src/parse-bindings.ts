import type { ParseResult } from './parse-requirements.js'
import { isBehavioralReqId, isStructuralReqId } from './sr-id.js'
import type { Binding, BindingsFile } from './types.js'

export function parseBindingsFile(raw: unknown): ParseResult<BindingsFile> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, message: 'bindings.json must be an object' }
  }
  const bindings: Record<string, Binding[]> = {}
  for (const [brId, placements] of Object.entries(raw as Record<string, unknown>)) {
    if (!isBehavioralReqId(brId)) {
      return { ok: false, message: `bindings key must be BR id, got ${brId}` }
    }
    if (!Array.isArray(placements)) {
      return { ok: false, message: `bindings.${brId} must be an array` }
    }
    const parsed: Binding[] = []
    for (const entry of placements) {
      if (!Array.isArray(entry) || entry.length < 1 || entry.length > 2) {
        return { ok: false, message: `bindings.${brId}: each entry is [screen] or [screen, sr]` }
      }
      const screenId = entry[0]
      if (typeof screenId !== 'string' || screenId.length === 0) {
        return { ok: false, message: `bindings.${brId}: screen id must be a string` }
      }
      if (entry.length === 1) {
        parsed.push([screenId])
        continue
      }
      const srId = entry[1]
      if (typeof srId !== 'string' || !isStructuralReqId(srId)) {
        return { ok: false, message: `bindings.${brId}: sr must be SR id` }
      }
      parsed.push([screenId, srId])
    }
    bindings[brId] = parsed
  }
  return { ok: true, value: bindings }
}
