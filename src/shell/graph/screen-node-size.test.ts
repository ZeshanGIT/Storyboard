import { describe, expect, it } from 'vitest'
import { isScreenMeasurementComplete, normalizeMeasuredSize } from './screen-node-size'

describe('normalizeMeasuredSize', () => {
  it('ceil dimensions and enforce a 1px minimum', () => {
    expect(normalizeMeasuredSize({ width: 120.2, height: 0 })).toEqual({
      width: 121,
      height: 1,
    })
  })
})

describe('isScreenMeasurementComplete', () => {
  it('returns true only when every expected screen id has a size', () => {
    const sizes = new Map([['home', { width: 100, height: 80 }]])
    expect(isScreenMeasurementComplete(['home'], sizes)).toBe(true)
    expect(isScreenMeasurementComplete(['home', 'login'], sizes)).toBe(false)
  })
})
