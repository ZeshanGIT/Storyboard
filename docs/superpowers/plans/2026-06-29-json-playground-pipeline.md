# JSON Playground Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browser-only JSON wireframe path (per [`docs/JSON-COMPONENTS.md`](../../JSON-COMPONENTS.md)) that produces Preview, Prototype, and Graph views at runtime — without touching MDX codegen or `src/generated/`.

**Architecture:** Two parallel ingestion compilers (`src/plugin/` for MDX, `src/json/` for JSON) converge on a shared `WireframeDocumentBundle` consumed by `Shell`. JSON compiles in-memory: parse tuples → validate → classify links → build `NavigationGraph` → render screens with existing wireframe primitives. MDX app unchanged except a thin adapter from `contentDocuments` to bundles.

**Tech Stack:** TypeScript 6, React 19, Vitest, existing shell/runtime/primitives. No new npm dependencies.

## Global Constraints

- Run `npm run build` + `npm run check` before claiming done; JSON module changes need `npm test`
- Do not hand-edit `src/generated/`; do not modify MDX codegen behavior except optional shared-link refactor in Task 2
- MDX path and JSON path live in separate directories; no JSON imports in `src/plugin/`, no MDX imports in `src/json/`
- Wireframe primitives stay structural; shell may use shadcn/Tailwind
- Graph edge rules unchanged: screen→screen only; skip `_close`, `_back`, modal targets, `disabled` links
- `linkId` format stays `${screenId}:${linkIndex}` (index among navigable link candidates in screen, same order as MDX)
- JSON spec: tuple nodes, colon-modifier tags, props for data only — see `docs/JSON-COMPONENTS.md`
- Update `docs/CONTEXT.md` when architecture changes (Task 10)

