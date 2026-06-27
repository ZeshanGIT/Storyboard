import {
  Background,
  ControlButton,
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
import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWireframeDisplayPreferences } from '@/runtime/WireframeDisplayPreferences'
import type { NavigationGraph } from '../plugin/types'
import { getCodegenErrors } from '../runtime/codegen-error'
import {
  buildReactFlowGraph,
  COMPACT_NODE_HEIGHT,
  COMPACT_NODE_WIDTH,
} from './graph/build-react-flow-graph'
import { CompactGraphNode } from './graph/CompactGraphNode'
import { GraphLoadingState } from './graph/GraphLoadingState'
import './graph/graph-view.css'
import { type GraphDisplayMode, layoutNavigationGraph } from './graph/layout-navigation-graph'
import { ScreenGraphMeasureLayer } from './graph/ScreenGraphMeasureLayer'
import { ScreenGraphNode } from './graph/ScreenGraphNode'
import type { ScreenNodeSizeMap } from './graph/screen-node-size'
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

const FIT_VIEW_PADDING = 0.04

type GraphFlowCanvasProps = {
  flowGraph: { nodes: Node[]; edges: Edge[] }
  layoutSignature: string
  onSelectNode: (id: string) => void
  onClearSelection: () => void
  onRequestLayoutReset: () => void
}

function GraphFlowCanvas({
  flowGraph,
  layoutSignature,
  onSelectNode,
  onClearSelection,
  onRequestLayoutReset,
}: GraphFlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowGraph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowGraph.edges)
  const { fitView } = useReactFlow()

  useEffect(() => {
    setNodes(flowGraph.nodes)
    setEdges(flowGraph.edges)
  }, [flowGraph, setNodes, setEdges])

  const runFitView = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitView({ padding: FIT_VIEW_PADDING, duration: 200 })
      })
    })
  }, [fitView])

  // Re-fit when layout inputs change (mode, measureKey, positions); not on selection.
  // biome-ignore lint/correctness/useExhaustiveDependencies: layoutSignature is the intentional trigger
  useEffect(() => {
    runFitView()
  }, [layoutSignature, runFitView])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelectNode(node.id)
    },
    [onSelectNode],
  )

  const onResetLayout = useCallback(() => {
    onRequestLayoutReset()
  }, [onRequestLayoutReset])

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
      defaultEdgeOptions={{
        type: 'smoothstep',
        zIndex: 0,
      }}
    >
      <Background />
      <Controls showFitView showZoom showInteractive={false}>
        <ControlButton onClick={onResetLayout} title="Reset arrangement">
          <RotateCcw className="size-4" aria-hidden />
        </ControlButton>
      </Controls>
      <MiniMap pannable zoomable />
    </ReactFlow>
  )
}

export function GraphView({ navigationGraph, routes, documentFilename }: GraphViewProps) {
  const codegenErrors = getCodegenErrors()
  const [mode, setMode] = useState<GraphDisplayMode>('screen')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [layoutResetKey, setLayoutResetKey] = useState(0)
  const [screenNodeSizes, setScreenNodeSizes] = useState<ScreenNodeSizeMap | null>(null)
  const { showLinkIndicators, showNoteIndicators } = useWireframeDisplayPreferences()

  const graphSignature = useMemo(
    () =>
      `${navigationGraph.nodes.map((node) => node.id).join(',')}|${navigationGraph.edges.map((edge) => edge.id).join(',')}`,
    [navigationGraph],
  )

  const measureKey = `${graphSignature}|${showLinkIndicators}|${showNoteIndicators}`
  const prevMeasureInputsRef = useRef<{ measureKey: string; mode: GraphDisplayMode } | null>(null)

  useEffect(() => {
    const prev = prevMeasureInputsRef.current
    prevMeasureInputsRef.current = { measureKey, mode }

    if (!prev) {
      if (mode !== 'screen') setScreenNodeSizes(null)
      return
    }

    if (prev.measureKey === measureKey && prev.mode === mode) return

    setScreenNodeSizes(null)
  }, [measureKey, mode])

  const positions = useMemo(() => {
    const layoutNodes =
      mode === 'compact'
        ? navigationGraph.nodes.map((node) => ({
            id: node.id,
            width: COMPACT_NODE_WIDTH,
            height: COMPACT_NODE_HEIGHT,
          }))
        : screenNodeSizes
          ? navigationGraph.nodes.flatMap((node) => {
              const size = screenNodeSizes.get(node.id)
              return size ? [{ id: node.id, width: size.width, height: size.height }] : []
            })
          : []

    if (layoutNodes.length !== navigationGraph.nodes.length) {
      return new Map<string, { x: number; y: number }>()
    }

    const layoutEdges = navigationGraph.edges.map((edge) => ({
      id: edge.id,
      from: edge.fromScreenId,
      to: edge.toScreenId,
    }))

    return layoutNavigationGraph(layoutNodes, layoutEdges)
  }, [navigationGraph, mode, screenNodeSizes])

  const flowGraph = useMemo(
    () =>
      buildReactFlowGraph({
        graph: navigationGraph,
        routes,
        mode,
        selectedId,
        positions,
        screenNodeSizes: mode === 'screen' ? (screenNodeSizes ?? undefined) : undefined,
      }),
    [navigationGraph, routes, mode, selectedId, positions, screenNodeSizes],
  )

  const isScreenLayoutReady = mode === 'compact' || screenNodeSizes !== null

  const layoutSignature = useMemo(() => {
    const positionPart = [...positions.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, pos]) => `${id}:${pos.x},${pos.y}`)
      .join('|')
    return `${measureKey}|${mode}|${layoutResetKey}|${positionPart}`
  }, [measureKey, mode, layoutResetKey, positions])

  const onSelectNode = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const onClearSelection = useCallback(() => {
    setSelectedId(null)
  }, [])

  const onRequestLayoutReset = useCallback(() => {
    setLayoutResetKey((key) => key + 1)
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
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-3">
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
      <div className="min-h-0 flex-1 border-border bg-muted/20">
        <div className="relative h-full">
          {mode === 'screen' && screenNodeSizes === null ? (
            <>
              <ScreenGraphMeasureLayer
                graph={navigationGraph}
                routes={routes}
                onMeasured={setScreenNodeSizes}
              />
              <GraphLoadingState />
            </>
          ) : null}
          {isScreenLayoutReady ? (
            <ReactFlowProvider>
              <div className="h-full">
                <GraphFlowCanvas
                  flowGraph={flowGraph}
                  layoutSignature={layoutSignature}
                  onSelectNode={onSelectNode}
                  onClearSelection={onClearSelection}
                  onRequestLayoutReset={onRequestLayoutReset}
                />
              </div>
            </ReactFlowProvider>
          ) : null}
        </div>
      </div>
    </div>
  )
}
