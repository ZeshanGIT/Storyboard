import { type Edge, MarkerType, type Node } from '@xyflow/react'
import type { NavigationGraph } from '../../plugin/types'
import type { RouteEntry } from '../router'
import type { CompactGraphNodeType } from './CompactGraphNode'
import type { GraphDisplayMode } from './layout-navigation-graph'

export const COMPACT_NODE_WIDTH = 180
export const COMPACT_NODE_HEIGHT = 100

export type BuildReactFlowGraphInput = {
  graph: NavigationGraph
  routes: readonly RouteEntry[]
  mode: GraphDisplayMode
  selectedId: string | null
  positions: Map<string, { x: number; y: number }>
}

function countConnections(graph: NavigationGraph): {
  incoming: Map<string, number>
  outgoing: Map<string, number>
} {
  const incoming = new Map<string, number>()
  const outgoing = new Map<string, number>()

  for (const node of graph.nodes) {
    incoming.set(node.id, 0)
    outgoing.set(node.id, 0)
  }

  for (const edge of graph.edges) {
    incoming.set(edge.toScreenId, (incoming.get(edge.toScreenId) ?? 0) + 1)
    outgoing.set(edge.fromScreenId, (outgoing.get(edge.fromScreenId) ?? 0) + 1)
  }

  return { incoming, outgoing }
}

function buildCompactGraph({
  graph,
  selectedId,
  positions,
}: Omit<BuildReactFlowGraphInput, 'mode' | 'routes'>): {
  nodes: CompactGraphNodeType[]
  edges: Edge[]
} {
  const { incoming, outgoing } = countConnections(graph)

  const nodes: CompactGraphNodeType[] = graph.nodes.map((node) => ({
    id: node.id,
    type: 'compact',
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: {
      title: node.title,
      screenId: node.id,
      note: node.note,
      incoming: incoming.get(node.id) ?? 0,
      outgoing: outgoing.get(node.id) ?? 0,
      isEntry: node.isEntry,
      selected: node.id === selectedId,
    },
  }))

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromScreenId,
    target: edge.toScreenId,
    markerEnd: { type: MarkerType.ArrowClosed },
  }))

  return { nodes, edges }
}

export function buildReactFlowGraph(input: BuildReactFlowGraphInput): {
  nodes: Node[]
  edges: Edge[]
} {
  if (input.mode === 'compact') {
    return buildCompactGraph(input)
  }

  return { nodes: [], edges: [] }
}
