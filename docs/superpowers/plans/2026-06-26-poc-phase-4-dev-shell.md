# Phase 4: Dev Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the hand-written dev shell with MDX Preview and Prototype View switcher, minimal router, and codegen error display.

**Architecture:** `Shell` receives `routes` from generated output. `PreviewView` renders raw `wireframe.mdx` via `@mdx-js/rollup`. `PrototypeView` uses a minimal History API router — no `react-router` dependency. Each view wraps content in `WireframeViewProvider` with the appropriate `view` mode. Tailwind styles the shell chrome only.

**Tech Stack:** React 19, generated `routes`, WireframeViewContext from Phase 1

**Prerequisite:** [Phase 3](./2026-06-26-poc-phase-3-vite-plugin.md) complete (generated files exist on dev start).

**Definition of Done:** See [overview § Phase 4](./2026-06-26-poc-overview.md#phase-4-dev-shell).

---

## File structure (this phase)

| File | Responsibility |
|------|----------------|
| `src/shell/router.tsx` | Minimal prototype router hook |
| `src/shell/PreviewView.tsx` | Full MDX document render |
| `src/shell/PrototypeView.tsx` | Single-screen route render |
| `src/shell/CodegenErrorBanner.tsx` | Shows plugin validation errors |
| `src/shell/Shell.tsx` | View switcher + layout |
| `src/App.tsx` | Entry: `<Shell routes={routes} />` |
| `src/main.tsx` | Unchanged bootstrap |

---

### Task 1: Minimal prototype router

**Files:**
- Create: `src/shell/router.tsx`

- [ ] **Step 1: Implement usePrototypeRouter**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react'

export type RouteEntry = {
  id: string
  path: string
  component: React.ComponentType
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname
}

export function usePrototypeRouter(routes: readonly RouteEntry[]) {
  const defaultPath = routes[0]?.path ?? '/'
  const [pathname, setPathname] = useState(() =>
    normalizePath(window.location.pathname),
  )

  useEffect(() => {
    const onPopState = () => setPathname(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((path: string) => {
    const next = path.startsWith('/') ? path : `/${path}`
    window.history.pushState({}, '', next)
    setPathname(normalizePath(next))
  }, [])

  const activePath = useMemo(() => {
    if (pathname === '/' || pathname === '') return defaultPath
    return routes.some((r) => r.path === pathname) ? pathname : defaultPath
  }, [pathname, routes, defaultPath])

  const activeRoute = routes.find((r) => r.path === activePath) ?? routes[0]

  useEffect(() => {
    if (pathname === '/' && defaultPath !== '/') {
      navigate(defaultPath)
    }
  }, [pathname, defaultPath, navigate])

  return { navigate, activeRoute, activePath }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS (or only fails on missing generated import in App — add temporary stub if needed)

- [ ] **Step 3: Commit**

```bash
git add src/shell/router.tsx
git commit -m "feat: add minimal prototype router for wireframe shell"
```

---

### Task 2: PreviewView

**Files:**
- Create: `src/shell/PreviewView.tsx`

- [ ] **Step 1: Implement PreviewView**

```tsx
import WireframeDocument from '../content/wireframe.mdx'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'

export function PreviewView() {
  return (
    <WireframeViewProvider view="preview" navigate={() => {}}>
      <div className="space-y-8">
        <WireframeDocument />
      </div>
    </WireframeViewProvider>
  )
}
```

Preview uses **raw MDX** (POC default) — not stacked generated components.

- [ ] **Step 2: Commit**

```bash
git add src/shell/PreviewView.tsx
git commit -m "feat: add MDX Preview view for wireframe shell"
```

---

### Task 3: PrototypeView

**Files:**
- Create: `src/shell/PrototypeView.tsx`

- [ ] **Step 1: Implement PrototypeView**

```tsx
import { WireframeViewProvider } from '../runtime/WireframeViewContext'
import { usePrototypeRouter, type RouteEntry } from './router'

export type PrototypeViewProps = {
  routes: readonly RouteEntry[]
}

export function PrototypeView({ routes }: PrototypeViewProps) {
  const { navigate, activeRoute } = usePrototypeRouter(routes)
  const Active = activeRoute?.component

  return (
    <WireframeViewProvider view="prototype" navigate={navigate}>
      <div className="min-h-[200px]">
        {Active ? <Active /> : <p>No routes defined.</p>}
      </div>
    </WireframeViewProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shell/PrototypeView.tsx
git commit -m "feat: add Prototype view with route-driven screen render"
```

---

### Task 4: Codegen error banner

**Files:**
- Create: `src/shell/CodegenErrorBanner.tsx`

- [ ] **Step 1: Implement banner**

```tsx
import { wireframePluginState } from '../plugin/plugin-state'

export function CodegenErrorBanner() {
  const error = wireframePluginState.lastError
  if (!error) return null

  return (
    <div
      role="alert"
      className="border border-red-600 bg-red-50 px-4 py-3 text-red-900"
    >
      <strong>Wireframe codegen error:</strong> {error.message}
    </div>
  )
}
```

For dev HMR updates when error clears, Shell can poll or use a simple `useState` + `import.meta.hot` listener. Minimal POC: re-read on render after full reload (sufficient for duplicate-ID case).

Optional enhancement — force re-render on codegen:

```tsx
import { useEffect, useState } from 'react'
import { wireframePluginState } from '../plugin/plugin-state'

export function CodegenErrorBanner() {
  const [, tick] = useState(0)
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.on('wireframe:codegen', () => tick((n) => n + 1))
    }
  }, [])
  // ...
}
```

Emit from plugin after regenerate: `server.ws.send({ type: 'custom', event: 'wireframe:codegen' })` — optional; full-reload from Phase 3 is enough for POC.

- [ ] **Step 2: Commit**

```bash
git add src/shell/CodegenErrorBanner.tsx
git commit -m "feat: show wireframe codegen errors in dev shell"
```

---

### Task 5: Shell and App wiring

**Files:**
- Create: `src/shell/Shell.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement Shell**

```tsx
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
```

- [ ] **Step 2: Update App.tsx**

```tsx
import { routes } from './generated/routes.generated'
import { Shell } from './shell/Shell'

function App() {
  return <Shell routes={routes} />
}

export default App
```

- [ ] **Step 3: Wire Screens into MDX for goto expressions**

Update `src/content/wireframe.mdx` top (after Phase 3 stub):

```mdx
import { Screens } from '../generated/screens-map.generated'

<Screen id="home" title="Home">
  <Text>Welcome back</Text>
  <Link goto={Screens.Login}>Login</Link>
  <Link goto={Screens.Signup}>Create account</Link>
</Screen>
...
```

MDX compile order: plugin `buildStart` runs before MDX import resolves.

- [ ] **Step 4: Verify dev experience**

Run: `npm run dev`
Expected:
- View switcher visible
- MDX Preview shows all screens stacked
- Clicking Link in Preview scrolls to `#login` anchor
- Prototype View shows one screen; Link navigates to `/login`

- [ ] **Step 5: Commit**

```bash
git add src/shell/Shell.tsx src/App.tsx src/content/wireframe.mdx
git commit -m "feat: add dual-view dev shell wired to generated routes"
```

---

### Task 6: Phase 4 verification

- [ ] **Step 1: Manual dual-view test**

| Action | Expected |
|--------|----------|
| Open MDX Preview | All `<Screen>` blocks visible, scrollable |
| Click Login link in Preview | Page scrolls to login section (`#login`) |
| Switch to Prototype | Only home screen visible at `/home` |
| Click Login in Prototype | URL `/login`, login screen renders |
| Introduce duplicate id in MDX | Error banner + terminal message |

- [ ] **Step 2: Run build and lint**

Run: `npm run build && npm run lint`
Expected: PASS

- [ ] **Step 3: Confirm Phase 4 DoD**

Check every item in [overview § Phase 4 DoD](./2026-06-26-poc-overview.md#phase-4-dev-shell).

Proceed to [Phase 5](./2026-06-26-poc-phase-5-integration.md).

---

## Self-review

| POC requirement | Task |
|-----------------|------|
| View switcher | Task 5 |
| MDX Preview — raw MDX | Task 2 |
| Prototype — routes table | Task 3 |
| Link preview = anchor | Phase 1 Link + Preview provider |
| Link prototype = router | Phase 1 Link + Prototype provider |
| Codegen error display | Task 4 |
| Shell imports routes only | Task 5 |
| No screen-specific shell logic | Task 5 |
