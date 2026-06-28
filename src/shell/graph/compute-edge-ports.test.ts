import { describe, expect, it } from 'vitest'
import {
  computeEdgePorts,
  computeTargetPort,
  linkCenterToRect,
  rectBoundaryAnchor,
} from './compute-edge-ports'

describe('computeEdgePorts', () => {
  it('uses bottom to top when target is below source', () => {
    expect(
      computeEdgePorts(
        { x: 0, y: 0, width: 100, height: 80 },
        { x: 0, y: 200, width: 100, height: 80 },
      ),
    ).toEqual({ sourceHandle: 'out-bottom', targetHandle: 'in-top' })
  })

  it('uses top to bottom when target is above source', () => {
    expect(
      computeEdgePorts(
        { x: 0, y: 200, width: 100, height: 80 },
        { x: 0, y: 0, width: 100, height: 80 },
      ),
    ).toEqual({ sourceHandle: 'out-top', targetHandle: 'in-bottom' })
  })

  it('uses right to left when target is to the right', () => {
    expect(
      computeEdgePorts(
        { x: 0, y: 0, width: 100, height: 200 },
        { x: 300, y: 50, width: 100, height: 200 },
      ),
    ).toEqual({ sourceHandle: 'out-right', targetHandle: 'in-left' })
  })

  it('uses left to right when target is to the left', () => {
    expect(
      computeEdgePorts(
        { x: 300, y: 0, width: 100, height: 200 },
        { x: 0, y: 50, width: 100, height: 200 },
      ),
    ).toEqual({ sourceHandle: 'out-left', targetHandle: 'in-right' })
  })
})

describe('computeTargetPort', () => {
  it('targets top when link is above screen', () => {
    const link = linkCenterToRect({ x: 50, y: 10 })
    const screen = { x: 0, y: 100, width: 100, height: 80 }
    expect(computeTargetPort(link, screen)).toBe('in-top')
  })

  it('targets bottom when link is below screen', () => {
    const link = linkCenterToRect({ x: 50, y: 200 })
    const screen = { x: 0, y: 0, width: 100, height: 80 }
    expect(computeTargetPort(link, screen)).toBe('in-bottom')
  })
})

describe('rectBoundaryAnchor', () => {
  it('anchors on the bottom edge for out-bottom', () => {
    const rect = { x: 10, y: 20, width: 40, height: 16 }
    expect(rectBoundaryAnchor(rect, 'out-bottom')).toEqual({ x: 30, y: 36 })
  })

  it('anchors on the right edge for out-right', () => {
    const rect = { x: 10, y: 20, width: 40, height: 16 }
    expect(rectBoundaryAnchor(rect, 'out-right')).toEqual({ x: 50, y: 28 })
  })
})
