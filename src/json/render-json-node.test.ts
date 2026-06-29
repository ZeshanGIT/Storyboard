import { describe, expect, it } from 'vitest'
import { parseJsonNode } from './parse-node'
import { propsFromTag } from './render-json-node'

describe('propsFromTag', () => {
  it('maps Text:h1 to h1 boolean prop', () => {
    const node = parseJsonNode(['Text:h1', 'Title'])
    expect(propsFromTag(node.tag, node.props)).toMatchObject({ h1: true })
  })

  it('maps Link:primary-btn and goto prop', () => {
    const node = parseJsonNode(['Link:primary-btn', { goto: 'home' }, 'Go'])
    expect(propsFromTag(node.tag, node.props)).toMatchObject({
      goto: 'home',
      'primary-btn': true,
    })
  })
})
