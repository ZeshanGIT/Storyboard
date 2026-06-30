import { describe, expect, it } from 'vitest'
import { buildMdxDocument } from './build-mdx-document'
import { extractNavigationGraph } from './extract-navigation-graph'

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
  it('builds edges from classified screen-edge links', () => {
    const built = buildMdxDocument(`
<Screen id="home" title="Home">
  <Link goto="detail">Detail</Link>
</Screen>
<Screen id="detail" title="Detail" />
`)
    if (!built.ok) throw new Error('fixture')
    const graph = extractNavigationGraph(built.document)
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]?.linkId).toBe('home:0')
  })

  it('builds nodes from screens with entry flag and note', () => {
    const built = buildMdxDocument(TWO_SCREEN)
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const graph = extractNavigationGraph(built.document)
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
    const built = buildMdxDocument(source)
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const graph = extractNavigationGraph(built.document)
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
    const built = buildMdxDocument(source)
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const graph = extractNavigationGraph(built.document)
    expect(graph.edges).toHaveLength(2)
    expect(graph.edges[0]?.toScreenId).toBe('b')
    expect(graph.edges[1]?.toScreenId).toBe('b')
    expect(graph.edges[0]?.linkId).not.toBe(graph.edges[1]?.linkId)
  })
})
