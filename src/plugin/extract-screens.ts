import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
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
import { collectGotoErrors } from './validate-gotos'
import { collectTextErrors } from './validate-text'

const processor = remark().use(remarkFrontmatter).use(remarkMdx)

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
        errors: [
          new CodegenError(
            'PARSE_ERROR',
            err instanceof Error ? err.message : 'Failed to parse MDX',
          ),
        ],
      }
    }

    const screens: ExtractedScreen[] = []
    const seenIds = new Map<string, { order: number; title: string }>()
    const errors: CodegenError[] = []
    let screenCount = 0

    visit(tree, (node) => {
      if (!isScreenNode(node)) return

      screenCount += 1
      const id = getStringAttr(node, 'id')
      const title = getStringAttr(node, 'title') ?? ''

      if (!id) {
        errors.push(
          new CodegenError('MISSING_SCREEN_ID', `Screen ${screenCount} is missing an id attribute`),
        )
        return
      }

      if (seenIds.has(id)) {
        const first = seenIds.get(id)
        if (!first) return
        errors.push(
          new CodegenError(
            'DUPLICATE_SCREEN_ID',
            `Duplicate screen id "${id}" — first at screen ${first.order + 1} ("${first.title}"), repeated at screen ${screenCount} ("${title}")`,
            id,
          ),
        )
        return
      }

      seenIds.set(id, { order: screens.length, title })
      screens.push({
        id,
        title,
        jsx: stringifyScreenNode(node),
        order: screens.length,
        modalIds: [],
      })
    })

    errors.push(...collectGotoErrors(tree, screens))
    errors.push(...collectTextErrors(tree))

    if (errors.length > 0) {
      return { ok: false, errors }
    }

    return { ok: true, screens }
  } catch (err) {
    if (err instanceof CodegenError) {
      return { ok: false, errors: [err] }
    }
    return {
      ok: false,
      errors: [
        new CodegenError('PARSE_ERROR', err instanceof Error ? err.message : 'Unknown error'),
      ],
    }
  }
}
