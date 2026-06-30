import { buildAppUrl, type PlaygroundSource, parseAppUrl, toAppPath } from '@storyboard/shell'
import { useCallback, useEffect, useState } from 'react'
import { navigateToAppPath } from '@/lib/navigate-app'
import { defaultJsonDocumentSlug, isContentJsonSlug } from './content-json'

const MDX_PLAYGROUND_SLUG = 'playground'

function docSlugForSource(source: PlaygroundSource, currentSlug?: string): string {
  if (source === 'mdx') return MDX_PLAYGROUND_SLUG
  if (currentSlug && isContentJsonSlug(currentSlug)) return currentSlug
  return defaultJsonDocumentSlug()
}

function readSource(): PlaygroundSource {
  const parsed = parseAppUrl({
    appPath: toAppPath(window.location.pathname),
    search: window.location.search,
  })
  return parsed?.app === 'playground' && parsed.source ? parsed.source : 'json'
}

export function usePlaygroundSource(): {
  source: PlaygroundSource
  setSource: (next: PlaygroundSource) => void
} {
  const [source, setSourceState] = useState<PlaygroundSource>(readSource)

  useEffect(() => {
    const onPopState = () => setSourceState(readSource())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setSource = useCallback((next: PlaygroundSource) => {
    const current = parseAppUrl({
      appPath: toAppPath(window.location.pathname),
      search: window.location.search,
    })
    const { appPath, search } = buildAppUrl(
      current?.app === 'playground'
        ? { ...current, source: next, docSlug: docSlugForSource(next, current.docSlug) }
        : {
            app: 'playground',
            source: next,
            docSlug: docSlugForSource(next),
            view: 'preview',
          },
    )
    navigateToAppPath(appPath, search)
    setSourceState(next)
  }, [])

  return { source, setSource }
}
