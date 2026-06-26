import type { ReactNode } from 'react'
import { wireframeBox, wireframeStack } from './wireframeStyles'

export type SectionProps = {
  title?: string
  children: ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className={wireframeBox}>
      {title ? <h3 className="font-medium">{title}</h3> : null}
      <div className={wireframeStack}>{children}</div>
    </section>
  )
}
