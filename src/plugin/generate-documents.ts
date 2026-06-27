import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type ScannedMdxDocument, slugToDocumentExportName } from './scan-content'
import type { ExtractedScreen } from './types'

const HEADER = '// AUTO-GENERATED — do not edit\n\n'

function slugToRoutesAlias(slug: string): string {
  return `${slug.replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())}Routes`
}

export async function generateContentDocuments(
  documents: ScannedMdxDocument[],
  documentScreens: ReadonlyMap<string, readonly ExtractedScreen[]>,
  outDir: string,
): Promise<void> {
  const mdxImportLines = documents
    .map((doc) => {
      const name = slugToDocumentExportName(doc.slug)
      return `import ${name} from '${doc.importPath}'`
    })
    .join('\n')

  const routeImportLines = documents
    .filter((doc) => documentScreens.has(doc.slug))
    .map((doc) => {
      const alias = slugToRoutesAlias(doc.slug)
      return `import { routes as ${alias} } from './documents/${doc.slug}/routes.generated'`
    })
    .join('\n')

  const entries = documents
    .filter((doc) => documentScreens.has(doc.slug))
    .map((doc) => {
      const name = slugToDocumentExportName(doc.slug)
      const alias = slugToRoutesAlias(doc.slug)
      return `  {\n    slug: '${doc.slug}',\n    title: ${JSON.stringify(doc.title)},\n    component: ${name},\n    routes: ${alias},\n  }`
    })
    .join(',\n')

  const content = `${HEADER}import type { ComponentType } from 'react'
${mdxImportLines}
${routeImportLines}

export type DocumentRoute = {
  id: string
  path: string
  component: ComponentType
}

export type ContentDocumentEntry = {
  slug: string
  title: string
  component: ComponentType
  routes: readonly DocumentRoute[]
}

export const contentDocuments = [
${entries},
] as const

export type ContentDocumentSlug = (typeof contentDocuments)[number]['slug']
`

  await writeFile(join(outDir, 'content-documents.generated.tsx'), content, 'utf8')
}
