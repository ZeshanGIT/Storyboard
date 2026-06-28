import { type Edge, MarkerType, type Node } from '@xyflow/react'
import type { NavigationGraph } from '../../plugin/types'
import { modalIdsByScreenFromRoutes, type RouteEntry } from '../router'
import type { CompactGraphNodeType } from './CompactGraphNode'
import { computeEdgePorts, computeTargetPort, type NodeRect } from './compute-edge-ports'
import type { GraphDisplayMode } from './layout-navigation-graph'
import type { OutgoingGraphLink, ScreenGraphNodeType } from './ScreenGraphNode'
import type { ScreenNodeSizeMap } from './screen-node-size'

export const GRAPH_EDGE_STROKE = '#63b3ed'

export const COMPACT_NODE_WIDTH = 180
export const COMPACT_NODE_HEIGHT = 100
export const GRAPH_NODE_Z_INDEX = 2
export const GRAPH_EDGE_Z_INDEX = 3
export const GRAPH_HIGHLIGHTED_EDGE_Z_INDEX = 4

const graphMarkerEnd = {
  type: MarkerType.ArrowClosed,
  color: GRAPH_EDGE_STROKE,
} as const

export type BuildReactFlowGraphInput = {
  graph: NavigationGraph
  routes: readonly RouteEntry[]
  mode: GraphDisplayMode
  selectedId: string | null
  positions: Map<string, { x: number; y: number }>
  screenNodeSizes?: ScreenNodeSizeMap
  onGraphLinkHover?: (linkId: string | null) => void
  onGraphLinkFocus?: (linkId: string, targetScreenId: string) => void
  onLinkRects?: (screenId: string, rects: Map<string, NodeRect>) => void
  linkRectsByScreen?: Map<string, Map<string, NodeRect>>
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

function buildCompactGraphEdges(
  graph: NavigationGraph,
  getNodeRect: (id: string) => NodeRect | undefined,
): Edge[] {
  return graph.edges.map((edge) => {
    const sourceRect = getNodeRect(edge.fromScreenId)
    const targetRect = getNodeRect(edge.toScreenId)
    const ports =
      sourceRect && targetRect
        ? computeEdgePorts(sourceRect, targetRect)
        : { sourceHandle: 'out-bottom', targetHandle: 'in-top' }

    return {
      id: edge.id,
      source: edge.fromScreenId,
      target: edge.toScreenId,
      sourceHandle: ports.sourceHandle,
      targetHandle: ports.targetHandle,
      type: 'default',
      markerEnd: graphMarkerEnd,
      data: { linkId: edge.linkId },
      zIndex: GRAPH_EDGE_Z_INDEX,
      interactionWidth: 20,
    }
  })
}

function buildScreenGraphEdges(
  graph: NavigationGraph,
  getScreenRect: (id: string) => NodeRect | undefined,
  linkRectsByScreen: Map<string, Map<string, NodeRect>>,
  screenPositions: Map<string, { x: number; y: number }>,
): Edge[] {
  return graph.edges.map((edge) => {
    const targetRect = getScreenRect(edge.toScreenId)
    const localLinkRect = linkRectsByScreen.get(edge.fromScreenId)?.get(edge.linkId)
    const sourcePos = screenPositions.get(edge.fromScreenId)

    let targetHandle = 'in-top'
    if (targetRect && localLinkRect && sourcePos) {
      const linkInFlow: NodeRect = {
        x: sourcePos.x + localLinkRect.x,
        y: sourcePos.y + localLinkRect.y,
        width: localLinkRect.width,
        height: localLinkRect.height,
      }
      targetHandle = computeTargetPort(linkInFlow, targetRect)
    } else if (targetRect) {
      const sourceRect = getScreenRect(edge.fromScreenId)
      if (sourceRect) targetHandle = computeEdgePorts(sourceRect, targetRect).targetHandle
    }

    return {
      id: edge.id,
      source: edge.fromScreenId,
      target: edge.toScreenId,
      sourceHandle: edge.linkId,
      targetHandle,
      type: 'default',
      markerEnd: graphMarkerEnd,
      data: { linkId: edge.linkId },
      zIndex: GRAPH_EDGE_Z_INDEX,
      interactionWidth: 20,
    }
  })
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

  const getNodeRect = (id: string): NodeRect | undefined => {
    const position = positions.get(id)
    if (!position) return undefined
    return {
      x: position.x,
      y: position.y,
      width: COMPACT_NODE_WIDTH,
      height: COMPACT_NODE_HEIGHT,
    }
  }

  const nodes: CompactGraphNodeType[] = graph.nodes.map((node) => ({
    id: node.id,
    type: 'compact',
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    className: 'wireframe-graph-node',
    style: { width: COMPACT_NODE_WIDTH, height: COMPACT_NODE_HEIGHT, zIndex: GRAPH_NODE_Z_INDEX },
    zIndex: GRAPH_NODE_Z_INDEX,
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

  return { nodes, edges: buildCompactGraphEdges(graph, getNodeRect) }
}

function buildScreenGraph({
  graph,
  routes,
  selectedId,
  positions,
  screenNodeSizes,
  onGraphLinkHover,
  onGraphLinkFocus,
  onLinkRects,
  linkRectsByScreen = new Map(),
}: Omit<BuildReactFlowGraphInput, 'mode'> & {
  screenNodeSizes: ScreenNodeSizeMap
}): {
  nodes: ScreenGraphNodeType[]
  edges: Edge[]
} {
  const routeById = new Map(routes.map((route) => [route.id, route]))
  const validScreenIds = routes.map((route) => route.id)
  const modalIdsByScreen = modalIdsByScreenFromRoutes(routes)

  const outgoingByScreen = new Map<string, OutgoingGraphLink[]>()
  for (const edge of graph.edges) {
    const list = outgoingByScreen.get(edge.fromScreenId) ?? []
    list.push({ linkId: edge.linkId, toScreenId: edge.toScreenId })
    outgoingByScreen.set(edge.fromScreenId, list)
  }

  const screenRectsById = new Map<string, NodeRect>()
  for (const node of graph.nodes) {
    const position = positions.get(node.id)
    const measured = screenNodeSizes.get(node.id)
    if (position && measured) {
      screenRectsById.set(node.id, {
        x: position.x,
        y: position.y,
        width: measured.width,
        height: measured.height,
      })
    }
  }

  const getNodeRect = (id: string): NodeRect | undefined => {
    const position = positions.get(id)
    const measured = screenNodeSizes.get(id)
    if (!position || !measured) return undefined
    return {
      x: position.x,
      y: position.y,
      width: measured.width,
      height: measured.height,
    }
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
        className: 'wireframe-graph-node wireframe-graph-screen-node',
        style: { width: measured.width, height: measured.height, zIndex: GRAPH_NODE_Z_INDEX },
        zIndex: GRAPH_NODE_Z_INDEX,
        data: {
          screenId: node.id,
          title: node.title,
          isEntry: node.isEntry,
          selected: node.id === selectedId,
          component: route.component,
          validScreenIds,
          modalIdsByScreen,
          measuredSize: measured,
          outgoingLinks: outgoingByScreen.get(node.id) ?? [],
          nodePosition: positions.get(node.id) ?? { x: 0, y: 0 },
          screenRectsById,
          onGraphLinkHover,
          onGraphLinkFocus,
          onLinkRects,
        },
      },
    ]
  })

  return {
    nodes,
    edges: buildScreenGraphEdges(graph, getNodeRect, linkRectsByScreen, positions),
  }
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
