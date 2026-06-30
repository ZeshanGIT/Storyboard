import { useWireframeView } from '@shell/runtime/WireframeViewContext'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { type NoteProps, WireframeNote } from './note'
import { ScreenProvider } from './ScreenContext'

export type ScreenProps = NoteProps & {
  id: string
  title?: string
  children: ReactNode
}

export function Screen({ id, title, note, children }: ScreenProps) {
  const { view } = useWireframeView()

  return (
    <ScreenProvider screenId={id}>
      <WireframeNote note={note}>
        <section
          id={id}
          aria-label={title ?? id}
          className={cn(
            'flex flex-col gap-4',
            view === 'preview' && 'scroll-mt-8 border border-border p-4',
          )}
        >
          {view === 'preview' && title ? (
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
          ) : null}
          {children}
        </section>
      </WireframeNote>
    </ScreenProvider>
  )
}
