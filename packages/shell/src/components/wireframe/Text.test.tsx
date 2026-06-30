import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Text } from './Text'

describe('Text', () => {
  it('uses div for body level so MDX paragraph children stay valid HTML', () => {
    const html = renderToStaticMarkup(
      <Text note="Author note">
        <p>MDX wraps plain text in a paragraph.</p>
      </Text>,
    )

    expect(html).toContain('<div class="text-sm text-muted-foreground">')
    expect(html).toContain('<p>MDX wraps plain text in a paragraph.</p>')
    expect(html).not.toMatch(/<p[^>]*>[^<]*<p/)
  })
})
