import { visit } from 'unist-util-visit'
import { classifyScreenLinks } from './classify-links'
import type { MdxJsxElement } from './mdx-ast'
import { getStringAttr, isNamedNode, stringifyMdxNode } from './mdx-ast'
import { parseMdxDocument } from './parse-mdx-document'
import { CodegenError, type MdxDocument, type MdxScreen } from './types'
import { collectModalIdsByScreen } from './validate-gotos'
import { collectTextErrors } from './validate-text'

const isScreenNode = isNamedNode('Screen')

type ScreenEntry = {
  node: MdxJsxElement
  id: string
  title: string
  note?: string
  order: number
}

export function buildMdxDocument(
  source: string,
): { ok: true; document: MdxDocument } | { ok: false; errors: CodegenError[] } {
  const parsed = parseMdxDocument(source)
  if (!parsed.ok) return parsed

  const { tree } = parsed
  const errors: CodegenError[] = []
  const screenEntries: ScreenEntry[] = []
  const seenIds = new Map<string, { order: number; title: string }>()
  let screenCount = 0

  visit(tree, (node) => {
    if (!isScreenNode(node)) return

    screenCount += 1
    const id = getStringAttr(node, 'id')
    const title = getStringAttr(node, 'title') ?? ''
    const note = getStringAttr(node, 'note')

    if (!id) {
      errors.push(
        new CodegenError('MISSING_SCREEN_ID', `Screen ${screenCount} is missing an id attribute`),
      )
      return
    }

    if (seenIds.has(id)) {
      const first = seenIds.get(id)
      if (!first) return
      errors.push(
        new CodegenError(
          'DUPLICATE_SCREEN_ID',
          `Duplicate screen id "${id}" — first at screen ${first.order + 1} ("${first.title}"), repeated at screen ${screenCount} ("${title}")`,
          id,
        ),
      )
      return
    }

    seenIds.set(id, { order: screenEntries.length, title })
    screenEntries.push({
      node,
      id,
      title,
      note,
      order: screenEntries.length,
    })
  })

  const screenIds = new Set(screenEntries.map((s) => s.id))
  const { modalIdsByScreen, errors: modalErrors } = collectModalIdsByScreen(tree, screenIds)
  errors.push(...modalErrors)

  const { linksByScreen, errors: linkErrors } = classifyScreenLinks(
    tree,
    screenIds,
    modalIdsByScreen,
  )
  errors.push(...linkErrors)

  errors.push(...collectTextErrors(tree))

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const screens: MdxScreen[] = screenEntries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    order: entry.order,
    jsx: stringifyMdxNode(entry.node),
    modalIds: [...(modalIdsByScreen.get(entry.id) ?? [])],
    links: linksByScreen.get(entry.id) ?? [],
    ...(entry.note !== undefined ? { note: entry.note } : {}),
  }))

  return { ok: true, document: { tree, screens } }
}
