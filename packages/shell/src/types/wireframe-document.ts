import type { ComponentType } from 'react'
import type { NavigationGraph } from './navigation'
import type { RouteEntry } from './route'

export type WireframePreviewSource =
  | { kind: 'mdx'; component: ComponentType }
  | {
      kind: 'screens'
      screens: readonly { id: string; title?: string; component: ComponentType }[]
    }

export type WireframeDocumentBundle = {
  slug: string
  title: string
  source: 'mdx' | 'json'
  routes: readonly RouteEntry[]
  navigationGraph: NavigationGraph
  preview: WireframePreviewSource
  /** Prototype screen paths live under this prefix (e.g. `/playground`). */
  routePrefix?: string
}
