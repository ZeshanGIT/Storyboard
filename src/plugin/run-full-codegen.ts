import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { extractScreens } from './extract-screens'
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
    const extracted = extractScreens(source)
    if (!extracted.ok) {
      for (const error of extracted.errors) {
        errors.push(
          new CodegenError(error.code, `${doc.filename}: ${error.message}`, error.screenId),
        )
      }
      continue
    }

    documentScreens.set(doc.slug, extracted.screens)
    await generateDocumentFiles(doc.slug, extracted.screens, outDir)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  await generateAggregateRoutes(documentScreens, outDir)
  await generateContentDocuments(documents, documentScreens, outDir)

  return {
    ok: true,
    screens:
      (documentScreens.get('wireframe') ?? documents[0])
        ? (documentScreens.get(documents[0].slug) ?? [])
        : [],
  }
}
