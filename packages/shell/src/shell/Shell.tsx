import type { AppUrlState } from '@shell/lib/app-url'
import type { WireframeDocumentBundle } from '@shell/types/wireframe-document'
import { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { getCodegenErrors } from '../runtime/codegen-error'
import { WireframeDisplayPreferencesProvider } from '../runtime/WireframeDisplayPreferences'
import { WireframeErrorProvider } from '../runtime/WireframeErrorProvider'
import { DocumentMenu } from './DocumentMenu'
import { GraphView } from './GraphView'
import { IndicatorToggles } from './IndicatorToggles'
import { PreviewView } from './PreviewView'
import { PrototypeView } from './PrototypeView'
import { normalizePrototypeScreenId } from './router'
import { type NavigateAppUrl, useAppUrl } from './use-app-url'

export type ShellLayout = 'standalone' | 'embedded'

export type ShellUrlControl = {
  urlState: AppUrlState
  navigate: NavigateAppUrl
}

export type ShellProps = {
  documents: readonly WireframeDocumentBundle[]
  appDefaults: Pick<AppUrlState, 'app'> & Partial<Pick<AppUrlState, 'source'>>
  layout?: ShellLayout
  urlControl?: ShellUrlControl
  onOpenPlayground?: () => void
}

function defaultDocumentSlug(documents: readonly WireframeDocumentBundle[]): string {
  const storyboard = documents.find((doc) => doc.slug === 'storyboard')
  const wireframe = documents.find((doc) => doc.slug === 'wireframe')
  return storyboard?.slug ?? wireframe?.slug ?? documents[0]?.slug ?? ''
}

function documentFilename(entry: WireframeDocumentBundle): string {
  return `${entry.slug}.${entry.source === 'mdx' ? 'mdx' : 'json'}`
}

export function Shell({
  documents,
  appDefaults,
  layout = 'standalone',
  urlControl,
  onOpenPlayground,
}: ShellProps) {
  const embedded = layout === 'embedded'
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

  const internalUrl = useAppUrl({ knownDocs, defaultState })
  const urlState = urlControl?.urlState ?? internalUrl.urlState
  const navigate = urlControl?.navigate ?? internalUrl.navigate

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
    if (view !== 'prototype') return
    const entryScreen = activeEntry?.routes[0]?.id
    const normalized = normalizePrototypeScreenId(urlState.screenId, validScreenIds, entryScreen)
    if (!normalized) return
    navigate({ screenId: normalized }, { replace: true })
  }, [view, urlState.screenId, validScreenIds, activeEntry, navigate])

  useEffect(() => {
    for (const error of codegenErrors) {
      console.error(`[wireframe] Codegen failed: ${error.message}`)
    }
  }, [codegenErrors])

  return (
    <WireframeErrorProvider initialErrors={initialErrors}>
      <WireframeDisplayPreferencesProvider>
        <div
          className={cn(
            'bg-background text-foreground',
            embedded ? 'flex h-full min-h-0 flex-col' : 'min-h-screen',
          )}
        >
          <header className="border-b">
            <div
              className={cn(
                'mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4',
                embedded ? 'max-w-none' : 'max-w-5xl',
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 text-lg font-semibold tracking-tight">OneSpec</span>
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
                {!embedded && appDefaults.app === 'mdx' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPlayground?.()}
                  >
                    Playground
                  </Button>
                ) : null}
                <IndicatorToggles />
                <Tabs value={view} onValueChange={(v: string) => setView(v as AppUrlState['view'])}>
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
              'mx-auto w-full',
              embedded
                ? view === 'graph'
                  ? 'flex min-h-0 flex-1 flex-col'
                  : 'min-h-0 flex-1 overflow-y-auto px-6 py-8'
                : view === 'graph'
                  ? 'h-[calc(100vh-73px)] max-w-none'
                  : 'max-w-3xl px-6 py-8',
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
                graphMode={urlState.graphMode}
                graphFocus={urlState.graphFocus}
                onGraphUrlChange={(patch) =>
                  navigate({
                    view: 'graph',
                    ...(patch.graphMode ? { graphMode: patch.graphMode } : {}),
                    ...(patch.graphFocus === null
                      ? { graphFocus: undefined }
                      : patch.graphFocus
                        ? { graphFocus: patch.graphFocus }
                        : {}),
                  })
                }
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
