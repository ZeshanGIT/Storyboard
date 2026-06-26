import type { ReactNode } from 'react'
import { CardContent, CardHeader, CardTitle, Card as ShadcnCard } from '@/components/ui/card'

export type CardProps = {
  title?: string
  children: ReactNode
}

export function Card({ title, children }: CardProps) {
  return (
    <ShadcnCard>
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-2 pt-0">{children}</CardContent>
    </ShadcnCard>
  )
}
