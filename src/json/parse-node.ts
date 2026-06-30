import { parseTag } from './parse-tag'
import { JsonBuildError, type JsonNode, type JsonProps } from './types'

const SR_PATTERN = /^SR-[A-Z0-9-]+$/

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSrSlot(value: unknown): value is string {
  return typeof value === 'string' && SR_PATTERN.test(value)
}

function normalizeProps(value: unknown): JsonProps {
  if (!isPlainObject(value)) {
    throw new JsonBuildError('INVALID_NODE', 'Props must be a plain object')
  }
  return value
}

export function parseJsonNode(raw: unknown): JsonNode {
  if (!Array.isArray(raw)) {
    throw new JsonBuildError('INVALID_NODE', 'Node must be a tuple array')
  }

  const hasSrSlot = raw.length >= 2 && isSrSlot(raw[1])
  const maxLength = hasSrSlot ? 4 : 3

  if (raw.length < 1 || raw.length > maxLength) {
    throw new JsonBuildError('INVALID_NODE', 'Node tuple must have 1–3 elements')
  }

  const tagRaw = raw[0]
  if (typeof tagRaw !== 'string') {
    throw new JsonBuildError('INVALID_NODE', 'Node tag must be a string')
  }

  const tag = parseTag(tagRaw)

  if (raw.length === 1) {
    return { tag, props: {} }
  }

  if (hasSrSlot) {
    const sr = raw[1]
    const rest = raw.slice(2)
    if (rest.length === 0) return { tag, sr, props: {} }
    if (typeof rest[0] === 'string') return { tag, sr, props: {}, children: rest[0] }
    if (isPlainObject(rest[0])) {
      const props = normalizeProps(rest[0])
      if (rest.length === 1) return { tag, sr, props }
      return { tag, sr, props, children: parseChildren(rest[1]) }
    }
    if (Array.isArray(rest[0])) return { tag, sr, props: {}, children: parseChildren(rest[0]) }
    throw new JsonBuildError('INVALID_NODE', 'Invalid tuple after SR id')
  }

  const second = raw[1]
  if (isPlainObject(second)) {
    const props = normalizeProps(second)
    if (raw.length === 2) {
      return { tag, props }
    }
    return { tag, props, children: parseChildren(raw[2]) }
  }

  return { tag, props: {}, children: parseChildren(second) }
}

function parseChildren(raw: unknown): readonly JsonNode[] | string {
  if (typeof raw === 'string') {
    return raw
  }

  if (!Array.isArray(raw)) {
    throw new JsonBuildError('INVALID_NODE', 'Children must be a string or node array')
  }

  return raw.map((child) => parseJsonNode(child))
}
