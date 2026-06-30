# Playground MDX Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the split-pane playground with an MDX Monaco editor path at `/playground/mdx/...`, compiling editor text in-browser to the same Shell (Preview / Prototype / Graph + graph sub-modes) via a runtime MDX→`WireframeDocumentBundle` pipeline.

**Architecture:** Reuse `buildMdxDocument` + `extractFrontmatter` from `src/plugin/` (parse/validate only — no file codegen). New `src/mdx-playground/` mirrors `src/json/`: AST-walk `render-mdx-node.tsx` turns each screen’s JSX string into React (same wireframe primitives as codegen output). `PlaygroundApp` reads `source` from URL (`json` | `mdx`), switches editor language + compile pipeline, and preserves separate editor buffers per source. URL schema already supports `/playground/mdx/{docSlug}/{view}/...`.

**Tech Stack:** TypeScript 6, React 19, Vite 8, Vitest, `@monaco-editor/react`, `remark` + `remark-mdx` (moved to runtime deps), existing `Shell` + JSON playground chrome.

## Global Constraints

- Run `npm run build` + `npm run check` before claiming done; new module tests need `npm test`
- Do not hand-edit `src/generated/`; do not change MDX Vite codegen behavior (file writes in `src/plugin/generate.ts` stay Node-only)
- `src/mdx-playground/` is browser-only — no `src/generated/` imports; no new imports of `src/json/` from `src/mdx-playground/` (shared types/plugin OK)
- `src/json/` must not import `src/mdx-playground/`
- Wireframe primitives stay structural; playground chrome may use shadcn/Tailwind
- Editor content **not** in URL; doc slug stays `playground` for both sources
- Preview uses `preview.kind: 'screens'` (per-screen runtime components), not full-file MDX component — matches JSON playground
- Min diff; no bidirectional MDX↔JSON conversion, no localStorage, no JSON Schema (YAGNI)
- Update `docs/CONTEXT.md` when playground UX changes (Task 6)

**Prerequisite:** JSON playground editor ✓ ([`2026-06-30-playground-json-editor.md`](2026-06-30-playground-json-editor.md)), URL state with `PlaygroundSource` ✓ ([`2026-06-29-app-url-state.md`](2026-06-29-app-url-state.md))

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/playground/compile-playground-mdx.ts` | Pure `compilePlaygroundMdx(text)` → frontmatter title + `buildMdxDocument` |
| `src/playground/compile-playground-mdx.test.ts` | Vitest for MDX compile helper |
| `src/mdx-playground/mdx-element-props.ts` | `mdxAttributesToProps` — MDX JSX attrs → React props |
| `src/mdx-playground/mdx-element-props.test.ts` | Attr mapping tests |
| `src/mdx-playground/render-mdx-node.tsx` | `renderMdxJsxElement` — AST → wireframe primitives |
| `src/mdx-playground/render-mdx-node.test.tsx` | Render smoke tests |
| `src/mdx-playground/build-mdx-screen-component.tsx` | `buildMdxScreenComponent(screen)` → `ComponentType` |
| `src/mdx-playground/to-document-bundle.ts` | `mdxToWireframeDocumentBundle` |
| `src/mdx-playground/to-document-bundle.test.ts` | Bundle shape + playground route prefix |
| `src/playground/PlaygroundMonacoEditor.tsx` | Renamed/generalized editor (`language`, `label`) |
| `src/playground/PlaygroundSourceTabs.tsx` | JSON \| MDX tabs → URL navigate |
| `src/playground/use-playground-source.ts` | Read/write `source` from URL |
| `src/playground/PlaygroundApp.tsx` | Dual-source editor + compile + Shell |
| `src/playground/sample-wireframe.mdx` | Playground default MDX (copy of `wireframe.mdx` subset or `?raw` import) |
| `src/vite-env.d.ts` | `*.mdx?raw` module declaration |
| `package.json` | Move `remark`, `remark-mdx`, `unist-util-visit` to `dependencies` |
| `docs/CONTEXT.md` | Document MDX playground path |

---

### Task 1: Runtime remark dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `remark`, `remark-mdx`, `unist-util-visit` in `dependencies` (browser bundle imports `src/plugin/` which uses them)

- [ ] **Step 1: Move packages to dependencies**

In `package.json`, move these from `devDependencies` to `dependencies` (keep versions):

```json
"remark": "^15.0.1",
"remark-mdx": "^3.1.1",
"unist-util-visit": "^5.1.0"
```

(`remark-frontmatter` is already in `dependencies`.)

- [ ] **Step 2: Reinstall**

Run: `npm install`

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: success (no import errors)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: move remark packages to runtime dependencies for MDX playground"
```

