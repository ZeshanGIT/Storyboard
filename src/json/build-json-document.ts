import type { ClassifiedLink } from '@/plugin/types'
import { classifyGotoLink } from './classify-goto-link'
import { collectRawLinks } from './collect-links'
import { collectModalIds } from './collect-modals'
import { parseJsonNode } from './parse-node'
import { JsonBuildError, type JsonNode } from './types'

export type JsonScreenBuilt = {
  id: string
  title: string
  order: number
  note?: string
  nodes: readonly JsonNode[]
  modalIds: readonly string[]
  links: readonly ClassifiedLink[]
}

export type JsonDocumentBuilt = {
  title: string
  screens: readonly JsonScreenBuilt[]
}

type JsonScreenInput = {
  title?: unknown
  note?: unknown
  nodes?: unknown
}

function validateTextLeaves(nodes: readonly JsonNode[], screenId: string): JsonBuildError[] {
  const errors: JsonBuildError[] = []

  function walk(node: JsonNode): void {
    if (node.tag.component === 'Text') {
      if (node.children !== undefined && typeof node.children !== 'string') {
        errors.push(
          new JsonBuildError(
            'INVALID_TEXT',
            `Text in screen "${screenId}" must have plain string content only`,
            screenId,
          ),
        )
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

  return errors
}

export function buildJsonDocument(
  raw: unknown,
): { ok: true; document: JsonDocumentBuilt } | { ok: false; errors: JsonBuildError[] } {
  const errors: JsonBuildError[] = []

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [new JsonBuildError('INVALID_DOCUMENT', 'Document must be a JSON object')],
    }
  }

  const record = raw as Record<string, unknown>
  const title = record.title
  const screensRaw = record.screens

  if (typeof title !== 'string' || title.length === 0) {
    errors.push(new JsonBuildError('INVALID_DOCUMENT', 'Document title is required'))
  }

  if (typeof screensRaw !== 'object' || screensRaw === null || Array.isArray(screensRaw)) {
    errors.push(new JsonBuildError('INVALID_DOCUMENT', 'Document screens must be an object'))
    return { ok: false, errors }
  }

  const screenKeys = Object.keys(screensRaw)
  const screenIds = new Set(screenKeys)
  const screens: JsonScreenBuilt[] = []

  for (const [index, screenId] of screenKeys.entries()) {
    const screenInput = (screensRaw as Record<string, JsonScreenInput>)[screenId]
    if (screenInput === undefined) continue

    const screenTitle = typeof screenInput.title === 'string' ? screenInput.title : screenId
    const screenNote = typeof screenInput.note === 'string' ? screenInput.note : undefined

    if (!Array.isArray(screenInput.nodes)) {
      errors.push(
        new JsonBuildError('INVALID_NODE', `Screen "${screenId}" nodes must be an array`, screenId),
      )
      continue
    }

    const nodes: JsonNode[] = []
    for (const rawNode of screenInput.nodes) {
      try {
        nodes.push(parseJsonNode(rawNode))
      } catch (error) {
        if (error instanceof JsonBuildError) {
          errors.push(
            error.screenId ? error : new JsonBuildError(error.code, error.message, screenId),
          )
        } else {
          throw error
        }
      }
    }

    errors.push(...validateTextLeaves(nodes, screenId))

    const modalIds = collectModalIds(nodes)
    const seenModalIds = new Set<string>()
    for (const modalId of modalIds) {
      if (screenIds.has(modalId)) {
        errors.push(
          new JsonBuildError(
            'DUPLICATE_MODAL_ID',
            `Modal id "${modalId}" in screen "${screenId}" matches a screen id`,
            screenId,
          ),
        )
      }
      if (seenModalIds.has(modalId)) {
        errors.push(
          new JsonBuildError(
            'DUPLICATE_MODAL_ID',
            `Duplicate modal id "${modalId}" in screen "${screenId}"`,
            screenId,
          ),
        )
      }
      seenModalIds.add(modalId)
    }

    for (const node of nodes) {
      if (node.tag.component === 'Modal') {
        const modalId = node.props.id
        if (typeof modalId !== 'string' || modalId.length === 0) {
          errors.push(
            new JsonBuildError(
              'MISSING_MODAL_ID',
              `Modal in screen "${screenId}" is missing id`,
              screenId,
            ),
          )
        }
      }
    }

    const rawLinks = collectRawLinks(nodes)
    const classifiedLinks: ClassifiedLink[] = []
    let linkIndex = 0
    const modalIdsForScreen = new Set(modalIds)

    for (const rawLink of rawLinks) {
      const { link, error } = classifyGotoLink({
        screenId,
        linkIndex,
        goto: rawLink.goto,
        label: rawLink.label,
        disabled: rawLink.disabled,
        screenIds,
        modalIdsForScreen,
      })
      if (error) errors.push(error)
      classifiedLinks.push(link)
      if (link.classification === 'screen-edge') linkIndex += 1
    }

    screens.push({
      id: screenId,
      title: screenTitle,
      order: index,
      nodes,
      modalIds,
      links: classifiedLinks,
      ...(screenNote !== undefined ? { note: screenNote } : {}),
    })
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  for (const screen of screens) {
    stampGraphLinkIds(screen.nodes, screen.links)
  }

  if (typeof title !== 'string') {
    return { ok: false, errors }
  }

  return { ok: true, document: { title, screens } }
}

function stampGraphLinkIds(nodes: readonly JsonNode[], links: readonly ClassifiedLink[]): void {
  let linkCursor = 0

  function walk(node: JsonNode): void {
    if (node.tag.component === 'Link') {
      const classified = links[linkCursor]
      linkCursor += 1
      if (classified?.linkId) {
        node.graphLinkId = classified.linkId
      }
      return
    }

    if (typeof node.children === 'string' || node.children === undefined) return
    for (const child of node.children) {
      walk(child)
    }
  }

  for (const node of nodes) {
    walk(node)
  }
}