**Recommended prerequisite:** [`2026-06-29-shared-navigation-types.md`](2026-06-29-shared-navigation-types.md) — if not done, Task 1 includes the type move.

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/types/navigation.ts` | `NavigationGraph`, `NavigationEdge`, `NavigationGraphNode` (shared) |
| `src/types/goto.ts` | `GotoTarget` as `string`; `RESERVED_GOTO` constants |
| `src/types/wireframe-document.ts` | `WireframeDocumentBundle`, `WireframePreviewSource` |
| `src/json/types.ts` | `JsonWireframeDocument`, `JsonScreen`, `JsonNode`, `ParsedTag`, `JsonBuildError` |
| `src/json/parse-tag.ts` | `parseTag(tag: string): ParsedTag` |
| `src/json/parse-node.ts` | `parseJsonNode(raw: unknown): JsonNode` — tuple arity + tag grammar |
| `src/json/tag-registry.ts` | Per-component allowed modifiers; mutual-exclusion rules |
| `src/json/collect-modals.ts` | Walk `JsonNode[]` → modal ids per screen |
| `src/json/collect-links.ts` | Walk `JsonNode[]` → raw link records for classification |
| `src/json/classify-goto-link.ts` | Pure `classifyGotoLink(...)` shared by MDX + JSON |
| `src/json/build-json-document.ts` | `buildJsonDocument(raw): Result` — validate + screens + links |
| `src/json/render-json-node.tsx` | `renderJsonNode(node, ctx): ReactNode` |
| `src/json/build-screen-component.tsx` | `buildScreenComponent(screen, linkIds): ComponentType` |
| `src/json/to-document-bundle.ts` | `jsonToWireframeDocumentBundle(doc): WireframeDocumentBundle` |
| `src/json/sample-wireframe.json` | Canonical sample (Workforge subset) |
| `src/shell/adapters/mdx-documents.ts` | `mdxContentDocumentsToBundles(...)` |
| `src/shell/PreviewView.tsx` | Accept `WireframePreviewSource` instead of MDX-only `component` |
| `src/shell/Shell.tsx` | Accept `WireframeDocumentBundle[]` |
| `src/playground/PlaygroundApp.tsx` | JSON editor state → bundle → Shell |
| `src/playground/main.tsx` | Playground entry (no `contentDocuments` import) |
| `playground.html` | Second Vite HTML entry |
| `src/App.tsx` | Use MDX adapter only (unchanged surface for dev) |
| `src/components/wireframe/Link.tsx` | Import `GotoTarget` from `@/types/goto` |

---

### Task 1: Shared document and navigation types

**Files:**
- Create: `src/types/navigation.ts`
- Create: `src/types/goto.ts`
- Create: `src/types/wireframe-document.ts`
- Modify: `src/components/wireframe/Link.tsx`
- Modify: `src/shell/GraphView.tsx` (import path only)
- Modify: `src/plugin/types.ts` (re-export navigation types)

**Interfaces:**
- Produces:
  ```ts
  // src/types/navigation.ts
  export type NavigationEdge = { id: string; fromScreenId: string; toScreenId: string; linkId: string; label?: string }
  export type NavigationGraphNode = { id: string; title: string; note?: string; order: number; isEntry: boolean }
  export type NavigationGraph = { nodes: readonly NavigationGraphNode[]; edges: readonly NavigationEdge[] }

  // src/types/goto.ts
  export const RESERVED_GOTO_TARGETS = ['_close', '_back'] as const
  export type GotoTarget = string

  // src/types/wireframe-document.ts
  import type { ComponentType } from 'react'
  import type { NavigationGraph } from './navigation'
  import type { RouteEntry } from '@/shell/router'

  export type WireframePreviewSource =
    | { kind: 'mdx'; component: ComponentType }
    | { kind: 'screens'; screens: readonly { id: string; title?: string; component: ComponentType }[] }

  export type WireframeDocumentBundle = {
    slug: string
    title: string
    source: 'mdx' | 'json'
    routes: readonly RouteEntry[]
    navigationGraph: NavigationGraph
    preview: WireframePreviewSource
  }
  ```

- [ ] **Step 1: Create `src/types/navigation.ts`**

Copy `NavigationEdge`, `NavigationGraphNode`, `NavigationGraph` verbatim from `src/plugin/types.ts`.

- [ ] **Step 2: Create `src/types/goto.ts`**

```ts
export const RESERVED_GOTO_TARGETS = ['_close', '_back'] as const
export type ReservedGotoTarget = (typeof RESERVED_GOTO_TARGETS)[number]
export type GotoTarget = string
```

- [ ] **Step 3: Create `src/types/wireframe-document.ts`**

Use the `WireframeDocumentBundle` / `WireframePreviewSource` types above.

- [ ] **Step 4: Update `Link.tsx` import**

```ts
// src/components/wireframe/Link.tsx — replace generated import
import type { GotoTarget } from '@/types/goto'
```

- [ ] **Step 5: Re-export navigation types from plugin**

```ts
// src/plugin/types.ts — replace inline Navigation* types with:
export type { NavigationEdge, NavigationGraph, NavigationGraphNode } from '../types/navigation'
```

- [ ] **Step 6: Update `GraphView.tsx` import**

```ts
import type { NavigationGraph } from '@/types/navigation'
```

- [ ] **Step 7: Verify**

Run: `npm run check && npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/types/navigation.ts src/types/goto.ts src/types/wireframe-document.ts src/components/wireframe/Link.tsx src/plugin/types.ts src/shell/GraphView.tsx
git commit -m "feat: add shared wireframe document and navigation types"
```

---

### Task 2: Shared link classifier

**Files:**
- Create: `src/json/classify-goto-link.ts`
- Create: `src/json/classify-goto-link.test.ts`
- Modify: `src/plugin/classify-links.ts`

**Interfaces:**
- Produces:
  ```ts
  import type { ClassifiedLink } from '@/plugin/types'
  import { CodegenError } from '@/plugin/types'

  export type ClassifyGotoLinkInput = {
    screenId: string
    linkIndex: number
    goto: string | undefined
    label?: string
    disabled?: boolean
    screenIds: ReadonlySet<string>
    modalIdsForScreen: ReadonlySet<string>
  }

  export type ClassifyGotoLinkResult = {
    link: ClassifiedLink
    error?: CodegenError
  }

  export function classifyGotoLink(input: ClassifyGotoLinkInput): ClassifyGotoLinkResult
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/json/classify-goto-link.test.ts
import { describe, expect, it } from 'vitest'
import { classifyGotoLink } from './classify-goto-link'

