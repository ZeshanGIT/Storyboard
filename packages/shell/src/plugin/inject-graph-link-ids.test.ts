import { describe, expect, it } from 'vitest'
import { injectGraphLinkIdsFromClassification } from './inject-graph-link-ids'

describe('injectGraphLinkIdsFromClassification', () => {
  it('adds graph-link-id to Link elements in visit order', () => {
    const jsx = `<Screen id="home" title="Home">
  <Link goto="login">Login</Link>
  <Link goto="signup">Signup</Link>
</Screen>`

    const result = injectGraphLinkIdsFromClassification(jsx, [
      {
        classification: 'screen-edge',
        goto: 'login',
        linkId: 'home:0',
        toScreenId: 'login',
        label: 'Login',
      },
      {
        classification: 'screen-edge',
        goto: 'signup',
        linkId: 'home:1',
        toScreenId: 'signup',
        label: 'Signup',
      },
    ])

    expect(result).toContain('graph-link-id="home:0"')
    expect(result).toContain('graph-link-id="home:1"')
  })

  it('injects distinct linkIds without re-matching goto targets', () => {
    const jsx = `<Screen id="home" title="Home">
  <Link goto="login">First</Link>
  <Link goto="login">Second</Link>
</Screen>`

    const result = injectGraphLinkIdsFromClassification(jsx, [
      {
        classification: 'screen-edge',
        goto: 'login',
        linkId: 'home:0',
        toScreenId: 'login',
      },
      {
        classification: 'screen-edge',
        goto: 'login',
        linkId: 'home:1',
        toScreenId: 'login',
      },
    ])

    expect(result).toContain('graph-link-id="home:0"')
    expect(result).toContain('graph-link-id="home:1"')
  })

  it('skips disabled, reserved, and modal links', () => {
    const jsx = `<Screen id="home" title="Home">
  <Link goto="confirm">Open</Link>
  <Link goto="_back">Back</Link>
  <Link goto="login" disabled>Disabled</Link>
  <Link goto="login">Sign in</Link>
</Screen>`

    const result = injectGraphLinkIdsFromClassification(jsx, [
      { classification: 'modal', goto: 'confirm' },
      { classification: 'reserved', goto: '_back' },
      { classification: 'disabled-skip', goto: 'login' },
      {
        classification: 'screen-edge',
        goto: 'login',
        linkId: 'home:0',
        toScreenId: 'login',
      },
    ])

    expect(result).not.toContain('graph-link-id="confirm"')
    expect(result).not.toContain('goto="_back" graph-link-id')
    expect(result).toMatch(/disabled[^>]*>Disabled<\/Link>/)
    expect(result).not.toMatch(/disabled[^>]*graph-link-id/)
    expect(result).toContain('graph-link-id="home:0"')
  })
})
