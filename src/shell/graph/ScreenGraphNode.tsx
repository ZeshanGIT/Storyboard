import type { Node, NodeProps } from '@xyflow/react'
import type { ComponentType } from 'react'
import { WireframeViewProvider } from '@/runtime/WireframeViewContext'
import { BoundaryHandles } from './BoundaryHandles'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'
import type { MeasuredScreenNodeSize } from './screen-node-size'

export type ScreenGraphNodeData = {
  screenId: string
  title: string
  isEntry: boolean
  selected: boolean
  component: ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  measuredSize: MeasuredScreenNodeSize
  onGraphLinkHover?: (linkId: string | null) => void
}

export type ScreenGraphNodeType = Node<ScreenGraphNodeData, 'screen'>

export function ScreenGraphNode({ data }: NodeProps<ScreenGraphNodeType>) {
  const Screen = data.component

  return (
    <ScreenGraphNodeShell
      isEntry={data.isEntry}
      selected={data.selected}
      width={data.measuredSize.width}
      height={data.measuredSize.height}
    >
      <BoundaryHandles className="wireframe-graph-boundary-handle" />
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={data.validScreenIds}
        modalIdsByScreen={data.modalIdsByScreen}
        onGraphLinkHover={data.onGraphLinkHover}
      >
        <Screen />
      </WireframeViewProvider>
    </ScreenGraphNodeShell>
  )
}
