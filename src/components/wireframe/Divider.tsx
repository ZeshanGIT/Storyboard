import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'

export type DividerProps = {
  label?: string
  disabled?: boolean
  danger?: boolean
}

export function Divider({ label, disabled, danger }: DividerProps) {
  if (label) {
    return (
      <div
        className={cn(
          'relative flex items-center py-2',
          wireframeAffordanceClass(disabled, danger),
        )}
      >
        <Separator className="absolute inset-x-0" />
        <span className="relative mx-auto bg-background px-2 text-xs text-muted-foreground">
          {label}
        </span>
      </div>
    )
  }

  return <Separator className={cn('my-2', wireframeAffordanceClass(disabled, danger))} />
}
