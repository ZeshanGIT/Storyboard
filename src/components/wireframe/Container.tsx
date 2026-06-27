import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'

export type ContainerDistribute = 'start' | 'space-between' | 'space-around' | 'end'
export type ContainerAlign = 'start' | 'center' | 'end'

export type ContainerProps = {
  row?: boolean
  border?: boolean
  distribute?: ContainerDistribute
  align?: ContainerAlign
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}

const distributeClass: Record<ContainerDistribute, string> = {
  start: 'justify-start',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  end: 'justify-end',
}

const alignClass: Record<ContainerAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
}

export function Container({
  row,
  border,
  distribute = 'start',
  align = 'start',
  disabled,
  danger,
  children,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'flex gap-4',
        row ? 'flex-row' : 'flex-col',
        row && distributeClass[distribute],
        alignClass[align],
        border && 'border border-border p-4',
        wireframeAffordanceClass(disabled, danger),
      )}
    >
      {children}
    </div>
  )
}
