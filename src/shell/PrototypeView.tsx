import { WireframeViewProvider } from '../runtime/WireframeViewContext'
import { usePrototypeRouter, type RouteEntry } from './router'

export type PrototypeViewProps = {
  routes: readonly RouteEntry[]
}

export function PrototypeView({ routes }: PrototypeViewProps) {
  const { navigate, activeRoute } = usePrototypeRouter(routes)
  const Active = activeRoute?.component

  return (
    <WireframeViewProvider view="prototype" navigate={navigate}>
      <div className="min-h-[200px]">
        {Active ? <Active /> : <p>No routes defined.</p>}
      </div>
    </WireframeViewProvider>
  )
}
