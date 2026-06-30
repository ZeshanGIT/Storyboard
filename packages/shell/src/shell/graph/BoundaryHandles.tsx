import { Handle, Position } from '@xyflow/react'

const BOUNDARY_SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
  { id: 'right', position: Position.Right },
] as const

type BoundaryHandlesProps = {
  className?: string
}

export function BoundaryHandles({ className }: BoundaryHandlesProps) {
  return (
    <>
      {BOUNDARY_SIDES.flatMap((side) => [
        <Handle
          key={`in-${side.id}`}
          type="target"
          id={`in-${side.id}`}
          position={side.position}
          className={className}
        />,
        <Handle
          key={`out-${side.id}`}
          type="source"
          id={`out-${side.id}`}
          position={side.position}
          className={className}
        />,
      ])}
    </>
  )
}
