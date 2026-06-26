import type { ReactNode } from 'react'

export type ScreenProps = {
  id: string
  title: string
  children: ReactNode
}

export function Screen({ id, title, children }: ScreenProps) {
  return (
    <section id={id} aria-label={title} className="border border-current p-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}
