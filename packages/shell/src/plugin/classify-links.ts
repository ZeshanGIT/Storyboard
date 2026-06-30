import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { classifyGotoLink } from '../json/classify-goto-link'
import { getGotoTarget, getLinkLabel, getStringAttr, hasBooleanAttr, isNamedNode } from './mdx-ast'
import { type ClassifiedLink, CodegenError } from './types'

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
    const gotoTarget = getGotoTarget(node)

    if (gotoTarget?.kind === 'unknown') {
      errors.push(
        new CodegenError(
          'INVALID_GOTO',
          `Link${linkContext} in screen "${activeScreenId ?? 'unknown'}" — goto must be a string literal (got expression: ${gotoTarget.raw})`,
          activeScreenId,
        ),
      )
      pushLink(linksByScreen, activeScreenId, { classification: 'invalid-expression-goto', label })
      return
    }

    const { link, error } = classifyGotoLink({
      screenId: activeScreenId,
      linkIndex,
      goto: gotoTarget?.kind === 'screen-id' ? gotoTarget.value : undefined,
      label,
      disabled: hasBooleanAttr(node, 'disabled'),
      screenIds,
      modalIdsForScreen: modalIdsByScreen.get(activeScreenId) ?? new Set(),
    })
    if (error) errors.push(error)
    pushLink(linksByScreen, activeScreenId, link)
    if (link.classification === 'screen-edge') linkIndex += 1
  })

  return { linksByScreen, errors }
}

function pushLink(map: Map<string, ClassifiedLink[]>, screenId: string, link: ClassifiedLink) {
  const list = map.get(screenId) ?? []
  list.push(link)
  map.set(screenId, list)
}
