import { buildMdxDocument, extractFrontmatter, type MdxDocument } from '@storyboard/shell'

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
  if (typeof text !== 'string') {
    return { ok: false, errors: ['MDX parse error: editor source must be a string'] }
  }
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
