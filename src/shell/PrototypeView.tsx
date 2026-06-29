import { getCodegenError } from '../runtime/codegen-error'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'
import { modalIdsByScreenFromRoutes, type RouteEntry, usePrototypeRouter } from './router'
import type { NavigateAppUrl } from './use-app-url'

export type PrototypeViewProps = {
  routes: readonly RouteEntry[]
  documentFilename: string
  routePrefix?: string
  screenId?: string
  navigate: NavigateAppUrl
}

export function PrototypeView({
  routes,
  documentFilename,
  routePrefix = '',
  screenId,
  navigate,
}: PrototypeViewProps) {
  const codegenError = getCodegenError()
  const { navigate: navigateToScreen, activeRoute } = usePrototypeRouter(routes, {
    screenId,
    navigate,
  })
  const Active = activeRoute?.component
  const validScreenIds = routes.map((route) => route.id)
  const modalIdsByScreen = modalIdsByScreenFromRoutes(routes)

  if (codegenError) {
    return (
      <p className="text-red-900">
        Prototype unavailable until codegen errors in <code>{documentFilename}</code> are fixed.
      </p>
    )
  }

  if (routes.length === 0) {
    return <p className="text-muted-foreground">No screens in {documentFilename}.</p>
  }

  return (
    <WireframeViewProvider
      view="prototype"
      navigate={navigateToScreen}
      routePrefix={routePrefix}
      validScreenIds={validScreenIds}
      modalIdsByScreen={modalIdsByScreen}
    >
      <div className="min-h-[200px]">{Active ? <Active /> : <p>No routes defined.</p>}</div>
    </WireframeViewProvider>
  )
}
