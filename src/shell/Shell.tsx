import { useState } from 'react'
import type { RouteEntry } from './router'
import { PreviewView } from './PreviewView'
import { PrototypeView } from './PrototypeView'
import { CodegenErrorBanner } from './CodegenErrorBanner'

export type ShellProps = {
  routes: readonly RouteEntry[]
}

type ActiveView = 'preview' | 'prototype'

export function Shell({ routes }: ShellProps) {
  const [view, setView] = useState<ActiveView>('preview')

  return (
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

      <CodegenErrorBanner />

      <main className="mx-auto max-w-3xl px-6 py-8">
        {view === 'preview' ? (
          <PreviewView />
        ) : (
          <PrototypeView routes={routes} />
        )}
      </main>
    </div>
  )
}
