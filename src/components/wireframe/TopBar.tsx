import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWireframeView } from '@/runtime/WireframeViewContext'
import { wireframeAffordanceClass } from './affordances'
import { type NoteProps, WireframeNote } from './note'

export type TopBarProps = NoteProps & {
  title?: string
  showBack?: boolean
  disabled?: boolean
  danger?: boolean
  children?: ReactNode
}

export function TopBar({ title, showBack, disabled, danger, note, children }: TopBarProps) {
  const { view, goBack } = useWireframeView()

  return (
    <WireframeNote note={note}>
      <header
        className={cn(
          'flex items-center gap-3 border-b border-border pb-3',
          wireframeAffordanceClass(disabled, danger),
        )}
      >
        {showBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || view === 'preview'}
            onClick={() => goBack()}
          >
            Back
          </Button>
        ) : null}
        {title ? (
          <span className="flex-1 text-sm font-medium">{title}</span>
        ) : (
          <span className="flex-1" />
        )}
        {children ? <div className="flex items-center gap-2">{children}</div> : null}
      </header>
    </WireframeNote>
  )
}