describe('classifyGotoLink', () => {
  it('classifies screen-edge with linkId', () => {
    const screenIds = new Set(['home', 'login'])
    const result = classifyGotoLink({
      screenId: 'home',
      linkIndex: 0,
      goto: 'login',
      label: 'Login',
      screenIds,
      modalIdsForScreen: new Set(),
    })
    expect(result.error).toBeUndefined()
    expect(result.link).toEqual({
      classification: 'screen-edge',
      goto: 'login',
      label: 'Login',
      linkId: 'home:0',
      toScreenId: 'login',
    })
  })

  it('returns error for missing goto', () => {
    const result = classifyGotoLink({
      screenId: 'home',
      linkIndex: 0,
      goto: undefined,
      screenIds: new Set(['home']),
      modalIdsForScreen: new Set(),
    })
    expect(result.link.classification).toBe('invalid-missing-goto')
    expect(result.error?.code).toBe('INVALID_GOTO')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/json/classify-goto-link.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement `classify-goto-link.ts`**

Port logic from `src/plugin/classify-links.ts` lines 32–94 into the pure function. Use `RESERVED_GOTO_TARGETS` from `@/types/goto`.

- [ ] **Step 4: Refactor `classify-links.ts` to call `classifyGotoLink`**

Replace inline classification block with:

```ts
const { link, error } = classifyGotoLink({
  screenId: activeScreenId,
  linkIndex,
  goto: gotoTarget?.kind === 'screen-id' ? gotoTarget.value : undefined,
  label,
  disabled: hasBooleanAttr(node, 'disabled'),
  screenIds,
  modalIdsForScreen: modalIdsByScreen.get(activeScreenId) ?? new Set(),
})
if (error) errors.push(error)
pushLink(linksByScreen, activeScreenId, link)
if (link.classification === 'screen-edge') linkIndex += 1
```

Preserve existing MDX-only branches for `unknown` goto expressions before calling classifier.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/json/classify-goto-link.test.ts src/plugin/classify-links.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/json/classify-goto-link.ts src/json/classify-goto-link.test.ts src/plugin/classify-links.ts
git commit -m "feat: extract shared goto link classifier"
```

---

### Task 3: JSON tag parser and tuple normalizer

**Files:**
- Create: `src/json/types.ts`
- Create: `src/json/tag-registry.ts`
- Create: `src/json/parse-tag.ts`
- Create: `src/json/parse-tag.test.ts`
- Create: `src/json/parse-node.ts`
- Create: `src/json/parse-node.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/json/types.ts
  export type ParsedTag = { component: string; modifiers: readonly string[] }
  export type JsonProps = Readonly<Record<string, unknown>>
  export type JsonNode = {
    tag: ParsedTag
    props: JsonProps
    children?: readonly JsonNode[] | string
  }

  // src/json/parse-tag.ts
  export function parseTag(raw: string): ParsedTag

  // src/json/parse-node.ts
  export function parseJsonNode(raw: unknown): JsonNode
  ```

- [ ] **Step 1: Write failing parse-tag test**

```ts
// src/json/parse-tag.test.ts
import { describe, expect, it } from 'vitest'
import { parseTag } from './parse-tag'

describe('parseTag', () => {
  it('splits component and modifiers', () => {
    expect(parseTag('Link:primary-btn')).toEqual({
      component: 'Link',
      modifiers: ['primary-btn'],
    })
  })

  it('sorts modifiers for stable order', () => {
    expect(parseTag('Input:danger:textarea').modifiers).toEqual(['danger', 'textarea'])
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/json/parse-tag.test.ts`

- [ ] **Step 3: Implement `parse-tag.ts` and `tag-registry.ts`**

```ts
// src/json/parse-tag.ts
import { validateModifiers } from './tag-registry'

export function parseTag(raw: string): ParsedTag {
  const parts = raw.split(':')
  const component = parts[0] ?? ''
  const modifiers = [...parts.slice(1)].sort()
  validateModifiers(component, modifiers)
  return { component, modifiers }
}
```

`tag-registry.ts` exports `WIREFRAME_COMPONENTS`, per-component modifier sets from `docs/JSON-COMPONENTS.md`, and `validateModifiers` throwing `JsonBuildError` on unknown component or conflicting modifiers (e.g. `Text:h1:h2`).

- [ ] **Step 4: Write failing parse-node test**

```ts
// src/json/parse-node.test.ts
import { describe, expect, it } from 'vitest'
import { parseJsonNode } from './parse-node'

describe('parseJsonNode', () => {
  it('parses text leaf 2-tuple', () => {
    expect(parseJsonNode(['Text:h1', 'Welcome'])).toEqual({
      tag: { component: 'Text', modifiers: ['h1'] },
      props: {},
      children: 'Welcome',
    })
  })

  it('parses container 3-tuple', () => {
    const node = parseJsonNode([
      'Container:row',
      { distribute: 'space-between' },
      [['Link:primary-btn', { goto: 'login' }, 'Login']],
    ])
    expect(node.tag.component).toBe('Container')
    expect(Array.isArray(node.children)).toBe(true)
  })
})
```

- [ ] **Step 5: Implement `parse-node.ts`**

Rules from `docs/JSON-COMPONENTS.md`:
- Tuple length 1–3 only
- Index 0: string tag
- If index 1 is plain object → props; if string or array → children (props `{}`)
- Index 2: string or `JsonNode[]` children
- Reject non-tuple roots

- [ ] **Step 6: Run tests**

Run: `npm test -- src/json/parse-tag.test.ts src/json/parse-node.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/json/types.ts src/json/tag-registry.ts src/json/parse-tag.ts src/json/parse-tag.test.ts src/json/parse-node.ts src/json/parse-node.test.ts
git commit -m "feat: parse JSON wireframe tuple nodes and tags"
```

---

### Task 4: buildJsonDocument

**Files:**
- Create: `src/json/collect-modals.ts`
- Create: `src/json/collect-links.ts`
- Create: `src/json/build-json-document.ts`
- Create: `src/json/build-json-document.test.ts`
- Modify: `src/plugin/extract-navigation-graph.ts` (export screen-shaped type alias if needed)

**Interfaces:**
- Produces:
  ```ts
  export type JsonScreenBuilt = {
    id: string
    title: string
    order: number
    note?: string
    nodes: readonly JsonNode[]
    modalIds: readonly string[]
    links: readonly ClassifiedLink[]
  }

  export type JsonDocumentBuilt = {
    title: string
    screens: readonly JsonScreenBuilt[]
  }

  export function buildJsonDocument(
    raw: unknown,
  ): { ok: true; document: JsonDocumentBuilt } | { ok: false; errors: JsonBuildError[] }
  ```

- [ ] **Step 1: Write failing integration test**

```ts
// src/json/build-json-document.test.ts
import { describe, expect, it } from 'vitest'
import { buildJsonDocument } from './build-json-document'
import { extractNavigationGraphFromScreens } from '@/plugin/extract-navigation-graph'

const FIXTURE = {
  title: 'Demo',
  screens: {
    home: {
      title: 'Home',
      nodes: [['Link:primary-btn', { goto: 'login' }, 'Login']],
    },
    login: {
      title: 'Login',
      nodes: [['Text:h1', 'Sign in']],
    },
  },
}

describe('buildJsonDocument', () => {
  it('builds screens and classifies links', () => {
    const built = buildJsonDocument(FIXTURE)
    expect(built.ok).toBe(true)
    if (!built.ok) return
    expect(built.document.screens[0]?.id).toBe('home')
    expect(built.document.screens[0]?.links[0]?.classification).toBe('screen-edge')
    const graph = extractNavigationGraphFromScreens(
      built.document.screens.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        jsx: '',
        modalIds: s.modalIds,
        links: s.links,
        note: s.note,
      })),
    )
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]?.toScreenId).toBe('login')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/json/build-json-document.test.ts`

- [ ] **Step 3: Implement collectors**

`collect-modals.ts` — depth-first walk; on `Modal` node read `props.id`; error on duplicate per screen or collision with screen keys.

`collect-links.ts` — depth-first walk; on `Link` node read `props.goto`, `tag.modifiers` includes `disabled`, derive label from string child or `'link'`.

- [ ] **Step 4: Implement `build-json-document.ts`**

1. Validate top-level `{ title: string, screens: Record<string, { title, note?, nodes }> }`
2. Preserve `Object.keys(screens)` order for `order` / entry screen
3. Parse each node with `parseJsonNode`
4. Validate `Text` leaves have string children only
5. `collect-modals` + `collect-links` per screen
6. `classifyGotoLink` for each link in traversal order
7. Return errors with codes aligned to `CodegenErrorCode` where applicable

- [ ] **Step 5: Run test — expect PASS**

Run: `npm test -- src/json/build-json-document.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/json/collect-modals.ts src/json/collect-links.ts src/json/build-json-document.ts src/json/build-json-document.test.ts
git commit -m "feat: build validated JSON wireframe document"
```

---

### Task 5: JSON → React renderer

**Files:**
- Create: `src/json/render-json-node.tsx`
- Create: `src/json/build-screen-component.tsx`
- Create: `src/json/render-json-node.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type RenderJsonContext = {
    screenId: string
    linkIdsByIndex: readonly (string | undefined)[]
    linkRenderIndex: { current: number }
  }

  export function renderJsonNode(node: JsonNode, ctx: RenderJsonContext): ReactNode

  export function buildScreenComponent(screen: JsonScreenBuilt): ComponentType
  ```

- [ ] **Step 1: Write failing render test (node module only)**

```ts
// src/json/render-json-node.test.ts
import { describe, expect, it } from 'vitest'
import { parseJsonNode } from './parse-node'
import { propsFromTag } from './render-json-node'

describe('propsFromTag', () => {
  it('maps Text:h1 to h1 boolean prop', () => {
    const node = parseJsonNode(['Text:h1', 'Title'])
    expect(propsFromTag(node.tag, node.props)).toMatchObject({ h1: true })
  })

  it('maps Link:primary-btn and goto prop', () => {
    const node = parseJsonNode(['Link:primary-btn', { goto: 'home' }, 'Go'])
    expect(propsFromTag(node.tag, node.props)).toMatchObject({
      goto: 'home',
      'primary-btn': true,
    })
  })
})
```

- [ ] **Step 2: Implement `propsFromTag` + `renderJsonNode`**

Map tags to existing primitives from `@/components/wireframe`:
- `Text`, `Link`, `Input`, `Container`, `Image`, `Icon`, `Modal`, `TopBar`, `Divider`
- Spread `propsFromTag(tag, props)` onto component
- For `Link` with `screen-edge` classified link at `linkRenderIndex`, pass `graph-link-id={linkId}` then increment index
- Wrap each built screen in `<Screen id title note>` via `buildScreenComponent`

```tsx
// src/json/build-screen-component.tsx
export function buildScreenComponent(screen: JsonScreenBuilt): ComponentType {
  return function JsonScreen() {
    const ctx: RenderJsonContext = {
      screenId: screen.id,
      linkIdsByIndex: screen.links.map((l) =>
        l.classification === 'screen-edge' ? l.linkId : undefined,
      ),
      linkRenderIndex: { current: 0 },
    }
    return (
      <Screen id={screen.id} title={screen.title} note={screen.note}>
        {screen.nodes.map((node, i) => (
          <Fragment key={i}>{renderJsonNode(node, ctx)}</Fragment>
        ))}
      </Screen>
    )
  }
}
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/json/render-json-node.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/json/render-json-node.tsx src/json/build-screen-component.tsx src/json/render-json-node.test.ts
git commit -m "feat: render JSON wireframe nodes to React"
```

---

### Task 6: JSON document bundle adapter

**Files:**
- Create: `src/json/to-document-bundle.ts`
- Create: `src/json/to-document-bundle.test.ts`
- Create: `src/json/sample-wireframe.json`

**Interfaces:**
- Produces:
  ```ts
  export function jsonToWireframeDocumentBundle(
    built: JsonDocumentBuilt,
    slug?: string,
  ): WireframeDocumentBundle
  ```

- [ ] **Step 1: Write failing test**

```ts
// src/json/to-document-bundle.test.ts
import { describe, expect, it } from 'vitest'
import { buildJsonDocument } from './build-json-document'
import { jsonToWireframeDocumentBundle } from './to-document-bundle'
import sample from './sample-wireframe.json'

describe('jsonToWireframeDocumentBundle', () => {
  it('produces routes and navigation graph', () => {
    const built = buildJsonDocument(sample)
    expect(built.ok).toBe(true)
    if (!built.ok) return
    const bundle = jsonToWireframeDocumentBundle(built.document, 'sample')
    expect(bundle.source).toBe('json')
    expect(bundle.routes.length).toBeGreaterThan(0)
    expect(bundle.preview.kind).toBe('screens')
    expect(bundle.navigationGraph.nodes.length).toBe(bundle.routes.length)
  })
})
```

- [ ] **Step 2: Add `sample-wireframe.json`**

Copy the Example block from `docs/JSON-COMPONENTS.md` (home + login screens).

- [ ] **Step 3: Implement `to-document-bundle.ts`**

```ts
import { extractNavigationGraphFromScreens } from '@/plugin/extract-navigation-graph'
import type { WireframeDocumentBundle } from '@/types/wireframe-document'
import { buildScreenComponent } from './build-screen-component'

export function jsonToWireframeDocumentBundle(
  built: JsonDocumentBuilt,
  slug = 'json-document',
): WireframeDocumentBundle {
  const routes = built.screens.map((screen) => ({
    id: screen.id,
    path: `/${screen.id}`,
    component: buildScreenComponent(screen),
    ...(screen.modalIds.length > 0 ? { modalIds: screen.modalIds } : {}),
  }))

  const navigationGraph = extractNavigationGraphFromScreens(
    built.screens.map((s) => ({
      id: s.id,
      title: s.title,
      order: s.order,
      jsx: '',
      modalIds: s.modalIds,
      links: s.links,
      note: s.note,
    })),
  )

  return {
    slug,
    title: built.title,
    source: 'json',
    routes,
    navigationGraph,
    preview: {
      kind: 'screens',
      screens: built.screens.map((s) => ({
        id: s.id,
        title: s.title,
        component: buildScreenComponent(s),
      })),
    },
  }
}
```

- [ ] **Step 4: Enable JSON import in tsconfig if needed**

Add to `tsconfig.app.json` `"resolveJsonModule": true` if not already set.

- [ ] **Step 5: Run test**

Run: `npm test -- src/json/to-document-bundle.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/json/to-document-bundle.ts src/json/to-document-bundle.test.ts src/json/sample-wireframe.json
git commit -m "feat: adapt JSON document to WireframeDocumentBundle"
```

---

### Task 7: Shell accepts WireframeDocumentBundle

**Files:**
- Create: `src/shell/adapters/mdx-documents.ts`
- Modify: `src/shell/Shell.tsx`
- Modify: `src/shell/PreviewView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces:
  ```ts
  // src/shell/adapters/mdx-documents.ts
  import type { ContentDocumentEntry } from '@/generated/content-documents.generated'
  import type { WireframeDocumentBundle } from '@/types/wireframe-document'

  export function mdxContentDocumentsToBundles(
    documents: readonly ContentDocumentEntry[],
  ): readonly WireframeDocumentBundle[]
  ```

- [ ] **Step 1: Implement MDX adapter**

```ts
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
  }))
}
```

- [ ] **Step 2: Update `PreviewView.tsx`**

```tsx
export type PreviewViewProps = {
  validScreenIds: readonly string[]
  routes: readonly RouteEntry[]
  preview: WireframePreviewSource
}

export function PreviewView({ validScreenIds, routes, preview }: PreviewViewProps) {
  const modalIdsByScreen = useMemo(() => modalIdsByScreenFromRoutes(routes), [routes])

  return (
    <WireframeViewProvider view="preview" navigate={() => {}} validScreenIds={validScreenIds} modalIdsByScreen={modalIdsByScreen}>
      <div className="flex flex-col gap-8">
        {preview.kind === 'mdx' ? (
          <preview.component />
        ) : (
          preview.screens.map((screen) => <screen.component key={screen.id} />)
        )}
      </div>
    </WireframeViewProvider>
  )
}
```

- [ ] **Step 3: Update `Shell.tsx`**

- Change prop to `documents: readonly WireframeDocumentBundle[]`
- Replace `activeEntry.component` with `activeEntry.preview` in `PreviewView`
- `documentFilename` for prototype/graph: `` `${activeEntry.slug}.${activeEntry.source === 'mdx' ? 'mdx' : 'json'}` ``

- [ ] **Step 4: Update `App.tsx`**

```tsx
import { contentDocuments } from './generated/content-documents.generated'
import { mdxContentDocumentsToBundles } from './shell/adapters/mdx-documents'

const documents = mdxContentDocumentsToBundles(contentDocuments)

function App() {
  return (
    <TooltipProvider delay={0}>
      <Shell documents={documents} />
    </TooltipProvider>
  )
}
```

- [ ] **Step 5: Verify MDX app still works**

Run: `npm run build && npm run check && npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/shell/adapters/mdx-documents.ts src/shell/Shell.tsx src/shell/PreviewView.tsx src/App.tsx
git commit -m "feat: shell consumes WireframeDocumentBundle"
```

---

### Task 8: Playground entry (JSON-only app)

**Files:**
- Create: `playground.html`
- Create: `src/playground/main.tsx`
- Create: `src/playground/PlaygroundApp.tsx`
- Modify: `package.json` (add `dev:playground` script optional)

**Interfaces:**
- Produces: standalone app that imports **no** `src/generated/*`

- [ ] **Step 1: Create `playground.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Storyboard Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/playground/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `PlaygroundApp.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { buildJsonDocument } from '@/json/build-json-document'
import sample from '@/json/sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from '@/json/to-document-bundle'
import { Shell } from '@/shell/Shell'
import { WireframeErrorProvider } from '@/runtime/WireframeErrorProvider'

export function PlaygroundApp() {
  const [raw] = useState(sample)
  const documents = useMemo(() => {
    const built = buildJsonDocument(raw)
    if (!built.ok) return []
    return [jsonToWireframeDocumentBundle(built.document, 'playground')]
  }, [raw])

  const errors = useMemo(() => {
    const built = buildJsonDocument(raw)
    return built.ok ? [] : built.errors.map((e) => e.message)
  }, [raw])

  return (
    <WireframeErrorProvider initialErrors={errors}>
      <Shell documents={documents} />
    </WireframeErrorProvider>
  )
}
```

- [ ] **Step 3: Create `src/playground/main.tsx`**

Mirror `src/main.tsx` but render `<PlaygroundApp />` — no `App.tsx` import.

- [ ] **Step 4: Add npm script**

```json
"dev:playground": "vite --open /playground.html"
```

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev:playground`
Expected: Playground loads; Preview / Prototype / Graph work from `sample-wireframe.json`; no codegen required.

- [ ] **Step 6: Commit**

```bash
git add playground.html src/playground/main.tsx src/playground/PlaygroundApp.tsx package.json
git commit -m "feat: add JSON playground entry"
```

---

### Task 9: Documentation

**Files:**
- Modify: `docs/CONTEXT.md`
- Modify: `AGENTS.md` (docs table row only)

- [ ] **Step 1: Add JSON path section to `CONTEXT.md`**

Document:
- Bifurcated flows diagram (MDX codegen vs JSON browser)
- `src/json/` module map
- `playground.html` entry
- `WireframeDocumentBundle` as shared shell contract
- Reference `docs/JSON-COMPONENTS.md`

- [ ] **Step 2: Add docs table row in `AGENTS.md`**

```markdown
| JSON authoring | JSON-COMPONENTS | browser/SaaS tuple spec |
```

- [ ] **Step 3: Commit**

```bash
git add docs/CONTEXT.md AGENTS.md
git commit -m "docs: document JSON playground architecture"
```

---

## Self-review

**Spec coverage:**
| Requirement | Task |
|-------------|------|
| JSON tuple + colon tags | 3 |
| Same nav/graph rules as MDX | 2, 4, 6 |
| Browser-only JSON path | 4–6, 8 |
| MDX path unchanged | 7 (adapter only) |
| Preview + Prototype + Graph | 6–8 |
| `graph-link-id` for graph edges | 5 |
| `docs/JSON-COMPONENTS.md` spec | 3–4 |
| No `src/generated/` for JSON | 8 |
| Shared shell | 7 |

**Placeholder scan:** None.

**Type consistency:** `WireframeDocumentBundle`, `JsonDocumentBuilt`, `JsonScreenBuilt`, `classifyGotoLink`, `jsonToWireframeDocumentBundle` names consistent across tasks.

---

## Out of scope (follow-up plans)

- JSON Schema file for agent contract
- In-browser JSON editor UI
- Bidirectional MDX ↔ JSON conversion
- SaaS hosting / auth
- Moving `ClassifiedLink` out of `src/plugin/types.ts` (optional polish)
