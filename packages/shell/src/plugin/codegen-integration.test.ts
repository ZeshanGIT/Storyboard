import { describe, expect, it } from 'vitest'
import { buildMdxDocument } from './build-mdx-document'
import { extractNavigationGraph } from './extract-navigation-graph'
import { injectGraphLinkIdsFromClassification } from './inject-graph-link-ids'

describe('codegen integration', () => {
  it('graph linkIds align with injected graph-link-id attributes', () => {
    const mdx = `
<Screen id="a" title="A"><Link goto="b">Next</Link></Screen>
<Screen id="b" title="B" />
`
    const built = buildMdxDocument(mdx)
    if (!built.ok) throw new Error('fixture')
    const graph = extractNavigationGraph(built.document)
    const edge = graph.edges[0]
    const jsx = injectGraphLinkIdsFromClassification(
      built.document.screens[0].jsx,
      built.document.screens[0].links,
    )
    expect(edge.linkId).toBe('a:0')
    expect(jsx).toContain('graph-link-id="a:0"')
  })
})
