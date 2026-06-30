declare module '@/json/build-json-document' {
  export type JsonDocumentBuilt = {
    title: string
    screens: readonly {
      id: string
      title: string
      order: number
      note?: string
      sr?: string
      nodes: readonly unknown[]
      modalIds: readonly string[]
      links: readonly unknown[]
    }[]
  }

  export function buildJsonDocument(
    raw: unknown,
  ):
    | { ok: true; document: JsonDocumentBuilt }
    | { ok: false; errors: readonly { message: string }[] }
}
