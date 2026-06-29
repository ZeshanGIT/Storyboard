import { type ComponentType, useMemo } from 'react'
import type { NavigateAppUrl } from './use-app-url'

export type RouteEntry = {
  id: string
  path: string
  component: ComponentType
  modalIds?: readonly string[]
}

export function modalIdsByScreenFromRoutes(
  routes: readonly Pick<RouteEntry, 'id' | 'modalIds'>[],
): Map<string, readonly string[]> {
  return new Map(routes.map((route) => [route.id, route.modalIds ?? []]))
}

export type PrototypeRouterOptions = {
  screenId?: string
  navigate: NavigateAppUrl
}

export function usePrototypeRouter(routes: readonly RouteEntry[], options: PrototypeRouterOptions) {
  const defaultRoute = routes[0]
  const activeRoute = useMemo(() => {
    if (options.screenId) {
      const match = routes.find((route) => route.id === options.screenId)
      if (match) return match
    }
    return defaultRoute
  }, [routes, options.screenId, defaultRoute])

  const navigateToScreen = (path: string) => {
    const route = routes.find((entry) => entry.path === path)
    if (!route) return
    options.navigate({ view: 'prototype', screenId: route.id })
  }

  return {
    navigate: navigateToScreen,
    activeRoute,
    activePath: activeRoute?.path ?? '/',
  }
}
