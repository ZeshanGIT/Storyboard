import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { cn } from '@/lib/utils'

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
        'min-w-[180px] rounded-md border bg-background p-3 text-sm shadow-none',
        data.isEntry && 'border-2 border-foreground',
        data.selected && 'ring-2 ring-foreground',
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <p className="font-medium">{data.title}</p>
      {data.note ? <p className="text-xs text-muted-foreground">{data.note}</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">
        in {data.incoming} · out {data.outgoing}
      </p>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}
