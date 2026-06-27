import { TooltipProvider } from '@/components/ui/tooltip'
import { contentDocuments } from './generated/content-documents.generated'
import { Shell } from './shell/Shell'

function App() {
  return (
    <TooltipProvider delay={0}>
      <Shell contentDocuments={contentDocuments} />
    </TooltipProvider>
  )
}

export default App
