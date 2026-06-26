import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'
import { screenIdToScreensKey } from './naming'
import { CodegenError, type ExtractedScreen } from './types'

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

function isScreenNode(node: { type?: string; name?: string | null }): node is MdxJsxElement {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    node.name === 'Screen'
  )
}

function isLinkNode(node: { type?: string; name?: string | null }): node is MdxJsxElement {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'Link'
  )
}

type GotoTarget =
  | { kind: 'screen-id'; value: string }
  | { kind: 'screens-key'; key: string }
  | { kind: 'unknown'; raw: string }

function getGotoTarget(node: MdxJsxElement): GotoTarget | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'goto')
  if (!attr || attr.value === null || attr.value === undefined) return undefined

  if (typeof attr.value === 'string') {
    return { kind: 'screen-id', value: attr.value }
  }

  if (attr.value.type === 'mdxJsxAttributeValueExpression') {
    const expr = attr.value.value.trim()
    const screensMatch = expr.match(/^Screens\.(\w+)$/)
    if (screensMatch) {
      return { kind: 'screens-key', key: screensMatch[1] }
    }

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
  if (target.kind === 'screens-key') return `Screens.${target.key}`
  return target.raw
}

function resolveGotoScreenId(
  target: GotoTarget,
  validIds: Set<string>,
  screensKeyToId: Map<string, string>,
): string | undefined {
  if (target.kind === 'screen-id') {
    return validIds.has(target.value) ? target.value : undefined
  }

  if (target.kind === 'screens-key') {
    return screensKeyToId.get(target.key)
  }

  return undefined
}

export function collectGotoErrors(tree: Root, screens: ExtractedScreen[]): CodegenError[] {
  const errors: CodegenError[] = []
  const validIds = new Set(screens.map((s) => s.id))
  const screensKeyToId = new Map(screens.map((s) => [screenIdToScreensKey(s.id), s.id] as const))
  const knownKeys = [...screensKeyToId.keys()].join(', ')

  let activeScreenId: string | undefined

  visit(tree, (node) => {
    if (isScreenNode(node)) {
      const idAttr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'id')
      activeScreenId = idAttr && typeof idAttr.value === 'string' ? idAttr.value : undefined
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

    const resolved = resolveGotoScreenId(target, validIds, screensKeyToId)
    if (resolved) return

    const label = formatGotoTarget(target)
    const hint =
      target.kind === 'screens-key'
        ? ` — Screens.${target.key} is not defined (known keys: ${knownKeys})`
        : target.kind === 'screen-id'
          ? ` — no screen with id "${target.value}"`
          : ''

    errors.push(
      new CodegenError(
        'INVALID_GOTO',
        `Invalid goto ${label}${linkContext} in screen "${activeScreenId ?? 'unknown'}"${hint}`,
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
