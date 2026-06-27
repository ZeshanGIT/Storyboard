import type { ReactNode, RefObject } from 'react'
import { cn } from '@/lib/utils'

export type ScreenGraphNodeShellProps = {
  isEntry: boolean
  selected?: boolean
  width?: number
  height?: number
  containerRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
}

export function ScreenGraphNodeShell({
  isEntry,
  selected = false,
  width,
  height,
  containerRef,
  children,
}: ScreenGraphNodeShellProps) {
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative box-border w-fit border bg-background p-2',
        isEntry && 'border-2 border-foreground',
        selected && 'ring-2 ring-foreground',
      )}
      style={width !== undefined && height !== undefined ? { width, height } : undefined}
    >
      {children}
    </div>
  )
}
