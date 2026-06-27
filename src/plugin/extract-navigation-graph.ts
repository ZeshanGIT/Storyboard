import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import type { ExtractedScreen, NavigationEdge, NavigationGraph, NavigationGraphNode } from './types'
import { collectModalIdsByScreen } from './validate-gotos'

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

const RESERVED_GOTO = new Set(['_close', '_back'])
const processor = remark().use(remarkFrontmatter).use(remarkMdx)

function isNamedNode(name: string) {
  return (node: { type?: string; name?: string | null }): node is MdxJsxElement =>
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === name
}

const isScreenNode = isNamedNode('Screen')
const isLinkNode = isNamedNode('Link')

function getStringAttr(node: MdxJsxElement, name: string): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  return undefined
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

function getLinkLabel(node: MdxJsxElement): string | undefined {
  for (const child of node.children) {
    if (child.type === 'text' && child.value.trim()) {
      return child.value.trim()
    }
  }
  return undefined
}

function parseTree(source: string): Root {
  return processor.parse(source) as Root
}

function buildNodes(
  tree: Root,
  screens: readonly ExtractedScreen[],
): readonly NavigationGraphNode[] {
  const notesByScreenId = new Map<string, string>()

  visit(tree, (node) => {
    if (!isScreenNode(node)) return
    const id = getStringAttr(node, 'id')
    const note = getStringAttr(node, 'note')
    if (id && note) notesByScreenId.set(id, note)
  })

  return screens.map((screen, index) => ({
    id: screen.id,
    title: screen.title,
    note: notesByScreenId.get(screen.id),
    order: screen.order,
    isEntry: index === 0,
  }))
}

export function extractNavigationGraph(
  source: string,
  screens: readonly ExtractedScreen[],
): NavigationGraph {
  const tree = parseTree(source)
  const screenIds = new Set(screens.map((s) => s.id))
  const { modalIdsByScreen } = collectModalIdsByScreen(tree, screenIds)

  const edges: NavigationEdge[] = []
  let activeScreenId: string | undefined
  let linkIndex = 0

  visit(tree, (node) => {
    if (isScreenNode(node)) {
      activeScreenId = getStringAttr(node, 'id')
      linkIndex = 0
      return
    }

    if (!isLinkNode(node) || !activeScreenId) return

    const goto = getGotoValue(node)
    if (!goto || RESERVED_GOTO.has(goto)) return
    if (hasBooleanAttr(node, 'disabled')) return

    const screenModalIds = modalIdsByScreen.get(activeScreenId) ?? new Set<string>()
    if (screenModalIds.has(goto)) return
    if (!screenIds.has(goto)) return

    const linkId = `${activeScreenId}:${linkIndex}`
    linkIndex += 1

    edges.push({
      id: `${linkId}->${goto}`,
      fromScreenId: activeScreenId,
      toScreenId: goto,
      linkId,
      label: getLinkLabel(node),
    })
  })

  return {
    nodes: buildNodes(tree, screens),
    edges,
  }
}
