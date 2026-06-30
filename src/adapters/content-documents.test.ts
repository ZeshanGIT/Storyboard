import { describe, expect, it } from 'vitest'
import type { ContentDocumentEntry } from '@/generated/content-documents.generated'
import { allContentDocumentsToBundles } from './content-documents'

describe('allContentDocumentsToBundles', () => {
  it('inserts JSON companion after matching MDX document', () => {
    const mdxEntries = [
      {
        slug: 'storyboard',
        title: 'About Storyboard',
        component: () => null,
        routes: [],
        navigationGraph: { nodes: [], edges: [] },
      },
      {
        slug: 'wireframe',
        title: 'Workforge Demo MDX',
        component: () => null,
        routes: [],
        navigationGraph: { nodes: [], edges: [] },
      },
    ] as unknown as ContentDocumentEntry[]

    const bundles = allContentDocumentsToBundles(mdxEntries)

    expect(bundles.map((bundle) => bundle.slug)).toEqual([
      'storyboard',
      'wireframe',
      'wireframe-json',
    ])
    expect(bundles[2]?.title).toBe('Workforge Demo JSON')
    expect(bundles[2]?.source).toBe('json')
  })
})
