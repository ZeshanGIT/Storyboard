import { describe, expect, it } from 'vitest'
import { getGotoValue, isNamedNode, mdxProcessor } from './mdx-ast'

describe('mdx-ast', () => {
  it('parses goto string literal from Link', () => {
    const tree = mdxProcessor.parse('<Link goto="home">\nGo\n</Link>')
    let linkNode: unknown
    tree.children.forEach((child) => {
      if (isNamedNode('Link')(child)) linkNode = child
    })
    expect(linkNode).toBeDefined()
    expect(getGotoValue(linkNode as never)).toBe('home')
  })
})
