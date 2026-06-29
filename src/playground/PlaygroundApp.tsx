import { useMemo, useState } from 'react'
import sample from '@/json/sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from '@/json/to-document-bundle'
import { WireframeErrorProvider } from '@/runtime/WireframeErrorProvider'
import { Shell } from '@/shell/Shell'
import { compilePlaygroundJson } from './compile-playground-json'
import { PlaygroundJsonEditor } from './PlaygroundJsonEditor'
import { PlaygroundSplitLayout } from './PlaygroundSplitLayout'
import { useDebouncedValue } from './use-debounced-value'

const INITIAL_EDITOR_TEXT = JSON.stringify(sample, null, 2)
const COMPILE_DEBOUNCE_MS = 300

export function PlaygroundApp() {
  const [editorText, setEditorText] = useState(INITIAL_EDITOR_TEXT)
  const debouncedText = useDebouncedValue(editorText, COMPILE_DEBOUNCE_MS)

  const compiled = useMemo(() => compilePlaygroundJson(debouncedText), [debouncedText])

  const documents = useMemo(() => {
    if (!compiled.ok) return []
    return [jsonToWireframeDocumentBundle(compiled.document, 'playground', { playground: true })]
  }, [compiled])

  const errors = useMemo(() => (compiled.ok ? [] : [...compiled.errors]), [compiled])

  return (
    <PlaygroundSplitLayout
      editor={<PlaygroundJsonEditor value={editorText} onChange={setEditorText} />}
      panel={
        <WireframeErrorProvider initialErrors={errors}>
          <Shell
            documents={documents}
            appDefaults={{ app: 'playground', source: 'json' }}
            layout="embedded"
          />
        </WireframeErrorProvider>
      }
    />
  )
}
