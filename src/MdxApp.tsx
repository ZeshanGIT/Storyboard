import { Shell } from '@storyboard/shell'
import { openPlayground } from '@/lib/navigate-app'
import { allContentDocumentsToBundles } from './adapters/content-documents'
import { contentDocuments } from './generated/content-documents.generated'

const documents = allContentDocumentsToBundles(contentDocuments)

export function MdxApp() {
  return (
    <Shell
      documents={documents}
      appDefaults={{ app: 'mdx' }}
      onOpenPlayground={() => openPlayground()}
    />
  )
}
