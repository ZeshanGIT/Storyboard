import { describe, expect, it } from 'vitest'
import { parseTag } from './parse-tag'

describe('parseTag', () => {
  it('splits component and modifiers', () => {
    expect(parseTag('Link:primary-btn')).toEqual({
      component: 'Link',
      modifiers: ['primary-btn'],
    })
  })

  it('sorts modifiers for stable order', () => {
    expect(parseTag('Input:danger:textarea').modifiers).toEqual(['danger', 'textarea'])
  })
})
