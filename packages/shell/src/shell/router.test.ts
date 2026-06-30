import { describe, expect, it } from 'vitest'
import { normalizePrototypeScreenId } from './router'

describe('normalizePrototypeScreenId', () => {
  const validScreenIds = ['home', 'login']

  it('returns undefined when screenId is valid', () => {
    expect(normalizePrototypeScreenId('login', validScreenIds, 'home')).toBeUndefined()
  })

  it('returns entry screen when screenId is missing', () => {
    expect(normalizePrototypeScreenId(undefined, validScreenIds, 'home')).toBe('home')
  })

  it('returns entry screen when screenId is not in routes', () => {
    expect(normalizePrototypeScreenId('unknown', validScreenIds, 'home')).toBe('home')
  })

  it('returns undefined when there are no routes', () => {
    expect(normalizePrototypeScreenId('home', [], 'home')).toBeUndefined()
  })
})
