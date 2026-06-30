import { describe, expect, it } from 'vitest'
import { screenIdToComponentName } from './naming'

describe('screenIdToComponentName', () => {
  it('converts simple id', () => {
    expect(screenIdToComponentName('home')).toBe('Home')
  })

  it('converts kebab-case id', () => {
    expect(screenIdToComponentName('user-profile')).toBe('UserProfile')
  })
})