---

### Task 2: MDX compile helper

**Files:**
- Create: `src/playground/compile-playground-mdx.ts`
- Create: `src/playground/compile-playground-mdx.test.ts`

**Interfaces:**
- Consumes: `buildMdxDocument` from `@/plugin/build-mdx-document`, `extractFrontmatter` from `@/plugin/extract-frontmatter`, `MdxDocument` from `@/plugin/types`
- Produces:
  ```ts
  export type MdxPlaygroundBuilt = {
    title: string
    document: MdxDocument
  }

  export type CompilePlaygroundMdxResult =
    | { ok: true; built: MdxPlaygroundBuilt }
    | { ok: false; errors: readonly string[] }

  export function compilePlaygroundMdx(
    text: string,
    filename?: string,
  ): CompilePlaygroundMdxResult
  ```

- [ ] **Step 1: Write the failing test**

Create `src/playground/compile-playground-mdx.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { compilePlaygroundMdx } from './compile-playground-mdx'

const VALID = `---
title: Demo App
---

<Screen id="home" title="Home">
  <Text h1>Hello</Text>
  <Link goto="login">Login</Link>
</Screen>

<Screen id="login" title="Login">
  <Text h1>Sign in</Text>
</Screen>
`

describe('compilePlaygroundMdx', () => {
  it('accepts valid wireframe MDX with frontmatter title', () => {
    const result = compilePlaygroundMdx(VALID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.built.title).toBe('Demo App')
    expect(result.built.document.screens).toHaveLength(2)
    expect(result.built.document.screens[0]?.id).toBe('home')
  })

  it('rejects MDX with validation errors', () => {
    const result = compilePlaygroundMdx(`
<Screen id="home" title="Home">
  <Link goto="missing">Go</Link>
</Screen>
`)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects unparseable MDX', () => {
    const result = compilePlaygroundMdx('<Screen id="home" title="Home"')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]).toMatch(/parse/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/playground/compile-playground-mdx.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/playground/compile-playground-mdx.ts`**

```ts
import { buildMdxDocument } from '@/plugin/build-mdx-document'
import { extractFrontmatter } from '@/plugin/extract-frontmatter'
import type { MdxDocument } from '@/plugin/types'

export type MdxPlaygroundBuilt = {
  title: string
  document: MdxDocument
}

export type CompilePlaygroundMdxResult =
  | { ok: true; built: MdxPlaygroundBuilt }
  | { ok: false; errors: readonly string[] }

export function compilePlaygroundMdx(
  text: string,
  filename = 'playground.mdx',
): CompilePlaygroundMdxResult {
  const { title } = extractFrontmatter(text, filename)
  const built = buildMdxDocument(text)
  if (!built.ok) {
    return { ok: false, errors: built.errors.map((entry) => entry.message) }
  }
  return { ok: true, built: { title, document: built.document } }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/playground/compile-playground-mdx.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/playground/compile-playground-mdx.ts src/playground/compile-playground-mdx.test.ts
git commit -m "feat: add compile helper for playground MDX editor"
```

---

### Task 3: MDX AST renderer

**Files:**
- Create: `src/mdx-playground/mdx-element-props.ts`
- Create: `src/mdx-playground/mdx-element-props.test.ts`
- Create: `src/mdx-playground/render-mdx-node.tsx`
- Create: `src/mdx-playground/render-mdx-node.test.tsx`
- Create: `src/mdx-playground/build-mdx-screen-component.tsx`

**Interfaces:**
- Consumes: `mdxProcessor`, `isNamedNode` from `@/plugin/mdx-ast`; `injectGraphLinkIdsFromClassification` from `@/plugin/inject-graph-link-ids`; `MdxScreen` from `@/plugin/types`
- Produces:
  ```ts
  // mdx-element-props.ts
  import type { MdxJsxAttribute } from 'mdast-util-mdx-jsx'
  export function mdxAttributesToProps(attributes: readonly MdxJsxAttribute[]): Record<string, unknown>

  // render-mdx-node.tsx
  import type { MdxJsxElement } from '@/plugin/mdx-ast'
  export function renderMdxJsxElement(node: MdxJsxElement): React.ReactNode

  // build-mdx-screen-component.tsx
  import type { ComponentType } from 'react'
  import type { MdxScreen } from '@/plugin/types'
  export function buildMdxScreenComponent(screen: MdxScreen): ComponentType
  ```

