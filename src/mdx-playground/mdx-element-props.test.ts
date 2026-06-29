import { describe, expect, it } from 'vitest'
import { mdxAttributesToProps } from './mdx-element-props'

describe('mdxAttributesToProps', () => {
  it('maps string and boolean MDX attributes', () => {
    const props = mdxAttributesToProps([
      { type: 'mdxJsxAttribute', name: 'goto', value: 'login' },
      { type: 'mdxJsxAttribute', name: 'primary-btn', value: null },
      { type: 'mdxJsxAttribute', name: 'graph-link-id', value: 'home:0' },
    ])
    expect(props).toEqual({
      goto: 'login',
      'primary-btn': true,
      'graph-link-id': 'home:0',
    })
  })
})
