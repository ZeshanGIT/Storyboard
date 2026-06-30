import { createRoot } from 'react-dom/client'
import { StoryboardApp } from './StoryboardApp'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(<StoryboardApp />)
