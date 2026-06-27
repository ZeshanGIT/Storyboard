import { contentDocuments } from './generated/content-documents.generated'
import { Shell } from './shell/Shell'

function App() {
  return <Shell contentDocuments={contentDocuments} />
}

export default App
