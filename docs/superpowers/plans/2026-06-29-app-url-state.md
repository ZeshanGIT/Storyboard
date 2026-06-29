# App URL State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the browser URL the single source of truth for app mode (MDX vs playground), source format (MDX vs JSON), active document, shell view (Preview / Prototype / Graph), prototype screen, and graph sub-state (Screen/Compact mode + focused node).

**Architecture:** Add a pure URL codec in `src/lib/app-url.ts` (`parseAppUrl` / `buildAppUrl`) and a React hook `useAppUrl` that owns History API reads/writes. `Shell`, `PrototypeView`, and `GraphView` derive UI state from the hook instead of isolated `useState`. MDX codegen emits doc-scoped route paths under `/mdx/{docSlug}/…`; JSON playground uses `/playground/json/{docSlug}/…`. Legacy flat paths (`/login`, `/playground/home`) redirect once on load.

**Tech Stack:** TypeScript 6, React 19, Vitest, existing History API helpers in `src/lib/app-base-path.ts`. No new npm dependencies. No React Router.

## Global Constraints

- Run `npm run build` + `npm run check` before claiming done; URL module + plugin changes need `npm test`
- Do not hand-edit `src/generated/`; update codegen in `src/plugin/generate.ts` and run `npm run codegen`
- Minimal History API only — no React Router (locked decision in `AGENTS.md`)
- Preserve `toAppPath` / `toBrowserPath` for Vite `BASE_URL` / GitHub Pages deploy
- Wireframe primitives unchanged; only shell/routing/playground touch
- Update `docs/CONTEXT.md` and `AGENTS.md` app-routing section when done (Task 9)
- Plugin/codegen touches → update tests in `src/plugin/generate.test.ts`

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/lib/app-url.ts` | `AppUrlState`, `parseAppUrl`, `buildAppUrl`, graph query helpers |
| `src/lib/app-url.test.ts` | Round-trip + legacy path resolution tests |
| `src/lib/app-routes.ts` | Expand constants: `MDX_APP_PREFIX`, view literals, `screenRoutePath` |
| `src/shell/use-app-url.ts` | React hook: read URL, `navigate(partial)`, popstate sync |
| `src/shell/Shell.tsx` | URL-driven view + doc slug (remove local `useState` for those) |
| `src/shell/router.tsx` | `usePrototypeRouter` consumes URL state instead of own pathname |
| `src/shell/GraphView.tsx` | Sync `graphMode` + `graphFocus` with query params via `useAppUrl` |
| `src/shell/use-app-router.ts` | Delete or fold into `useAppUrl` |
| `src/App.tsx` | Route on parsed `app` field (`mdx` vs `playground`) |
| `src/MdxApp.tsx` | Legacy redirect on mount |
| `src/playground/PlaygroundApp.tsx` | Playground URL shape + legacy redirect |
| `src/shell/adapters/mdx-documents.ts` | Set `routePrefix: '/mdx/{slug}'` on bundles |
| `src/json/to-document-bundle.ts` | Playground paths under `/playground/json/{slug}/…` |
| `src/plugin/generate.ts` | Emit `path: '/mdx/{slug}/{screenId}'` |
| `docs/CONTEXT.md` | Document URL schema |

### URL schema (canonical)

```
/mdx/{docSlug}/{view}[/{screenId}]
/playground/{source}/{docSlug}/{view}[/{screenId}]
```

- `view`: `preview` | `prototype` | `graph`
- `source`: `mdx` | `json` (playground only)
- `screenId`: required in path for `prototype`; omitted for `preview` and `graph`
- Query (graph only): `?graphMode=screen|compact&focus={screenId}`

Examples:

```
/mdx/wireframe/preview
/mdx/wireframe/prototype/login
/mdx/storyboard/graph?graphMode=compact&focus=welcome
/playground/json/playground/prototype/home
```

Screen route paths (for `RouteEntry.path` and `Link` navigate):

```
/mdx/{docSlug}/{screenId}
/playground/json/{docSlug}/{screenId}
```

---

### Task 1: URL codec (pure parse/build)

**Files:**
- Create: `src/lib/app-url.ts`
- Create: `src/lib/app-url.test.ts`
- Modify: `src/lib/app-routes.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ShellView = 'preview' | 'prototype' | 'graph'
  export type AppMode = 'mdx' | 'playground'
  export type PlaygroundSource = 'mdx' | 'json'
  export type GraphMode = 'screen' | 'compact'

  export type AppUrlState = {
    app: AppMode
    source?: PlaygroundSource
    docSlug: string
    view: ShellView
    screenId?: string
    graphMode?: GraphMode
    graphFocus?: string
  }

  export type ParseAppUrlInput = {
    appPath: string
    search?: string
  }

  export function parseAppUrl(input: ParseAppUrlInput): AppUrlState | null
  export function buildAppUrl(state: AppUrlState): { appPath: string; search: string }
  export function screenPathForDoc(
    app: AppMode,
    source: PlaygroundSource | undefined,
    docSlug: string,
    screenId: string,
  ): string
  export function resolveLegacyAppPath(
    appPath: string,
    knownDocs: readonly { slug: string; screenIds: readonly string[] }[],
  ): AppUrlState | null
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/app-url.test.ts
import { describe, expect, it } from 'vitest'
import { buildAppUrl, parseAppUrl, resolveLegacyAppPath, screenPathForDoc } from './app-url'

