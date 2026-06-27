import { describe, expect, it } from 'vitest'
import { injectGraphLinkIds } from './inject-graph-link-ids'

describe('injectGraphLinkIds', () => {
  it('adds graph-link-id to Link elements in visit order', () => {
    const jsx = `<Screen id="home" title="Home">
  <Link goto="login">Login</Link>
  <Link goto="signup">Signup</Link>
</Screen>`

    const result = injectGraphLinkIds(jsx, 'home', [
      {
        id: 'home:0->login',
        fromScreenId: 'home',
        toScreenId: 'login',
        linkId: 'home:0',
        label: 'Login',
      },
      {
        id: 'home:1->signup',
        fromScreenId: 'home',
        toScreenId: 'signup',
        linkId: 'home:1',
        label: 'Signup',
      },
    ])

    expect(result).toContain('graph-link-id="home:0"')
    expect(result).toContain('graph-link-id="home:1"')
  })
})
