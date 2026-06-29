import { extractNavigationGraphFromScreens } from '@/plugin/extract-navigation-graph'
import type { WireframeDocumentBundle } from '@/types/wireframe-document'
import type { JsonDocumentBuilt } from './build-json-document'
import { buildScreenComponent } from './build-screen-component'

export function jsonToWireframeDocumentBundle(
  built: JsonDocumentBuilt,
  slug = 'json-document',
): WireframeDocumentBundle {
  const components = new Map(
    built.screens.map((screen) => [screen.id, buildScreenComponent(screen)] as const),
  )

  const routes = built.screens.map((screen) => ({
    id: screen.id,
    path: `/${screen.id}`,
    component: components.get(screen.id)!,
    ...(screen.modalIds.length > 0 ? { modalIds: screen.modalIds } : {}),
  }))

  const navigationGraph = extractNavigationGraphFromScreens(
    built.screens.map((s) => ({
      id: s.id,
      title: s.title,
      order: s.order,
      jsx: '',
      modalIds: s.modalIds,
      links: s.links,
      note: s.note,
    })),
  )

  return {
    slug,
    title: built.title,
    source: 'json',
    routes,
    navigationGraph,
    preview: {
      kind: 'screens',
      screens: built.screens.map((s) => ({
        id: s.id,
        title: s.title,
        component: components.get(s.id)!,
      })),
    },
  }
}
