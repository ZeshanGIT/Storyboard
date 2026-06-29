import { TooltipProvider } from '@/components/ui/tooltip'
import { isPlaygroundAppPath } from '@/lib/app-routes'
import { MdxApp } from './MdxApp'
import { PlaygroundApp } from './playground/PlaygroundApp'
import { useAppRouter } from './shell/use-app-router'

function App() {
  const { appPath } = useAppRouter()

  return (
    <TooltipProvider delay={0}>
      {isPlaygroundAppPath(appPath) ? <PlaygroundApp /> : <MdxApp />}
    </TooltipProvider>
  )
}

export default App