- [ ] **Step 1: Write failing attr test**

Create `src/mdx-playground/mdx-element-props.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mdxAttributesToProps } from './mdx-element-props'

describe('mdxAttributesToProps', () => {
  it('maps string and boolean MDX attributes', () => {
    const props = mdxAttributesToProps([
      { type: 'mdxJsxAttribute', name: 'goto', value: 'login' },
      { type: 'mdxJsxAttribute', name: 'primary-btn', value: null },
      { type: 'mdxJsxAttribute', name: 'graph-link-id', value: 'home:0' },
    ])
    expect(props).toEqual({
      goto: 'login',
      'primary-btn': true,
      'graph-link-id': 'home:0',
    })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/mdx-playground/mdx-element-props.test.ts`

- [ ] **Step 3: Implement `src/mdx-playground/mdx-element-props.ts`**

```ts
import type { MdxJsxAttribute } from 'mdast-util-mdx-jsx'

export function mdxAttributesToProps(
  attributes: readonly MdxJsxAttribute[],
): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  for (const attr of attributes) {
    if (attr.type !== 'mdxJsxAttribute' || !attr.name) continue

    if (attr.value === null || attr.value === undefined) {
      props[attr.name] = true
      continue
    }

    if (typeof attr.value === 'string') {
      props[attr.name] = attr.value
      continue
    }

    if (attr.value.type === 'mdxJsxAttributeValueExpression') {
      const expr = attr.value.value.trim()
      const stringMatch = expr.match(/^(['"])(.*)\1$/)
      if (stringMatch) {
        props[attr.name] = stringMatch[2]
      }
    }
  }

  return props
}
```

- [ ] **Step 4: Run attr test — expect PASS**

- [ ] **Step 5: Write failing render test**

Create `src/mdx-playground/render-mdx-node.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mdxProcessor } from '@/plugin/mdx-ast'
import type { MdxJsxElement } from '@/plugin/mdx-ast'
import { renderMdxJsxElement } from './render-mdx-node'

function parseScreenRoot(jsx: string): MdxJsxElement {
  const tree = mdxProcessor.parse(jsx)
  const node = tree.children[0]
  if (!node || (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement')) {
    throw new Error('expected MDX screen root')
  }
  return node
}

describe('renderMdxJsxElement', () => {
  it('renders Text and Link children inside Screen', () => {
    const root = parseScreenRoot(`<Screen id="home" title="Home">
  <Text h1>Hello</Text>
  <Link goto="login" primary-btn>Login</Link>
</Screen>`)

    render(<>{renderMdxJsxElement(root)}</>)
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Login' })).toBeTruthy()
  })
})
```

- [ ] **Step 6: Install test renderer if missing**

If `@testing-library/react` is not installed:

```bash
npm install -D @testing-library/react @testing-library/dom jsdom
```

Add to `vitest.config.ts` only if needed — prefer running render test without jsdom by testing `renderMdxJsxElement` output shape instead if deps unavailable:

**Fallback test (no testing-library):** skip jsdom test; test `buildMdxScreenComponent` returns a function in Task 4 bundle test. If using fallback, replace Step 5–8 with a unit test that `renderMdxJsxElement` on a `Text` node returns a React element with `type` matching Text.

Minimal fallback:

```ts
import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { mdxProcessor } from '@/plugin/mdx-ast'
import { renderMdxJsxElement } from './render-mdx-node'

describe('renderMdxJsxElement', () => {
  it('returns a React element for Text', () => {
    const tree = mdxProcessor.parse('<Text h1>Hello</Text>')
    const node = tree.children[0]
    if (!node || (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement')) {
      throw new Error('expected MDX node')
    }
    const element = renderMdxJsxElement(node)
    expect(isValidElement(element)).toBe(true)
  })
})
```

Use fallback if `@testing-library/react` not in project — check first.

- [ ] **Step 7: Implement `src/mdx-playground/render-mdx-node.tsx`**

