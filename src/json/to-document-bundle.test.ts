import { describe, expect, it } from 'vitest'
import { buildJsonDocument } from './build-json-document'
import sample from './sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from './to-document-bundle'

describe('jsonToWireframeDocumentBundle', () => {
  it('produces routes and navigation graph', () => {
    const built = buildJsonDocument(sample)
    expect(built.ok).toBe(true)
    if (!built.ok) return
    const bundle = jsonToWireframeDocumentBundle(built.document, 'sample')
    expect(bundle.source).toBe('json')
    expect(bundle.routes.length).toBeGreaterThan(0)
    expect(bundle.preview.kind).toBe('screens')
    expect(bundle.navigationGraph.nodes.length).toBe(bundle.routes.length)
  })
})
