import type { ReactNode } from 'react'

export type ScreenProps = {
  id: string
  title: string
  children: ReactNode
}

export function Screen({ id, title, children }: ScreenProps) {
  return (
    <section id={id} aria-label={title}>
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      <div className="border border-current p-4">
        <div className="space-y-2">{children}</div>
      </div>
    </section>
  )
}
