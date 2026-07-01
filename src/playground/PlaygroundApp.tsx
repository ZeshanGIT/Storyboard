import {
  type AppUrlState,
  jsonToWireframeDocumentBundle,
  Shell,
  useAppUrl,
  type WireframeDocumentBundle,
  WireframeErrorProvider,
} from '@onespec-dev/shell'
import { useCallback, useMemo, useState } from 'react'
import sampleMdx from '@/content/wireframe.mdx?raw'
import { mdxToWireframeDocumentBundle } from '@/mdx-playground/to-document-bundle'
import { compilePlaygroundJson } from './compile-playground-json'
import { compilePlaygroundMdx } from './compile-playground-mdx'
import { contentJsonDocuments, defaultJsonDocumentSlug } from './content-json'
import { asEditorText } from './editor-text'
import { PlaygroundMonacoEditor } from './PlaygroundMonacoEditor'
import { PlaygroundSourceTabs } from './PlaygroundSourceTabs'
import { PlaygroundSplitLayout } from './PlaygroundSplitLayout'
import { useDebouncedValue } from './use-debounced-value'
import { usePlaygroundSource } from './use-playground-source'

const COMPILE_DEBOUNCE_MS = 300
const MDX_PLAYGROUND_SLUG = 'playground'

function defaultDocumentSlug(documents: readonly WireframeDocumentBundle[]): string {
  const onespec = documents.find((doc) => doc.slug === 'onespec')
  const wireframe = documents.find((doc) => doc.slug === 'wireframe')
  return onespec?.slug ?? wireframe?.slug ?? documents[0]?.slug ?? ''
}

function buildInitialJsonTexts(): Map<string, string> {
  return new Map(contentJsonDocuments.map((doc) => [doc.slug, doc.text]))
}

export function PlaygroundApp() {
  const { source, setSource } = usePlaygroundSource()
  const [jsonTexts, setJsonTexts] = useState(buildInitialJsonTexts)
  const [mdxText, setMdxText] = useState(() => asEditorText(sampleMdx))

  const debouncedJsonTexts = useDebouncedValue(jsonTexts, COMPILE_DEBOUNCE_MS)
  const debouncedMdxText = useDebouncedValue(mdxText, COMPILE_DEBOUNCE_MS)

  const jsonDocuments = useMemo(() => {
    const bundles: WireframeDocumentBundle[] = []
    for (const entry of contentJsonDocuments) {
      const text = debouncedJsonTexts.get(entry.slug) ?? entry.text
      const compiled = compilePlaygroundJson(text)
      if (!compiled.ok) continue
      bundles.push(
        jsonToWireframeDocumentBundle(compiled.document, entry.slug, { playground: true }),
      )
    }
    return bundles
  }, [debouncedJsonTexts])

  const mdxDocuments = useMemo(() => {
    const compiled = compilePlaygroundMdx(debouncedMdxText)
    if (!compiled.ok) return []
    return [mdxToWireframeDocumentBundle(compiled.built, MDX_PLAYGROUND_SLUG, { playground: true })]
  }, [debouncedMdxText])

  const documents = source === 'json' ? jsonDocuments : mdxDocuments

  const knownDocs = useMemo(
    () =>
      documents.map((doc) => ({ slug: doc.slug, screenIds: doc.routes.map((route) => route.id) })),
    [documents],
  )

  const defaultState = useMemo<AppUrlState>(
    () => ({
      app: 'playground',
      source,
      docSlug:
        source === 'json'
          ? defaultJsonDocumentSlug() || defaultDocumentSlug(documents)
          : MDX_PLAYGROUND_SLUG,
      view: 'preview',
    }),
    [source, documents],
  )

  const { urlState, navigate } = useAppUrl({ knownDocs, defaultState })
  const activeSlug = urlState.docSlug

  const editorText = source === 'json' ? (jsonTexts.get(activeSlug) ?? '') : mdxText

  const setEditorText = useCallback(
    (value: string) => {
      if (source === 'json') {
        setJsonTexts((prev) => {
          const next = new Map(prev)
          next.set(activeSlug, value)
          return next
        })
        return
      }
      setMdxText(value)
    },
    [source, activeSlug],
  )

  const compileText =
    source === 'json' ? (debouncedJsonTexts.get(activeSlug) ?? '') : debouncedMdxText

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
            urlControl={{ urlState, navigate }}
          />
        </WireframeErrorProvider>
      }
    />
  )
}
