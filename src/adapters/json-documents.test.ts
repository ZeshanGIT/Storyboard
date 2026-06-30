import { describe, expect, it } from 'vitest'
import { contentJsonSources } from '@/content/content-json'
import { jsonContentSourcesToBundles } from './json-documents'

describe('jsonContentSourcesToBundles', () => {
  it('uses wireframe-json slug when wireframe MDX slug is reserved', () => {
    const entries = jsonContentSourcesToBundles(contentJsonSources, new Set(['wireframe']))
    const wireframe = entries.find((entry) => entry.baseSlug === 'wireframe')
    expect(wireframe?.bundle.slug).toBe('wireframe-json')
    expect(wireframe?.bundle.title).toBe('Workforge Demo JSON')
    expect(wireframe?.bundle.source).toBe('json')
    expect(wireframe?.bundle.routePrefix).toBe('/mdx/wireframe-json')
  })
})
