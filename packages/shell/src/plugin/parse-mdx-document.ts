import type { Root } from 'mdast'
import { mdxProcessor } from './mdx-ast'
import { CodegenError } from './types'

export function parseMdxDocument(
  source: string,
): { ok: true; tree: Root } | { ok: false; errors: CodegenError[] } {
  try {
    const tree = mdxProcessor.parse(source) as Root
    return { ok: true, tree }
  } catch (err) {
    return {
      ok: false,
      errors: [
        new CodegenError('PARSE_ERROR', err instanceof Error ? err.message : 'Failed to parse MDX'),
      ],
    }
  }
}
