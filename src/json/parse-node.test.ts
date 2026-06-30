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

  it('parses Input with SR as second element', () => {
    expect(parseJsonNode(['Input', 'SR-010', { placeholder: 'Email' }])).toEqual({
      tag: { component: 'Input', modifiers: [] },
      sr: 'SR-010',
      props: { placeholder: 'Email' },
    })
  })

  it('parses Link with SR, props, and text', () => {
    expect(parseJsonNode(['Link:primary-btn', 'SR-012', { goto: 'home' }, 'Add'])).toEqual({
      tag: { component: 'Link', modifiers: ['primary-btn'] },
      sr: 'SR-012',
      props: { goto: 'home' },
      children: 'Add',
    })
  })

  it('does not treat Container children as SR', () => {
    const node = parseJsonNode(['Container:row', [['Input', 'SR-010', { placeholder: 'x' }]]])
    expect(node.sr).toBeUndefined()
    expect(Array.isArray(node.children)).toBe(true)
  })
})
