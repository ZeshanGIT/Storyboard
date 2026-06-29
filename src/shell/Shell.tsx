import { useEffect, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AppUrlState } from '@/lib/app-url'
import { cn } from '@/lib/utils'
import type { WireframeDocumentBundle } from '@/types/wireframe-document'
import { getCodegenErrors } from '../runtime/codegen-error'
import { WireframeDisplayPreferencesProvider } from '../runtime/WireframeDisplayPreferences'
import { WireframeErrorProvider } from '../runtime/WireframeErrorProvider'
import { DocumentMenu } from './DocumentMenu'
import { GraphView } from './GraphView'
import { IndicatorToggles } from './IndicatorToggles'
import { PreviewView } from './PreviewView'
import { PrototypeView } from './PrototypeView'
import { useAppUrl } from './use-app-url'

export type ShellProps = {
  documents: readonly WireframeDocumentBundle[]
  appDefaults: Pick<AppUrlState, 'app' | 'source'>
}

function defaultDocumentSlug(documents: readonly WireframeDocumentBundle[]): string {
  const storyboard = documents.find((doc) => doc.slug === 'storyboard')
  const wireframe = documents.find((doc) => doc.slug === 'wireframe')
  return storyboard?.slug ?? wireframe?.slug ?? documents[0]?.slug ?? ''
}

function documentFilename(entry: WireframeDocumentBundle): string {
  return `${entry.slug}.${entry.source === 'mdx' ? 'mdx' : 'json'}`
}

export function Shell({ documents, appDefaults }: ShellProps) {
  const knownDocs = useMemo(
    () => documents.map((doc) => ({ slug: doc.slug, screenIds: doc.routes.map((r) => r.id) })),
    [documents],
  )

  const defaultSlug = defaultDocumentSlug(documents)
  const defaultState = useMemo<AppUrlState>(
    () => ({
      app: appDefaults.app,
      source: appDefaults.source,
      docSlug: defaultSlug,
      view: 'preview',
    }),
    [appDefaults.app, appDefaults.source, defaultSlug],
  )

  const { urlState, navigate } = useAppUrl({ knownDocs, defaultState })

  const view = urlState.view
  const activeDocumentSlug = urlState.docSlug

  const setView = (next: AppUrlState['view']) => {
    const doc = documents.find((entry) => entry.slug === activeDocumentSlug)
    const entryScreen = doc?.routes[0]?.id
    navigate({
      view: next,
      screenId: next === 'prototype' ? entryScreen : undefined,
    })
  }
  const setActiveDocumentSlug = (slug: string) => {
    const doc = documents.find((entry) => entry.slug === slug)
    const entryScreen = doc?.routes[0]?.id
    navigate({
      docSlug: slug,
      screenId: view === 'prototype' ? entryScreen : undefined,
      graphFocus: undefined,
    })
  }

  const codegenErrors = getCodegenErrors()

  const initialErrors = useMemo(() => codegenErrors.map((error) => error.message), [codegenErrors])

  const activeEntry = useMemo(
    () => documents.find((doc) => doc.slug === activeDocumentSlug) ?? documents[0],
    [documents, activeDocumentSlug],
  )

  const validScreenIds = useMemo(
    () => activeEntry?.routes.map((route) => route.id) ?? [],
    [activeEntry],
  )

  const routePrefix = activeEntry?.routePrefix ?? ''

  useEffect(() => {
    if (documents.some((doc) => doc.slug === activeDocumentSlug)) return
    navigate({ docSlug: defaultDocumentSlug(documents) }, { replace: true })
  }, [documents, activeDocumentSlug, navigate])

  useEffect(() => {
    for (const error of codegenErrors) {
      console.error(`[wireframe] Codegen failed: ${error.message}`)
    }
  }, [codegenErrors])

  return (
    <WireframeErrorProvider initialErrors={initialErrors}>
      <WireframeDisplayPreferencesProvider>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b px-6 py-4">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 text-lg font-semibold tracking-tight">Storyboard</span>
                {documents.length > 0 ? (
                  <DocumentMenu
                    documents={documents}
                    activeSlug={activeDocumentSlug}
                    onSelect={setActiveDocumentSlug}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">No documents</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <IndicatorToggles />
                <Tabs value={view} onValueChange={(v) => setView(v as AppUrlState['view'])}>
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="prototype">Prototype View</TabsTrigger>
                    <TabsTrigger value="graph">Graph View</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </header>

          <main
            className={cn(
              'mx-auto',
              view === 'graph' ? 'h-[calc(100vh-73px)] max-w-none' : 'max-w-3xl px-6 py-8',
            )}
          >
            {view === 'preview' ? (
              activeEntry ? (
                <PreviewView
                  validScreenIds={validScreenIds}
                  routes={activeEntry.routes}
                  preview={activeEntry.preview}
                  routePrefix={routePrefix}
                />
              ) : (
                <p className="text-muted-foreground">No documents loaded.</p>
              )
            ) : view === 'graph' && activeEntry ? (
              <GraphView
                key={activeEntry.slug}
                navigationGraph={activeEntry.navigationGraph}
                routes={activeEntry.routes}
                documentFilename={documentFilename(activeEntry)}
              />
            ) : activeEntry ? (
              <PrototypeView
                key={activeEntry.slug}
                routes={activeEntry.routes}
                documentFilename={documentFilename(activeEntry)}
                routePrefix={routePrefix}
                screenId={urlState.screenId}
                navigate={navigate}
              />
            ) : (
              <p className="text-muted-foreground">No documents loaded.</p>
            )}
          </main>
        </div>
      </WireframeDisplayPreferencesProvider>
    </WireframeErrorProvider>
  )
}
