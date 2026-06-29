import { useCallback, useEffect, useState } from 'react'
import { toAppPath, toBrowserPath } from '@/lib/app-base-path'
import type { PlaygroundSource } from '@/lib/app-routes'
import { buildAppUrl, parseAppUrl } from '@/lib/app-url'

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
    if (current?.app !== 'playground') {
      const { appPath, search } = buildAppUrl({
        app: 'playground',
        source: next,
        docSlug: 'playground',
        view: 'preview',
      })
      window.history.pushState({}, '', `${toBrowserPath(appPath)}${search}`)
      setSourceState(next)
      return
    }

    const { appPath, search } = buildAppUrl({ ...current, source: next })
    window.history.pushState({}, '', `${toBrowserPath(appPath)}${search}`)
    setSourceState(next)
  }, [])

  return { source, setSource }
}
