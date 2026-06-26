import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type SectionProps = {
  title?: string
  children: ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <Card>
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-4 pt-0">{children}</CardContent>
    </Card>
  )
}
