import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generateContentDocuments } from './generate-documents'
import type { ScannedMdxDocument } from './scan-content'
import type { ExtractedScreen } from './types'

const documents: ScannedMdxDocument[] = [
  {
    slug: 'wireframe',
    filename: 'wireframe.mdx',
    title: 'Wireframe App',
    importPath: '../content/wireframe.mdx',
  },
  {
    slug: 'components',
    filename: 'components.mdx',
    title: 'Component Catalog',
    importPath: '../content/components.mdx',
  },
]

const documentScreens = new Map<string, ExtractedScreen[]>([
  [
    'wireframe',
    [{ id: 'home', title: 'Home', jsx: '<Screen id="home" />', order: 0, modalIds: [], links: [] }],
  ],
  [
    'components',
    [
      {
        id: 'cmp-index',
        title: 'Index',
        jsx: '<Screen id="cmp-index" />',
        order: 0,
        modalIds: [],
        links: [],
      },
    ],
  ],
])

describe('generateContentDocuments', () => {
  it('writes content document registry with imports, routes, and types', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wfx-docs-'))
    await generateContentDocuments(documents, documentScreens, dir)

    const generated = await readFile(join(dir, 'content-documents.generated.tsx'), 'utf8')

    expect(generated).toContain("import WireframeDocument from '../content/wireframe.mdx'")
    expect(generated).toContain("import ComponentsDocument from '../content/components.mdx'")
    expect(generated).toContain(
      "import { routes as wireframeRoutes } from './documents/wireframe/routes.generated'",
    )
    expect(generated).toContain("slug: 'wireframe'")
    expect(generated).toContain('title: "Wireframe App"')
    expect(generated).toContain('routes: wireframeRoutes')
    expect(generated).toContain('export const contentDocuments')
    expect(generated).toContain('export type ContentDocumentSlug')
  })
})
