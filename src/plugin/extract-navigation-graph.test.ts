import { describe, expect, it } from 'vitest'
import { extractNavigationGraph } from './extract-navigation-graph'
import { extractScreens } from './extract-screens'

const TWO_SCREEN = `
<Screen id="home" title="Home" note="Entry point">
  <Link goto="login">Login</Link>
  <Link goto="login" disabled>Disabled dup</Link>
</Screen>
<Screen id="login" title="Login">
  <Link goto="home">Back</Link>
</Screen>
`

describe('extractNavigationGraph', () => {
  it('builds nodes from screens with entry flag and note', () => {
    const extracted = extractScreens(TWO_SCREEN)
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const graph = extractNavigationGraph(TWO_SCREEN, extracted.screens)
    expect(graph.nodes).toEqual([
      {
        id: 'home',
        title: 'Home',
        note: 'Entry point',
        order: 0,
        isEntry: true,
      },
      {
        id: 'login',
        title: 'Login',
        order: 1,
        isEntry: false,
      },
    ])
  })

  it('creates screen-to-screen edges and skips disabled, reserved, and modal-open links', () => {
    const source = `
<Screen id="home" title="Home">
  <Link goto="confirm">Open</Link>
  <Link goto="_back">Back</Link>
  <Modal id="confirm">
    <Link goto="login">Continue</Link>
    <Link goto="_close">Cancel</Link>
  </Modal>
</Screen>
<Screen id="login" title="Login">
  <Link goto="home">Home</Link>
</Screen>
`
    const extracted = extractScreens(source)
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const graph = extractNavigationGraph(source, extracted.screens)
    expect(graph.edges).toEqual([
      {
        id: 'home:0->login',
        fromScreenId: 'home',
        toScreenId: 'login',
        linkId: 'home:0',
        label: 'Continue',
      },
      {
        id: 'login:0->home',
        fromScreenId: 'login',
        toScreenId: 'home',
        linkId: 'login:0',
        label: 'Home',
      },
    ])
  })

  it('keeps parallel edges to the same destination', () => {
    const source = `
<Screen id="a" title="A">
  <Link goto="b">One</Link>
  <Link goto="b">Two</Link>
</Screen>
<Screen id="b" title="B"></Screen>
`
    const extracted = extractScreens(source)
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const graph = extractNavigationGraph(source, extracted.screens)
    expect(graph.edges).toHaveLength(2)
    expect(graph.edges[0]?.toScreenId).toBe('b')
    expect(graph.edges[1]?.toScreenId).toBe('b')
    expect(graph.edges[0]?.linkId).not.toBe(graph.edges[1]?.linkId)
  })
})