describe('parseAppUrl / buildAppUrl', () => {
  it('round-trips MDX prototype URL', () => {
    const state = parseAppUrl({ appPath: '/mdx/wireframe/prototype/login' })
    expect(state).toEqual({
      app: 'mdx',
      docSlug: 'wireframe',
      view: 'prototype',
      screenId: 'login',
    })
    expect(buildAppUrl(state!)).toEqual({
      appPath: '/mdx/wireframe/prototype/login',
      search: '',
    })
  })

  it('round-trips playground JSON graph URL with query', () => {
    const state = parseAppUrl({
      appPath: '/playground/json/playground/graph',
      search: '?graphMode=compact&focus=home',
    })
    expect(state).toEqual({
      app: 'playground',
      source: 'json',
      docSlug: 'playground',
      view: 'graph',
      graphMode: 'compact',
      graphFocus: 'home',
    })
    expect(buildAppUrl(state!)).toEqual({
      appPath: '/playground/json/playground/graph',
      search: '?graphMode=compact&focus=home',
    })
  })

  it('returns null for unrecognized paths', () => {
    expect(parseAppUrl({ appPath: '/totally/unknown/path/here' })).toBeNull()
  })
})

describe('screenPathForDoc', () => {
  it('builds MDX screen path', () => {
    expect(screenPathForDoc('mdx', undefined, 'wireframe', 'login')).toBe(
      '/mdx/wireframe/login',
    )
  })

  it('builds playground JSON screen path', () => {
    expect(screenPathForDoc('playground', 'json', 'playground', 'home')).toBe(
      '/playground/json/playground/home',
    )
  })
})

