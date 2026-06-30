import { buildMdxDocument } from './build-mdx-document'
import { extractNavigationGraph } from './extract-navigation-graph'
import { generateAggregateRoutes, generateDocumentFiles } from './generate'
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
    links: s.links,
  }))
  const graph = extractNavigationGraph(built.document)
  await generateDocumentFiles('wireframe', built.document, graph, outDir)
  await generateAggregateRoutes(new Map([['wireframe', screens]]), outDir)
  return { ok: true, screens }
}
