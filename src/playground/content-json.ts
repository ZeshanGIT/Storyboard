import {
  type ContentJsonSource,
  contentJsonSources,
  defaultJsonBaseSlug,
} from '@/content/content-json'

export type { ContentJsonSource }

export type ContentJsonDocument = {
  slug: string
  filename: string
  text: string
}

export const contentJsonDocuments: readonly ContentJsonDocument[] = contentJsonSources.map(
  (source) => ({
    slug: source.baseSlug,
    filename: source.filename,
    text: JSON.stringify(source.raw, null, 2),
  }),
)

export function defaultJsonDocumentSlug(): string {
  return defaultJsonBaseSlug()
}

export function isContentJsonSlug(slug: string): boolean {
  return contentJsonDocuments.some((doc) => doc.slug === slug)
}
