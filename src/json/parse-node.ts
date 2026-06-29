import { parseTag } from './parse-tag'
import { JsonBuildError, type JsonNode, type JsonProps } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

  if (raw.length < 1 || raw.length > 3) {
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
