import { type Node, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { BoundaryHandles } from './BoundaryHandles'
import { COMPACT_NODE_HEIGHT, COMPACT_NODE_WIDTH } from './build-react-flow-graph'

export type CompactGraphNodeData = {
  title: string
  screenId: string
  note?: string
  incoming: number
  outgoing: number
  isEntry: boolean
  selected: boolean
}

export type CompactGraphNodeType = Node<CompactGraphNodeData, 'compact'>

export function CompactGraphNode({ data }: NodeProps<CompactGraphNodeType>) {
  return (
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
  )
}
