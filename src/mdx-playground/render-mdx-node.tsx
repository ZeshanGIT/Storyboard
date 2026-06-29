import type { Text as MdastText, Root } from 'mdast'
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

type MdastChild = MdxJsxElement['children'][number]

function renderMdastChild(child: MdastChild, key: string): ReactNode {
  if (child.type === 'text') {
    const text = (child as MdastText).value
    return text ? <Fragment key={key}>{text}</Fragment> : null
  }
  if (child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement') {
    return <Fragment key={key}>{renderMdxJsxElement(child)}</Fragment>
  }
  if (child.type === 'paragraph' && 'children' in child) {
    return (
      <Fragment key={key}>
        {renderMdxChildren(child.children as MdxJsxElement['children'])}
      </Fragment>
    )
  }
  return null
}

function renderMdxChildren(children: MdxJsxElement['children']): ReactNode {
  let keySeq = 0
  return children.map((child) => renderMdastChild(child, `mdx-${keySeq++}`))
}

function asMdxJsxElement(node: { type?: string; name?: string | null }): MdxJsxElement | null {
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    return node as MdxJsxElement
  }
  return null
}

function findScreenRoot(tree: Root): MdxJsxElement | null {
  for (const child of tree.children) {
    const jsx = asMdxJsxElement(child)
    if (jsx?.name === 'Screen') return jsx

    if (child.type === 'paragraph') {
      for (const nested of child.children) {
        const nestedJsx = asMdxJsxElement(nested)
        if (nestedJsx?.name === 'Screen') return nestedJsx
      }
    }
  }

  const first = asMdxJsxElement(tree.children[0] ?? {})
  return first
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
  const root = findScreenRoot(tree)
  if (!root) return null
  return renderMdxJsxElement(root)
}
