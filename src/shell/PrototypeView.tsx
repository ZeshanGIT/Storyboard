import { getCodegenError } from '../runtime/codegen-error'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'
import { type RouteEntry, usePrototypeRouter } from './router'

export type PrototypeViewProps = {
  routes: readonly RouteEntry[]
  documentFilename: string
}

export function PrototypeView({ routes, documentFilename }: PrototypeViewProps) {
  const codegenError = getCodegenError()
  const { navigate, activeRoute } = usePrototypeRouter(routes)
  const Active = activeRoute?.component
  const validScreenIds = routes.map((route) => route.id)

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
    <WireframeViewProvider view="prototype" navigate={navigate} validScreenIds={validScreenIds}>
      <div className="min-h-[200px]">{Active ? <Active /> : <p>No routes defined.</p>}</div>
    </WireframeViewProvider>
  )
}
