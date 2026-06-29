import { contentDocuments } from './generated/content-documents.generated'
import { mdxContentDocumentsToBundles } from './shell/adapters/mdx-documents'
import { Shell } from './shell/Shell'

const documents = mdxContentDocumentsToBundles(contentDocuments)

export function MdxApp() {
  return <Shell documents={documents} appDefaults={{ app: 'mdx' }} />
}
