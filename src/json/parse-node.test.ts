import { describe, expect, it } from 'vitest'
import { parseJsonNode } from './parse-node'

describe('parseJsonNode', () => {
  it('parses text leaf 2-tuple', () => {
    expect(parseJsonNode(['Text:h1', 'Welcome'])).toEqual({
      tag: { component: 'Text', modifiers: ['h1'] },
      props: {},
      children: 'Welcome',
    })
  })

  it('parses container 3-tuple', () => {
    const node = parseJsonNode([
      'Container:row',
      { distribute: 'space-between' },
      [['Link:primary-btn', { goto: 'login' }, 'Login']],
    ])
    expect(node.tag.component).toBe('Container')
    expect(Array.isArray(node.children)).toBe(true)
  })
})
