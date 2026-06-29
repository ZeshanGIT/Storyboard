import { describe, expect, it } from 'vitest'
import { buildMdxDocument } from './build-mdx-document'

const SAMPLE = `
<Screen id="home" title="Home">
  <Link goto="detail">Detail</Link>
  <Modal id="confirm"><Text>Sure?</Text></Modal>
</Screen>
<Screen id="detail" title="Detail" />
`

describe('buildMdxDocument', () => {
  it('returns screens with modalIds and classified links in one pass', () => {
    const result = buildMdxDocument(SAMPLE)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.screens).toHaveLength(2)
    expect(result.document.screens[0].modalIds).toEqual(['confirm'])
    expect(result.document.screens[0].links[0]).toMatchObject({
      classification: 'screen-edge',
      linkId: 'home:0',
      toScreenId: 'detail',
    })
  })
})
