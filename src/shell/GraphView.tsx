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
  GRAPH_EDGE_STROKE,
  GRAPH_EDGE_Z_INDEX,
  GRAPH_HIGHLIGHTED_EDGE_Z_INDEX,
} from './graph/build-react-flow-graph'
import { CompactGraphNode } from './graph/CompactGraphNode'
import type { NodeRect } from './graph/compute-edge-ports'
import { GraphLoadingState } from './graph/GraphLoadingState'
import { graphLinkRectsEqual } from './graph/measure-link-handle-positions'
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
const FOCUS_SCREEN_PADDING = 0.15
const FOCUS_SCREEN_DURATION_MS = 450
const GRAPH_EDGE_INTERACTION_WIDTH = 40

type GraphFlowCanvasProps = {
  nodes: Node[]
  edges: Edge[]
  highlightedLinkId: string | null
  onHighlightLink: (linkId: string | null) => void
  focusTargetScreenId: string | null
  onFocusTargetHandled: () => void
  layoutSignature: string
  onSelectNode: (id: string) => void
  onClearSelection: () => void
  onRequestLayoutReset: () => void
}

function linkIdFromEdge(edge: Edge): string | undefined {
  const linkId = edge.data?.linkId
  return typeof linkId === 'string' ? linkId : undefined
}

function applyEdgeHighlight(edges: Edge[], highlightedLinkId: string | null): Edge[] {
  if (!highlightedLinkId) return edges

  return edges.map((edge) => {
    const isHighlighted = linkIdFromEdge(edge) === highlightedLinkId
    return {
      ...edge,
      zIndex: isHighlighted ? GRAPH_HIGHLIGHTED_EDGE_Z_INDEX : GRAPH_EDGE_Z_INDEX,
      className: isHighlighted ? 'wireframe-graph-edge-highlighted' : 'wireframe-graph-edge-dimmed',
    }
  })
}

function GraphFlowCanvas({
  nodes,
  edges,
  highlightedLinkId,
  onHighlightLink,
  focusTargetScreenId,
  onFocusTargetHandled,
  layoutSignature,
  onSelectNode,
  onClearSelection,
  onRequestLayoutReset,
}: GraphFlowCanvasProps) {
  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges)
  const { fitView } = useReactFlow()

  useEffect(() => {
    setNodes(nodes)
  }, [nodes, setNodes])

  useEffect(() => {
    setEdges(applyEdgeHighlight(edges, highlightedLinkId))
  }, [edges, highlightedLinkId, setEdges])

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

  useEffect(() => {
    if (!focusTargetScreenId) return
    void fitView({
      nodes: [{ id: focusTargetScreenId }],
      padding: FOCUS_SCREEN_PADDING,
      duration: FOCUS_SCREEN_DURATION_MS,
    }).finally(onFocusTargetHandled)
  }, [focusTargetScreenId, fitView, onFocusTargetHandled])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelectNode(node.id)
    },
    [onSelectNode],
  )

  const onResetLayout = useCallback(() => {
    onRequestLayoutReset()
  }, [onRequestLayoutReset])

  const onEdgeMouseEnter = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const linkId = linkIdFromEdge(edge)
      if (linkId) onHighlightLink(linkId)
    },
    [onHighlightLink],
  )

  const onEdgeMouseLeave = useCallback(() => {
    onHighlightLink(null)
  }, [onHighlightLink])

  // React Flow marks edges inactive (no pointer events) unless selectable or onEdgeClick is set.
  const onEdgeClick = useCallback(() => {}, [])

  return (
    <ReactFlow
      className="h-full"
      defaultMarkerColor={GRAPH_EDGE_STROKE}
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={graphNodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onClearSelection}
      onEdgeMouseEnter={onEdgeMouseEnter}
      onEdgeMouseLeave={onEdgeMouseLeave}
      onEdgeClick={onEdgeClick}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      zIndexMode="manual"
      onlyRenderVisibleElements
      panOnScroll
      zoomOnScroll
      zoomOnPinch
      defaultEdgeOptions={{
        type: 'default',
        zIndex: GRAPH_EDGE_Z_INDEX,
        interactionWidth: GRAPH_EDGE_INTERACTION_WIDTH,
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
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)
  const [focusTargetScreenId, setFocusTargetScreenId] = useState<string | null>(null)
  const [linkRectsByScreen, setLinkRectsByScreen] = useState<Map<string, Map<string, NodeRect>>>(
    () => new Map(),
  )
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

    if (!prev) return

    if (prev.measureKey !== measureKey) {
      setScreenNodeSizes(null)
    }
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

  const onGraphLinkHover = useCallback((linkId: string | null) => {
    setHighlightedLinkId(linkId)
  }, [])

  const onGraphLinkFocus = useCallback((linkId: string, targetScreenId: string) => {
    setHighlightedLinkId(linkId)
    setSelectedId(targetScreenId)
    setFocusTargetScreenId(targetScreenId)
  }, [])

  const onFocusTargetHandled = useCallback(() => {
    setFocusTargetScreenId(null)
  }, [])

  const onLinkRects = useCallback((screenId: string, rects: Map<string, NodeRect>) => {
    setLinkRectsByScreen((prev) => {
      const existing = prev.get(screenId)
      if (existing && graphLinkRectsEqual(existing, rects)) return prev
      const next = new Map(prev)
      next.set(screenId, rects)
      return next
    })
  }, [])

  const flowGraphInput = useMemo(
    () => ({
      graph: navigationGraph,
      routes,
      mode,
      selectedId,
      positions,
      screenNodeSizes: screenNodeSizes ?? undefined,
      onGraphLinkHover,
      onGraphLinkFocus,
      onLinkRects: mode === 'screen' ? onLinkRects : undefined,
    }),
    [
      navigationGraph,
      routes,
      mode,
      selectedId,
      positions,
      screenNodeSizes,
      onGraphLinkHover,
      onGraphLinkFocus,
      onLinkRects,
    ],
  )

  const baseFlowNodes = useMemo(() => buildReactFlowGraph(flowGraphInput).nodes, [flowGraphInput])

  const baseFlowEdges = useMemo(
    () =>
      buildReactFlowGraph({
        ...flowGraphInput,
        linkRectsByScreen: mode === 'screen' ? linkRectsByScreen : undefined,
      }).edges,
    [flowGraphInput, linkRectsByScreen, mode],
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
    setHighlightedLinkId(null)
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
          {screenNodeSizes === null ? (
            <ScreenGraphMeasureLayer
              graph={navigationGraph}
              routes={routes}
              onMeasured={setScreenNodeSizes}
            />
          ) : null}
          {mode === 'screen' && screenNodeSizes === null ? <GraphLoadingState /> : null}
          {isScreenLayoutReady ? (
            <ReactFlowProvider>
              <div className="h-full">
                <GraphFlowCanvas
                  nodes={baseFlowNodes}
                  edges={baseFlowEdges}
                  highlightedLinkId={highlightedLinkId}
                  onHighlightLink={onGraphLinkHover}
                  focusTargetScreenId={focusTargetScreenId}
                  onFocusTargetHandled={onFocusTargetHandled}
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
