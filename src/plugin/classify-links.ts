import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { getGotoValue, getLinkLabel, getStringAttr, hasBooleanAttr, isNamedNode } from './mdx-ast'
import { type ClassifiedLink, CodegenError } from './types'

const RESERVED_GOTO = new Set(['_close', '_back'])
const isScreenNode = isNamedNode('Screen')
const isLinkNode = isNamedNode('Link')

export function classifyScreenLinks(
  tree: Root,
  screenIds: Set<string>,
  modalIdsByScreen: Map<string, Set<string>>,
): { linksByScreen: Map<string, ClassifiedLink[]>; errors: CodegenError[] } {
  const linksByScreen = new Map<string, ClassifiedLink[]>()
  const errors: CodegenError[] = []
  let activeScreenId: string | undefined
  let linkIndex = 0

  visit(tree, (node) => {
    if (isScreenNode(node)) {
      activeScreenId = getStringAttr(node, 'id')
      linkIndex = 0
      return
    }
    if (!isLinkNode(node) || !activeScreenId) return

    const label = getLinkLabel(node)
    const linkContext = label ? ` on link "${label}"` : ''
    const goto = getGotoValue(node)

    if (!goto) {
      errors.push(
        new CodegenError(
          'INVALID_GOTO',
          `Link${linkContext} in screen "${activeScreenId}" is missing a goto attribute`,
          activeScreenId,
        ),
      )
      pushLink(linksByScreen, activeScreenId, { classification: 'invalid-missing-goto', label })
      return
    }

    if (hasBooleanAttr(node, 'disabled')) {
      pushLink(linksByScreen, activeScreenId, { classification: 'disabled-skip', goto, label })
      return
    }

    if (RESERVED_GOTO.has(goto)) {
      pushLink(linksByScreen, activeScreenId, { classification: 'reserved', goto, label })
      return
    }

    const screenModalIds = modalIdsByScreen.get(activeScreenId) ?? new Set<string>()
    if (screenModalIds.has(goto)) {
      pushLink(linksByScreen, activeScreenId, { classification: 'modal', goto, label })
      return
    }

    if (!screenIds.has(goto)) {
      errors.push(
        new CodegenError(
          'INVALID_GOTO',
          `Invalid goto "${goto}"${linkContext} in screen "${activeScreenId ?? 'unknown'}" — no screen with id "${goto}", and no modal with id "${goto}" in this screen`,
          activeScreenId,
        ),
      )
      pushLink(linksByScreen, activeScreenId, { classification: 'invalid-target', goto, label })
      return
    }

    const linkId = `${activeScreenId}:${linkIndex}`
    linkIndex += 1
    pushLink(linksByScreen, activeScreenId, {
      classification: 'screen-edge',
      goto,
      label,
      linkId,
      toScreenId: goto,
    })
  })

  return { linksByScreen, errors }
}

function pushLink(map: Map<string, ClassifiedLink[]>, screenId: string, link: ClassifiedLink) {
  const list = map.get(screenId) ?? []
  list.push(link)
  map.set(screenId, list)
}
