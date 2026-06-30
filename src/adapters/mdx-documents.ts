import { MDX_APP_PREFIX, type WireframeDocumentBundle } from '@storyboard/shell'
import type { ContentDocumentEntry } from '@/generated/content-documents.generated'

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
