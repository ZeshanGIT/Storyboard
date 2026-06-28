import { describe, expect, it } from 'vitest'
import type { NavigationGraph } from '../../plugin/types'
import { buildReactFlowGraph } from './build-react-flow-graph'

const graph: NavigationGraph = {
  nodes: [
    { id: 'home', title: 'Home', order: 0, isEntry: true },
    { id: 'login', title: 'Login', order: 1, isEntry: false },
  ],
  edges: [],
}

describe('buildReactFlowGraph screen mode', () => {
  it('applies per-node measured sizes to screen nodes', () => {
    const Home = () => null
    const Login = () => null
    const screenNodeSizes = new Map([
      ['home', { width: 140, height: 90 }],
      ['login', { width: 220, height: 310 }],
    ])

    const { nodes } = buildReactFlowGraph({
      graph,
      routes: [
        { id: 'home', path: '/home', component: Home },
        { id: 'login', path: '/login', component: Login },
      ],
      mode: 'screen',
      selectedId: null,
      positions: new Map([
        ['home', { x: 0, y: 0 }],
        ['login', { x: 0, y: 200 }],
      ]),
      screenNodeSizes,
    })

    expect(nodes).toHaveLength(2)
    expect(nodes[0]?.style).toEqual(expect.objectContaining({ width: 140, height: 90 }))
    expect(nodes[1]?.style).toEqual(expect.objectContaining({ width: 220, height: 310 }))
    expect(nodes[0]?.data).toEqual(
      expect.objectContaining({ measuredSize: { width: 140, height: 90 } }),
    )
    expect(nodes[1]?.data).toEqual(
      expect.objectContaining({ measuredSize: { width: 220, height: 310 } }),
    )
  })

  it('returns no screen nodes when screenNodeSizes is missing or empty', () => {
    const base = {
      graph,
      routes: [{ id: 'home', path: '/home', component: () => null }],
      mode: 'screen' as const,
      selectedId: null,
      positions: new Map([['home', { x: 0, y: 0 }]]),
    }

    expect(buildReactFlowGraph(base).nodes).toHaveLength(0)
    expect(buildReactFlowGraph({ ...base, screenNodeSizes: new Map() }).nodes).toHaveLength(0)
  })
})

const linkedGraph: NavigationGraph = {
  nodes: [
    { id: 'home', title: 'Home', order: 0, isEntry: true },
    { id: 'login', title: 'Login', order: 1, isEntry: false },
  ],
  edges: [
    {
      id: 'home:0->login',
      fromScreenId: 'home',
      toScreenId: 'login',
      linkId: 'home:0',
    },
  ],
}

describe('buildReactFlowGraph screen mode edges', () => {
  it('uses link-anchored sourceHandle with linkId data', () => {
    const Home = () => null
    const Login = () => null
    const screenNodeSizes = new Map([
      ['home', { width: 140, height: 90 }],
      ['login', { width: 220, height: 310 }],
    ])

    const { edges } = buildReactFlowGraph({
      graph: linkedGraph,
      routes: [
        { id: 'home', path: '/home', component: Home },
        { id: 'login', path: '/login', component: Login },
      ],
      mode: 'screen',
      selectedId: null,
      positions: new Map([
        ['home', { x: 0, y: 0 }],
        ['login', { x: 0, y: 200 }],
      ]),
      screenNodeSizes,
    })

    expect(edges).toHaveLength(1)
    expect(edges[0]).toEqual(
      expect.objectContaining({
        source: 'home',
        target: 'login',
        type: 'default',
        sourceHandle: 'home:0',
        targetHandle: 'in-top',
        data: { linkId: 'home:0' },
        interactionWidth: 20,
      }),
    )
  })
})
