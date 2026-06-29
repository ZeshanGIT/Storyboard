import { describe, expect, it } from 'vitest'
import { classifyGotoLink } from './classify-goto-link'

describe('classifyGotoLink', () => {
  it('classifies screen-edge with linkId', () => {
    const screenIds = new Set(['home', 'login'])
    const result = classifyGotoLink({
      screenId: 'home',
      linkIndex: 0,
      goto: 'login',
      label: 'Login',
      screenIds,
      modalIdsForScreen: new Set(),
    })
    expect(result.error).toBeUndefined()
    expect(result.link).toEqual({
      classification: 'screen-edge',
      goto: 'login',
      label: 'Login',
      linkId: 'home:0',
      toScreenId: 'login',
    })
  })

  it('returns error for missing goto', () => {
    const result = classifyGotoLink({
      screenId: 'home',
      linkIndex: 0,
      goto: undefined,
      screenIds: new Set(['home']),
      modalIdsForScreen: new Set(),
    })
    expect(result.link.classification).toBe('invalid-missing-goto')
    expect(result.error?.code).toBe('INVALID_GOTO')
  })
})
