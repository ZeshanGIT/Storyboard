import { useMemo, useState } from 'react'
import { buildJsonDocument } from '@/json/build-json-document'
import sample from '@/json/sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from '@/json/to-document-bundle'
import { WireframeErrorProvider } from '@/runtime/WireframeErrorProvider'
import { Shell } from '@/shell/Shell'

export function PlaygroundApp() {
  const [raw] = useState(sample)

  const documents = useMemo(() => {
    const built = buildJsonDocument(raw)
    if (!built.ok) return []
    return [jsonToWireframeDocumentBundle(built.document, 'playground')]
  }, [raw])

  const errors = useMemo(() => {
    const built = buildJsonDocument(raw)
    return built.ok ? [] : built.errors.map((error) => error.message)
  }, [raw])

  return (
    <WireframeErrorProvider initialErrors={errors}>
      <Shell documents={documents} />
    </WireframeErrorProvider>
  )
}
