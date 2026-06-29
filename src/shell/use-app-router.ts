export { type NavigateAppUrl, useAppUrl } from './use-app-url'

import { useEffect, useState } from 'react'
import { toAppPath } from '@/lib/app-base-path'

/** Legacy pathname hook — replaced by `useAppUrl` in Task 7. */
export function useAppRouter() {
  const [appPath, setAppPath] = useState(() => toAppPath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setAppPath(toAppPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return { appPath }
}
