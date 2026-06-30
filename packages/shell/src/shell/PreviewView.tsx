import type { WireframePreviewSource } from '@shell/types/wireframe-document'
import { useMemo } from 'react'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'
import { modalIdsByScreenFromRoutes, type RouteEntry } from './router'

export type PreviewViewProps = {
  validScreenIds: readonly string[]
  routes: readonly RouteEntry[]
  preview: WireframePreviewSource
  routePrefix?: string
}

export function PreviewView({
  validScreenIds,
  routes,
  preview,
  routePrefix = '',
}: PreviewViewProps) {
  const modalIdsByScreen = useMemo(() => modalIdsByScreenFromRoutes(routes), [routes])

  return (
    <WireframeViewProvider
      view="preview"
      navigate={() => {}}
      routePrefix={routePrefix}
      validScreenIds={validScreenIds}
      modalIdsByScreen={modalIdsByScreen}
    >
      <div className="flex flex-col gap-8">
        {preview.kind === 'mdx' ? (
          <preview.component />
        ) : (
          preview.screens.map((screen) => <screen.component key={screen.id} />)
        )}
      </div>
    </WireframeViewProvider>
  )
}
