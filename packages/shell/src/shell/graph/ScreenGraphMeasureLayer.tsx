import { WireframeViewProvider } from '@shell/runtime/WireframeViewContext'
import { type ComponentType, useLayoutEffect, useRef } from 'react'
import type { NavigationGraph } from '../../plugin/types'
import { modalIdsByScreenFromRoutes, type RouteEntry } from '../router'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'
import {
  isScreenMeasurementComplete,
  normalizeMeasuredSize,
  type ScreenNodeSizeMap,
} from './screen-node-size'

export type ScreenGraphMeasureLayerProps = {
  graph: NavigationGraph
  routes: readonly RouteEntry[]
  onMeasured: (sizes: ScreenNodeSizeMap) => void
}

type MeasureItemProps = {
  screenId: string
  isEntry: boolean
  component: ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  onSize: (screenId: string, size: { width: number; height: number }) => void
}

function MeasureItem({
  screenId,
  isEntry,
  component: Screen,
  validScreenIds,
  modalIdsByScreen,
  onSize,
}: MeasureItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    onSize(screenId, normalizeMeasuredSize(element.getBoundingClientRect()))
  })

  return (
    <ScreenGraphNodeShell isEntry={isEntry} containerRef={ref}>
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={validScreenIds}
        modalIdsByScreen={modalIdsByScreen}
      >
        <Screen />
      </WireframeViewProvider>
    </ScreenGraphNodeShell>
  )
}

export function ScreenGraphMeasureLayer({
  graph,
  routes,
  onMeasured,
}: ScreenGraphMeasureLayerProps) {
  const collectedRef = useRef(new Map<string, { width: number; height: number }>())
  const routeById = new Map(routes.map((route) => [route.id, route]))
  const validScreenIds = routes.map((route) => route.id)
  const modalIdsByScreen = modalIdsByScreenFromRoutes(routes)
  const expectedScreenIds = graph.nodes.map((node) => node.id).filter((id) => routeById.has(id))

  const handleSize = (screenId: string, size: { width: number; height: number }) => {
    collectedRef.current.set(screenId, size)
    if (isScreenMeasurementComplete(expectedScreenIds, collectedRef.current)) {
      onMeasured(new Map(collectedRef.current))
    }
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0"
      style={{ visibility: 'hidden' }}
    >
      {graph.nodes.map((node) => {
        const route = routeById.get(node.id)
        if (!route) return null
        return (
          <MeasureItem
            key={node.id}
            screenId={node.id}
            isEntry={node.isEntry}
            component={route.component}
            validScreenIds={validScreenIds}
            modalIdsByScreen={modalIdsByScreen}
            onSize={handleSize}
          />
        )
      })}
    </div>
  )
}
