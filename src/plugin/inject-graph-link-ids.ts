import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import type { NavigationEdge } from './types'

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

const RESERVED_GOTO = new Set(['_close', '_back'])
const processor = remark().use(remarkFrontmatter).use(remarkMdx)

function isLinkNode(node: { type?: string; name?: string | null }): node is MdxJsxElement {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'Link'
  )
}

function hasBooleanAttr(node: MdxJsxElement, name: string): boolean {
  return node.attributes.some((a) => a.type === 'mdxJsxAttribute' && a.name === name)
}

function getGotoValue(node: MdxJsxElement): string | undefined {
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

function isNavLinkCandidate(node: MdxJsxElement): boolean {
  const goto = getGotoValue(node)
  if (!goto || RESERVED_GOTO.has(goto)) return false
  if (hasBooleanAttr(node, 'disabled')) return false
  return true
}

function injectLinkId(node: MdxJsxElement, linkId: string): void {
  const existing = node.attributes.find(
    (a) => a.type === 'mdxJsxAttribute' && a.name === 'graph-link-id',
  )
  if (existing && existing.type === 'mdxJsxAttribute') {
    existing.value = linkId
    return
  }

  const attr: MdxJsxAttribute = {
    type: 'mdxJsxAttribute',
    name: 'graph-link-id',
    value: linkId,
  }
  node.attributes.push(attr)
}

function stringifyFragment(tree: Root): string {
  const chunk = processor.stringify(tree)
  return chunk.trim()
}

export function injectGraphLinkIds(
  screenJsx: string,
  _screenId: string,
  edges: NavigationEdge[],
): string {
  const tree = processor.parse(screenJsx) as Root
  let edgeIndex = 0

  visit(tree, (node) => {
    if (!isLinkNode(node) || edgeIndex >= edges.length) return
    if (!isNavLinkCandidate(node)) return

    const edge = edges[edgeIndex]
    const goto = getGotoValue(node)
    if (goto !== edge.toScreenId) return

    injectLinkId(node, edge.linkId)
    edgeIndex += 1
  })

  return stringifyFragment(tree)
}
