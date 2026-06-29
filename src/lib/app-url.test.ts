import { describe, expect, it } from 'vitest'
import { buildAppUrl, parseAppUrl, resolveLegacyAppPath, screenPathForDoc } from './app-url'

describe('parseAppUrl / buildAppUrl', () => {
  it('round-trips MDX prototype URL', () => {
    const state = parseAppUrl({ appPath: '/mdx/wireframe/prototype/login' })
    expect(state).toEqual({
      app: 'mdx',
      docSlug: 'wireframe',
      view: 'prototype',
      screenId: 'login',
    })
    expect(buildAppUrl(state!)).toEqual({
      appPath: '/mdx/wireframe/prototype/login',
      search: '',
    })
  })

  it('round-trips playground JSON graph URL with query', () => {
    const state = parseAppUrl({
      appPath: '/playground/json/playground/graph',
      search: '?graphMode=compact&focus=home',
    })
    expect(state).toEqual({
      app: 'playground',
      source: 'json',
      docSlug: 'playground',
      view: 'graph',
      graphMode: 'compact',
      graphFocus: 'home',
    })
    expect(buildAppUrl(state!)).toEqual({
      appPath: '/playground/json/playground/graph',
      search: '?graphMode=compact&focus=home',
    })
  })

  it('returns null for unrecognized paths', () => {
    expect(parseAppUrl({ appPath: '/totally/unknown/path/here' })).toBeNull()
  })
})

describe('screenPathForDoc', () => {
  it('builds MDX screen path', () => {
    expect(screenPathForDoc('mdx', undefined, 'wireframe', 'login')).toBe('/mdx/wireframe/login')
  })

  it('builds playground JSON screen path', () => {
    expect(screenPathForDoc('playground', 'json', 'playground', 'home')).toBe(
      '/playground/json/playground/home',
    )
  })
})

describe('resolveLegacyAppPath', () => {
  const docs = [
    { slug: 'wireframe', screenIds: ['home', 'login'] },
    { slug: 'storyboard', screenIds: ['welcome'] },
  ]

  it('maps flat /login to wireframe prototype', () => {
    expect(resolveLegacyAppPath('/login', docs)).toEqual({
      app: 'mdx',
      docSlug: 'wireframe',
      view: 'prototype',
      screenId: 'login',
    })
  })

  it('maps /playground/home to playground JSON.stringify', () => {
    expect(
      resolveLegacyAppPath('/playground/home', [{ slug: 'playground', screenIds: ['home'] }]),
    ).toEqual({
      app: 'playground',
      source: 'json',
      docSlug: 'playground',
      view: 'prototype',
      screenId: 'home',
    })
  })
})
