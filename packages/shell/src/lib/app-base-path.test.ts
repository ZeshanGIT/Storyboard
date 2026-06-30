import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizePath, toAppPath, toBrowserPath } from './app-base-path'

describe('app base path helpers', () => {
  describe('at site root (BASE_URL /)', () => {
    beforeEach(() => {
      vi.stubEnv('BASE_URL', '/')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('normalizes trailing slashes', () => {
      expect(normalizePath('/login/')).toBe('/login')
      expect(normalizePath('/')).toBe('/')
    })

    it('passes paths through unchanged', () => {
      expect(toAppPath('/login')).toBe('/login')
      expect(toBrowserPath('/login')).toBe('/login')
    })
  })

  describe('on GitHub Pages (BASE_URL /Storyboard/)', () => {
    beforeEach(() => {
      vi.stubEnv('BASE_URL', '/Storyboard/')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('maps browser paths to app paths', () => {
      expect(toAppPath('/Storyboard')).toBe('/')
      expect(toAppPath('/Storyboard/login')).toBe('/login')
      expect(toAppPath('/login')).toBe('/login')
    })

    it('maps app paths to browser paths', () => {
      expect(toBrowserPath('/login')).toBe('/Storyboard/login')
      expect(toBrowserPath('/')).toBe('/Storyboard/')
    })
  })
})
