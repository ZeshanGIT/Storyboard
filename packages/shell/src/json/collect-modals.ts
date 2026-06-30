import type { JsonNode } from './types'

export function collectModalIds(nodes: readonly JsonNode[]): string[] {
  const modalIds: string[] = []

  function walk(node: JsonNode): void {
    if (node.tag.component === 'Modal') {
      const id = node.props.id
      if (typeof id === 'string' && id.length > 0) {
        modalIds.push(id)
      }
    }
    if (typeof node.children === 'string' || node.children === undefined) return
    for (const child of node.children) {
      walk(child)
    }
  }

  for (const node of nodes) {
    walk(node)
  }

  return modalIds
}
