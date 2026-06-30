import { createRoot } from 'react-dom/client'
import '@/index.css'
import { OnespecApp } from '@onespec-app'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(<OnespecApp />)
