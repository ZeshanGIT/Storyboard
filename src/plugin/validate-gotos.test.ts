import { describe, expect, it } from 'vitest'
import { extractScreens } from './extract-screens'
import { CodegenError } from './types'

const VALID = `
<Screen id="home" title="Home">
  <Link goto={Screens.Login}>Login</Link>
</Screen>

<Screen id="login" title="Login">
  <Link goto={Screens.Home}>Back</Link>
</Screen>
`

describe('validateGotos', () => {
  it('accepts valid Screens.* goto targets', () => {
    const result = extractScreens(VALID)
    expect(result.ok).toBe(true)
  })

  it('accepts valid string goto targets', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Link goto="login">Login</Link>
</Screen>
<Screen id="login" title="Login">...</Screen>
`)
    expect(result.ok).toBe(true)
  })

  it('rejects unknown Screens keys with screen and link context', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Link goto={Screens.Logi}>Login</Link>
</Screen>
<Screen id="login" title="Login">...</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]).toBeInstanceOf(CodegenError)
    expect(result.errors[0].code).toBe('INVALID_GOTO')
    expect(result.errors[0].message).toContain('Screens.Logi')
    expect(result.errors[0].message).toContain('screen "home"')
    expect(result.errors[0].message).toContain('link "Login"')
    expect(result.errors[0].message).toContain('known keys')
  })

  it('rejects unknown screen id strings', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Link goto="missing">Go</Link>
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('INVALID_GOTO')
    expect(result.errors[0].message).toContain('"missing"')
    expect(result.errors[0].message).toContain('link "Go"')
  })

  it('collects duplicate and goto errors together', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Link goto={Screens.Logi}>Login</Link>
</Screen>
<Screen id="signup" title="Sign up">...</Screen>
<Screen id="signup" title="Sign up again">...</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
    expect(result.errors.some((error) => error.code === 'DUPLICATE_SCREEN_ID')).toBe(true)
    expect(result.errors.some((error) => error.code === 'INVALID_GOTO')).toBe(true)
  })
})
