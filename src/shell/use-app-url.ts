import { useCallback, useEffect, useState } from 'react'
import { toAppPath, toBrowserPath } from '@/lib/app-base-path'
import { type AppUrlState, buildAppUrl, parseAppUrl, resolveLegacyAppPath } from '@/lib/app-url'

export type UseAppUrlOptions = {
  knownDocs: readonly { slug: string; screenIds: readonly string[] }[]
  defaultState: AppUrlState
}

export type NavigateAppUrl = (patch: Partial<AppUrlState>, options?: { replace?: boolean }) => void

function readUrlState(
  knownDocs: UseAppUrlOptions['knownDocs'],
  defaultState: AppUrlState,
): AppUrlState {
  const appPath = toAppPath(window.location.pathname)
  const search = window.location.search
  return (
    parseAppUrl({ appPath, search }) ?? resolveLegacyAppPath(appPath, knownDocs) ?? defaultState
  )
}

function writeUrlState(state: AppUrlState, replace: boolean): void {
  const { appPath, search } = buildAppUrl(state)
  const browserPath = `${toBrowserPath(appPath)}${search}`
  if (replace) {
    window.history.replaceState({}, '', browserPath)
  } else {
    window.history.pushState({}, '', browserPath)
  }
}

export function useAppUrl({ knownDocs, defaultState }: UseAppUrlOptions) {
  const [urlState, setUrlState] = useState(() => readUrlState(knownDocs, defaultState))

  useEffect(() => {
    const onPopState = () => setUrlState(readUrlState(knownDocs, defaultState))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [knownDocs, defaultState])

  const navigate = useCallback<NavigateAppUrl>((patch, options) => {
    setUrlState((prev) => {
      const next: AppUrlState = { ...prev, ...patch }
      if (patch.view && patch.view !== 'graph') {
        next.graphMode = undefined
        next.graphFocus = undefined
      }
      if (patch.view && patch.view !== 'prototype') {
        next.screenId = undefined
      }
      writeUrlState(next, options?.replace ?? false)
      return next
    })
  }, [])

  useEffect(() => {
    const appPath = toAppPath(window.location.pathname)
    const search = window.location.search
    if (parseAppUrl({ appPath, search })) return
    const legacy = resolveLegacyAppPath(appPath, knownDocs)
    if (!legacy) return
    writeUrlState(legacy, true)
    setUrlState(legacy)
  }, [knownDocs])

  return { urlState, navigate }
}
