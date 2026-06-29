import { describe, expect, it } from 'vitest'
import { compilePlaygroundMdx } from './compile-playground-mdx'

const VALID = `---
title: Demo App
---

<Screen id="home" title="Home">
  <Text h1>Hello</Text>
  <Link goto="login">Login</Link>
</Screen>

<Screen id="login" title="Login">
  <Text h1>Sign in</Text>
</Screen>
`

describe('compilePlaygroundMdx', () => {
  it('accepts valid wireframe MDX with frontmatter title', () => {
    const result = compilePlaygroundMdx(VALID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.built.title).toBe('Demo App')
    expect(result.built.document.screens).toHaveLength(2)
    expect(result.built.document.screens[0]?.id).toBe('home')
  })

  it('rejects MDX with validation errors', () => {
    const result = compilePlaygroundMdx(`
<Screen id="home" title="Home">
  <Link goto="missing">Go</Link>
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects unparseable MDX', () => {
    const result = compilePlaygroundMdx('<Screen id="home" title="Home"')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]).toMatch(/parse/i)
  })
})
