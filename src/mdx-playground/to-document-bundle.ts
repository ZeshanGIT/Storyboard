import { MDX_APP_PREFIX, PLAYGROUND_APP_PATH, screenRoutePath } from '@/lib/app-routes'
import type { MdxPlaygroundBuilt } from '@/playground/compile-playground-mdx'
import { extractNavigationGraphFromScreens } from '@/plugin/extract-navigation-graph'
import type { WireframeDocumentBundle } from '@/types/wireframe-document'
import { buildMdxScreenComponent } from './build-mdx-screen-component'

export function mdxToWireframeDocumentBundle(
  built: MdxPlaygroundBuilt,
  slug = 'playground',
  options: { playground?: boolean } = {},
): WireframeDocumentBundle {
  const routePrefix = options.playground
    ? `${PLAYGROUND_APP_PATH}/mdx/${slug}`
    : `${MDX_APP_PREFIX}/${slug}`

  const screens = built.document.screens
  const components = new Map(
    screens.map((screen) => [screen.id, buildMdxScreenComponent(screen)] as const),
  )

  const routes = screens.map((screen) => {
    const component = components.get(screen.id)
    if (!component) {
      throw new Error(`Missing component for screen "${screen.id}"`)
    }
    return {
      id: screen.id,
      path: screenRoutePath(routePrefix, screen.id),
      component,
      ...(screen.modalIds.length > 0 ? { modalIds: screen.modalIds } : {}),
    }
  })

  const navigationGraph = extractNavigationGraphFromScreens(
    screens.map((screen) => ({
      id: screen.id,
      title: screen.title,
      order: screen.order,
      jsx: '',
      modalIds: screen.modalIds,
      links: screen.links,
      note: screen.note,
    })),
  )

  return {
    slug,
    title: built.title,
    source: 'mdx',
    routes,
    navigationGraph,
    routePrefix,
    preview: {
      kind: 'screens',
      screens: screens.map((screen) => {
        const component = components.get(screen.id)
        if (!component) {
          throw new Error(`Missing component for screen "${screen.id}"`)
        }
        return {
          id: screen.id,
          title: screen.title,
          component,
        }
      }),
    },
  }
}
