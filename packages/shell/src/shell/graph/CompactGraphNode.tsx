import type { Node, NodeProps } from '@xyflow/react'
import { useNodeId, useReactFlow, useStore } from '@xyflow/react'
import type { ComponentType } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { BoundaryHandles } from './BoundaryHandles'
import {
  COMPACT_NODE_HEIGHT,
  COMPACT_NODE_WIDTH,
  COMPACT_PREVIEW_NODE_Z_INDEX,
  GRAPH_NODE_Z_INDEX,
} from './build-react-flow-graph'
import { CompactGraphScreenPreview } from './CompactGraphScreenPreview'
import {
  COMPACT_PREVIEW_CLOSE_DELAY_MS,
  COMPACT_PREVIEW_REVEAL_DURATION_MS,
  COMPACT_PREVIEW_REVEAL_PADDING,
  computeCompactPreviewBounds,
  isBoundsVisibleInViewport,
  viewportToRevealBounds,
} from './compact-preview-bounds'
import type { MeasuredScreenNodeSize } from './screen-node-size'

export type CompactGraphNodeData = {
  title: string
  screenId: string
  note?: string
  incoming: number
  outgoing: number
  isEntry: boolean
  selected: boolean
  component?: ComponentType
  measuredSize?: MeasuredScreenNodeSize
  validScreenIds?: readonly string[]
  modalIdsByScreen?: ReadonlyMap<string, readonly string[]>
}

export type CompactGraphNodeType = Node<CompactGraphNodeData, 'compact'>

export function CompactGraphNode({ data }: NodeProps<CompactGraphNodeType>) {
  const nodeId = useNodeId()
  const { getNode, getViewport, setNodes, setViewport } = useReactFlow()
  const containerWidth = useStore((state) => state.width)
  const containerHeight = useStore((state) => state.height)
  const minZoom = useStore((state) => state.minZoom)
  const maxZoom = useStore((state) => state.maxZoom)
  const [previewOpen, setPreviewOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealLockRef = useRef(false)
  const component = data.component
  const measuredSize = data.measuredSize
  const validScreenIds = data.validScreenIds
  const modalIdsByScreen = data.modalIdsByScreen
  const canPreview =
    component !== undefined &&
    measuredSize !== undefined &&
    validScreenIds !== undefined &&
    modalIdsByScreen !== undefined

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openPreview = () => {
    clearCloseTimer()
    setPreviewOpen(true)
  }

  const scheduleClosePreview = () => {
    clearCloseTimer()
    const attemptClose = () => {
      if (revealLockRef.current) {
        closeTimerRef.current = setTimeout(attemptClose, COMPACT_PREVIEW_CLOSE_DELAY_MS)
        return
      }
      setPreviewOpen(false)
    }
    closeTimerRef.current = setTimeout(attemptClose, COMPACT_PREVIEW_CLOSE_DELAY_MS)
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!nodeId) return
    const nodeZ = previewOpen ? COMPACT_PREVIEW_NODE_Z_INDEX : GRAPH_NODE_Z_INDEX
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              zIndex: nodeZ,
              style: { ...node.style, zIndex: nodeZ },
            }
          : node,
      ),
    )
  }, [previewOpen, nodeId, setNodes])

  useEffect(() => {
    if (!previewOpen || !canPreview || !nodeId || !measuredSize) return
    if (containerWidth <= 0 || containerHeight <= 0) return

    const node = getNode(nodeId)
    if (!node) return

    const bounds = computeCompactPreviewBounds(node.position, measuredSize)
    const viewport = getViewport()

    if (
      isBoundsVisibleInViewport(
        bounds,
        viewport,
        containerWidth,
        containerHeight,
        COMPACT_PREVIEW_REVEAL_PADDING,
      )
    ) {
      return
    }

    revealLockRef.current = true
    const nextViewport = viewportToRevealBounds(
      bounds,
      viewport,
      containerWidth,
      containerHeight,
      minZoom,
      maxZoom,
      COMPACT_PREVIEW_REVEAL_PADDING,
    )

    void setViewport(nextViewport, { duration: COMPACT_PREVIEW_REVEAL_DURATION_MS }).finally(() => {
      setTimeout(() => {
        revealLockRef.current = false
      }, COMPACT_PREVIEW_CLOSE_DELAY_MS)
    })
  }, [
    previewOpen,
    canPreview,
    nodeId,
    measuredSize,
    containerWidth,
    containerHeight,
    minZoom,
    maxZoom,
    getNode,
    getViewport,
    setViewport,
  ])

  return (
    <article className="relative" onMouseEnter={openPreview} onMouseLeave={scheduleClosePreview}>
      <div
        className={cn(
          'relative box-border border bg-background p-3 text-sm shadow-none',
          data.isEntry && 'border-2 border-foreground',
          data.selected && 'ring-2 ring-foreground',
        )}
        style={{ width: COMPACT_NODE_WIDTH, height: COMPACT_NODE_HEIGHT }}
      >
        <BoundaryHandles className="wireframe-graph-boundary-handle" />
        <p className="font-medium">{data.title}</p>
        {data.note ? <p className="text-xs text-muted-foreground">{data.note}</p> : null}
        <p className="mt-2 text-xs text-muted-foreground">
          in {data.incoming} · out {data.outgoing}
        </p>
      </div>
      {previewOpen && canPreview ? (
        <CompactGraphScreenPreview
          title={data.title}
          isEntry={data.isEntry}
          component={component}
          measuredSize={measuredSize}
          validScreenIds={validScreenIds}
          modalIdsByScreen={modalIdsByScreen}
        />
      ) : null}
    </article>
  )
}
