/** Strip trailing slash; empty string when deployed at site root. */
export function appBasePath(): string {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return ''
  return base.replace(/\/$/, '')
}

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
}

/** Browser pathname → app route path (e.g. `/Storyboard/login` → `/login`). */
export function toAppPath(pathname: string): string {
  const normalized = normalizePath(pathname)
  const base = appBasePath()
  if (!base) return normalized
  if (normalized === base) return '/'
  if (normalized.startsWith(`${base}/`)) return normalized.slice(base.length) || '/'
  return normalized
}

/** App route path → browser pathname for History API. */
export function toBrowserPath(appPath: string): string {
  const path = appPath.startsWith('/') ? appPath : `/${appPath}`
  const base = appBasePath()
  return base ? `${base}${path}` : path
}
