import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { Screen } from '@/components/wireframe'
import { mdxProcessor } from '@/plugin/mdx-ast'
import { renderMdxJsxElement } from './render-mdx-node'

describe('renderMdxJsxElement', () => {
  it('returns a React element for Screen with Text child', () => {
    const tree = mdxProcessor.parse(`<Screen id="home" title="Home">
  <Text h1>Hello</Text>
</Screen>`)
    const node = tree.children[0]
    if (!node || (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement')) {
      throw new Error('expected MDX node')
    }
    const element = renderMdxJsxElement(node)
    expect(isValidElement(element)).toBe(true)
    if (!isValidElement(element)) return
    expect(element.type).toBe(Screen)
  })
})
