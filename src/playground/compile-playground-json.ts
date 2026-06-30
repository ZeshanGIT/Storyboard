import { buildJsonDocument, type JsonDocumentBuilt } from '@onespec-dev/shell'

export type CompilePlaygroundJsonResult =
  | { ok: true; document: JsonDocumentBuilt }
  | { ok: false; errors: readonly string[] }

export function compilePlaygroundJson(text: string): CompilePlaygroundJsonResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    return { ok: false, errors: [`JSON parse error: ${message}`] }
  }

  const built = buildJsonDocument(raw)
  if (!built.ok) {
    return { ok: false, errors: built.errors.map((entry) => entry.message) }
  }

  return { ok: true, document: built.document }
}
