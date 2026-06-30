import { isStructuralReqId } from './sr-id'
import type { StructuralReqId, WireframeSpec } from './types'

export type SrPlacement = { screenId: string; path?: string }

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

export function collectSrPlacements(wireframe: WireframeSpec): Map<StructuralReqId, SrPlacement[]> {
  const placements = new Map<StructuralReqId, SrPlacement[]>()
  for (const [screenId, screen] of Object.entries(wireframe.screens)) {
    if (screen.sr !== undefined && isStructuralReqId(screen.sr)) {
      addPlacement(placements, screen.sr, { screenId })
    }
    walkNodesForPlacements(screen.nodes, screenId, placements)
  }
  return placements
}

function addPlacement(
  placements: Map<StructuralReqId, SrPlacement[]>,
  srId: StructuralReqId,
  placement: SrPlacement,
): void {
  const existing = placements.get(srId) ?? []
  existing.push(placement)
  placements.set(srId, existing)
}

function walkNodesForPlacements(
  nodes: unknown[],
  screenId: string,
  placements: Map<StructuralReqId, SrPlacement[]>,
): void {
  for (const raw of nodes) {
    if (!Array.isArray(raw) || raw.length < 1) continue
    if (typeof raw[1] === 'string' && isStructuralReqId(raw[1])) {
      addPlacement(placements, raw[1], { screenId })
      parseNodeChildrenWithSrForPlacements(raw, screenId, placements)
    } else {
      parseNodeChildrenNoSrForPlacements(raw, screenId, placements)
    }
  }
}

function parseNodeChildrenWithSrForPlacements(
  raw: unknown[],
  screenId: string,
  placements: Map<StructuralReqId, SrPlacement[]>,
): void {
  for (let i = 2; i < raw.length; i += 1) {
    const part = raw[i]
    if (Array.isArray(part)) walkNodesForPlacements(part, screenId, placements)
  }
}

function parseNodeChildrenNoSrForPlacements(
  raw: unknown[],
  screenId: string,
  placements: Map<StructuralReqId, SrPlacement[]>,
): void {
  for (let i = 1; i < raw.length; i += 1) {
    const part = raw[i]
    if (Array.isArray(part)) walkNodesForPlacements(part, screenId, placements)
  }
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
