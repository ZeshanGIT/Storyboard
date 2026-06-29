import type { ContentDocumentEntry } from '@/generated/content-documents.generated'
import { MDX_APP_PREFIX } from '@/lib/app-routes'
import type { WireframeDocumentBundle } from '@/types/wireframe-document'

export function mdxContentDocumentsToBundles(
  documents: readonly ContentDocumentEntry[],
): readonly WireframeDocumentBundle[] {
  return documents.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    source: 'mdx' as const,
    routes: doc.routes,
    navigationGraph: doc.navigationGraph,
    preview: { kind: 'mdx' as const, component: doc.component },
    routePrefix: `${MDX_APP_PREFIX}/${doc.slug}`,
  }))
}
