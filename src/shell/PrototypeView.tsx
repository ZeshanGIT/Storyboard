import { getCodegenError } from '../runtime/codegen-error'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'
import { type RouteEntry, usePrototypeRouter } from './router'

export type PrototypeViewProps = {
  routes: readonly RouteEntry[]
}

export function PrototypeView({ routes }: PrototypeViewProps) {
  const codegenError = getCodegenError()
  const { navigate, activeRoute } = usePrototypeRouter(routes)
  const Active = activeRoute?.component
  const validScreenIds = routes.map((route) => route.id)

  if (codegenError) {
    return (
      <p className="text-red-900">
        Prototype unavailable until codegen errors in <code>wireframe.mdx</code> are fixed.
      </p>
    )
  }

  return (
    <WireframeViewProvider view="prototype" navigate={navigate} validScreenIds={validScreenIds}>
      <div className="min-h-[200px]">{Active ? <Active /> : <p>No routes defined.</p>}</div>
    </WireframeViewProvider>
  )
}
