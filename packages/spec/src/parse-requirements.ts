import { isBehavioralReqId, isStructuralReqId } from './sr-id.js'
import type { ReqDefinition, RequirementsFile } from './types.js'

export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string }

function parseReqDefinition(raw: unknown, path: string): ParseResult<ReqDefinition> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, message: `${path}: must be an object` }
  }
  const record = raw as Record<string, unknown>
  if (typeof record.description !== 'string' || record.description.length === 0) {
    return { ok: false, message: `${path}: description is required` }
  }
  const def: ReqDefinition = { description: record.description }
  if (record.children !== undefined) {
    if (
      typeof record.children !== 'object' ||
      record.children === null ||
      Array.isArray(record.children)
    ) {
      return { ok: false, message: `${path}.children: must be an object` }
    }
    const children: Record<string, ReqDefinition> = {}
    for (const [key, child] of Object.entries(record.children as Record<string, unknown>)) {
      const parsed = parseReqDefinition(child, `${path}.children.${key}`)
      if (!parsed.ok) return parsed
      children[key] = parsed.value
    }
    return { ok: true, value: { ...def, children } }
  }
  return { ok: true, value: def }
}

export function parseRequirementsFile(raw: unknown): ParseResult<RequirementsFile> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, message: 'requirements.json must be an object' }
  }
  const record = raw as Record<string, unknown>
  const structuralRaw = record.structural
  const behavioralRaw = record.behavioral
  if (typeof structuralRaw !== 'object' || structuralRaw === null || Array.isArray(structuralRaw)) {
    return { ok: false, message: 'structural must be an object' }
  }
  if (typeof behavioralRaw !== 'object' || behavioralRaw === null || Array.isArray(behavioralRaw)) {
    return { ok: false, message: 'behavioral must be an object' }
  }

  const structural: Record<string, ReqDefinition> = {}
  for (const [id, def] of Object.entries(structuralRaw as Record<string, unknown>)) {
    if (!isStructuralReqId(id)) {
      return { ok: false, message: `structural key must be SR id, got ${id}` }
    }
    const parsed = parseReqDefinition(def, `structural.${id}`)
    if (!parsed.ok) return parsed
    structural[id] = parsed.value
  }

  const behavioral: Record<string, ReqDefinition> = {}
  for (const [id, def] of Object.entries(behavioralRaw as Record<string, unknown>)) {
    if (!isBehavioralReqId(id)) {
      return { ok: false, message: `behavioral key must be BR id, got ${id}` }
    }
    const parsed = parseReqDefinition(def, `behavioral.${id}`)
    if (!parsed.ok) return parsed
    behavioral[id] = parsed.value
  }

  return { ok: true, value: { structural, behavioral } }
}
