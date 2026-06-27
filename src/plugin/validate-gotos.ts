import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'
import { CodegenError, type ExtractedScreen } from './types'

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

const RESERVED_GOTO = new Set(['_close', '_back'])

function isNamedNode(name: string) {
  return (node: { type?: string; name?: string | null }): node is MdxJsxElement =>
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === name
}

const isScreenNode = isNamedNode('Screen')
const isModalNode = isNamedNode('Modal')
const isLinkNode = isNamedNode('Link')

type GotoTarget = { kind: 'screen-id'; value: string } | { kind: 'unknown'; raw: string }

function getStringAttr(node: MdxJsxElement, name: string): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  return undefined
}

function getGotoTarget(node: MdxJsxElement): GotoTarget | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'goto')
  if (!attr || attr.value === null || attr.value === undefined) return undefined

  if (typeof attr.value === 'string') {
    return { kind: 'screen-id', value: attr.value }
  }

  if (attr.value.type === 'mdxJsxAttributeValueExpression') {
    const expr = attr.value.value.trim()
    const stringMatch = expr.match(/^(['"])(.*)\1$/)
    if (stringMatch) {
      return { kind: 'screen-id', value: stringMatch[2] }
    }

    return { kind: 'unknown', raw: expr }
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

function formatGotoTarget(target: GotoTarget): string {
  if (target.kind === 'screen-id') return `"${target.value}"`
  return target.raw
}

function collectModalIdsByScreen(
  tree: Root,
  screenIds: Set<string>,
): { modalIdsByScreen: Map<string, Set<string>>; errors: CodegenError[] } {
  const modalIdsByScreen = new Map<string, Set<string>>()
  const errors: CodegenError[] = []
  let activeScreenId: string | undefined
  let modalCount = 0

  visit(tree, (node) => {
    if (isScreenNode(node)) {
      activeScreenId = getStringAttr(node, 'id')
      return
    }

    if (!isModalNode(node)) return

    modalCount += 1
    const id = getStringAttr(node, 'id')
    const screenContext = activeScreenId ?? 'unknown'

    if (!id) {
      errors.push(
        new CodegenError('MISSING_MODAL_ID', `Modal ${modalCount} is missing an id attribute`),
      )
      return
    }

    if (screenIds.has(id)) {
      errors.push(
        new CodegenError(
          'DUPLICATE_SCREEN_ID',
          `Modal id "${id}" in screen "${screenContext}" conflicts with an existing Screen id`,
          screenContext,
        ),
      )
      return
    }

    const screenModals = modalIdsByScreen.get(screenContext) ?? new Set<string>()
    if (screenModals.has(id)) {
      errors.push(
        new CodegenError(
          'DUPLICATE_MODAL_ID',
          `Duplicate modal id "${id}" in screen "${screenContext}"`,
          screenContext,
        ),
      )
      return
    }

    screenModals.add(id)
    modalIdsByScreen.set(screenContext, screenModals)
  })

  return { modalIdsByScreen, errors }
}

export function collectGotoErrors(tree: Root, screens: ExtractedScreen[]): CodegenError[] {
  const errors: CodegenError[] = []
  const screenIds = new Set(screens.map((s) => s.id))
  const { modalIdsByScreen, errors: modalErrors } = collectModalIdsByScreen(tree, screenIds)
  errors.push(...modalErrors)

  let activeScreenId: string | undefined
  let activeScreenModalIds = new Set<string>()

  visit(tree, (node) => {
    if (isScreenNode(node)) {
      activeScreenId = getStringAttr(node, 'id')
      activeScreenModalIds =
        (activeScreenId ? modalIdsByScreen.get(activeScreenId) : undefined) ?? new Set()
      return
    }

    if (!isLinkNode(node)) return

    const linkLabel = getLinkLabel(node)
    const linkContext = linkLabel ? ` on link "${linkLabel}"` : ''
    const target = getGotoTarget(node)

    if (!target) {
      errors.push(
        new CodegenError(
          'INVALID_GOTO',
          `Link${linkContext} in screen "${activeScreenId ?? 'unknown'}" is missing a goto attribute`,
          activeScreenId,
        ),
      )
      return
    }

    if (target.kind === 'unknown') {
      errors.push(
        new CodegenError(
          'INVALID_GOTO',
          `Link${linkContext} in screen "${activeScreenId ?? 'unknown'}" — goto must be a string literal (got expression: ${target.raw})`,
          activeScreenId,
        ),
      )
      return
    }

    if (RESERVED_GOTO.has(target.value)) {
      return
    }

    const validGotoIds = new Set([...screenIds, ...activeScreenModalIds])
    if (validGotoIds.has(target.value)) return

    const label = formatGotoTarget(target)
    errors.push(
      new CodegenError(
        'INVALID_GOTO',
        `Invalid goto ${label}${linkContext} in screen "${activeScreenId ?? 'unknown'}" — no screen with id "${target.value}", and no modal with id "${target.value}" in this screen`,
        activeScreenId,
      ),
    )
  })

  return errors
}

export function validateGotos(tree: Root, screens: ExtractedScreen[]): void {
  const errors = collectGotoErrors(tree, screens)
  if (errors[0]) {
    throw errors[0]
  }
}
