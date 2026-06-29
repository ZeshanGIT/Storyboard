import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildMdxDocument } from './build-mdx-document'
import { extractNavigationGraph } from './extract-navigation-graph'
import { generateAggregateRoutes, generateDocumentFiles } from './generate'
import { generateContentDocuments } from './generate-documents'
import { resolveContentDir, resolveGeneratedDir } from './paths'
import { scanContentMdx } from './scan-content'
import type { CodegenResult, ExtractedScreen } from './types'
import { CodegenError } from './types'

export async function runFullCodegen(root: string): Promise<CodegenResult> {
  const outDir = resolveGeneratedDir(root)
  const contentDir = resolveContentDir(root)
  const documents = await scanContentMdx(contentDir)

  const documentScreens = new Map<string, ExtractedScreen[]>()
  const errors: CodegenError[] = []

  for (const doc of documents) {
    const source = await readFile(join(contentDir, doc.filename), 'utf8')
    const built = buildMdxDocument(source)
    if (built.ok === false) {
      for (const error of built.errors) {
        errors.push(
          new CodegenError(error.code, `${doc.filename}: ${error.message}`, error.screenId),
        )
      }
      continue
    }

    const screens: ExtractedScreen[] = built.document.screens.map((s) => ({
      id: s.id,
      title: s.title,
      jsx: s.jsx,
      order: s.order,
      modalIds: s.modalIds,
      links: s.links,
    }))
    documentScreens.set(doc.slug, screens)
    const graph = extractNavigationGraph(built.document)
    await generateDocumentFiles(doc.slug, built.document, graph, outDir)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  await generateAggregateRoutes(documentScreens, outDir)
  await generateContentDocuments(documents, documentScreens, outDir)

  const primarySlug = documentScreens.has('storyboard')
    ? 'storyboard'
    : documentScreens.has('wireframe')
      ? 'wireframe'
      : documents[0]?.slug

  return {
    ok: true,
    screens: primarySlug ? (documentScreens.get(primarySlug) ?? []) : [],
  }
}
