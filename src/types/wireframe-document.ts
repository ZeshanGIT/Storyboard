import type { ComponentType } from 'react'
import type { RouteEntry } from '@/shell/router'
import type { NavigationGraph } from './navigation'

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
}
