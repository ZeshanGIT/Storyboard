import { isBehavioralReqId } from './sr-id'
import type { BehavioralReqId, Binding, ImpactResult, ProductSpec, StructuralReqId } from './types'

function uniqueScreens(placements: readonly Binding[]): string[] {
  return [...new Set(placements.map(([screenId]) => screenId))]
}

function uniqueSrs(placements: readonly Binding[]): StructuralReqId[] {
  const srs: StructuralReqId[] = []
  for (const [, srId] of placements) {
    if (srId !== undefined && !srs.includes(srId)) {
      srs.push(srId)
    }
  }
  return srs
}

export function impact(spec: ProductSpec, target: string): ImpactResult {
  if (isBehavioralReqId(target)) {
    const placements = spec.bindings[target] ?? []
    const screens = uniqueScreens(placements)
    const srs = uniqueSrs(placements)

    return {
      target,
      bindings: placements.length > 0 ? [{ brId: target, placements }] : [],
      screens: screens.length > 0 ? screens : undefined,
      srs: srs.length > 0 ? srs : undefined,
    }
  }

  if (target in spec.wireframe.screens) {
    const bindings: { brId: BehavioralReqId; placements: readonly Binding[] }[] = []
    for (const [brId, placements] of Object.entries(spec.bindings)) {
      const onScreen = placements.filter(([screenId]) => screenId === target)
      if (onScreen.length > 0) {
        bindings.push({ brId: brId as BehavioralReqId, placements: onScreen })
      }
    }

    return {
      target,
      bindings,
      screens: [target],
    }
  }

  throw new Error(`Unknown impact target: ${target}`)
}
