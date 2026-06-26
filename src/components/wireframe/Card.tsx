import type { ReactNode } from 'react'
import { wireframeBox, wireframeStack } from './wireframeStyles'

export type CardProps = {
  title?: string
  children: ReactNode
}

export function Card({ title, children }: CardProps) {
  return (
    <div className={wireframeBox}>
      {title ? <h3 className="font-medium">{title}</h3> : null}
      <div className={wireframeStack}>{children}</div>
    </div>
  )
}
