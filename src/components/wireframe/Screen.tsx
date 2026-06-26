import type { ReactNode } from 'react'
import { ScreenProvider } from './ScreenContext'
import { wireframeBox, wireframeStack } from './wireframeStyles'

export type ScreenProps = {
  id: string
  title: string
  children: ReactNode
}

export function Screen({ id, title, children }: ScreenProps) {
  return (
    <ScreenProvider screenId={id}>
      <section id={id} aria-label={title}>
        <h2 className="text-lg font-medium mb-2">{title}</h2>
        <div className={wireframeBox}>
          <div className={wireframeStack}>{children}</div>
        </div>
      </section>
    </ScreenProvider>
  )
}
