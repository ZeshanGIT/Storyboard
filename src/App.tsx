import { routes } from './generated/routes.generated'
import { Shell } from './shell/Shell'

function App() {
  return <Shell routes={routes} />
}

export default App
