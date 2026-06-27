import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useWireframeDisplayPreferences } from '@/runtime/WireframeDisplayPreferences'

export type NoteProps = {
  note?: string
}

type WireframeNoteProps = NoteProps & {
  children: ReactNode
  className?: string
}

export function WireframeNote({ note, children, className }: WireframeNoteProps) {
  const { showNoteIndicators } = useWireframeDisplayPreferences()

  if (!note || !showNoteIndicators) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Author note"
              className="absolute top-0 right-0 z-10 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 ring-2 ring-background"
            />
          }
        />
        <TooltipContent side="left" align="center" sideOffset={6}>
          {note}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
