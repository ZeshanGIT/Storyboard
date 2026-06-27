import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ContentDocumentEntry } from '../generated/content-documents.generated'
import { getCodegenErrors } from '../runtime/codegen-error'
import { WireframeErrorProvider } from '../runtime/WireframeErrorProvider'
import { DocumentMenu } from './DocumentMenu'
import { PreviewView } from './PreviewView'
import { PrototypeView } from './PrototypeView'

export type ShellProps = {
  contentDocuments: readonly ContentDocumentEntry[]
}

type ActiveView = 'preview' | 'prototype'

function defaultDocumentSlug(documents: readonly ContentDocumentEntry[]): string {
  const wireframe = documents.find((doc) => doc.slug === 'wireframe')
  return wireframe?.slug ?? documents[0]?.slug ?? ''
}

export function Shell({ contentDocuments }: ShellProps) {
  const [view, setView] = useState<ActiveView>('preview')
  const [activeDocumentSlug, setActiveDocumentSlug] = useState(() =>
    defaultDocumentSlug(contentDocuments),
  )
  const codegenErrors = getCodegenErrors()

  const initialErrors = useMemo(() => codegenErrors.map((error) => error.message), [codegenErrors])

  const activeEntry = useMemo(
    () => contentDocuments.find((doc) => doc.slug === activeDocumentSlug) ?? contentDocuments[0],
    [contentDocuments, activeDocumentSlug],
  )

  const validScreenIds = useMemo(
    () => activeEntry?.routes.map((route) => route.id) ?? [],
    [activeEntry],
  )

  useEffect(() => {
    if (contentDocuments.some((doc) => doc.slug === activeDocumentSlug)) return
    setActiveDocumentSlug(defaultDocumentSlug(contentDocuments))
  }, [contentDocuments, activeDocumentSlug])

  useEffect(() => {
    for (const error of codegenErrors) {
      console.error(`[wireframe] Codegen failed: ${error.message}`)
    }
  }, [codegenErrors])

  return (
    <WireframeErrorProvider initialErrors={initialErrors}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            {contentDocuments.length > 0 ? (
              <DocumentMenu
                documents={contentDocuments}
                activeSlug={activeDocumentSlug}
                onSelect={setActiveDocumentSlug}
              />
            ) : (
              <h1 className="text-lg font-semibold tracking-tight">Documents</h1>
            )}
            <Tabs value={view} onValueChange={(v) => setView(v as ActiveView)}>
              <TabsList>
                <TabsTrigger value="preview">MDX Preview</TabsTrigger>
                <TabsTrigger value="prototype">Prototype View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-8">
          {view === 'preview' ? (
            activeEntry ? (
              <PreviewView
                validScreenIds={validScreenIds}
                routes={activeEntry.routes}
                document={activeEntry.component}
              />
            ) : (
              <p className="text-muted-foreground">No MDX documents in src/content.</p>
            )
          ) : activeEntry ? (
            <PrototypeView
              key={activeEntry.slug}
              routes={activeEntry.routes}
              documentFilename={`${activeEntry.slug}.mdx`}
            />
          ) : (
            <p className="text-muted-foreground">No MDX documents in src/content.</p>
          )}
        </main>
      </div>
    </WireframeErrorProvider>
  )
}
