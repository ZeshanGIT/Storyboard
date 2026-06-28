import { getViewportForBounds } from '@xyflow/react'
import { COMPACT_NODE_HEIGHT, COMPACT_NODE_WIDTH } from './build-react-flow-graph'
import type { MeasuredScreenNodeSize } from './screen-node-size'

export const COMPACT_PREVIEW_MAX_WIDTH = 260

export const COMPACT_PREVIEW_GAP = 8
export const COMPACT_PREVIEW_TITLE_HEIGHT = 29
export const COMPACT_PREVIEW_REVEAL_PADDING = 0.06
export const COMPACT_PREVIEW_REVEAL_DURATION_MS = 280
export const COMPACT_PREVIEW_CLOSE_DELAY_MS = 350

export type FlowRect = {
  x: number
  y: number
  width: number
  height: number
}

export type Viewport = {
  x: number
  y: number
  zoom: number
}

export function computeCompactPreviewDimensions(measuredSize: MeasuredScreenNodeSize): {
  width: number
  height: number
} {
  const scale = Math.min(1, COMPACT_PREVIEW_MAX_WIDTH / measuredSize.width)
  return {
    width: Math.round(measuredSize.width * scale),
    height: Math.round(measuredSize.height * scale),
  }
}

export function computeCompactPreviewBounds(
  nodePosition: { x: number; y: number },
  measuredSize: MeasuredScreenNodeSize,
): FlowRect {
  const { width: previewWidth, height: previewHeight } =
    computeCompactPreviewDimensions(measuredSize)

  return {
    x: nodePosition.x,
    y: nodePosition.y,
    width: Math.max(COMPACT_NODE_WIDTH, previewWidth),
    height:
      COMPACT_NODE_HEIGHT + COMPACT_PREVIEW_GAP + COMPACT_PREVIEW_TITLE_HEIGHT + previewHeight,
  }
}

function padPixels(containerWidth: number, containerHeight: number, padding: number): number {
  return padding * Math.min(containerWidth, containerHeight)
}

export function isBoundsVisibleInViewport(
  bounds: FlowRect,
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number,
  padding: number,
): boolean {
  const pad = padPixels(containerWidth, containerHeight, padding)
  const left = bounds.x * viewport.zoom + viewport.x
  const top = bounds.y * viewport.zoom + viewport.y
  const right = (bounds.x + bounds.width) * viewport.zoom + viewport.x
  const bottom = (bounds.y + bounds.height) * viewport.zoom + viewport.y

  return (
    left >= pad && top >= pad && right <= containerWidth - pad && bottom <= containerHeight - pad
  )
}

function panOnlyToRevealBounds(
  bounds: FlowRect,
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number,
  padding: number,
): Viewport {
  const pad = padPixels(containerWidth, containerHeight, padding)
  const zoom = viewport.zoom
  const left = bounds.x * zoom + viewport.x
  const top = bounds.y * zoom + viewport.y
  const right = (bounds.x + bounds.width) * zoom + viewport.x
  const bottom = (bounds.y + bounds.height) * zoom + viewport.y

  let dx = 0
  let dy = 0

  if (left < pad) dx = pad - left
  else if (right > containerWidth - pad) dx = containerWidth - pad - right

  if (top < pad) dy = pad - top
  else if (bottom > containerHeight - pad) dy = containerHeight - pad - bottom

  return { x: viewport.x + dx, y: viewport.y + dy, zoom }
}

export function viewportToRevealBounds(
  bounds: FlowRect,
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number,
  minZoom: number,
  maxZoom: number,
  padding: number,
): Viewport {
  const panned = panOnlyToRevealBounds(bounds, viewport, containerWidth, containerHeight, padding)

  if (isBoundsVisibleInViewport(bounds, panned, containerWidth, containerHeight, padding)) {
    return panned
  }

  return getViewportForBounds(
    bounds,
    containerWidth,
    containerHeight,
    minZoom,
    Math.min(maxZoom, viewport.zoom),
    padding,
  )
}
