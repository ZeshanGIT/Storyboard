import { useCallback, useEffect, useState } from 'react'
import { toAppPath } from '@/lib/app-base-path'
import type { PlaygroundSource } from '@/lib/app-routes'
import { buildAppUrl, parseAppUrl } from '@/lib/app-url'
import { navigateToAppPath } from '@/lib/navigate-app'

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
        ? { ...current, source: next }
        : {
            app: 'playground',
            source: next,
            docSlug: 'playground',
            view: 'preview',
          },
    )
    navigateToAppPath(appPath, search)
    setSourceState(next)
  }, [])

  return { source, setSource }
}
