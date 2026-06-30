import { isPlaygroundAppPath, parseAppUrl, toAppPath } from '@storyboard/shell'
import { useEffect, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MdxApp } from './MdxApp'
import { PlaygroundApp } from './playground/PlaygroundApp'

function resolveAppMode(appPath: string): 'mdx' | 'playground' {
  const parsed = parseAppUrl({ appPath, search: window.location.search })
  if (parsed) return parsed.app
  if (isPlaygroundAppPath(appPath)) return 'playground'
  return 'mdx'
}

function App() {
  const [appPath, setAppPath] = useState(() => toAppPath(window.location.pathname))
  const mode = resolveAppMode(appPath)

  useEffect(() => {
    const onPopState = () => setAppPath(toAppPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <TooltipProvider delay={0}>
      {mode === 'playground' ? <PlaygroundApp key="playground" /> : <MdxApp key="mdx" />}
    </TooltipProvider>
  )
}

export default App
