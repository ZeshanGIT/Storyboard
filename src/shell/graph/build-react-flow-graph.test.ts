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
  })
})
