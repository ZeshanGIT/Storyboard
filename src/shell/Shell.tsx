import { useEffect, useMemo, useState } from 'react'
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <h1 className="text-lg font-semibold">WireframeX</h1>
            <div className="flex gap-2">
              <button
                type="button"
                className={
                  view === 'preview'
                    ? 'rounded border border-slate-900 px-3 py-1 text-sm'
                    : 'rounded border border-slate-300 px-3 py-1 text-sm'
                }
                onClick={() => setView('preview')}
              >
                MDX Preview
              </button>
              <button
                type="button"
                className={
                  view === 'prototype'
                    ? 'rounded border border-slate-900 px-3 py-1 text-sm'
                    : 'rounded border border-slate-300 px-3 py-1 text-sm'
                }
                onClick={() => setView('prototype')}
              >
                Prototype View
              </button>
            </div>
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
