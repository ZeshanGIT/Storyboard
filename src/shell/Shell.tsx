import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCodegenErrors } from '../runtime/codegen-error'
import { WireframeErrorProvider } from '../runtime/WireframeErrorProvider'
import { PreviewView } from './PreviewView'
import { PrototypeView } from './PrototypeView'
import type { RouteEntry } from './router'

export type ShellProps = {
  routes: readonly RouteEntry[]
}

type ActiveView = 'preview' | 'prototype'

export function Shell({ routes }: ShellProps) {
  const [view, setView] = useState<ActiveView>('preview')
  const validScreenIds = routes.map((route) => route.id)
  const codegenErrors = getCodegenErrors()

  const initialErrors = useMemo(() => codegenErrors.map((error) => error.message), [codegenErrors])

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
            <h1 className="text-lg font-semibold tracking-tight">WireframeX</h1>
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
            <PreviewView validScreenIds={validScreenIds} />
          ) : (
            <PrototypeView routes={routes} />
          )}
        </main>
      </div>
    </WireframeErrorProvider>
  )
}
