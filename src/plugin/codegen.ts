import { buildMdxDocument } from './build-mdx-document'
import { extractNavigationGraph } from './extract-navigation-graph'
import { generateWireframeFiles } from './generate'
import type { CodegenError, ExtractedScreen } from './types'

export type RunCodegenResult =
  | { ok: true; screens: ExtractedScreen[] }
  | { ok: false; errors: CodegenError[] }

export async function runCodegen(source: string, outDir: string): Promise<RunCodegenResult> {
  const built = buildMdxDocument(source)
  if (!built.ok) {
    return built
  }
  const screens: ExtractedScreen[] = built.document.screens.map((s) => ({
    id: s.id,
    title: s.title,
    jsx: s.jsx,
    order: s.order,
    modalIds: s.modalIds,
  }))
  const graph = extractNavigationGraph(built.document)
  await generateWireframeFiles(screens, outDir, graph)
  return { ok: true, screens }
}
