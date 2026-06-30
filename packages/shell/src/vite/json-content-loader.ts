import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildJsonDocument } from '../json/build-json-document'
import { jsonToWireframeDocumentBundle } from '../json/to-document-bundle'
import type { WireframeDocumentBundle } from '../types/wireframe-document'

export function loadJsonDocumentBundle(onespecDir: string): WireframeDocumentBundle {
  const raw = JSON.parse(readFileSync(join(onespecDir, 'spec.json'), 'utf8')) as Record<
    string,
    unknown
  >
  const built = buildJsonDocument(raw)
  if (!built.ok) {
    const msg = built.errors.map((e) => e.message).join('; ')
    throw new Error(`Invalid onespec/spec.json: ${msg}`)
  }
  return jsonToWireframeDocumentBundle(built.document, 'spec')
}
