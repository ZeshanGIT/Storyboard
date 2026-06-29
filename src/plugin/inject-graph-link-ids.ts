import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import type { ClassifiedLink } from './types'

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

const processor = remark().use(remarkFrontmatter).use(remarkMdx)

function isLinkNode(node: { type?: string; name?: string | null }): node is MdxJsxElement {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'Link'
  )
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

export function injectGraphLinkIdsFromClassification(
  screenJsx: string,
  links: readonly ClassifiedLink[],
): string {
  const tree = processor.parse(screenJsx) as Root
  let linkIndex = 0

  visit(tree, (node) => {
    if (!isLinkNode(node)) return
    if (linkIndex >= links.length) return

    const classified = links[linkIndex]
    linkIndex += 1

    if (classified.classification !== 'screen-edge' || !classified.linkId) return

    injectLinkId(node, classified.linkId)
  })

  return stringifyFragment(tree)
}
