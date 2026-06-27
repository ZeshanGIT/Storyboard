import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type NoteProps = {
  note?: string
}

type WireframeNoteProps = NoteProps & {
  children: ReactNode
  className?: string
}

const CLOSE_DELAY_MS = 120

export function WireframeNote({ note, children, className }: WireframeNoteProps) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const keepOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  if (!note) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label="Author note"
              className="absolute top-0 right-0 z-10 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 ring-2 ring-background"
              onMouseEnter={keepOpen}
              onMouseLeave={scheduleClose}
            />
          }
        />
        <PopoverContent
          side="left"
          align="end"
          sideOffset={8}
          className="max-w-xs"
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
        >
          <PopoverTitle className="sr-only">Note</PopoverTitle>
          <PopoverDescription>{note}</PopoverDescription>
        </PopoverContent>
      </Popover>
    </div>
  )
}
