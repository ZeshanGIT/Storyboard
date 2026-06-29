import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'

export type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

export const mdxProcessor = remark().use(remarkFrontmatter).use(remarkMdx)

export function isNamedNode(name: string) {
  return (node: { type?: string; name?: string | null }): node is MdxJsxElement =>
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === name
}

export function getStringAttr(node: MdxJsxElement, name: string): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  return undefined
}

export function getGotoValue(node: MdxJsxElement): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'goto')
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  if (attr.value.type === 'mdxJsxAttributeValueExpression') {
    const expr = attr.value.value.trim()
    const stringMatch = expr.match(/^(['"])(.*)\1$/)
    if (stringMatch) return stringMatch[2]
  }
  return undefined
}

export function hasBooleanAttr(node: MdxJsxElement, name: string): boolean {
  return node.attributes.some((a) => a.type === 'mdxJsxAttribute' && a.name === name)
}

export function getLinkLabel(node: MdxJsxElement): string | undefined {
  for (const child of node.children) {
    if (child.type === 'text' && child.value.trim()) return child.value.trim()
  }
  return undefined
}

export function stringifyMdxNode(node: MdxJsxElement): string {
  const chunk = mdxProcessor.stringify({ type: 'root', children: [node] } as Root)
  return chunk.trim()
}
