import { buildMdxDocument } from '@/plugin/build-mdx-document'
import { extractFrontmatter } from '@/plugin/extract-frontmatter'
import type { MdxDocument } from '@/plugin/types'

export type MdxPlaygroundBuilt = {
  title: string
  document: MdxDocument
}

export type CompilePlaygroundMdxResult =
  | { ok: true; built: MdxPlaygroundBuilt }
  | { ok: false; errors: readonly string[] }

export function compilePlaygroundMdx(
  text: string,
  filename = 'playground.mdx',
): CompilePlaygroundMdxResult {
  const { title } = extractFrontmatter(text, filename)
  const built = buildMdxDocument(text)
  if (!built.ok) {
    return {
      ok: false,
      errors: built.errors.map((entry) =>
        entry.code === 'PARSE_ERROR' ? `MDX parse error: ${entry.message}` : entry.message,
      ),
    }
  }
  return { ok: true, built: { title, document: built.document } }
}
