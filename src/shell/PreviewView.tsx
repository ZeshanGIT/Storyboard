import type { ComponentType } from 'react'
import { useMemo } from 'react'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'
import { modalIdsByScreenFromRoutes, type RouteEntry } from './router'

export type PreviewViewProps = {
  validScreenIds: readonly string[]
  routes: readonly RouteEntry[]
  document: ComponentType
}

export function PreviewView({ validScreenIds, routes, document: Document }: PreviewViewProps) {
  const modalIdsByScreen = useMemo(() => modalIdsByScreenFromRoutes(routes), [routes])

  return (
    <WireframeViewProvider
      view="preview"
      navigate={() => {}}
      validScreenIds={validScreenIds}
      modalIdsByScreen={modalIdsByScreen}
    >
      <div className="flex flex-col gap-8">
        <Document />
      </div>
    </WireframeViewProvider>
  )
}
