import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { type ComponentType, useRef } from 'react'
import { cn } from '@/lib/utils'
import { WireframeViewProvider } from '@/runtime/WireframeViewContext'
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
}

export type ScreenGraphNodeType = Node<ScreenGraphNodeData, 'screen'>

export function ScreenGraphNode({ data }: NodeProps<ScreenGraphNodeType>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handles = useGraphLinkHandles(containerRef, data.outgoingLinkIds)
  const Screen = data.component

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-md border bg-background p-2',
        data.isEntry && 'border-2 border-foreground',
        data.selected && 'ring-2 ring-foreground',
      )}
    >
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={data.validScreenIds}
        modalIdsByScreen={data.modalIdsByScreen}
      >
        <div className="pointer-events-none origin-top-left scale-[0.65]">
          <Screen />
        </div>
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
    </div>
  )
}
