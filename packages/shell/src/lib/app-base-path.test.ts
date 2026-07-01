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

  describe('on GitHub Pages (BASE_URL /OneSpec/)', () => {
    beforeEach(() => {
      vi.stubEnv('BASE_URL', '/OneSpec/')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('maps browser paths to app paths', () => {
      expect(toAppPath('/OneSpec')).toBe('/')
      expect(toAppPath('/OneSpec/login')).toBe('/login')
      expect(toAppPath('/login')).toBe('/login')
    })

    it('maps app paths to browser paths', () => {
      expect(toBrowserPath('/login')).toBe('/OneSpec/login')
      expect(toBrowserPath('/')).toBe('/OneSpec/')
    })
  })
})
