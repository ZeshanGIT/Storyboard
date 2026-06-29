import type { JsonNode } from './types'

export type RawJsonLink = {
  goto: string | undefined
  label?: string
  disabled: boolean
}

function linkLabel(node: JsonNode): string | undefined {
  if (typeof node.children === 'string') return node.children
  return undefined
}

export function collectRawLinks(nodes: readonly JsonNode[]): RawJsonLink[] {
  const links: RawJsonLink[] = []

  function walk(node: JsonNode): void {
    if (node.tag.component === 'Link') {
      const goto = node.props.goto
      links.push({
        goto: typeof goto === 'string' ? goto : undefined,
        label: linkLabel(node),
        disabled: node.tag.modifiers.includes('disabled'),
      })
    }
    if (typeof node.children === 'string' || node.children === undefined) return
    for (const child of node.children) {
      walk(child)
    }
  }

  for (const node of nodes) {
    walk(node)
  }

  return links
}
