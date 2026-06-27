import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type GraphFlowCanvasProps = {
  flowGraph: { nodes: Node[]; edges: Edge[] }
  graphSignature: string
  mode: GraphDisplayMode
  selectedId: string | null
  onSelectNode: (id: string) => void
  onClearSelection: () => void
}

function GraphFlowCanvas({
  flowGraph,
  graphSignature,
  mode,
  selectedId,
  onSelectNode,
  onClearSelection,
}: GraphFlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowGraph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowGraph.edges)
  const { fitView } = useReactFlow()
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

  const prevModeRef = useRef(mode)
  const prevGraphSignatureRef = useRef(graphSignature)

  useEffect(() => {
    setNodes(flowGraph.nodes)
    setEdges(flowGraph.edges)
  }, [flowGraph, setNodes, setEdges])

  useEffect(() => {
    const graphChanged = prevGraphSignatureRef.current !== graphSignature
    const modeChanged = prevModeRef.current !== mode

    prevGraphSignatureRef.current = graphSignature
    prevModeRef.current = mode

    if (!graphChanged && !modeChanged) return

    requestAnimationFrame(() => {
      const id = selectedIdRef.current
      if (modeChanged && !graphChanged && id) {
        fitView({ nodes: [{ id }], padding: 0.2 })
      } else {
        fitView({ padding: 0.2 })
      }
    })
  }, [graphSignature, mode, fitView])

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
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={graphNodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onClearSelection}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
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

  const graphSignature = useMemo(
    () =>
      `${navigationGraph.nodes.map((node) => node.id).join(',')}|${navigationGraph.edges.map((edge) => edge.id).join(',')}`,
    [navigationGraph],
  )

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

  const flowGraph = useMemo(
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
        <ReactFlowProvider>
          <div className="h-full">
            <GraphFlowCanvas
              flowGraph={flowGraph}
              graphSignature={graphSignature}
              mode={mode}
              selectedId={selectedId}
              onSelectNode={onSelectNode}
              onClearSelection={onClearSelection}
            />
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  )
}
