import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'

export type RouteEntry = {
  id: string
  path: string
  component: ComponentType
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname
}

export function usePrototypeRouter(routes: readonly RouteEntry[]) {
  const defaultPath = routes[0]?.path ?? '/'
  const [pathname, setPathname] = useState(() =>
    normalizePath(window.location.pathname),
  )

  useEffect(() => {
    const onPopState = () => setPathname(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((path: string) => {
    const next = path.startsWith('/') ? path : `/${path}`
    window.history.pushState({}, '', next)
    setPathname(normalizePath(next))
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
