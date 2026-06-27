import dagre from '@dagrejs/dagre'

export type GraphDisplayMode = 'screen' | 'compact'

export type LayoutNodeInput = {
  id: string
  width: number
  height: number
}

export type LayoutEdgeInput = {
  id: string
  from: string
  to: string
}

export function layoutNavigationGraph(
  nodes: readonly LayoutNodeInput[],
  edges: readonly LayoutEdgeInput[],
  direction: 'TB' | 'LR' = 'TB',
): Map<string, { x: number; y: number }> {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction })

  for (const node of nodes) {
    graph.setNode(node.id, { width: node.width, height: node.height })
  }

  for (const edge of edges) {
    graph.setEdge(edge.from, edge.to)
  }

  dagre.layout(graph)

  const positions = new Map<string, { x: number; y: number }>()
  for (const node of nodes) {
    const layoutNode = graph.node(node.id) as { x: number; y: number }
    positions.set(node.id, {
      x: layoutNode.x - node.width / 2,
      y: layoutNode.y - node.height / 2,
    })
  }

  return positions
}
