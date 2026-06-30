import { cn } from '@/lib/utils'

export function wireframeAffordanceClass(disabled?: boolean, danger?: boolean): string {
  return cn(
    disabled && 'pointer-events-none opacity-50',
    danger && 'border-destructive text-destructive',
  )
}
