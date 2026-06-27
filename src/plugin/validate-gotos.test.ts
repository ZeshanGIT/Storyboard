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

  it('allows the same modal id on different screens', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Link goto="confirm">Open</Link>
  <Modal id="confirm">
    <Link goto="_close">Close</Link>
  </Modal>
</Screen>
<Screen id="settings" title="Settings">
  <Link goto="confirm">Open</Link>
  <Modal id="confirm">
    <Link goto="_close">Close</Link>
  </Modal>
</Screen>
`)
    expect(result.ok).toBe(true)
  })

  it('rejects duplicate modal ids within the same screen', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Modal id="confirm" />
  <Modal id="confirm" />
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('DUPLICATE_MODAL_ID')
    expect(result.errors[0].message).toContain('screen "home"')
  })

  it('rejects modal ids that match a screen id', () => {
    const result = extractScreens(`
<Screen id="login" title="Login">...</Screen>
<Screen id="home" title="Home">
  <Modal id="login" />
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('DUPLICATE_SCREEN_ID')
    expect(result.errors[0].message).toContain('Screen id')
  })

  it('rejects goto to a modal declared on another screen', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Link goto="confirm">Open</Link>
</Screen>
<Screen id="settings" title="Settings">
  <Modal id="confirm">
    <Link goto="_close">Close</Link>
  </Modal>
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('INVALID_GOTO')
    expect(result.errors[0].message).toContain('screen "home"')
    expect(result.errors[0].message).toContain('in this screen')
  })
})
