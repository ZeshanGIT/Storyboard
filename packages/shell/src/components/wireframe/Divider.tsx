import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'
import { type NoteProps, WireframeNote } from './note'

export type DividerProps = NoteProps & {
  label?: string
  disabled?: boolean
  danger?: boolean
}

export function Divider({ label, disabled, danger, note }: DividerProps) {
  if (label) {
    return (
      <WireframeNote note={note}>
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
      </WireframeNote>
    )
  }

  return (
    <WireframeNote note={note}>
      <Separator className={cn('my-2', wireframeAffordanceClass(disabled, danger))} />
    </WireframeNote>
  )
}
