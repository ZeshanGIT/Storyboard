import { describe, expect, it } from 'vitest'
import { viewportDeltaToLocal } from './measure-link-handle-positions'

describe('viewportDeltaToLocal', () => {
  it('returns deltas unchanged at zoom 1', () => {
    expect(
      viewportDeltaToLocal(
        60,
        40,
        { offsetWidth: 200, offsetHeight: 100 },
        { width: 200, height: 100 },
      ),
    ).toEqual({ x: 60, y: 40 })
  })

  it('divides by zoom when zoomed in', () => {
    expect(
      viewportDeltaToLocal(
        120,
        80,
        { offsetWidth: 200, offsetHeight: 100 },
        { width: 400, height: 200 },
      ),
    ).toEqual({ x: 60, y: 40 })
  })
})