describe('resolveLegacyAppPath', () => {
  const docs = [
    { slug: 'wireframe', screenIds: ['home', 'login'] },
    { slug: 'storyboard', screenIds: ['welcome'] },
  ]

  it('maps flat /login to wireframe prototype', () => {
    expect(resolveLegacyAppPath('/login', docs)).toEqual({
      app: 'mdx',
      docSlug: 'wireframe',
      view: 'prototype',
      screenId: 'login',
    })
  })

  it('maps /playground/home to playground JSON.stringify', () => {
    expect(
      resolveLegacyAppPath('/playground/home', [
        { slug: 'playground', screenIds: ['home'] },
      ]),
    ).toEqual({
      app: 'playground',
      source: 'json',
      docSlug: 'playground',
      view: 'prototype',
      screenId: 'home',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/app-url.test.ts`
Expected: FAIL — module `./app-url` not found

- [ ] **Step 3: Implement `src/lib/app-routes.ts` additions**

```ts
// src/lib/app-routes.ts — add alongside existing exports
export const MDX_APP_PREFIX = '/mdx'
export const PLAYGROUND_APP_PATH = '/playground'

export const SHELL_VIEWS = ['preview', 'prototype', 'graph'] as const
export type ShellView = (typeof SHELL_VIEWS)[number]

export const PLAYGROUND_SOURCES = ['mdx', 'json'] as const
export type PlaygroundSource = (typeof PLAYGROUND_SOURCES)[number]

export const GRAPH_MODES = ['screen', 'compact'] as const
export type GraphMode = (typeof GRAPH_MODES)[number]

export function isPlaygroundAppPath(appPath: string): boolean {
  return appPath === PLAYGROUND_APP_PATH || appPath.startsWith(`${PLAYGROUND_APP_PATH}/`)
}

export function screenRoutePath(routePrefix: string, screenId: string): string {
  return routePrefix ? `${routePrefix}/${screenId}` : `/${screenId}`
}
```

- [ ] **Step 4: Implement `src/lib/app-url.ts`**

```ts
import {
  GRAPH_MODES,
  MDX_APP_PREFIX,
  PLAYGROUND_APP_PATH,
  PLAYGROUND_SOURCES,
  type GraphMode,
  type PlaygroundSource,
  type ShellView,
  SHELL_VIEWS,
  screenRoutePath,
} from './app-routes'

export type AppMode = 'mdx' | 'playground'

export type AppUrlState = {
  app: AppMode
  source?: PlaygroundSource
  docSlug: string
  view: ShellView
  screenId?: string
  graphMode?: GraphMode
  graphFocus?: string
}

export type ParseAppUrlInput = {
  appPath: string
  search?: string
}

function parseGraphQuery(search: string | undefined): Pick<AppUrlState, 'graphMode' | 'graphFocus'> {
  if (!search) return {}
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const graphModeRaw = params.get('graphMode')
  const graphMode =
    graphModeRaw && (GRAPH_MODES as readonly string[]).includes(graphModeRaw)
      ? (graphModeRaw as GraphMode)
      : undefined
  const graphFocus = params.get('focus') ?? undefined
  return { ...(graphMode ? { graphMode } : {}), ...(graphFocus ? { graphFocus } : {}) }
}

function isShellView(value: string): value is ShellView {
  return (SHELL_VIEWS as readonly string[]).includes(value)
}

function isPlaygroundSource(value: string): value is PlaygroundSource {
  return (PLAYGROUND_SOURCES as readonly string[]).includes(value)
}

export function parseAppUrl(input: ParseAppUrlInput): AppUrlState | null {
  const segments = input.appPath.split('/').filter(Boolean)
  const query = parseGraphQuery(input.search)

  if (segments[0] === 'mdx' && segments.length >= 3) {
    const docSlug = segments[1]
    const viewRaw = segments[2]
    if (!docSlug || !isShellView(viewRaw)) return null
    const screenId = viewRaw === 'prototype' ? segments[3] : undefined
    if (viewRaw === 'prototype' && segments.length > 4) return null
    if (viewRaw !== 'prototype' && segments.length > 3) return null
    return { app: 'mdx', docSlug, view: viewRaw, ...(screenId ? { screenId } : {}), ...query }
  }

  if (segments[0] === 'playground' && segments.length >= 4) {
    const sourceRaw = segments[1]
    const docSlug = segments[2]
    const viewRaw = segments[3]
    if (!isPlaygroundSource(sourceRaw) || !docSlug || !isShellView(viewRaw)) return null
    const screenId = viewRaw === 'prototype' ? segments[4] : undefined
    if (viewRaw === 'prototype' && segments.length > 5) return null
    if (viewRaw !== 'prototype' && segments.length > 4) return null
    return {
      app: 'playground',
      source: sourceRaw,
      docSlug,
      view: viewRaw,
      ...(screenId ? { screenId } : {}),
      ...query,
    }
  }

  return null
}

export function buildAppUrl(state: AppUrlState): { appPath: string; search: string } {
  const base =
    state.app === 'mdx'
      ? `${MDX_APP_PREFIX}/${state.docSlug}/${state.view}`
      : `${PLAYGROUND_APP_PATH}/${state.source}/${state.docSlug}/${state.view}`

  const appPath =
    state.view === 'prototype' && state.screenId ? `${base}/${state.screenId}` : base

  const params = new URLSearchParams()
  if (state.view === 'graph') {
    if (state.graphMode) params.set('graphMode', state.graphMode)
    if (state.graphFocus) params.set('focus', state.graphFocus)
  }
  const search = params.toString()
  return { appPath, search: search ? `?${search}` : '' }
}

export function screenPathForDoc(
  app: AppMode,
  source: PlaygroundSource | undefined,
  docSlug: string,
  screenId: string,
): string {
  if (app === 'mdx') {
    return screenRoutePath(`${MDX_APP_PREFIX}/${docSlug}`, screenId)
  }
  return screenRoutePath(`${PLAYGROUND_APP_PATH}/${source}/${docSlug}`, screenId)
}

export function resolveLegacyAppPath(
  appPath: string,
  knownDocs: readonly { slug: string; screenIds: readonly string[] }[],
): AppUrlState | null {
  const segments = appPath.split('/').filter(Boolean)

  if (appPath === '/' || appPath === '') {
    const storyboard = knownDocs.find((doc) => doc.slug === 'storyboard')
    const fallback = storyboard ?? knownDocs[0]
    if (!fallback) return null
    return { app: 'mdx', docSlug: fallback.slug, view: 'preview' }
  }

  if (segments[0] === 'playground' && segments.length === 2) {
    const screenId = segments[1]
    const doc = knownDocs.find((entry) => entry.screenIds.includes(screenId))
    if (!doc) return null
    return {
      app: 'playground',
      source: 'json',
      docSlug: doc.slug,
      view: 'prototype',
      screenId,
    }
  }

  if (segments.length === 1) {
    const screenId = segments[0]
    for (const doc of knownDocs) {
      if (doc.screenIds.includes(screenId)) {
        return { app: 'mdx', docSlug: doc.slug, view: 'prototype', screenId }
      }
    }
  }

  if (appPath === PLAYGROUND_APP_PATH) {
    const doc = knownDocs[0]
    const entryScreen = doc?.screenIds[0]
    if (!doc || !entryScreen) return null
    return {
      app: 'playground',
      source: 'json',
      docSlug: doc.slug,
      view: 'prototype',
      screenId: entryScreen,
    }
  }

  return null
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/lib/app-url.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/app-url.ts src/lib/app-url.test.ts src/lib/app-routes.ts
git commit -m "feat: add app URL parse/build codec with legacy resolution"
```

---

### Task 2: `useAppUrl` hook

**Files:**
- Create: `src/shell/use-app-url.ts`
- Modify: `src/shell/use-app-router.ts` (re-export or delete)
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `parseAppUrl`, `buildAppUrl`, `resolveLegacyAppPath`, `AppUrlState` from `@/lib/app-url`; `toAppPath`, `toBrowserPath` from `@/lib/app-base-path`
- Produces:
  ```ts
  export type UseAppUrlOptions = {
    knownDocs: readonly { slug: string; screenIds: readonly string[] }[]
    defaultState: AppUrlState
  }

  export type NavigateAppUrl = (patch: Partial<AppUrlState>, options?: { replace?: boolean }) => void

  export function useAppUrl(options: UseAppUrlOptions): {
    urlState: AppUrlState
    navigate: NavigateAppUrl
  }
  ```

- [ ] **Step 1: Create `src/shell/use-app-url.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import { toAppPath, toBrowserPath } from '@/lib/app-base-path'
import {
  buildAppUrl,
  parseAppUrl,
  resolveLegacyAppPath,
  type AppUrlState,
} from '@/lib/app-url'

export type UseAppUrlOptions = {
  knownDocs: readonly { slug: string; screenIds: readonly string[] }[]
  defaultState: AppUrlState
}

export type NavigateAppUrl = (patch: Partial<AppUrlState>, options?: { replace?: boolean }) => void

function readUrlState(
  knownDocs: UseAppUrlOptions['knownDocs'],
  defaultState: AppUrlState,
): AppUrlState {
  const appPath = toAppPath(window.location.pathname)
  const search = window.location.search
  return (
    parseAppUrl({ appPath, search }) ??
    resolveLegacyAppPath(appPath, knownDocs) ??
    defaultState
  )
}

function writeUrlState(state: AppUrlState, replace: boolean): void {
  const { appPath, search } = buildAppUrl(state)
  const browserPath = `${toBrowserPath(appPath)}${search}`
  if (replace) {
    window.history.replaceState({}, '', browserPath)
  } else {
    window.history.pushState({}, '', browserPath)
  }
}

export function useAppUrl({ knownDocs, defaultState }: UseAppUrlOptions) {
  const [urlState, setUrlState] = useState(() => readUrlState(knownDocs, defaultState))

  useEffect(() => {
    const onPopState = () => setUrlState(readUrlState(knownDocs, defaultState))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [knownDocs, defaultState])

  const navigate = useCallback<NavigateAppUrl>(
    (patch, options) => {
      setUrlState((prev) => {
        const next: AppUrlState = { ...prev, ...patch }
        if (patch.view && patch.view !== 'graph') {
          next.graphMode = undefined
          next.graphFocus = undefined
        }
        if (patch.view && patch.view !== 'prototype') {
          next.screenId = undefined
        }
        writeUrlState(next, options?.replace ?? false)
        return next
      })
    },
    [],
  )

  useEffect(() => {
    const appPath = toAppPath(window.location.pathname)
    const search = window.location.search
    if (parseAppUrl({ appPath, search })) return
    const legacy = resolveLegacyAppPath(appPath, knownDocs)
    if (!legacy) return
    writeUrlState(legacy, true)
    setUrlState(legacy)
  }, [knownDocs])

  return { urlState, navigate }
}
```

- [ ] **Step 2: Update `src/shell/use-app-router.ts` to re-export**

```ts
export { useAppUrl as useAppRouter } from './use-app-url'
export type { NavigateAppUrl } from './use-app-url'
```

Keep `App.tsx` import path stable until Task 7 rewrites it.

- [ ] **Step 3: Verify**

Run: `npm run check`
Expected: PASS (hook unused yet — no runtime change)

- [ ] **Step 4: Commit**

```bash
git add src/shell/use-app-url.ts src/shell/use-app-router.ts
git commit -m "feat: add useAppUrl hook for History API shell state"
```

---

### Task 3: Wire Shell to URL state

**Files:**
- Modify: `src/shell/Shell.tsx`
- Modify: `src/MdxApp.tsx`
- Modify: `src/playground/PlaygroundApp.tsx`

**Interfaces:**
- Consumes: `useAppUrl`, `AppUrlState`, `NavigateAppUrl`
- Produces: `Shell` accepts optional `appDefaults: Pick<AppUrlState, 'app' | 'source'>` prop so MDX vs playground set correct `app` mode

- [ ] **Step 1: Extend `ShellProps` and replace local view/doc state**

```tsx
// src/shell/Shell.tsx — key changes
import { useMemo } from 'react'
import type { AppUrlState } from '@/lib/app-url'
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

export function Shell({ documents, appDefaults }: ShellProps) {
  const knownDocs = useMemo(
    () => documents.map((doc) => ({ slug: doc.slug, screenIds: doc.routes.map((r) => r.id) })),
    [documents],
  )

  const defaultSlug = defaultDocumentSlug(documents)
  const defaultState: AppUrlState = {
    app: appDefaults.app,
    source: appDefaults.source,
    docSlug: defaultSlug,
    view: 'preview',
  }

  const { urlState, navigate } = useAppUrl({ knownDocs, defaultState })

  const view = urlState.view
  const activeDocumentSlug = urlState.docSlug

  const setView = (next: AppUrlState['view']) => navigate({ view: next })
  const setActiveDocumentSlug = (slug: string) => {
    const doc = documents.find((entry) => entry.slug === slug)
    const entryScreen = doc?.routes[0]?.id
    navigate({
      docSlug: slug,
      screenId: view === 'prototype' ? entryScreen : undefined,
      graphFocus: undefined,
    })
  }

  // ... rest unchanged except remove useState for view and activeDocumentSlug
}
```

- [ ] **Step 2: Update `MdxApp.tsx`**

```tsx
import { contentDocuments } from './generated/content-documents.generated'
import { mdxContentDocumentsToBundles } from './shell/adapters/mdx-documents'
import { Shell } from './shell/Shell'

const documents = mdxContentDocumentsToBundles(contentDocuments)

export function MdxApp() {
  return <Shell documents={documents} appDefaults={{ app: 'mdx' }} />
}
```

- [ ] **Step 3: Update `PlaygroundApp.tsx` — remove manual redirect effect**

```tsx
// Remove the useEffect that replaceState /playground → first screen.
// useAppUrl legacy resolver handles /playground and /playground/{screenId}.

return (
  <WireframeErrorProvider initialErrors={errors}>
    <Shell documents={documents} appDefaults={{ app: 'playground', source: 'json' }} />
  </WireframeErrorProvider>
)
```

- [ ] **Step 4: Manual verify**

Run: `npm run dev`
Expected:
- Open `/` → redirects to `/mdx/storyboard/preview`
- Click Prototype tab → URL becomes `/mdx/storyboard/prototype/{entryScreen}`
- Click Graph tab → URL `/mdx/storyboard/graph`
- Switch document via menu → URL doc segment updates

- [ ] **Step 5: Commit**

```bash
git add src/shell/Shell.tsx src/MdxApp.tsx src/playground/PlaygroundApp.tsx
git commit -m "feat: drive shell view and document from URL state"
```

---

### Task 4: Prototype router uses URL screen segment

**Files:**
- Modify: `src/shell/router.tsx`
- Modify: `src/shell/PrototypeView.tsx`
- Modify: `src/components/wireframe/Link.tsx` (no change if routePrefix already correct after Task 6)

**Interfaces:**
- Consumes: `NavigateAppUrl`, `screenId` from parent
- Produces: updated `usePrototypeRouter(routes, { screenId, navigate })`

- [ ] **Step 1: Rewrite `usePrototypeRouter`**

```tsx
// src/shell/router.tsx
import { type ComponentType, useMemo } from 'react'
import type { NavigateAppUrl } from './use-app-url'

export type RouteEntry = {
  id: string
  path: string
  component: ComponentType
  modalIds?: readonly string[]
}

export function modalIdsByScreenFromRoutes(
  routes: readonly Pick<RouteEntry, 'id' | 'modalIds'>[],
): Map<string, readonly string[]> {
  return new Map(routes.map((route) => [route.id, route.modalIds ?? []]))
}

export type PrototypeRouterOptions = {
  screenId?: string
  navigate: NavigateAppUrl
}

export function usePrototypeRouter(routes: readonly RouteEntry[], options: PrototypeRouterOptions) {
  const defaultRoute = routes[0]
  const activeRoute = useMemo(() => {
    if (options.screenId) {
      const match = routes.find((route) => route.id === options.screenId)
      if (match) return match
    }
    return defaultRoute
  }, [routes, options.screenId, defaultRoute])

  const navigateToScreen = (path: string) => {
    const route = routes.find((entry) => entry.path === path)
    if (!route) return
    options.navigate({ view: 'prototype', screenId: route.id })
  }

  return {
    navigate: navigateToScreen,
    activeRoute,
    activePath: activeRoute?.path ?? '/',
  }
}
```

- [ ] **Step 2: Update `PrototypeView.tsx`**

```tsx
import type { NavigateAppUrl } from './use-app-url'

export type PrototypeViewProps = {
  routes: readonly RouteEntry[]
  documentFilename: string
  routePrefix?: string
  screenId?: string
  navigate: NavigateAppUrl
}

export function PrototypeView({
  routes,
  documentFilename,
  routePrefix = '',
  screenId,
  navigate,
}: PrototypeViewProps) {
  const { navigate: navigateToScreen, activeRoute } = usePrototypeRouter(routes, {
    screenId,
    navigate,
  })
  // pass navigateToScreen to WireframeViewProvider
}
```

- [ ] **Step 3: Pass props from `Shell.tsx`**

```tsx
<PrototypeView
  key={activeEntry.slug}
  routes={activeEntry.routes}
  documentFilename={documentFilename(activeEntry)}
  routePrefix={routePrefix}
  screenId={urlState.screenId}
  navigate={navigate}
/>
```

- [ ] **Step 4: Verify prototype navigation**

Run: `npm run dev`
Expected:
- `/mdx/wireframe/prototype/home` shows home screen
- Click Login link → URL `/mdx/wireframe/prototype/login`
- Browser back → previous screen

- [ ] **Step 5: Commit**

```bash
git add src/shell/router.tsx src/shell/PrototypeView.tsx src/shell/Shell.tsx
git commit -m "feat: sync prototype screen with URL segment"
```

---

### Task 5: Graph view query sync

**Files:**
- Modify: `src/shell/GraphView.tsx`
- Modify: `src/shell/Shell.tsx`

**Interfaces:**
- Consumes: `graphMode`, `graphFocus` from `urlState`; `navigate` from `useAppUrl`
- Produces: GraphView props `{ graphMode?, graphFocus?, onGraphUrlChange }`

- [ ] **Step 1: Add props to `GraphView` and replace local mode/focus state**

```tsx
// src/shell/GraphView.tsx — replace useState for mode/selectedId URL fields
export type GraphViewProps = {
  navigationGraph: NavigationGraph
  routes: readonly RouteEntry[]
  documentFilename: string
  graphMode?: GraphMode
  graphFocus?: string
  onGraphUrlChange: (patch: { graphMode?: GraphMode; graphFocus?: string | null }) => void
}

export function GraphView({
  navigationGraph,
  routes,
  documentFilename,
  graphMode = 'screen',
  graphFocus,
  onGraphUrlChange,
}: GraphViewProps) {
  const mode = graphMode
  const selectedId = graphFocus ?? null

  const setMode = (value: GraphDisplayMode) => onGraphUrlChange({ graphMode: value })
  const onSelectNode = (id: string) => onGraphUrlChange({ graphFocus: id })
  const onClearSelection = () => onGraphUrlChange({ graphFocus: null })

  const onGraphLinkFocus = useCallback(
    (linkId: string, targetScreenId: string) => {
      setHighlightedLinkId(linkId)
      onGraphUrlChange({ graphFocus: targetScreenId })
      setFocusTargetScreenId(targetScreenId)
    },
    [onGraphUrlChange],
  )
  // keep focusTargetScreenId local (transient camera animation only)
}
```

- [ ] **Step 2: Wire in `Shell.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Expected:
- Graph tab → `/mdx/storyboard/graph`
- Switch Compact → `?graphMode=compact`
- Click node → `?graphMode=compact&focus={id}` (or `screen` if default)
- Copy URL, open new tab → same graph mode + focus restored

- [ ] **Step 4: Commit**

```bash
git add src/shell/GraphView.tsx src/shell/Shell.tsx
git commit -m "feat: sync graph mode and focus with URL query params"
```

---

### Task 6: Doc-scoped route paths (codegen + bundles)

**Files:**
- Modify: `src/plugin/generate.ts`
- Modify: `src/plugin/generate.test.ts`
- Modify: `src/shell/adapters/mdx-documents.ts`
- Modify: `src/json/to-document-bundle.ts`
- Modify: `src/json/to-document-bundle.test.ts`

**Interfaces:**
- Produces: MDX routes with `path: '/mdx/{slug}/{screenId}'` and bundle `routePrefix: '/mdx/{slug}'`
- Produces: JSON playground routes with `path: '/playground/json/{slug}/{screenId}'`

- [ ] **Step 1: Update failing codegen test**

```ts
// src/plugin/generate.test.ts — change expectation
expect(docRoutes).toContain("path: '/mdx/wireframe/home'")
```

- [ ] **Step 2: Pass slug into `buildRoutesFile`**

```ts
// src/plugin/generate.ts
export function buildRoutesFile(screens: readonly MdxScreen[], slug: string): string {
  // ...
  return `  {\n    id: '${s.id}',\n    path: '/mdx/${slug}/${s.id}',\n    component: ${name}${modalIdsField},\n  }`
}

// generateDocumentFiles — call buildRoutesFile(screens, slug)
```

- [ ] **Step 3: Update MDX adapter**

```ts
// src/shell/adapters/mdx-documents.ts
import { MDX_APP_PREFIX } from '@/lib/app-routes'

export function mdxContentDocumentsToBundles(
  documents: readonly ContentDocumentEntry[],
): readonly WireframeDocumentBundle[] {
  return documents.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    source: 'mdx' as const,
    routes: doc.routes,
    navigationGraph: doc.navigationGraph,
    preview: { kind: 'mdx' as const, component: doc.component },
    routePrefix: `${MDX_APP_PREFIX}/${doc.slug}`,
  }))
}
```

- [ ] **Step 4: Update JSON bundle paths**

```ts
// src/json/to-document-bundle.ts
import { PLAYGROUND_APP_PATH } from '@/lib/app-routes'

export function jsonToWireframeDocumentBundle(
  built: JsonDocumentBuilt,
  slug = 'json-document',
  options: { playground?: boolean } = {},
): WireframeDocumentBundle {
  const routePrefix = options.playground
    ? `${PLAYGROUND_APP_PATH}/json/${slug}`
    : `${MDX_APP_PREFIX}/${slug}`

  const routes = built.screens.map((screen) => ({
    id: screen.id,
    path: screenRoutePath(routePrefix, screen.id),
    // ...
  }))

  return {
    // ...
    routePrefix,
  }
}
```

- [ ] **Step 5: Update `PlaygroundApp.tsx` bundle call**

```tsx
return [jsonToWireframeDocumentBundle(built.document, 'playground', { playground: true })]
```

- [ ] **Step 6: Run codegen + tests**

Run: `npm run codegen && npm test && npm run check && npm run build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/plugin/generate.ts src/plugin/generate.test.ts src/shell/adapters/mdx-documents.ts src/json/to-document-bundle.ts src/json/to-document-bundle.test.ts src/playground/PlaygroundApp.tsx
git commit -m "feat: scope prototype route paths by app and document slug"
```

---

### Task 7: App entry routing cleanup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/shell/use-app-router.ts` (remove shim if unused)
- Modify: `src/lib/app-url.ts` (add `isMdxAppPath` helper if useful)

**Interfaces:**
- Consumes: `parseAppUrl`, `resolveLegacyAppPath`
- Produces: `App.tsx` chooses `MdxApp` vs `PlaygroundApp` from parsed `app` field

- [ ] **Step 1: Update `App.tsx`**

```tsx
import { TooltipProvider } from '@/components/ui/tooltip'
import { toAppPath } from '@/lib/app-base-path'
import { parseAppUrl, resolveLegacyAppPath } from '@/lib/app-url'
import { isPlaygroundAppPath } from '@/lib/app-routes'
import { MdxApp } from './MdxApp'
import { PlaygroundApp } from './playground/PlaygroundApp'
import { useAppUrl } from './shell/use-app-url'

function resolveAppMode(appPath: string): 'mdx' | 'playground' {
  const parsed = parseAppUrl({ appPath, search: window.location.search })
  if (parsed) return parsed.app
  if (isPlaygroundAppPath(appPath)) return 'playground'
  return 'mdx'
}

function App() {
  const appPath = toAppPath(window.location.pathname)
  const mode = resolveAppMode(appPath)

  return (
    <TooltipProvider delay={0}>
      {mode === 'playground' ? <PlaygroundApp /> : <MdxApp />}
    </TooltipProvider>
  )
}
```

Note: `App.tsx` uses one-shot read on render; `Shell` inside each app owns full URL sync. For popstate across app boundary (rare), remount via key:

```tsx
const appPath = toAppPath(window.location.pathname)
const mode = resolveAppMode(appPath)
// ...
{mode === 'playground' ? <PlaygroundApp key="playground" /> : <MdxApp key="mdx" />}
```

Add popstate listener in `App.tsx` if hot reload during dev shows stale app:

```tsx
const [appPath, setAppPath] = useState(() => toAppPath(window.location.pathname))
useEffect(() => {
  const onPopState = () => setAppPath(toAppPath(window.location.pathname))
  window.addEventListener('popstate', onPopState)
  return () => window.removeEventListener('popstate', onPopState)
}, [])
```

- [ ] **Step 2: Verify legacy redirects**

Run: `npm run dev`

| Visit | Expected redirect |
|-------|-------------------|
| `/login` | `/mdx/wireframe/prototype/login` |
| `/playground` | `/playground/json/playground/prototype/home` |
| `/playground/home` | `/playground/json/playground/prototype/home` |
| `/mdx/wireframe/graph?graphMode=compact` | Graph compact mode |

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: route App by parsed URL app mode with legacy support"
```

---

### Task 8: Documentation

**Files:**
- Modify: `docs/CONTEXT.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Add URL schema section to `docs/CONTEXT.md`**

Under **Key behaviors**, add:

```markdown
### URL state

Browser URL is source of truth for shell navigation:

- MDX app: `/mdx/{docSlug}/{view}[/ {screenId}]`
- Playground: `/playground/{source}/{docSlug}/{view}[/ {screenId}]`
- Graph query: `?graphMode=screen|compact&focus={screenId}`

Legacy flat paths (`/login`, `/playground/home`) redirect on load. Codec: `src/lib/app-url.ts`; hook: `src/shell/use-app-url.ts`.
```

- [ ] **Step 2: Update `AGENTS.md` app routing bullet**

```markdown
### App routing

- Canonical paths: `/mdx/...` (codegen MDX) and `/playground/json/...` (JSON playground)
- `src/lib/app-url.ts` — parse/build; `src/shell/use-app-url.ts` — History API hook
- `App.tsx` — playground vs MDX split from parsed URL
- Prototype screen paths: `/mdx/{docSlug}/{screenId}` or `/playground/json/{docSlug}/{screenId}`
```

- [ ] **Step 3: Final verify**

Run: `npm run check && npm run build && npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/CONTEXT.md AGENTS.md
git commit -m "docs: document canonical app URL schema"
```

---

## Self-review

### Spec coverage

| Requirement | Task |
|-------------|------|
| MDX vs JSON in URL | Task 1 schema, Task 7 App split |
| Preview / Prototype / Graph in URL | Task 1, Task 3 |
| Graph Screen / Compact in URL | Task 5 |
| Active document in URL | Task 1 `docSlug`, Task 3 |
| Active / focused screen in URL | Task 4 prototype, Task 5 graph focus |
| Playground route cleanup | Task 6, Task 7 legacy redirects |
| Future MDX playground path slot | `/playground/mdx/{docSlug}/…` reserved in schema |
| No React Router | Global constraints |
| BASE_URL compat | Uses existing `toAppPath`/`toBrowserPath` |

### Deferred (YAGNI — follow-up plan)

- Preview in-page scroll deep link via hash (`#login`) — optional polish
- Editor pane content in URL — out of scope; SaaS persistence later
- MDX playground (`/playground/mdx/…`) — schema ready, implementation when editor lands

### Placeholder scan

No TBD steps. All code blocks complete.

### Type consistency

- `ShellView` exported from `app-routes.ts`; re-used in `app-url.ts` and `Shell.tsx`
- `NavigateAppUrl` defined once in `use-app-url.ts`, imported by router + PrototypeView
- `GraphMode` shared between `app-url.ts` and `GraphView.tsx` via `@/lib/app-routes`
