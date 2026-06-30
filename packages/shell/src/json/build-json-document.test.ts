import { extractNavigationGraphFromScreens } from '@shell/plugin/extract-navigation-graph'
import { describe, expect, it } from 'vitest'
import { buildJsonDocument } from './build-json-document'

const FIXTURE = {
  title: 'Demo',
  screens: {
    home: {
      title: 'Home',
      nodes: [['Link:primary-btn', { goto: 'login' }, 'Login']],
    },
    login: {
      title: 'Login',
      nodes: [['Text:h1', 'Sign in']],
    },
  },
}

describe('buildJsonDocument', () => {
  it('builds screens and classifies links', () => {
    const built = buildJsonDocument(FIXTURE)
    expect(built.ok).toBe(true)
    if (!built.ok) return
    expect(built.document.screens[0]?.id).toBe('home')
    expect(built.document.screens[0]?.links[0]?.classification).toBe('screen-edge')
    const graph = extractNavigationGraphFromScreens(
      built.document.screens.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        jsx: '',
        modalIds: s.modalIds,
        links: s.links,
        note: s.note,
      })),
    )
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]?.toScreenId).toBe('login')
  })
})
