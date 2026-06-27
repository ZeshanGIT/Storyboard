import {
  Background,
  Controls,
  MiniMap,
  type Node,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import { useCallback, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NavigationGraph } from '../plugin/types'
import { getCodegenErrors } from '../runtime/codegen-error'
import {
  buildReactFlowGraph,
  COMPACT_NODE_HEIGHT,
  COMPACT_NODE_WIDTH,
  SCREEN_NODE_HEIGHT,
  SCREEN_NODE_WIDTH,
} from './graph/build-react-flow-graph'
import { CompactGraphNode } from './graph/CompactGraphNode'
import { type GraphDisplayMode, layoutNavigationGraph } from './graph/layout-navigation-graph'
import { ScreenGraphNode } from './graph/ScreenGraphNode'
import type { RouteEntry } from './router'

export type GraphViewProps = {
  navigationGraph: NavigationGraph
  routes: readonly RouteEntry[]
  documentFilename: string
}

const graphNodeTypes: NodeTypes = {
  compact: CompactGraphNode,
  screen: ScreenGraphNode,
}

type GraphCanvasProps = {
  nodes: Node[]
  edges: ReturnType<typeof buildReactFlowGraph>['edges']
  onSelectNode: (id: string) => void
  onClearSelection: () => void
}

function GraphCanvas({ nodes, edges, onSelectNode, onClearSelection }: GraphCanvasProps) {
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelectNode(node.id)
    },
    [onSelectNode],
  )

  return (
    <ReactFlow
      className="h-full"
      nodes={nodes}
      edges={edges}
      nodeTypes={graphNodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onClearSelection}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}

export function GraphView({ navigationGraph, routes, documentFilename }: GraphViewProps) {
  const codegenErrors = getCodegenErrors()
  const [mode, setMode] = useState<GraphDisplayMode>('screen')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const nodeWidth = mode === 'compact' ? COMPACT_NODE_WIDTH : SCREEN_NODE_WIDTH
  const nodeHeight = mode === 'compact' ? COMPACT_NODE_HEIGHT : SCREEN_NODE_HEIGHT

  const positions = useMemo(() => {
    const layoutNodes = navigationGraph.nodes.map((node) => ({
      id: node.id,
      width: nodeWidth,
      height: nodeHeight,
    }))
    const layoutEdges = navigationGraph.edges.map((edge) => ({
      id: edge.id,
      from: edge.fromScreenId,
      to: edge.toScreenId,
    }))
    return layoutNavigationGraph(layoutNodes, layoutEdges)
  }, [navigationGraph, nodeWidth, nodeHeight])

  const fitViewKey = useMemo(
    () =>
      `${mode}|${navigationGraph.nodes.map((node) => node.id).join(',')}|${navigationGraph.edges.map((edge) => edge.id).join(',')}`,
    [mode, navigationGraph],
  )

  const { nodes, edges } = useMemo(
    () =>
      buildReactFlowGraph({
        graph: navigationGraph,
        routes,
        mode,
        selectedId,
        positions,
      }),
    [navigationGraph, routes, mode, selectedId, positions],
  )

  const onSelectNode = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const onClearSelection = useCallback(() => {
    setSelectedId(null)
  }, [])

  if (codegenErrors.length > 0) {
    return (
      <p className="text-red-900">
        Graph unavailable until codegen errors in <code>{documentFilename}</code> are fixed.
      </p>
    )
  }

  if (routes.length === 0) {
    return <p className="text-muted-foreground">No screens in {documentFilename}.</p>
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {navigationGraph.nodes.length} screens, {navigationGraph.edges.length} connections
        </p>
        <Tabs value={mode} onValueChange={(value) => setMode(value as GraphDisplayMode)}>
          <TabsList>
            <TabsTrigger value="screen">Screen</TabsTrigger>
            <TabsTrigger value="compact">Compact</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="min-h-0 flex-1 rounded-md border border-border bg-muted/20">
        <ReactFlowProvider key={fitViewKey}>
          <div className="h-full">
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              onSelectNode={onSelectNode}
              onClearSelection={onClearSelection}
            />
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  )
}
