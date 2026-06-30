import type { BehavioralReqId, ReqPath, StructuralReqId } from './types.js'

const SR_PATTERN = /^SR-[A-Z0-9-]+$/
const BR_PATTERN = /^BR-[A-Z0-9-]+$/
const NAMED_CHILD = /^[A-Z][A-Z0-9-]*$/
const NUMERIC_CHILD = /^[0-9]+$/

export function isStructuralReqId(value: string): value is StructuralReqId {
  return SR_PATTERN.test(value)
}

export function isBehavioralReqId(value: string): value is BehavioralReqId {
  return BR_PATTERN.test(value)
}

export function isNamedChildKey(key: string): boolean {
  return NAMED_CHILD.test(key)
}

export function isNumericChildKey(key: string): boolean {
  return NUMERIC_CHILD.test(key)
}

export function parseReqPath(path: string): ReqPath {
  const [parentId, ...segments] = path.split('/')
  if (!isBehavioralReqId(parentId)) {
    throw new Error(`Invalid behavioral req path: ${path}`)
  }
  return { parentId, segments }
}
