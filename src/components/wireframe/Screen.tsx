import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScreenProvider } from './ScreenContext'

export type ScreenProps = {
  id: string
  title: string
  children: ReactNode
}

export function Screen({ id, title, children }: ScreenProps) {
  return (
    <ScreenProvider screenId={id}>
      <section id={id} aria-label={title} className="scroll-mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </section>
    </ScreenProvider>
  )
}
