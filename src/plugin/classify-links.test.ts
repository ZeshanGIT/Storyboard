import { describe, expect, it } from 'vitest'
import { classifyScreenLinks } from './classify-links'
import { mdxProcessor } from './mdx-ast'
import { collectModalIdsByScreen } from './validate-gotos'

const SAMPLE = `
<Screen id="home" title="Home">
  <Link goto="settings">Settings</Link>
  <Link goto="missing">Bad</Link>
  <Link goto="_back">Back</Link>
  <Link goto="settings" disabled>Disabled</Link>
</Screen>
<Screen id="settings" title="Settings" />
`

describe('classifyScreenLinks', () => {
  it('assigns screen-edge linkIds in visit order', () => {
    const tree = mdxProcessor.parse(SAMPLE) as import('mdast').Root
    const screenIds = new Set(['home', 'settings'])
    const { modalIdsByScreen } = collectModalIdsByScreen(tree, screenIds)
    const { linksByScreen, errors } = classifyScreenLinks(tree, screenIds, modalIdsByScreen)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('INVALID_GOTO')
    const homeLinks = linksByScreen.get('home') ?? []
    expect(homeLinks[0]).toMatchObject({
      classification: 'screen-edge',
      linkId: 'home:0',
      toScreenId: 'settings',
    })
    expect(homeLinks[1].classification).toBe('invalid-target')
    expect(homeLinks[2].classification).toBe('reserved')
    expect(homeLinks[3].classification).toBe('disabled-skip')
  })
})
