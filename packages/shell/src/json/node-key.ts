import type { JsonNode } from './types'

export function jsonNodeKey(node: JsonNode, index: number): string {
  const modifiers = node.tag.modifiers.join(':')
  const propsKey =
    typeof node.props.goto === 'string'
      ? node.props.goto
      : typeof node.props.id === 'string'
        ? node.props.id
        : typeof node.props.label === 'string'
          ? node.props.label
          : ''
  const childKey = typeof node.children === 'string' ? node.children : String(index)
  return `${index}:${node.tag.component}:${modifiers}:${propsKey}:${childKey}`
}
