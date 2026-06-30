import { collectSrPlacements } from './collect-sr-ids'
import { isBehavioralReqId, isStructuralReqId } from './sr-id'
import type { ProductSpec } from './types'

export function showReq(spec: ProductSpec, id: string): string {
  if (isStructuralReqId(id)) {
    const def = spec.requirements.structural[id]
    if (def === undefined) {
      throw new Error(`Unknown structural requirement: ${id}`)
    }

    const placementMap = collectSrPlacements(spec.wireframe)
    const screens = [...new Set((placementMap.get(id) ?? []).map((p) => p.screenId))]

    const lines = [`${id}: ${def.description}`]
    if (screens.length > 0) {
      lines.push(`Screens: ${screens.join(', ')}`)
    }
    return lines.join('\n')
  }

  if (isBehavioralReqId(id)) {
    const def = spec.requirements.behavioral[id]
    if (def === undefined) {
      throw new Error(`Unknown behavioral requirement: ${id}`)
    }
    return JSON.stringify(def, null, 2)
  }

  throw new Error(`Unknown requirement id: ${id}`)
}
