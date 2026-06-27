import { describe, expect, it } from 'vitest'
import { computeEdgePorts } from './compute-edge-ports'

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
