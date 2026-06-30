import { MDX_APP_PREFIX, PLAYGROUND_APP_PATH, screenRoutePath } from '@shell/lib/app-routes'
import { extractNavigationGraphFromScreens } from '@shell/plugin/extract-navigation-graph'
import type { WireframeDocumentBundle } from '@shell/types/wireframe-document'
import type { JsonDocumentBuilt } from './build-json-document'
import { buildScreenComponent } from './build-screen-component'

export function jsonToWireframeDocumentBundle(
  built: JsonDocumentBuilt,
  slug = 'json-document',
  options: { playground?: boolean } = {},
): WireframeDocumentBundle {
  const routePrefix = options.playground
    ? `${PLAYGROUND_APP_PATH}/json/${slug}`
    : `${MDX_APP_PREFIX}/${slug}`
  const components = new Map(
    built.screens.map((screen) => [screen.id, buildScreenComponent(screen)] as const),
  )

  const routes = built.screens.map((screen) => ({
    id: screen.id,
    path: screenRoutePath(routePrefix, screen.id),
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
    routePrefix,
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
