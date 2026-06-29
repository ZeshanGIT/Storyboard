import { TooltipProvider } from '@/components/ui/tooltip'
import { contentDocuments } from './generated/content-documents.generated'
import { mdxContentDocumentsToBundles } from './shell/adapters/mdx-documents'
import { Shell } from './shell/Shell'

const documents = mdxContentDocumentsToBundles(contentDocuments)

function App() {
  return (
    <TooltipProvider delay={0}>
      <Shell documents={documents} />
    </TooltipProvider>
  )
}

export default App
