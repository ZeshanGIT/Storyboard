import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { type ComponentType, useRef } from 'react'
import { WireframeViewProvider } from '@/runtime/WireframeViewContext'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'
import type { MeasuredScreenNodeSize } from './screen-node-size'
import { useGraphLinkHandles } from './useGraphLinkHandles'

export type ScreenGraphNodeData = {
  screenId: string
  title: string
  isEntry: boolean
  selected: boolean
  outgoingLinkIds: string[]
  component: ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  measuredSize: MeasuredScreenNodeSize
}

export type ScreenGraphNodeType = Node<ScreenGraphNodeData, 'screen'>

export function ScreenGraphNode({ data }: NodeProps<ScreenGraphNodeType>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handles = useGraphLinkHandles(containerRef, data.outgoingLinkIds)
  const Screen = data.component

  return (
    <ScreenGraphNodeShell
      containerRef={containerRef}
      isEntry={data.isEntry}
      selected={data.selected}
      width={data.measuredSize.width}
      height={data.measuredSize.height}
    >
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={data.validScreenIds}
        modalIdsByScreen={data.modalIdsByScreen}
      >
        <Screen />
      </WireframeViewProvider>
      {data.outgoingLinkIds.map((linkId) => {
        const point = handles.get(linkId)
        if (!point) return null
        return (
          <Handle
            key={linkId}
            id={linkId}
            type="source"
            position={Position.Right}
            style={{ left: point.x, top: point.y }}
            className="h-2 w-2"
          />
        )
      })}
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </ScreenGraphNodeShell>
  )
}
