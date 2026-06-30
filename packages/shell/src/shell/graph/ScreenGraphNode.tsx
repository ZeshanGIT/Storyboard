import { WireframeViewProvider } from '@shell/runtime/WireframeViewContext'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { type ComponentType, type CSSProperties, useCallback, useMemo, useRef } from 'react'
import { BoundaryHandles } from './BoundaryHandles'
import {
  computeEdgePorts,
  type NodeRect,
  rectBoundaryAnchor,
  sourceHandleTransform,
} from './compute-edge-ports'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'
import type { MeasuredScreenNodeSize } from './screen-node-size'
import { useGraphLinkHandles } from './useGraphLinkHandles'

export type OutgoingGraphLink = {
  linkId: string
  toScreenId: string
}

export type ScreenGraphNodeData = {
  screenId: string
  title: string
  isEntry: boolean
  selected: boolean
  component: ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  measuredSize: MeasuredScreenNodeSize
  outgoingLinks: OutgoingGraphLink[]
  nodePosition: { x: number; y: number }
  screenRectsById: Map<string, NodeRect>
  onGraphLinkHover?: (linkId: string | null) => void
  onGraphLinkFocus?: (linkId: string, targetScreenId: string) => void
  onLinkRects?: (screenId: string, rects: Map<string, NodeRect>) => void
}

export type ScreenGraphNodeType = Node<ScreenGraphNodeData, 'screen'>

function sourceHandleToPosition(sourceHandle: string): Position {
  switch (sourceHandle) {
    case 'out-left':
      return Position.Left
    case 'out-top':
      return Position.Top
    case 'out-bottom':
      return Position.Bottom
    default:
      return Position.Right
  }
}

function toLocalScreenRect(flowRect: NodeRect, nodePosition: { x: number; y: number }): NodeRect {
  return {
    x: flowRect.x - nodePosition.x,
    y: flowRect.y - nodePosition.y,
    width: flowRect.width,
    height: flowRect.height,
  }
}

export function ScreenGraphNode({ data }: NodeProps<ScreenGraphNodeType>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const linkIds = useMemo(() => data.outgoingLinks.map((link) => link.linkId), [data.outgoingLinks])
  const targetByLinkId = useMemo(
    () => new Map(data.outgoingLinks.map((link) => [link.linkId, link.toScreenId])),
    [data.outgoingLinks],
  )
  const onMeasured = useCallback(
    (rects: Map<string, NodeRect>) => {
      data.onLinkRects?.(data.screenId, rects)
    },
    [data.onLinkRects, data.screenId],
  )
  const linkRects = useGraphLinkHandles(containerRef, linkIds, onMeasured)
  const Screen = data.component

  return (
    <ScreenGraphNodeShell
      containerRef={containerRef}
      isEntry={data.isEntry}
      selected={data.selected}
      width={data.measuredSize.width}
      height={data.measuredSize.height}
    >
      <BoundaryHandles className="wireframe-graph-boundary-handle" />
      {data.outgoingLinks.map(({ linkId }) => {
        const linkRect = linkRects.get(linkId)
        const toScreenId = targetByLinkId.get(linkId)
        const targetFlowRect = toScreenId ? data.screenRectsById.get(toScreenId) : undefined
        if (!linkRect || !targetFlowRect) return null

        const targetLocal = toLocalScreenRect(targetFlowRect, data.nodePosition)
        const { sourceHandle } = computeEdgePorts(linkRect, targetLocal)
        const point = rectBoundaryAnchor(linkRect, sourceHandle)

        return (
          <Handle
            key={linkId}
            id={linkId}
            type="source"
            position={sourceHandleToPosition(sourceHandle)}
            style={
              {
                '--wf-handle-x': `${point.x}px`,
                '--wf-handle-y': `${point.y}px`,
                transform: sourceHandleTransform(sourceHandle),
              } as CSSProperties
            }
            className="wireframe-graph-link-handle"
          />
        )
      })}
      <div className="relative z-10">
        <WireframeViewProvider
          view="graph"
          navigate={() => {}}
          validScreenIds={data.validScreenIds}
          modalIdsByScreen={data.modalIdsByScreen}
          onGraphLinkHover={data.onGraphLinkHover}
          onGraphLinkFocus={data.onGraphLinkFocus}
        >
          <Screen />
        </WireframeViewProvider>
      </div>
    </ScreenGraphNodeShell>
  )
}
