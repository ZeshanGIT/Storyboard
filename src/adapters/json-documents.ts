import {
  buildJsonDocument,
  jsonToWireframeDocumentBundle,
  type WireframeDocumentBundle,
} from '@storyboard/shell'
import {
  type ContentJsonSource,
  contentJsonSources,
  resolveJsonDocumentSlug,
} from '@/content/content-json'

export type JsonContentBundleEntry = {
  baseSlug: string
  bundle: WireframeDocumentBundle
}

export function jsonContentSourceToBundle(
  source: ContentJsonSource,
  reservedSlugs: ReadonlySet<string>,
): WireframeDocumentBundle | null {
  const built = buildJsonDocument(source.raw)
  if (!built.ok) {
    console.error(
      `[wireframe] Failed to compile ${source.filename}:`,
      built.errors.map((error) => error.message).join('; '),
    )
    return null
  }

  const slug = resolveJsonDocumentSlug(source.baseSlug, reservedSlugs)
  return jsonToWireframeDocumentBundle(built.document, slug)
}

export function jsonContentSourcesToBundles(
  sources: readonly ContentJsonSource[],
  reservedSlugs: ReadonlySet<string>,
): JsonContentBundleEntry[] {
  const entries: JsonContentBundleEntry[] = []
  const usedSlugs = new Set(reservedSlugs)

  for (const source of sources) {
    const bundle = jsonContentSourceToBundle(source, usedSlugs)
    if (!bundle) continue
    entries.push({ baseSlug: source.baseSlug, bundle })
    usedSlugs.add(bundle.slug)
  }

  return entries
}

export function loadJsonContentDocumentBundles(
  reservedSlugs: ReadonlySet<string>,
): JsonContentBundleEntry[] {
  return jsonContentSourcesToBundles(contentJsonSources, reservedSlugs)
}
