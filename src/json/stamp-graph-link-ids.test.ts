import { describe, expect, it } from 'vitest'
import { buildJsonDocument } from './build-json-document'
import sample from './sample-wireframe.json'
import type { JsonNode } from './types'

describe('stampGraphLinkIds', () => {
  it('assigns graphLinkId on Link nodes in traversal order', () => {
    const built = buildJsonDocument(sample)
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const home = built.document.screens.find((s) => s.id === 'home')
    if (!home) throw new Error('home screen missing')

    const linkIds: string[] = []
    function walk(node: JsonNode): void {
      if (node.tag.component === 'Link' && node.graphLinkId) {
        linkIds.push(node.graphLinkId)
      }
      if (typeof node.children !== 'string' && node.children) {
        for (const child of node.children) walk(child)
      }
    }
    for (const node of home.nodes) walk(node)

    expect(linkIds).toEqual(['home:0', 'home:1'])
  })
})
