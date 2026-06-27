import { describe, expect, it } from 'vitest'
import { extractFrontmatter } from './extract-frontmatter'

describe('extractFrontmatter', () => {
  it('parses title from YAML frontmatter', () => {
    const source = `---
title: Wireframe App
---

<Screen id="home" />`

    expect(extractFrontmatter(source, 'wireframe.mdx')).toEqual({
      title: 'Wireframe App',
      body: '\n<Screen id="home" />',
    })
  })

  it('parses quoted title values', () => {
    const source = `---
title: "Component Catalog"
---

content`

    expect(extractFrontmatter(source, 'components.mdx').title).toBe('Component Catalog')
  })

  it('falls back to filename when frontmatter is missing', () => {
    expect(extractFrontmatter('<Screen id="home" />', 'my-doc.mdx').title).toBe('My Doc')
  })
})
