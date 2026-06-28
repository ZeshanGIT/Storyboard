export type GraphLinkRect = {
  x: number
  y: number
  width: number
  height: number
}

export function viewportDeltaToLocal(
  deltaX: number,
  deltaY: number,
  container: Pick<HTMLElement, 'offsetWidth' | 'offsetHeight'>,
  containerViewport: Pick<DOMRect, 'width' | 'height'>,
): { x: number; y: number } {
  const scaleX = containerViewport.width / container.offsetWidth
  const scaleY = containerViewport.height / container.offsetHeight
  return {
    x: deltaX / scaleX,
    y: deltaY / scaleY,
  }
}

export function measureElementOffsetRect(
  container: HTMLElement,
  element: HTMLElement,
): GraphLinkRect | null {
  let x = 0
  let y = 0
  let node: HTMLElement | null = element

  while (node && node !== container) {
    x += node.offsetLeft
    y += node.offsetTop
    const parent: HTMLElement | null =
      node.offsetParent instanceof HTMLElement ? node.offsetParent : null
    if (!parent || !container.contains(parent)) {
      return null
    }
    node = parent
  }

  if (node !== container) return null

  return {
    x,
    y,
    width: element.offsetWidth,
    height: element.offsetHeight,
  }
}

export function measureLinkHandlePositions(
  container: HTMLElement,
  linkIds: readonly string[],
): Map<string, GraphLinkRect> {
  const positions = new Map<string, GraphLinkRect>()

  for (const linkId of linkIds) {
    const element = container.querySelector(`[data-graph-link-id="${linkId}"]`)
    if (!(element instanceof HTMLElement)) continue

    const rect =
      measureElementOffsetRect(container, element) ??
      measureLinkRectFromViewport(container, element)
    positions.set(linkId, rect)
  }

  return positions
}

function measureLinkRectFromViewport(container: HTMLElement, element: HTMLElement): GraphLinkRect {
  const containerRect = container.getBoundingClientRect()
  const linkRect = element.getBoundingClientRect()
  const scaleX = containerRect.width / container.offsetWidth
  const scaleY = containerRect.height / container.offsetHeight

  return {
    x: (linkRect.left - containerRect.left) / scaleX,
    y: (linkRect.top - containerRect.top) / scaleY,
    width: linkRect.width / scaleX,
    height: linkRect.height / scaleY,
  }
}
