import { buildMdxDocument } from './build-mdx-document'
import type { CodegenResult, ExtractedScreen } from './types'

export function extractScreens(source: string): CodegenResult {
  const built = buildMdxDocument(source)
  if (!built.ok) return built
  const screens: ExtractedScreen[] = built.document.screens.map((s) => ({
    id: s.id,
    title: s.title,
    jsx: s.jsx,
    order: s.order,
    modalIds: s.modalIds,
  }))
  return { ok: true, screens }
}
