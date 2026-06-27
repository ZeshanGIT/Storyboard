import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useWireframeView } from '@/runtime/WireframeViewContext'
import { ScreenProvider } from './ScreenContext'

export type ScreenProps = {
  id: string
  title?: string
  children: ReactNode
}

export function Screen({ id, title, children }: ScreenProps) {
  const { view } = useWireframeView()

  return (
    <ScreenProvider screenId={id}>
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
    </ScreenProvider>
  )
}
