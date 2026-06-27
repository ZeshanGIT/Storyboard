import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { extractFrontmatter } from './extract-frontmatter'

export type ScannedMdxDocument = {
  slug: string
  filename: string
  title: string
  importPath: string
}

function sortMdxFilenames(filenames: string[]): string[] {
  return [...filenames].sort((a, b) => {
    if (a === 'wireframe.mdx') return -1
    if (b === 'wireframe.mdx') return 1
    return a.localeCompare(b)
  })
}

export function slugToDocumentExportName(slug: string): string {
  const base = slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return `${base}Document`
}

export async function scanContentMdx(contentDir: string): Promise<ScannedMdxDocument[]> {
  const entries = await readdir(contentDir, { withFileTypes: true })
  const filenames = sortMdxFilenames(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
      .map((entry) => entry.name),
  )

  const documents: ScannedMdxDocument[] = []
  for (const filename of filenames) {
    const source = await readFile(join(contentDir, filename), 'utf8')
    const { title } = extractFrontmatter(source, filename)
    const slug = filename.replace(/\.mdx$/i, '')
    documents.push({
      slug,
      filename,
      title,
      importPath: `../content/${filename}`,
    })
  }

  return documents
}
