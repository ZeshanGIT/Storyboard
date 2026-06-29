import type { Root, Text as MdastText } from 'mdast'
import type { ComponentType, ReactNode } from 'react'
import { Fragment } from 'react'
import {
  Container,
  Divider,
  Icon,
  Image,
  Input,
  Link,
  Modal,
  Screen,
  Text,
  TopBar,
} from '@/components/wireframe'
import type { MdxJsxElement } from '@/plugin/mdx-ast'
import { mdxProcessor } from '@/plugin/mdx-ast'
import { mdxAttributesToProps } from './mdx-element-props'

const WIREFRAME_COMPONENTS: Record<string, ComponentType<Record<string, unknown>>> = {
  Screen: Screen as ComponentType<Record<string, unknown>>,
  Text: Text as ComponentType<Record<string, unknown>>,
  Link: Link as ComponentType<Record<string, unknown>>,
  Input: Input as ComponentType<Record<string, unknown>>,
  Container: Container as ComponentType<Record<string, unknown>>,
  Image: Image as ComponentType<Record<string, unknown>>,
  Icon: Icon as ComponentType<Record<string, unknown>>,
  Modal: Modal as ComponentType<Record<string, unknown>>,
  TopBar: TopBar as ComponentType<Record<string, unknown>>,
  Divider: Divider as ComponentType<Record<string, unknown>>,
}

type WireframeComponentName = keyof typeof WIREFRAME_COMPONENTS

function isWireframeComponent(name: string | null | undefined): name is WireframeComponentName {
  return name !== null && name !== undefined && name in WIREFRAME_COMPONENTS
}

function renderMdxChildren(children: MdxJsxElement['children']): ReactNode {
  return children.map((child, index) => {
    if (child.type === 'text') {
      const text = (child as MdastText).value
      return text ? <Fragment key={`t-${index}`}>{text}</Fragment> : null
    }
    if (child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement') {
      return <Fragment key={`n-${index}`}>{renderMdxJsxElement(child)}</Fragment>
    }
    return null
  })
}

export function renderMdxJsxElement(node: MdxJsxElement): ReactNode {
  const name = node.name
  if (!isWireframeComponent(name)) {
    return null
  }

  const Component = WIREFRAME_COMPONENTS[name]
  const props = mdxAttributesToProps(node.attributes)

  return <Component {...props}>{renderMdxChildren(node.children)}</Component>
}

export function renderMdxScreenJsx(jsx: string): ReactNode {
  const tree = mdxProcessor.parse(jsx) as Root
  const root = tree.children[0]
  if (!root || (root.type !== 'mdxJsxFlowElement' && root.type !== 'mdxJsxTextElement')) {
    return null
  }
  return renderMdxJsxElement(root)
}
