import { describe, expect, it } from 'vitest'
import { compilePlaygroundMdx } from '@/playground/compile-playground-mdx'
import { mdxToWireframeDocumentBundle } from './to-document-bundle'

const SAMPLE = `<Screen id="home" title="Home">
  <Link goto="login">Login</Link>
</Screen>
<Screen id="login" title="Login" />`

describe('mdxToWireframeDocumentBundle', () => {
  it('builds playground bundle with mdx source and route prefix', () => {
    const compiled = compilePlaygroundMdx(SAMPLE)
    expect(compiled.ok).toBe(true)
    if (!compiled.ok) return

    const bundle = mdxToWireframeDocumentBundle(compiled.built, 'playground', { playground: true })
    expect(bundle.source).toBe('mdx')
    expect(bundle.slug).toBe('playground')
    expect(bundle.routePrefix).toBe('/playground/mdx/playground')
    expect(bundle.routes).toHaveLength(2)
    expect(bundle.routes[0]?.path).toBe('/playground/mdx/playground/home')
    expect(bundle.preview.kind).toBe('screens')
    expect(bundle.navigationGraph.edges).toHaveLength(1)
  })
})
