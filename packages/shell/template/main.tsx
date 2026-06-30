import { createRoot } from 'react-dom/client'
import '@/index.css'
import { StoryboardApp } from '@storyboard-app'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(<StoryboardApp />)