```tsx
import type { Root, Text as MdastText } from 'mdast'
import type { MdxJsxElement } from '@/plugin/mdx-ast'
import {
  Container,
  Divider,
  Icon,
  Image,
  Input,
  Link,
  Modal,
  Screen,
  Text,
  TopBar,
} from '@/components/wireframe'
import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { mdxAttributesToProps } from './mdx-element-props'

const WIREFRAME_COMPONENTS = {
  Screen,
  Text,
  Link,
  Input,
  Container,
  Image,
  Icon,
  Modal,
  TopBar,
  Divider,
} as const

type WireframeComponentName = keyof typeof WIREFRAME_COMPONENTS

function isWireframeComponent(name: string | null | undefined): name is WireframeComponentName {
  return name !== null && name !== undefined && name in WIREFRAME_COMPONENTS
}

function renderMdxChildren(children: MdxJsxElement['children']): ReactNode {
  return children.map((child, index) => {
    if (child.type === 'text') {
      const text = (child as MdastText).value
      return text ? <Fragment key={`t-${index}`}>{text}</Fragment> : null
    }
    if (child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement') {
      return <Fragment key={`n-${index}`}>{renderMdxJsxElement(child)}</Fragment>
    }
    return null
  })
}

export function renderMdxJsxElement(node: MdxJsxElement): ReactNode {
  const name = node.name
  if (!isWireframeComponent(name)) {
    return null
  }

  const Component = WIREFRAME_COMPONENTS[name]
  const props = mdxAttributesToProps(node.attributes)

  return (
    <Component {...(props as Record<string, never>)}>{renderMdxChildren(node.children)}</Component>
  )
}

export function renderMdxScreenJsx(jsx: string): ReactNode {
  const tree = mdxProcessor.parse(jsx) as Root
  const root = tree.children[0]
  if (!root || (root.type !== 'mdxJsxFlowElement' && root.type !== 'mdxJsxTextElement')) {
    return null
  }
  return renderMdxJsxElement(root)
}
```

Add missing import at top of `render-mdx-node.tsx`:

```ts
import { mdxProcessor } from '@/plugin/mdx-ast'
```

- [ ] **Step 8: Implement `src/mdx-playground/build-mdx-screen-component.tsx`**

```tsx
import type { ComponentType } from 'react'
import { injectGraphLinkIdsFromClassification } from '@/plugin/inject-graph-link-ids'
import type { MdxScreen } from '@/plugin/types'
import { renderMdxScreenJsx } from './render-mdx-node'

export function buildMdxScreenComponent(screen: MdxScreen): ComponentType {
  const jsx = injectGraphLinkIdsFromClassification(screen.jsx, screen.links)

  return function MdxPlaygroundScreen() {
    return <>{renderMdxScreenJsx(jsx)}</>
  }
}
```

- [ ] **Step 9: Run tests**

Run: `npm test -- src/mdx-playground/`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/mdx-playground/
git commit -m "feat: add browser MDX AST renderer for playground screens"
```

---

### Task 4: MDX document bundle adapter

**Files:**
- Create: `src/mdx-playground/to-document-bundle.ts`
- Create: `src/mdx-playground/to-document-bundle.test.ts`
- Modify: `src/lib/app-url.test.ts`

**Interfaces:**
- Consumes: `MdxPlaygroundBuilt`, `buildMdxScreenComponent`, `extractNavigationGraphFromScreens` from `@/plugin/extract-navigation-graph`
- Produces:
  ```ts
  import type { MdxPlaygroundBuilt } from '@/playground/compile-playground-mdx'

  export function mdxToWireframeDocumentBundle(
    built: MdxPlaygroundBuilt,
    slug?: string,
    options?: { playground?: boolean },
  ): WireframeDocumentBundle
  ```

- [ ] **Step 1: Write failing bundle test**

Create `src/mdx-playground/to-document-bundle.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { compilePlaygroundMdx } from '@/playground/compile-playground-mdx'
import { mdxToWireframeDocumentBundle } from './to-document-bundle'

const SAMPLE = `<Screen id="home" title="Home">
  <Link goto="login">Login</Link>
</Screen>
<Screen id="login" title="Login" />`

