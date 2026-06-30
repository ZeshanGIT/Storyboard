import { isStructuralReqId } from './sr-id'
import type { StructuralReqId, WireframeSpec } from './types'

export function listScreenIds(wireframe: WireframeSpec): Set<string> {
  return new Set(Object.keys(wireframe.screens))
}

export function collectSrIds(wireframe: WireframeSpec): Set<StructuralReqId> {
  const ids = new Set<StructuralReqId>()
  for (const screen of Object.values(wireframe.screens)) {
    if (screen.sr !== undefined && isStructuralReqId(screen.sr)) {
      ids.add(screen.sr)
    }
    walkNodes(screen.nodes, ids)
  }
  return ids
}

function walkNodes(nodes: unknown[], ids: Set<StructuralReqId>): void {
  for (const raw of nodes) {
    if (!Array.isArray(raw) || raw.length < 1) continue
    if (typeof raw[1] === 'string' && isStructuralReqId(raw[1])) {
      ids.add(raw[1])
      parseNodeChildrenWithSr(raw, ids)
    } else {
      parseNodeChildrenNoSr(raw, ids)
    }
  }
}

function parseNodeChildrenWithSr(raw: unknown[], ids: Set<StructuralReqId>): void {
  for (let i = 2; i < raw.length; i += 1) {
    const part = raw[i]
    if (Array.isArray(part)) walkNodes(part, ids)
    else if (typeof part === 'object' && part !== null && !Array.isArray(part)) {
      // props only — no nested walk
    }
  }
}

function parseNodeChildrenNoSr(raw: unknown[], ids: Set<StructuralReqId>): void {
  for (let i = 1; i < raw.length; i += 1) {
    const part = raw[i]
    if (Array.isArray(part)) walkNodes(part, ids)
  }
}
