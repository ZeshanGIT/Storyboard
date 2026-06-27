import { type Edge, MarkerType, type Node } from '@xyflow/react'
import type { NavigationGraph } from '../../plugin/types'
import { modalIdsByScreenFromRoutes, type RouteEntry } from '../router'
import type { CompactGraphNodeType } from './CompactGraphNode'
import type { GraphDisplayMode } from './layout-navigation-graph'
import type { ScreenGraphNodeType } from './ScreenGraphNode'
import type { ScreenNodeSizeMap } from './screen-node-size'

export const COMPACT_NODE_WIDTH = 180
export const COMPACT_NODE_HEIGHT = 100

export type BuildReactFlowGraphInput = {
  graph: NavigationGraph
  routes: readonly RouteEntry[]
  mode: GraphDisplayMode
  selectedId: string | null
  positions: Map<string, { x: number; y: number }>
  screenNodeSizes?: ScreenNodeSizeMap
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
    className: 'wireframe-graph-node',
    style: { width: COMPACT_NODE_WIDTH, height: COMPACT_NODE_HEIGHT, zIndex: 2 },
    zIndex: 2,
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
    type: 'smoothstep',
    pathOptions: { borderRadius: 0, offset: 24 },
    markerEnd: { type: MarkerType.ArrowClosed },
    zIndex: 0,
  }))

  return { nodes, edges }
}

function buildScreenGraph({
  graph,
  routes,
  selectedId,
  positions,
  screenNodeSizes,
}: Omit<BuildReactFlowGraphInput, 'mode'> & {
  screenNodeSizes: ScreenNodeSizeMap
}): {
  nodes: ScreenGraphNodeType[]
  edges: Edge[]
} {
  const routeById = new Map(routes.map((route) => [route.id, route]))
  const validScreenIds = routes.map((route) => route.id)
  const modalIdsByScreen = modalIdsByScreenFromRoutes(routes)
  const outgoingByScreen = new Map<string, string[]>()

  for (const edge of graph.edges) {
    const list = outgoingByScreen.get(edge.fromScreenId) ?? []
    list.push(edge.linkId)
    outgoingByScreen.set(edge.fromScreenId, list)
  }

  const nodes: ScreenGraphNodeType[] = graph.nodes.flatMap((node) => {
    const route = routeById.get(node.id)
    const measured = screenNodeSizes.get(node.id)
    if (!route || !measured) return []

    return [
      {
        id: node.id,
        type: 'screen' as const,
        position: positions.get(node.id) ?? { x: 0, y: 0 },
        className: 'wireframe-graph-node',
        style: { width: measured.width, height: measured.height, zIndex: 2 },
        zIndex: 2,
        data: {
          screenId: node.id,
          title: node.title,
          isEntry: node.isEntry,
          selected: node.id === selectedId,
          outgoingLinkIds: outgoingByScreen.get(node.id) ?? [],
          component: route.component,
          validScreenIds,
          modalIdsByScreen,
          measuredSize: measured,
        },
      },
    ]
  })

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromScreenId,
    target: edge.toScreenId,
    sourceHandle: edge.linkId,
    type: 'smoothstep',
    pathOptions: { borderRadius: 0, offset: 24 },
    markerEnd: { type: MarkerType.ArrowClosed },
    zIndex: 0,
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

  if (!input.screenNodeSizes) {
    return { nodes: [], edges: [] }
  }

  return buildScreenGraph({ ...input, screenNodeSizes: input.screenNodeSizes })
}
