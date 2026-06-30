import { buildAppUrl, toBrowserPath } from '@storyboard/shell'
import { defaultJsonDocumentSlug } from '@/playground/content-json'

const MDX_PLAYGROUND_SLUG = 'playground'

export function navigateToAppPath(appPath: string, search = ''): void {
  window.history.pushState({}, '', `${toBrowserPath(appPath)}${search}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function openPlayground(source: 'json' | 'mdx' = 'json'): void {
  const { appPath, search } = buildAppUrl({
    app: 'playground',
    source,
    docSlug: source === 'json' ? defaultJsonDocumentSlug() : MDX_PLAYGROUND_SLUG,
    view: 'preview',
  })
  navigateToAppPath(appPath, search)
}
