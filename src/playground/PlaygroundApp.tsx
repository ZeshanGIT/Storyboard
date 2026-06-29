import { useEffect, useMemo, useState } from 'react'
import { buildJsonDocument } from '@/json/build-json-document'
import sample from '@/json/sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from '@/json/to-document-bundle'
import { toAppPath, toBrowserPath } from '@/lib/app-base-path'
import { PLAYGROUND_APP_PATH } from '@/lib/app-routes'
import { WireframeErrorProvider } from '@/runtime/WireframeErrorProvider'
import { Shell } from '@/shell/Shell'

export function PlaygroundApp() {
  const [raw] = useState(sample)

  const documents = useMemo(() => {
    const built = buildJsonDocument(raw)
    if (!built.ok) return []
    return [jsonToWireframeDocumentBundle(built.document, 'playground', PLAYGROUND_APP_PATH)]
  }, [raw])

  const errors = useMemo(() => {
    const built = buildJsonDocument(raw)
    return built.ok ? [] : built.errors.map((error) => error.message)
  }, [raw])

  useEffect(() => {
    const entryPath = documents[0]?.routes[0]?.path
    if (!entryPath) return
    if (toAppPath(window.location.pathname) === PLAYGROUND_APP_PATH) {
      const browserPath = toBrowserPath(entryPath)
      window.history.replaceState({}, '', browserPath)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [documents])

  return (
    <WireframeErrorProvider initialErrors={errors}>
      <Shell documents={documents} />
    </WireframeErrorProvider>
  )
}
