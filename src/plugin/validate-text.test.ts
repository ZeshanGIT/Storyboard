import { describe, expect, it } from 'vitest'
import { extractScreens } from './extract-screens'

describe('validateText', () => {
  it('accepts bare heading flags', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Text h1>Title</Text>
  <Text h2>Subtitle</Text>
  <Text>Body</Text>
</Screen>
`)
    expect(result.ok).toBe(true)
  })

  it('rejects variant attribute', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Text variant="h1">Title</Text>
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('INVALID_TEXT')
    expect(result.errors[0].message).toContain('variant')
  })

  it('rejects multiple heading flags on one Text', () => {
    const result = extractScreens(`
<Screen id="home" title="Home">
  <Text h1 h2>Title</Text>
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('INVALID_TEXT')
    expect(result.errors[0].message).toContain('conflicting')
  })
})
