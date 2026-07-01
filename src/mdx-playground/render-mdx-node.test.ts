import { readFileSync } from 'node:fs'
import { buildMdxDocument, mdxProcessor, Screen } from '@onespec-dev/shell'
import { createElement, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildMdxScreenComponent } from './build-mdx-screen-component'
import { renderMdxJsxElement, renderMdxScreenJsx } from './render-mdx-node'

function markupForScreenJsx(jsx: string): string {
  return renderToStaticMarkup(createElement('div', null, renderMdxScreenJsx(jsx)))
}

describe('renderMdxJsxElement', () => {
  it('returns a React element for Screen with Text child', () => {
    const tree = mdxProcessor.parse(`<Screen id="home" title="Home">
  <Text h1>Hello</Text>
</Screen>`)
    const node = tree.children[0]
    if (!node || (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement')) {
      throw new Error('expected MDX node')
    }
    const element = renderMdxJsxElement(node)
    expect(isValidElement(element)).toBe(true)
    if (!isValidElement(element)) return
    expect(element.type).toBe(Screen)
  })
})

describe('renderMdxScreenJsx', () => {
  it('renders Text and Link children wrapped in remark paragraph nodes', () => {
    const jsx = `<Screen id="home" title="Home">
  <Text h1>Welcome back</Text>
  <Text>Sign in to continue.</Text>
  <Container row distribute="space-between">
    <Link goto="login" primary-btn>Login</Link>
    <Link goto="signup" secondary-btn>Create account</Link>
  </Container>
  <Divider label="demo note" />
</Screen>`

    const markup = markupForScreenJsx(jsx)
    expect(markup).toContain('Welcome back')
    expect(markup).toContain('Sign in to continue.')
    expect(markup).toContain('Login')
    expect(markup).toContain('Create account')
    expect(markup).toContain('demo note')
  })

  it('finds Screen when remark wraps the root in a paragraph', () => {
    const jsx = `<Screen id="home" title="Home"><Text h1>Welcome back</Text></Screen>`
    const markup = markupForScreenJsx(jsx)
    expect(markup).toContain('Welcome back')
  })

  it('renders wireframe.mdx home screen content', () => {
    const source = readFileSync('src/content/wireframe.mdx', 'utf8')
    const result = buildMdxDocument(source)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const home = result.document.screens.find((screen) => screen.id === 'home')
    expect(home).toBeDefined()
    if (!home) return

    const ScreenComponent = buildMdxScreenComponent(home)
    const markup = renderToStaticMarkup(createElement(ScreenComponent))

    expect(markup).toContain('Welcome back')
    expect(markup).toContain('Sign in to continue to your workspace, or create a new account.')
    expect(markup).toContain('Login')
    expect(markup).toContain('Create account')
    expect(markup).toContain('demo note')
    expect(markup).toContain('Sample auth flow for OneSpec')
  })
})
