export type NodeRect = {
  x: number
  y: number
  width: number
  height: number
}

export type EdgePorts = {
  sourceHandle: string
  targetHandle: string
}

export function computeEdgePorts(source: NodeRect, target: NodeRect): EdgePorts {
  const sourceCenterX = source.x + source.width / 2
  const sourceCenterY = source.y + source.height / 2
  const targetCenterX = target.x + target.width / 2
  const targetCenterY = target.y + target.height / 2

  const dx = targetCenterX - sourceCenterX
  const dy = targetCenterY - sourceCenterY

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourceHandle: 'out-right', targetHandle: 'in-left' }
      : { sourceHandle: 'out-left', targetHandle: 'in-right' }
  }

  return dy > 0
    ? { sourceHandle: 'out-bottom', targetHandle: 'in-top' }
    : { sourceHandle: 'out-top', targetHandle: 'in-bottom' }
}
