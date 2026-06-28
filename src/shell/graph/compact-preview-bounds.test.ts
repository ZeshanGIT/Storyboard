import { describe, expect, it } from 'vitest'
import {
  computeCompactPreviewBounds,
  isBoundsVisibleInViewport,
  viewportToRevealBounds,
} from './compact-preview-bounds'

describe('computeCompactPreviewBounds', () => {
  it('includes compact card and preview below the node position', () => {
    const bounds = computeCompactPreviewBounds({ x: 100, y: 50 }, { width: 200, height: 120 })

    expect(bounds).toEqual({
      x: 100,
      y: 50,
      width: 200,
      height: 100 + 8 + 29 + 120,
    })
  })
})

describe('isBoundsVisibleInViewport', () => {
  it('detects when bounds extend below the viewport', () => {
    const bounds = { x: 0, y: 0, width: 180, height: 400 }
    const viewport = { x: 0, y: 0, zoom: 1 }

    expect(isBoundsVisibleInViewport(bounds, viewport, 800, 300, 0.06)).toBe(false)
  })
})

describe('viewportToRevealBounds', () => {
  it('pans without zooming when a small clip can be fixed by translation', () => {
    const bounds = { x: 100, y: 400, width: 180, height: 250 }
    const viewport = { x: 0, y: 0, zoom: 1 }

    const next = viewportToRevealBounds(bounds, viewport, 800, 600, 0.5, 2, 0.06)

    expect(next.zoom).toBe(1)
    expect(next.y).toBeLessThan(0)
    expect(isBoundsVisibleInViewport(bounds, next, 800, 600, 0.06)).toBe(true)
  })
})
