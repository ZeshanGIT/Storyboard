import { describe, expect, it } from 'vitest'
import { isBehavioralReqId, isStructuralReqId, parseReqPath } from './sr-id'

describe('isStructuralReqId', () => {
  it('accepts SR-001 and SR-010', () => {
    expect(isStructuralReqId('SR-001')).toBe(true)
    expect(isStructuralReqId('SR-010')).toBe(true)
  })
  it('rejects BR-001 and bare SR', () => {
    expect(isStructuralReqId('BR-001')).toBe(false)
    expect(isStructuralReqId('SR')).toBe(false)
  })
})

describe('isBehavioralReqId', () => {
  it('accepts BR-001 and BR-PASSWORD-VALIDATE', () => {
    expect(isBehavioralReqId('BR-001')).toBe(true)
    expect(isBehavioralReqId('BR-PASSWORD-VALIDATE')).toBe(true)
  })
  it('rejects SR-001 and bare BR', () => {
    expect(isBehavioralReqId('SR-001')).toBe(false)
    expect(isBehavioralReqId('BR')).toBe(false)
  })
})

describe('parseReqPath', () => {
  it('splits parent and child segments', () => {
    expect(parseReqPath('BR-PASSWORD-VALIDATE/MIN-LEN')).toEqual({
      parentId: 'BR-PASSWORD-VALIDATE',
      segments: ['MIN-LEN'],
    })
    expect(parseReqPath('BR-001/2')).toEqual({
      parentId: 'BR-001',
      segments: ['2'],
    })
  })
})
