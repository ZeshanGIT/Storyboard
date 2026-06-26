import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'

type ScreenNode = MdxJsxFlowElement | MdxJsxTextElement

function isScreenNode(node: { type?: string; name?: string | null }): node is ScreenNode {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    node.name === 'Screen'
  )
}

import { CodegenError, type CodegenResult, type ExtractedScreen } from './types'

const processor = remark().use(remarkMdx)

function getStringAttr(node: ScreenNode, name: string): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  if (attr.value.type === 'mdxJsxAttributeValueExpression') {
    return undefined
  }
  return undefined
}

function stringifyScreenNode(node: ScreenNode): string {
  const chunk = processor.stringify({
    type: 'root',
    children: [node],
  } as Root)
  return chunk.trim()
}

export function extractScreens(source: string): CodegenResult {
  try {
    let tree: Root
    try {
      tree = processor.parse(source) as Root
    } catch (err) {
      return {
        ok: false,
        error: new CodegenError(
          'PARSE_ERROR',
          err instanceof Error ? err.message : 'Failed to parse MDX',
        ),
      }
    }

    const screens: ExtractedScreen[] = []
    const seenIds = new Map<string, number>()

    visit(tree, (node) => {
      if (!isScreenNode(node)) return

      const id = getStringAttr(node, 'id')
      const title = getStringAttr(node, 'title') ?? ''

      if (!id) {
        throw new CodegenError('MISSING_SCREEN_ID', 'Screen node missing id attribute')
      }

      if (seenIds.has(id)) {
        throw new CodegenError('DUPLICATE_SCREEN_ID', `Duplicate screen id "${id}"`, id)
      }
      seenIds.set(id, screens.length)

      screens.push({
        id,
        title,
        jsx: stringifyScreenNode(node),
        order: screens.length,
      })
    })

    return { ok: true, screens }
  } catch (err) {
    if (err instanceof CodegenError) {
      return { ok: false, error: err }
    }
    return {
      ok: false,
      error: new CodegenError('PARSE_ERROR', err instanceof Error ? err.message : 'Unknown error'),
    }
  }
}
