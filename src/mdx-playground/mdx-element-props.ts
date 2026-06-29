import type { MdxJsxElement } from '@/plugin/mdx-ast'

export function mdxAttributesToProps(
  attributes: MdxJsxElement['attributes'],
): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  for (const attr of attributes) {
    if (attr.type !== 'mdxJsxAttribute' || !attr.name) continue

    if (attr.value === null || attr.value === undefined) {
      props[attr.name] = true
      continue
    }

    if (typeof attr.value === 'string') {
      props[attr.name] = attr.value
      continue
    }

    if (attr.value.type === 'mdxJsxAttributeValueExpression') {
      const expr = attr.value.value.trim()
      const stringMatch = expr.match(/^(['"])(.*)\1$/)
      if (stringMatch) {
        props[attr.name] = stringMatch[2]
      }
    }
  }

  return props
}
