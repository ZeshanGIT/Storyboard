import { useMemo, useState } from 'react'
import sampleMdx from '@/content/wireframe.mdx?raw'
import sampleJson from '@/json/sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from '@/json/to-document-bundle'
import { mdxToWireframeDocumentBundle } from '@/mdx-playground/to-document-bundle'
import { WireframeErrorProvider } from '@/runtime/WireframeErrorProvider'
import { Shell } from '@/shell/Shell'
import { compilePlaygroundJson } from './compile-playground-json'
import { compilePlaygroundMdx } from './compile-playground-mdx'
import { asEditorText } from './editor-text'
import { PlaygroundMonacoEditor } from './PlaygroundMonacoEditor'
import { PlaygroundSourceTabs } from './PlaygroundSourceTabs'
import { PlaygroundSplitLayout } from './PlaygroundSplitLayout'
import { useDebouncedValue } from './use-debounced-value'
import { usePlaygroundSource } from './use-playground-source'

const INITIAL_JSON_TEXT = JSON.stringify(sampleJson, null, 2)
const COMPILE_DEBOUNCE_MS = 300

export function PlaygroundApp() {
  const { source, setSource } = usePlaygroundSource()
  const [jsonText, setJsonText] = useState(INITIAL_JSON_TEXT)
  const [mdxText, setMdxText] = useState(() => asEditorText(sampleMdx))

  const editorText = source === 'json' ? jsonText : mdxText
  const setEditorText = source === 'json' ? setJsonText : setMdxText

  const debouncedJsonText = useDebouncedValue(jsonText, COMPILE_DEBOUNCE_MS)
  const debouncedMdxText = useDebouncedValue(mdxText, COMPILE_DEBOUNCE_MS)
  const compileText = source === 'json' ? debouncedJsonText : debouncedMdxText

  const documents = useMemo(() => {
    if (source === 'json') {
      const compiled = compilePlaygroundJson(compileText)
      if (!compiled.ok) return []
      return [jsonToWireframeDocumentBundle(compiled.document, 'playground', { playground: true })]
    }
    const compiled = compilePlaygroundMdx(compileText)
    if (!compiled.ok) return []
    return [mdxToWireframeDocumentBundle(compiled.built, 'playground', { playground: true })]
  }, [source, compileText])

  const errors = useMemo(() => {
    const compiled =
      source === 'json' ? compilePlaygroundJson(compileText) : compilePlaygroundMdx(compileText)
    return compiled.ok ? [] : [...compiled.errors]
  }, [source, compileText])

  return (
    <PlaygroundSplitLayout
      editor={
        <PlaygroundMonacoEditor
          label={source === 'json' ? 'JSON' : 'MDX'}
          language={source === 'json' ? 'json' : 'markdown'}
          value={editorText}
          onChange={setEditorText}
          headerExtra={<PlaygroundSourceTabs source={source} onSourceChange={setSource} />}
        />
      }
      panel={
        <WireframeErrorProvider initialErrors={errors}>
          <Shell
            documents={documents}
            appDefaults={{ app: 'playground', source }}
            layout="embedded"
          />
        </WireframeErrorProvider>
      }
    />
  )
}
