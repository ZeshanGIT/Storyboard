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

export function linkCenterToRect(center: { x: number; y: number }, size = 2): NodeRect {
  const half = size / 2
  return {
    x: center.x - half,
    y: center.y - half,
    width: size,
    height: size,
  }
}

export function computeTargetPort(linkRect: NodeRect, targetScreen: NodeRect): string {
  return computeEdgePorts(linkRect, targetScreen).targetHandle
}

export function rectBoundaryAnchor(rect: NodeRect, sourceHandle: string): { x: number; y: number } {
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  switch (sourceHandle) {
    case 'out-right':
      return { x: rect.x + rect.width, y: centerY }
    case 'out-left':
      return { x: rect.x, y: centerY }
    case 'out-bottom':
      return { x: centerX, y: rect.y + rect.height }
    case 'out-top':
      return { x: centerX, y: rect.y }
    default:
      return { x: centerX, y: centerY }
  }
}

export function sourceHandleTransform(sourceHandle: string): string {
  switch (sourceHandle) {
    case 'out-right':
      return 'translate(0, -50%)'
    case 'out-left':
      return 'translate(-100%, -50%)'
    case 'out-bottom':
      return 'translate(-50%, 0)'
    case 'out-top':
      return 'translate(-50%, -100%)'
    default:
      return 'translate(-50%, -50%)'
  }
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
