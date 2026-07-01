import { describe, expect, it } from 'vitest'
import { contentJsonSources, defaultJsonBaseSlug, resolveJsonDocumentSlug } from './content-json'

describe('contentJsonSources', () => {
  it('loads wireframe.json from src/content', () => {
    const wireframe = contentJsonSources.find((doc) => doc.baseSlug === 'wireframe')
    expect(wireframe).toBeDefined()
    if (!wireframe) return
    expect(wireframe.filename).toBe('wireframe.json')
    expect(wireframe.raw.title).toBe('Workforge Demo JSON')
  })

  it('prefers wireframe as default base slug when onespec.json is absent', () => {
    expect(defaultJsonBaseSlug()).toBe('wireframe')
  })

  it('suffixes slug when an MDX document already uses the same slug', () => {
    expect(resolveJsonDocumentSlug('wireframe', new Set(['wireframe']))).toBe('wireframe-json')
    expect(resolveJsonDocumentSlug('wireframe', new Set())).toBe('wireframe')
  })
})
