import { describe, expect, it } from 'vitest'
import { extractScreens } from './extract-screens'
import { CodegenError } from './types'

const SAMPLE = `
<Screen id="home" title="Home">
  <Text>Welcome back</Text>
  <Link goto={Screens.Login}>Login</Link>
</Screen>

<Screen id="login" title="Login">
  <Text>Sign in</Text>
</Screen>
`

describe('extractScreens', () => {
  it('extracts screens in document order', () => {
    const result = extractScreens(SAMPLE)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.screens).toHaveLength(2)
    expect(result.screens[0].id).toBe('home')
    expect(result.screens[1].id).toBe('login')
    expect(result.screens[0].jsx).toContain('<Text>Welcome back</Text>')
  })

  it('rejects duplicate screen ids with location detail', () => {
    const dup = `
<Screen id="home" title="A">...</Screen>
<Screen id="home" title="B">...</Screen>
`
    const result = extractScreens(dup)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]).toBeInstanceOf(CodegenError)
    expect(result.errors[0].code).toBe('DUPLICATE_SCREEN_ID')
    expect(result.errors[0].message).toContain('first at screen 1')
    expect(result.errors[0].message).toContain('repeated at screen 2')
  })
})
