import type { WireframeDocumentBundle } from '@storyboard/shell'
import { contentJsonSources } from '@/content/content-json'
import type { ContentDocumentEntry } from '@/generated/content-documents.generated'
import { jsonContentSourcesToBundles } from './json-documents'
import { mdxContentDocumentsToBundles } from './mdx-documents'

export function allContentDocumentsToBundles(
  mdxEntries: readonly ContentDocumentEntry[],
): readonly WireframeDocumentBundle[] {
  const mdxBundles = mdxContentDocumentsToBundles(mdxEntries)
  const mdxSlugs = new Set(mdxBundles.map((doc) => doc.slug))
  const jsonEntries = jsonContentSourcesToBundles(contentJsonSources, mdxSlugs)

  const jsonByBaseSlug = new Map(jsonEntries.map((entry) => [entry.baseSlug, entry.bundle]))
  const merged: WireframeDocumentBundle[] = []
  const insertedJson = new Set<string>()

  for (const mdxBundle of mdxBundles) {
    merged.push(mdxBundle)
    const jsonCompanion = jsonByBaseSlug.get(mdxBundle.slug)
    if (jsonCompanion && !insertedJson.has(jsonCompanion.slug)) {
      merged.push(jsonCompanion)
      insertedJson.add(jsonCompanion.slug)
    }
  }

  for (const entry of jsonEntries) {
    if (insertedJson.has(entry.bundle.slug)) continue
    merged.push(entry.bundle)
  }

  return merged
}
