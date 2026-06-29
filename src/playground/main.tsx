import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import '@xyflow/react/dist/style.css'
import '../index.css'
import { PlaygroundApp } from './PlaygroundApp'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <TooltipProvider delay={0}>
      <PlaygroundApp />
    </TooltipProvider>
  </StrictMode>,
)
