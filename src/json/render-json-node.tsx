import type { ReactNode } from 'react'
import {
  Container,
  Divider,
  Icon,
  Image,
  Input,
  Link,
  Modal,
  Text,
  TopBar,
} from '@/components/wireframe'
import type { IconSize } from '@/components/wireframe/Icon'
import type { ImageAspect } from '@/components/wireframe/Image'
import type { InputType } from '@/components/wireframe/Input'
import { jsonNodeKey } from './node-key'
import type { JsonNode, JsonProps, ParsedTag } from './types'

export type RenderJsonContext = Record<string, never>

const INPUT_TYPES = new Set<InputType>([
  'text',
  'password',
  'textarea',
  'checkbox',
  'radio',
  'toggle',
  'select',
  'search',
  'number',
  'date',
])

const IMAGE_ASPECTS = new Set<ImageAspect>(['square', 'portrait', 'landscape', 'wide'])
const ICON_SIZES = new Set<IconSize>(['sm', 'md', 'lg'])

export function propsFromTag(tag: ParsedTag, props: JsonProps): Record<string, unknown> {
  const result: Record<string, unknown> = { ...props }

  for (const modifier of tag.modifiers) {
    if (modifier === 'disabled' || modifier === 'danger' || modifier === 'required') {
      result[modifier] = true
      continue
    }

    switch (tag.component) {
      case 'Text':
        if (modifier === 'h1' || modifier === 'h2' || modifier === 'h3' || modifier === 'h4') {
          result[modifier] = true
        }
        break
      case 'Link':
        if (modifier === 'primary-btn' || modifier === 'secondary-btn') {
          result[modifier] = true
        }
        break
      case 'Input':
        if (INPUT_TYPES.has(modifier as InputType)) {
          result.type = modifier
        }
        break
      case 'Container':
        if (modifier === 'row' || modifier === 'border') {
          result[modifier] = true
        }
        break
      case 'Image':
        if (IMAGE_ASPECTS.has(modifier as ImageAspect)) {
          result.aspect = modifier
        }
        break
      case 'Icon':
        if (ICON_SIZES.has(modifier as IconSize)) {
          result.size = modifier
        }
        break
      case 'TopBar':
        if (modifier === 'showBack') {
          result.showBack = true
        }
        break
      default:
        break
    }
  }

  return result
}

function renderChildren(
  children: readonly JsonNode[] | string | undefined,
  ctx: RenderJsonContext,
): ReactNode {
  if (children === undefined) return null
  if (typeof children === 'string') return children
  return children.map((child, index) => (
    <JsonNodeElement key={jsonNodeKey(child, index)} node={child} ctx={ctx} />
  ))
}

function JsonNodeElement({ node, ctx }: { node: JsonNode; ctx: RenderJsonContext }) {
  const mapped = propsFromTag(node.tag, node.props)
  const { component } = node.tag

  switch (component) {
    case 'Text':
      return (
        <Text {...(mapped as React.ComponentProps<typeof Text>)}>
          {typeof node.children === 'string' ? node.children : undefined}
        </Text>
      )
    case 'Link': {
      const graphLinkId = node.graphLinkId
      return (
        <Link
          {...(mapped as React.ComponentProps<typeof Link>)}
          {...(graphLinkId ? { 'graph-link-id': graphLinkId } : {})}
        >
          {renderChildren(node.children, ctx)}
        </Link>
      )
    }
    case 'Input':
      return <Input {...(mapped as React.ComponentProps<typeof Input>)} />
    case 'Container':
      return (
        <Container {...(mapped as React.ComponentProps<typeof Container>)}>
          {renderChildren(node.children, ctx)}
        </Container>
      )
    case 'Image':
      return <Image {...(mapped as React.ComponentProps<typeof Image>)} />
    case 'Icon':
      return <Icon {...(mapped as React.ComponentProps<typeof Icon>)} />
    case 'Modal':
      return (
        <Modal {...(mapped as React.ComponentProps<typeof Modal>)}>
          {renderChildren(node.children, ctx)}
        </Modal>
      )
    case 'TopBar':
      return (
        <TopBar {...(mapped as React.ComponentProps<typeof TopBar>)}>
          {renderChildren(node.children, ctx)}
        </TopBar>
      )
    case 'Divider':
      return <Divider {...(mapped as React.ComponentProps<typeof Divider>)} />
    default:
      return null
  }
}

export function renderJsonNode(node: JsonNode, ctx: RenderJsonContext = {}): ReactNode {
  return <JsonNodeElement node={node} ctx={ctx} />
}

export const JSON_RENDER_CONTEXT: RenderJsonContext = {}