describe('mdxToWireframeDocumentBundle', () => {
  it('builds playground bundle with mdx source and route prefix', () => {
    const compiled = compilePlaygroundMdx(SAMPLE)
    expect(compiled.ok).toBe(true)
    if (!compiled.ok) return

    const bundle = mdxToWireframeDocumentBundle(compiled.built, 'playground', { playground: true })
    expect(bundle.source).toBe('mdx')
    expect(bundle.slug).toBe('playground')
    expect(bundle.routePrefix).toBe('/playground/mdx/playground')
    expect(bundle.routes).toHaveLength(2)
    expect(bundle.routes[0]?.path).toBe('/playground/mdx/playground/home')
    expect(bundle.preview.kind).toBe('screens')
    expect(bundle.navigationGraph.edges).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement `src/mdx-playground/to-document-bundle.ts`**

```ts
import { MDX_APP_PREFIX, PLAYGROUND_APP_PATH, screenRoutePath } from '@/lib/app-routes'
import { extractNavigationGraphFromScreens } from '@/plugin/extract-navigation-graph'
import type { MdxPlaygroundBuilt } from '@/playground/compile-playground-mdx'
import type { WireframeDocumentBundle } from '@/types/wireframe-document'
import { buildMdxScreenComponent } from './build-mdx-screen-component'

export function mdxToWireframeDocumentBundle(
  built: MdxPlaygroundBuilt,
  slug = 'playground',
  options: { playground?: boolean } = {},
): WireframeDocumentBundle {
  const routePrefix = options.playground
    ? `${PLAYGROUND_APP_PATH}/mdx/${slug}`
    : `${MDX_APP_PREFIX}/${slug}`

  const screens = built.document.screens
  const components = new Map(
    screens.map((screen) => [screen.id, buildMdxScreenComponent(screen)] as const),
  )

  const routes = screens.map((screen) => {
    const component = components.get(screen.id)
    if (!component) {
      throw new Error(`Missing component for screen "${screen.id}"`)
    }
    return {
      id: screen.id,
      path: screenRoutePath(routePrefix, screen.id),
      component,
      ...(screen.modalIds.length > 0 ? { modalIds: screen.modalIds } : {}),
    }
  })

  const navigationGraph = extractNavigationGraphFromScreens(
    screens.map((screen) => ({
      id: screen.id,
      title: screen.title,
      order: screen.order,
      jsx: '',
      modalIds: screen.modalIds,
      links: screen.links,
      note: screen.note,
    })),
  )

  return {
    slug,
    title: built.title,
    source: 'mdx',
    routes,
    navigationGraph,
    routePrefix,
    preview: {
      kind: 'screens',
      screens: screens.map((screen) => {
        const component = components.get(screen.id)
        if (!component) {
          throw new Error(`Missing component for screen "${screen.id}"`)
        }
        return {
          id: screen.id,
          title: screen.title,
          component,
        }
      }),
    },
  }
}
```

- [ ] **Step 4: Add app-url test for MDX playground**

In `src/lib/app-url.test.ts`, add:

```ts
  it('round-trips playground MDX preview URL', () => {
    const state = parseAppUrl({ appPath: '/playground/mdx/playground/preview' })
    expect(state).toEqual({
      app: 'playground',
      source: 'mdx',
      docSlug: 'playground',
      view: 'preview',
    })
  })
```

And in `screenPathForDoc` describe block:

```ts
  it('builds playground MDX screen path', () => {
    expect(screenPathForDoc('playground', 'mdx', 'playground', 'home')).toBe(
      '/playground/mdx/playground/home',
    )
  })
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/mdx-playground/to-document-bundle.test.ts src/lib/app-url.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/mdx-playground/to-document-bundle.ts src/mdx-playground/to-document-bundle.test.ts src/lib/app-url.test.ts
git commit -m "feat: add MDX playground WireframeDocumentBundle adapter"
```

---

### Task 5: Playground UI — source tabs + dual editor

**Files:**
- Create: `src/playground/PlaygroundMonacoEditor.tsx` (rename from `PlaygroundJsonEditor.tsx`)
- Delete: `src/playground/PlaygroundJsonEditor.tsx`
- Create: `src/playground/PlaygroundSourceTabs.tsx`
- Create: `src/playground/use-playground-source.ts`
- Modify: `src/playground/PlaygroundApp.tsx`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Produces:
  ```ts
  // PlaygroundMonacoEditor.tsx
  export type PlaygroundMonacoEditorProps = {
    label: string
    language: string
    value: string
    onChange: (next: string) => void
    headerExtra?: React.ReactNode
  }

  // use-playground-source.ts
  import type { PlaygroundSource } from '@/lib/app-routes'
  export function usePlaygroundSource(): {
    source: PlaygroundSource
    setSource: (next: PlaygroundSource) => void
  }
  ```

- [ ] **Step 1: Add raw MDX module type**

In `src/vite-env.d.ts`:

```ts
declare module '*.mdx?raw' {
  const content: string
  export default content
}
```

- [ ] **Step 2: Create `use-playground-source.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import { toAppPath, toBrowserPath } from '@/lib/app-base-path'
import type { PlaygroundSource } from '@/lib/app-routes'
import { buildAppUrl, parseAppUrl } from '@/lib/app-url'

function readSource(): PlaygroundSource {
  const parsed = parseAppUrl({
    appPath: toAppPath(window.location.pathname),
    search: window.location.search,
  })
  return parsed?.app === 'playground' && parsed.source ? parsed.source : 'json'
}

export function usePlaygroundSource(): {
  source: PlaygroundSource
  setSource: (next: PlaygroundSource) => void
} {
  const [source, setSourceState] = useState<PlaygroundSource>(readSource)

  useEffect(() => {
    const onPopState = () => setSourceState(readSource())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setSource = useCallback((next: PlaygroundSource) => {
    const current = parseAppUrl({
      appPath: toAppPath(window.location.pathname),
      search: window.location.search,
    })
    if (!current || current.app !== 'playground') {
      const { appPath, search } = buildAppUrl({
        app: 'playground',
        source: next,
        docSlug: 'playground',
        view: 'preview',
      })
      window.history.pushState({}, '', `${toBrowserPath(appPath)}${search}`)
      setSourceState(next)
      return
    }

    const { appPath, search } = buildAppUrl({ ...current, source: next })
    window.history.pushState({}, '', `${toBrowserPath(appPath)}${search}`)
    setSourceState(next)
  }, [])

  return { source, setSource }
}
```

- [ ] **Step 3: Create `PlaygroundSourceTabs.tsx`**

```tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlaygroundSource } from '@/lib/app-routes'

export type PlaygroundSourceTabsProps = {
  source: PlaygroundSource
  onSourceChange: (next: PlaygroundSource) => void
}

export function PlaygroundSourceTabs({ source, onSourceChange }: PlaygroundSourceTabsProps) {
  return (
    <Tabs value={source} onValueChange={(value) => onSourceChange(value as PlaygroundSource)}>
      <TabsList className="h-7">
        <TabsTrigger value="json" className="px-2 text-xs">
          JSON
        </TabsTrigger>
        <TabsTrigger value="mdx" className="px-2 text-xs">
          MDX
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

- [ ] **Step 4: Rename editor to `PlaygroundMonacoEditor.tsx`**

Replace `PlaygroundJsonEditor.tsx` with:

```tsx
import type { ReactNode } from 'react'
import Editor from '@monaco-editor/react'
import './monaco-setup'

export type PlaygroundMonacoEditorProps = {
  label: string
  language: string
  value: string
  onChange: (next: string) => void
  headerExtra?: ReactNode
}

export function PlaygroundMonacoEditor({
  label,
  language,
  value,
  onChange,
  headerExtra,
}: PlaygroundMonacoEditorProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {headerExtra}
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs"
          value={value}
          onChange={(next) => onChange(next ?? '')}
          options={{
            automaticLayout: true,
            fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
          }}
          loading={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}
        />
      </div>
    </div>
  )
}
```

Delete `src/playground/PlaygroundJsonEditor.tsx`.

- [ ] **Step 5: Replace `PlaygroundApp.tsx`**

```tsx
import { useMemo, useState } from 'react'
import sampleJson from '@/json/sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from '@/json/to-document-bundle'
import { mdxToWireframeDocumentBundle } from '@/mdx-playground/to-document-bundle'
import sampleMdx from '@/content/wireframe.mdx?raw'
import { WireframeErrorProvider } from '@/runtime/WireframeErrorProvider'
import { Shell } from '@/shell/Shell'
import { compilePlaygroundJson } from './compile-playground-json'
import { compilePlaygroundMdx } from './compile-playground-mdx'
import { PlaygroundMonacoEditor } from './PlaygroundMonacoEditor'
import { PlaygroundSourceTabs } from './PlaygroundSourceTabs'
import { PlaygroundSplitLayout } from './PlaygroundSplitLayout'
import { useDebouncedValue } from './use-debounced-value'
import { usePlaygroundSource } from './use-playground-source'

const INITIAL_JSON_TEXT = JSON.stringify(sampleJson, null, 2)
const COMPILE_DEBOUNCE_MS = 300

export function PlaygroundApp() {
  const { source, setSource } = usePlaygroundSource()
  const [jsonText, setJsonText] = useState(INITIAL_JSON_TEXT)
  const [mdxText, setMdxText] = useState(sampleMdx)

  const editorText = source === 'json' ? jsonText : mdxText
  const setEditorText = source === 'json' ? setJsonText : setMdxText

  const debouncedText = useDebouncedValue(editorText, COMPILE_DEBOUNCE_MS)

  const documents = useMemo(() => {
    if (source === 'json') {
      const compiled = compilePlaygroundJson(debouncedText)
      if (!compiled.ok) return []
      return [jsonToWireframeDocumentBundle(compiled.document, 'playground', { playground: true })]
    }
    const compiled = compilePlaygroundMdx(debouncedText)
    if (!compiled.ok) return []
    return [mdxToWireframeDocumentBundle(compiled.built, 'playground', { playground: true })]
  }, [source, debouncedText])

  const errors = useMemo(() => {
    const compiled =
      source === 'json' ? compilePlaygroundJson(debouncedText) : compilePlaygroundMdx(debouncedText)
    return compiled.ok ? [] : [...compiled.errors]
  }, [source, debouncedText])

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
          />
        </WireframeErrorProvider>
      }
    />
  )
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc -b`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/playground/ src/vite-env.d.ts
git commit -m "feat: add MDX source tabs and dual playground editor"
```

---

### Task 6: Docs and full verification

**Files:**
- Modify: `docs/CONTEXT.md`

- [ ] **Step 1: Update CONTEXT**

In **Status** table, change JSON playground row to:

```markdown
| JSON / MDX playground (browser compile, Monaco split editor) | Done |
```

In **JSON flow** section, rename heading to **JSON / MDX playground flow** and add after existing playground UI line:

```markdown
MDX path: `compilePlaygroundMdx` → `mdxToWireframeDocumentBundle` with `routePrefix` `/playground/mdx/{slug}`. MDX editor loads `wireframe.mdx` sample via `?raw` import. Source toggle (JSON \| MDX) syncs to URL `source` segment.
```

In **Repo map**, add:

```markdown
src/mdx-playground/         # browser MDX renderer + bundle adapter
```

- [ ] **Step 2: Manual verify**

Run: `npm run dev`

| URL | Expected |
|-----|----------|
| `/playground/json/playground/preview` | JSON editor, Workforge JSON preview |
| `/playground/mdx/playground/preview` | MDX editor (markdown), wireframe.mdx preview |
| Switch JSON ↔ MDX tabs | URL `source` changes; separate editor buffers preserved |
| Prototype + Graph on MDX | Same as JSON; routes under `/playground/mdx/playground/...` |
| Invalid MDX | Error overlay; right pane empty |

- [ ] **Step 3: Full checks**

```bash
npm test
npm run build
npm run check
```

Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add docs/CONTEXT.md
git commit -m "docs: document MDX playground editor path"
```

---

## Out of scope (follow-up plans)

- Monaco MDX language service / component autocomplete
- Bidirectional MDX ↔ JSON conversion
- Editor draft `localStorage`
- Multiple playground documents / file picker
- Full-file MDX preview (`preview.kind: 'mdx'`) in playground

---

## Self-review

### Spec coverage

| Requirement | Task |
|-------------|------|
| MDX Monaco editor left | Task 5 |
| `/playground/mdx/...` URL | Task 4 (tests), Task 5 (Shell `appDefaults.source`) |
| Same Shell views right | Task 5–6 |
| Browser compile, no codegen files | Tasks 2–4 |
| Source toggle JSON/MDX | Task 5 |
| Separate editor buffers | Task 5 |
| `npm run build` + `npm run check` | Task 6 |
| CONTEXT update | Task 6 |

### Placeholder scan

No TBD/TODO/similar-to. All code blocks complete.

### Type consistency

- `CompilePlaygroundMdxResult.built` → `mdxToWireframeDocumentBundle(built, ...)`
- `PlaygroundSource` from `@/lib/app-routes` used in hook, tabs, Shell
- `routePrefix` `/playground/mdx/{slug}` matches `buildAppUrl` playground branch
- `preview.kind: 'screens'` for MDX matches JSON playground
