import { type ComponentType, useCallback, useEffect, useMemo, useState } from 'react'
import { toAppPath, toBrowserPath } from '@/lib/app-base-path'

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

export function usePrototypeRouter(routes: readonly RouteEntry[]) {
  const defaultPath = routes[0]?.path ?? '/'
  const [pathname, setPathname] = useState(() => toAppPath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setPathname(toAppPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((path: string) => {
    const appPath = path.startsWith('/') ? path : `/${path}`
    const browserPath = toBrowserPath(appPath)
    window.history.pushState({}, '', browserPath)
    setPathname(appPath)
  }, [])

  const activePath = useMemo(() => {
    if (pathname === '/' || pathname === '') return defaultPath
    return routes.some((r) => r.path === pathname) ? pathname : defaultPath
  }, [pathname, routes, defaultPath])

  const activeRoute = routes.find((r) => r.path === activePath) ?? routes[0]

  useEffect(() => {
    if (pathname === '/' && defaultPath !== '/') {
      navigate(defaultPath)
    }
  }, [pathname, defaultPath, navigate])

  return { navigate, activeRoute, activePath }
}
