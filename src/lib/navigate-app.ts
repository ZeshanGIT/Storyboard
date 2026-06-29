import { toBrowserPath } from '@/lib/app-base-path'
import { buildAppUrl } from '@/lib/app-url'

export function navigateToAppPath(appPath: string, search = ''): void {
  window.history.pushState({}, '', `${toBrowserPath(appPath)}${search}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function openPlayground(source: 'json' | 'mdx' = 'json'): void {
  const { appPath, search } = buildAppUrl({
    app: 'playground',
    source,
    docSlug: 'playground',
    view: 'preview',
  })
  navigateToAppPath(appPath, search)
}
