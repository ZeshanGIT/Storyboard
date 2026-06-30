import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'
import { CodegenError } from './types'

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

const HEADING_FLAGS = ['h1', 'h2', 'h3', 'h4'] as const

function isTextNode(node: { type?: string; name?: string | null }): node is MdxJsxElement {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'Text'
  )
}

function isBareBooleanAttr(attr: MdxJsxAttribute): boolean {
  return attr.value === null || attr.value === undefined
}

function getTextPreview(node: MdxJsxElement): string | undefined {
  for (const child of node.children) {
    if (child.type === 'text' && child.value.trim()) {
      return child.value.trim().slice(0, 40)
    }
  }
  return undefined
}

export function collectTextErrors(tree: Root): CodegenError[] {
  const errors: CodegenError[] = []

  visit(tree, (node) => {
    if (!isTextNode(node)) return

    const preview = getTextPreview(node)
    const context = preview ? ` on Text "${preview}"` : ''

    const variantAttr = node.attributes.find(
      (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'variant',
    )
    if (variantAttr) {
      errors.push(
        new CodegenError(
          'INVALID_TEXT',
          `Text${context} uses deprecated variant attribute — use bare h1, h2, h3, or h4 flags instead`,
        ),
      )
      return
    }

    const activeFlags = node.attributes.filter(
      (attr): attr is MdxJsxAttribute =>
        attr.type === 'mdxJsxAttribute' &&
        (HEADING_FLAGS as readonly string[]).includes(attr.name) &&
        isBareBooleanAttr(attr),
    )

    if (activeFlags.length > 1) {
      const flags = activeFlags.map((attr) => attr.name).join(', ')
      errors.push(
        new CodegenError(
          'INVALID_TEXT',
          `Text${context} has conflicting heading flags: ${flags} — use only one of h1, h2, h3, h4`,
        ),
      )
    }
  })

  return errors
}
