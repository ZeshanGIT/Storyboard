import type { ClassifiedLink } from '../plugin/types'
import { CodegenError } from '../plugin/types'
import { RESERVED_GOTO_TARGETS } from '../types/goto'

export type ClassifyGotoLinkInput = {
  screenId: string
  linkIndex: number
  goto: string | undefined
  label?: string
  disabled?: boolean
  screenIds: ReadonlySet<string>
  modalIdsForScreen: ReadonlySet<string>
}

export type ClassifyGotoLinkResult = {
  link: ClassifiedLink
  error?: CodegenError
}

const RESERVED_GOTO = new Set<string>(RESERVED_GOTO_TARGETS)

export function classifyGotoLink(input: ClassifyGotoLinkInput): ClassifyGotoLinkResult {
  const { screenId, linkIndex, goto, label, disabled, screenIds, modalIdsForScreen } = input
  const linkContext = label ? ` on link "${label}"` : ''

  if (goto === undefined) {
    const error = new CodegenError(
      'INVALID_GOTO',
      `Link${linkContext} in screen "${screenId}" is missing a goto attribute`,
      screenId,
    )
    return { link: { classification: 'invalid-missing-goto', label }, error }
  }

  if (disabled) {
    return { link: { classification: 'disabled-skip', goto, label } }
  }

  if (RESERVED_GOTO.has(goto)) {
    return { link: { classification: 'reserved', goto, label } }
  }

  if (modalIdsForScreen.has(goto)) {
    return { link: { classification: 'modal', goto, label } }
  }

  if (!screenIds.has(goto)) {
    const error = new CodegenError(
      'INVALID_GOTO',
      `Invalid goto "${goto}"${linkContext} in screen "${screenId}" — no screen with id "${goto}", and no modal with id "${goto}" in this screen`,
      screenId,
    )
    return { link: { classification: 'invalid-target', goto, label }, error }
  }

  const linkId = `${screenId}:${linkIndex}`
  return {
    link: {
      classification: 'screen-edge',
      goto,
      label,
      linkId,
      toScreenId: goto,
    },
  }
}
