# Graph View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third shell tab — Graph View — that visualizes screen-to-screen navigation from MDX wireframes in Screen View (default) and Compact View sub-modes.

**Architecture:** Extend the Vite codegen plugin to extract a per-document `navigationGraph` (nodes + edges) from the same MDX AST used for screen extraction. Shell imports the graph alongside existing `routes`. `GraphView` renders with `@xyflow/react`, laying out nodes via `@dagrejs/dagre`. Compact View uses card nodes with boundary-anchored edges; Screen View renders generated screen components inside custom nodes and anchors edges to `data-graph-link-id` handles on `Link` primitives when `WireframeView` is `graph`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest, `@xyflow/react`, `@dagrejs/dagre`, existing wireframe primitives + shadcn shell

**Spec:** [`docs/GRAPH_VIEW.md`](../../GRAPH_VIEW.md)

## Global Constraints

- Graph View is a third top-level shell tab labeled **Graph View**
- Active document from document picker applies; switching documents switches the graph
- Canvas uses full width and height below the shell header (not `max-w-3xl`)
- Codegen errors on active document: same error treatment as other views; graph not shown
- Nodes = screens only; modals are not separate top-level nodes
- Edges = declared screen→screen navigations; skip `_close`, `_back`, modal-open targets, and `disabled` links
- Links inside modals that target another screen **do** produce screen→screen edges (source = containing screen)
- Multiple links to the same destination = multiple edges
- Entry screen (first `<Screen>`) visually distinct
- Screen View is default sub-mode; Compact View is toggle alternative
- Clicking a node selects it; does not navigate to Preview/Prototype
- Mode switch recalculates layout; selected node stays selected and centered
- Pan, zoom, fit-to-screen, minimap required
- Node wireframes use structural wireframe style; shell chrome may use shadcn/Tailwind
- No brand colors, shadows, or typography systems on graph chrome
- Compact card shows title (or id), optional `note`, incoming/outgoing counts
- Run `npm run build` + `npm run check` before claiming done; plugin changes need Vitest tests
- Do not hand-edit `src/generated/`; min diff; no unrelated refactors

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/plugin/extract-navigation-graph.ts` | Parse MDX AST → `NavigationGraph` nodes/edges |
| `src/plugin/extract-navigation-graph.test.ts` | Plugin tests for graph extraction |
| `src/plugin/inject-graph-link-ids.ts` | Inject `graph-link-id` on `<Link>` in generated screen JSX |
| `src/plugin/inject-graph-link-ids.test.ts` | Tests for link-id injection |
| `src/plugin/types.ts` | Add `NavigationGraph`, `NavigationGraphNode`, `NavigationEdge` types |
| `src/plugin/generate.ts` | Emit `navigation-graph.generated.ts`; call link-id injection in `buildScreensFile` |
| `src/plugin/generate-documents.ts` | Add `navigationGraph` to `ContentDocumentEntry` |
| `src/plugin/run-full-codegen.ts` | Pass graph extraction into document generation |
| `src/plugin/wireframe-plugin.ts` | HMR invalidation for new generated files |
| `src/runtime/WireframeViewContext.tsx` | Add `'graph'` view; noop navigation in graph mode |
| `src/components/wireframe/Link.tsx` | Render `data-graph-link-id` handle in graph view |
| `src/components/wireframe/Screen.tsx` | Graph view styling (no preview border card) |
| `src/shell/graph/layout-navigation-graph.ts` | Dagre layout → React Flow nodes/edges |
| `src/shell/graph/layout-navigation-graph.test.ts` | Layout unit tests |
| `src/shell/graph/CompactGraphNode.tsx` | Compact mode custom node |
| `src/shell/graph/ScreenGraphNode.tsx` | Screen mode custom node (scaled wireframe) |
| `src/shell/graph/useGraphLinkHandles.ts` | Measure link handle positions inside screen nodes |
| `src/shell/graph/build-react-flow-graph.ts` | Map `NavigationGraph` + mode → RF graph |
| `src/shell/GraphView.tsx` | Graph canvas, toolbar, mode toggle, selection |
| `src/shell/Shell.tsx` | Third tab; full-width main for graph |
| `docs/CONTEXT.md` | Status row for Graph View |

---

### Task 1: Navigation graph extraction

**Files:**
- Modify: `src/plugin/types.ts`
- Create: `src/plugin/extract-navigation-graph.ts`
- Create: `src/plugin/extract-navigation-graph.test.ts`

**Interfaces:**
- Consumes: `ExtractedScreen[]` from `extractScreens`, MDX source string
- Produces:
  ```ts
  export type NavigationEdge = {
    id: string
    fromScreenId: string
    toScreenId: string
    linkId: string
    label?: string
  }

  export type NavigationGraphNode = {
    id: string
    title: string
    note?: string
    order: number
    isEntry: boolean
  }

  export type NavigationGraph = {
    nodes: readonly NavigationGraphNode[]
    edges: readonly NavigationEdge[]
  }

  export function extractNavigationGraph(
    source: string,
    screens: readonly ExtractedScreen[],
  ): NavigationGraph
  ```

- [ ] **Step 1: Add types to `src/plugin/types.ts`**

Append after `ExtractedScreen`:

```ts
export type NavigationEdge = {
  id: string
  fromScreenId: string
  toScreenId: string
  linkId: string
  label?: string
}

export type NavigationGraphNode = {
  id: string
  title: string
  note?: string
  order: number
  isEntry: boolean
}

export type NavigationGraph = {
  nodes: readonly NavigationGraphNode[]
  edges: readonly NavigationEdge[]
}
```

- [ ] **Step 2: Write failing tests**

Create `src/plugin/extract-navigation-graph.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { extractScreens } from './extract-screens'
import { extractNavigationGraph } from './extract-navigation-graph'

const TWO_SCREEN = `
<Screen id="home" title="Home" note="Entry point">
  <Link goto="login">Login</Link>
  <Link goto="login" disabled>Disabled dup</Link>
</Screen>
<Screen id="login" title="Login">
  <Link goto="home">Back</Link>
</Screen>
`

describe('extractNavigationGraph', () => {
  it('builds nodes from screens with entry flag and note', () => {
    const extracted = extractScreens(TWO_SCREEN)
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const graph = extractNavigationGraph(TWO_SCREEN, extracted.screens)
    expect(graph.nodes).toEqual([
      {
        id: 'home',
        title: 'Home',
        note: 'Entry point',
        order: 0,
        isEntry: true,
      },
      {
        id: 'login',
        title: 'Login',
        order: 1,
        isEntry: false,
      },
    ])
  })

  it('creates screen-to-screen edges and skips disabled, reserved, and modal-open links', () => {
    const source = `
<Screen id="home" title="Home">
  <Link goto="confirm">Open</Link>
  <Link goto="_back">Back</Link>
  <Modal id="confirm">
    <Link goto="login">Continue</Link>
    <Link goto="_close">Cancel</Link>
  </Modal>
</Screen>
<Screen id="login" title="Login">
  <Link goto="home">Home</Link>
</Screen>
`
    const extracted = extractScreens(source)
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const graph = extractNavigationGraph(source, extracted.screens)
    expect(graph.edges).toEqual([
      {
        id: 'home:0->login',
        fromScreenId: 'home',
        toScreenId: 'login',
        linkId: 'home:0',
        label: 'Continue',
      },
      {
        id: 'login:0->home',
        fromScreenId: 'login',
        toScreenId: 'home',
        linkId: 'login:0',
        label: 'Home',
      },
    ])
  })

  it('keeps parallel edges to the same destination', () => {
    const source = `
<Screen id="a" title="A">
  <Link goto="b">One</Link>
  <Link goto="b">Two</Link>
</Screen>
<Screen id="b" title="B"></Screen>
`
    const extracted = extractScreens(source)
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const graph = extractNavigationGraph(source, extracted.screens)
    expect(graph.edges).toHaveLength(2)
    expect(graph.edges[0]?.toScreenId).toBe('b')
    expect(graph.edges[1]?.toScreenId).toBe('b')
    expect(graph.edges[0]?.linkId).not.toBe(graph.edges[1]?.linkId)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/plugin/extract-navigation-graph.test.ts`
Expected: FAIL — module `extract-navigation-graph` not found

- [ ] **Step 4: Implement `extract-navigation-graph.ts`**

Create `src/plugin/extract-navigation-graph.ts`:

```ts
import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'
import type {
  ExtractedScreen,
  NavigationEdge,
  NavigationGraph,
  NavigationGraphNode,
} from './types'
import { collectModalIdsByScreen } from './validate-gotos'

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

const RESERVED_GOTO = new Set(['_close', '_back'])
const processor = remark().use(remarkFrontmatter).use(remarkMdx)

function isNamedNode(name: string) {
  return (node: { type?: string; name?: string | null }): node is MdxJsxElement =>
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === name
}

const isScreenNode = isNamedNode('Screen')
const isLinkNode = isNamedNode('Link')

function getStringAttr(node: MdxJsxElement, name: string): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  return undefined
}

function hasBooleanAttr(node: MdxJsxElement, name: string): boolean {
  return node.attributes.some((a) => a.type === 'mdxJsxAttribute' && a.name === name)
}

function getGotoValue(node: MdxJsxElement): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'goto')
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  if (attr.value.type === 'mdxJsxAttributeValueExpression') {
    const expr = attr.value.value.trim()
    const stringMatch = expr.match(/^(['"])(.*)\1$/)
    if (stringMatch) return stringMatch[2]
  }
  return undefined
}

function getLinkLabel(node: MdxJsxElement): string | undefined {
  for (const child of node.children) {
    if (child.type === 'text' && child.value.trim()) {
      return child.value.trim()
    }
  }
  return undefined
}

function parseTree(source: string): Root {
  return processor.parse(source) as Root
}

function buildNodes(
  tree: Root,
  screens: readonly ExtractedScreen[],
): readonly NavigationGraphNode[] {
  const notesByScreenId = new Map<string, string>()

  visit(tree, (node) => {
    if (!isScreenNode(node)) return
    const id = getStringAttr(node, 'id')
    const note = getStringAttr(node, 'note')
    if (id && note) notesByScreenId.set(id, note)
  })

  return screens.map((screen, index) => ({
    id: screen.id,
    title: screen.title,
    note: notesByScreenId.get(screen.id),
    order: screen.order,
    isEntry: index === 0,
  }))
}

export function extractNavigationGraph(
  source: string,
  screens: readonly ExtractedScreen[],
): NavigationGraph {
  const tree = parseTree(source)
  const screenIds = new Set(screens.map((s) => s.id))
  const { modalIdsByScreen } = collectModalIdsByScreen(tree, screenIds)

  const edges: NavigationEdge[] = []
  let activeScreenId: string | undefined
  let linkIndex = 0

  visit(tree, (node) => {
    if (isScreenNode(node)) {
      activeScreenId = getStringAttr(node, 'id')
      linkIndex = 0
      return
    }

    if (!isLinkNode(node) || !activeScreenId) return

    const goto = getGotoValue(node)
    if (!goto || RESERVED_GOTO.has(goto)) return
    if (hasBooleanAttr(node, 'disabled')) return

    const screenModalIds = modalIdsByScreen.get(activeScreenId) ?? new Set<string>()
    if (screenModalIds.has(goto)) return
    if (!screenIds.has(goto)) return

    const linkId = `${activeScreenId}:${linkIndex}`
    linkIndex += 1

    edges.push({
      id: `${linkId}->${goto}`,
      fromScreenId: activeScreenId,
      toScreenId: goto,
      linkId,
      label: getLinkLabel(node),
    })
  })

  return {
    nodes: buildNodes(tree, screens),
    edges,
  }
}
```

Export `collectModalIdsByScreen` from `validate-gotos.ts` (change from private function to exported).

In `src/plugin/validate-gotos.ts`, change:

```ts
function collectModalIdsByScreen(
```

to:

```ts
export function collectModalIdsByScreen(
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/plugin/extract-navigation-graph.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/plugin/types.ts src/plugin/validate-gotos.ts src/plugin/extract-navigation-graph.ts src/plugin/extract-navigation-graph.test.ts
git commit -m "feat: extract navigation graph from MDX wireframes"
```

---

### Task 2: Codegen navigation-graph.generated.ts

**Files:**
- Modify: `src/plugin/generate.ts`
- Modify: `src/plugin/generate-documents.ts`
- Modify: `src/plugin/run-full-codegen.ts`
- Modify: `src/plugin/wireframe-plugin.ts`

**Interfaces:**
- Consumes: `NavigationGraph` from Task 1
- Produces per document: `src/generated/documents/{slug}/navigation-graph.generated.ts` exporting `navigationGraph`
- Produces in aggregate: `ContentDocumentEntry.navigationGraph` field

- [ ] **Step 1: Add graph file generation to `generate.ts`**

Add imports:

```ts
import type { NavigationGraph } from './types'
```

Add function:

```ts
function buildNavigationGraphFile(graph: NavigationGraph): string {
  return `${HEADER}export const navigationGraph = ${JSON.stringify(graph, null, 2)} as const\n`
}
```

Update `generateDocumentFiles` signature:

```ts
export async function generateDocumentFiles(
  slug: string,
  screens: ExtractedScreen[],
  graph: NavigationGraph,
  outDir: string,
): Promise<void> {
```

Inside, after routes file:

```ts
  await writeFile(
    join(docDir, 'navigation-graph.generated.ts'),
    buildNavigationGraphFile(graph),
    'utf8',
  )
```

Update `generateWireframeFiles` test helper call to pass empty graph `{ nodes: [], edges: [] }`.

- [ ] **Step 2: Update `run-full-codegen.ts`**

Add import:

```ts
import { extractNavigationGraph } from './extract-navigation-graph'
```

Inside the success branch of each document loop, after `documentScreens.set`:

```ts
    const graph = extractNavigationGraph(source, extracted.screens)
```

Change `generateDocumentFiles` call:

```ts
    await generateDocumentFiles(doc.slug, extracted.screens, graph, outDir)
```

- [ ] **Step 3: Extend `generate-documents.ts`**

Add navigation graph imports per slug:

```ts
import { navigationGraph as ${alias}Graph } from './documents/${doc.slug}/navigation-graph.generated'
```

Add to `ContentDocumentEntry`:

```ts
export type ContentDocumentEntry = {
  slug: string
  title: string
  component: ComponentType
  routes: readonly DocumentRoute[]
  navigationGraph: typeof ${firstAlias}Graph // use per-entry typeof in entries
}
```

Each entry line adds `navigationGraph: ${alias}Graph`.

- [ ] **Step 4: HMR invalidation in `wireframe-plugin.ts`**

Add to modules array inside `handleHotUpdate`:

```ts
        ...(server.moduleGraph.getModulesByFile(`${generatedDir}/documents/wireframe/navigation-graph.generated.ts`) ?? []),
```

Better: invalidate any `navigation-graph.generated.ts` under documents — loop `documentScreens` keys or glob. Minimal v1 fix: invalidate `content-documents.generated.tsx` only (already done) + full reload (already done). No change strictly required because full reload runs; skip unless partial HMR desired.

- [ ] **Step 5: Update `generateWireframeFiles` and `src/plugin/codegen.ts`**

`generateWireframeFiles` must accept/build a graph and pass it to `generateDocumentFiles`. Legacy `codegen.ts` entry should call `extractNavigationGraph` or pass `{ nodes: [], edges: [] }` for single-file CLI use.

Update `src/plugin/generate.test.ts` expectations to assert `navigation-graph.generated.ts` exists.

- [ ] **Step 6: Run codegen and verify output**

Run: `npm run codegen && head -20 src/generated/documents/wireframe/navigation-graph.generated.ts`
Expected: `navigationGraph` with `home`, `login` nodes and edges

- [ ] **Step 7: Run full check**

Run: `npm run check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/plugin/generate.ts src/plugin/generate-documents.ts src/plugin/run-full-codegen.ts
git commit -m "feat: codegen per-document navigation graph"
```

---

### Task 3: Graph link-id injection in generated screens

**Files:**
- Create: `src/plugin/inject-graph-link-ids.ts`
- Create: `src/plugin/inject-graph-link-ids.test.ts`
- Modify: `src/plugin/generate.ts`
- Modify: `src/components/wireframe/Link.tsx`
- Modify: `src/runtime/WireframeViewContext.tsx`

**Interfaces:**
- Consumes: `NavigationEdge[]` for one screen
- Produces: `injectGraphLinkIds(screenJsx: string, screenId: string, edges: NavigationEdge[]): string`
- Produces: `Link` accepts optional `graph-link-id` prop; renders `data-graph-link-id` when `view === 'graph'`

- [ ] **Step 1: Write failing test**

Create `src/plugin/inject-graph-link-ids.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { injectGraphLinkIds } from './inject-graph-link-ids'

describe('injectGraphLinkIds', () => {
  it('adds graph-link-id to Link elements in visit order', () => {
    const jsx = `<Screen id="home" title="Home">
  <Link goto="login">Login</Link>
  <Link goto="signup">Signup</Link>
</Screen>`

    const result = injectGraphLinkIds(jsx, 'home', [
      {
        id: 'home:0->login',
        fromScreenId: 'home',
        toScreenId: 'login',
        linkId: 'home:0',
        label: 'Login',
      },
      {
        id: 'home:1->signup',
        fromScreenId: 'home',
        toScreenId: 'signup',
        linkId: 'home:1',
        label: 'Signup',
      },
    ])

    expect(result).toContain('graph-link-id="home:0"')
    expect(result).toContain('graph-link-id="home:1"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/plugin/inject-graph-link-ids.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement injection**

Create `src/plugin/inject-graph-link-ids.ts` using remark parse of fragment, visit `Link` nodes, insert `graph-link-id` attribute for edges matching `fromScreenId` in order. Stringify back with `processor.stringify`.

Update `buildScreensFile` in `generate.ts`:

```ts
function buildScreensFile(screens: ExtractedScreen[], graph: NavigationGraph): string {
  const edgesByScreen = new Map<string, NavigationEdge[]>()
  for (const edge of graph.edges) {
    const list = edgesByScreen.get(edge.fromScreenId) ?? []
    list.push(edge)
    edgesByScreen.set(edge.fromScreenId, list)
  }

  const componentExports = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      const jsx = injectGraphLinkIds(s.jsx, s.id, edgesByScreen.get(s.id) ?? [])
      return `export function ${name}() {\n  return (\n    ${jsx}\n  )\n}`
    })
    .join('\n\n')
  // ...
}
```

Pass `graph` into `buildScreensFile` from `generateDocumentFiles`.

- [ ] **Step 4: Add `graph` view to runtime**

In `WireframeViewContext.tsx`:

```ts
export type WireframeView = 'preview' | 'prototype' | 'graph'
```

In `Link.tsx`, add prop:

```ts
  'graph-link-id'?: string
```

When `view === 'graph'`, render non-interactive link/button with `data-graph-link-id={graphLinkId}` and `pointer-events-none` (or `tabIndex={-1}`) on the control; `handleClick` no-ops when `view === 'graph'`.

In `Screen.tsx`, treat `view === 'graph'` like prototype (no preview border/title banner).

- [ ] **Step 5: Run tests and check**

Run: `npm test && npm run codegen && npm run check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/plugin/inject-graph-link-ids.ts src/plugin/inject-graph-link-ids.test.ts src/plugin/generate.ts src/components/wireframe/Link.tsx src/components/wireframe/Screen.tsx src/runtime/WireframeViewContext.tsx
git commit -m "feat: inject graph link ids for screen-view edge anchoring"
```

---

### Task 4: Layout helper and dependencies

**Files:**
- Modify: `package.json`
- Create: `src/shell/graph/layout-navigation-graph.ts`
- Create: `src/shell/graph/layout-navigation-graph.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GraphDisplayMode = 'screen' | 'compact'

  export type LayoutNodeInput = {
    id: string
    width: number
    height: number
  }

  export type LayoutEdgeInput = {
    id: string
    from: string
    to: string
  }

  export function layoutNavigationGraph(
    nodes: readonly LayoutNodeInput[],
    edges: readonly LayoutEdgeInput[],
    direction?: 'TB' | 'LR',
  ): Map<string, { x: number; y: number }>
  ```

- [ ] **Step 1: Install dependencies**

Run: `npm install @xyflow/react @dagrejs/dagre`
Run: `npm install -D @types/dagre` (if needed; `@dagrejs/dagre` may ship types)

- [ ] **Step 2: Write failing layout test**

Create `src/shell/graph/layout-navigation-graph.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { layoutNavigationGraph } from './layout-navigation-graph'

describe('layoutNavigationGraph', () => {
  it('assigns positions to all node ids', () => {
    const positions = layoutNavigationGraph(
      [
        { id: 'home', width: 200, height: 100 },
        { id: 'login', width: 200, height: 100 },
      ],
      [{ id: 'e1', from: 'home', to: 'login' }],
    )

    expect(positions.get('home')).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }))
    expect(positions.get('login')).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }))
    expect(positions.get('home')?.y).toBeLessThan(positions.get('login')?.y ?? 0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/shell/graph/layout-navigation-graph.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement layout**

Create `src/shell/graph/layout-navigation-graph.ts` using dagre `graphlib.Graph`, set nodes with width/height, set edges, `dagre.layout`, return position map (adjust for center anchor: dagre returns center; React Flow expects top-left — subtract width/2, height/2).

Export `GraphDisplayMode` type from same file or `src/shell/graph/types.ts`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/shell/graph/layout-navigation-graph.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/shell/graph/layout-navigation-graph.ts src/shell/graph/layout-navigation-graph.test.ts
git commit -m "feat: add dagre layout helper for graph view"
```

---

### Task 5: Shell tab and full-width graph layout

**Files:**
- Modify: `src/shell/Shell.tsx`
- Create: `src/shell/GraphView.tsx` (stub)

**Interfaces:**
- Consumes: `ContentDocumentEntry.navigationGraph`, `routes`, `slug`
- Produces: `GraphView` component with props:
  ```ts
  export type GraphViewProps = {
    navigationGraph: NavigationGraph
    routes: readonly RouteEntry[]
    documentFilename: string
  }
  ```

- [ ] **Step 1: Extend Shell view type and tab**

In `Shell.tsx`:

```ts
type ActiveView = 'preview' | 'prototype' | 'graph'
```

Add tab:

```tsx
<TabsTrigger value="graph">Graph View</TabsTrigger>
```

Change header container: remove `max-w-3xl` from header inner div OR widen to `max-w-none px-6` when graph active — simpler approach: header stays `max-w-3xl`, main switches:

```tsx
<main
  className={cn(
    'mx-auto px-6 py-8',
    view === 'graph' ? 'h-[calc(100vh-73px)] max-w-none' : 'max-w-3xl',
  )}
>
```

Add graph branch:

```tsx
) : view === 'graph' && activeEntry ? (
  <GraphView
    key={activeEntry.slug}
    navigationGraph={activeEntry.navigationGraph}
    routes={activeEntry.routes}
    documentFilename={`${activeEntry.slug}.mdx`}
  />
```

- [ ] **Step 2: Create GraphView stub**

Create `src/shell/GraphView.tsx`:

```tsx
import { getCodegenErrors } from '../runtime/codegen-error'
import type { NavigationGraph } from '../plugin/types'
import type { RouteEntry } from './router'

export type GraphViewProps = {
  navigationGraph: NavigationGraph
  routes: readonly RouteEntry[]
  documentFilename: string
}

export function GraphView({ navigationGraph, routes, documentFilename }: GraphViewProps) {
  const codegenErrors = getCodegenErrors()

  if (codegenErrors.length > 0) {
    return (
      <p className="text-red-900">
        Graph unavailable until codegen errors in <code>{documentFilename}</code> are fixed.
      </p>
    )
  }

  if (routes.length === 0) {
    return <p className="text-muted-foreground">No screens in {documentFilename}.</p>
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {navigationGraph.nodes.length} screens, {navigationGraph.edges.length} connections
      </p>
      <div className="flex-1 rounded-md border border-border bg-muted/20" />
    </div>
  )
}
```

Import `NavigationGraph` from plugin types is OK for shell (types only) — or duplicate a shell-facing type alias from generated file. Prefer importing type from `src/plugin/types.ts`.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`
Expected: Graph View tab visible; stub shows counts for `wireframe.mdx`

- [ ] **Step 4: Commit**

```bash
git add src/shell/Shell.tsx src/shell/GraphView.tsx
git commit -m "feat: add graph view shell tab and layout slot"
```

---

### Task 6: Compact View React Flow canvas

**Files:**
- Create: `src/shell/graph/CompactGraphNode.tsx`
- Create: `src/shell/graph/build-react-flow-graph.ts`
- Modify: `src/shell/GraphView.tsx`
- Create: `src/shell/graph/graph-view.css` (optional React Flow overrides)

**Interfaces:**
- Produces: `buildReactFlowGraph({ graph, routes, mode, selectedId, positions })` returning `{ nodes, edges }` for `@xyflow/react`

- [ ] **Step 1: Implement CompactGraphNode**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'

export type CompactGraphNodeData = {
  title: string
  screenId: string
  note?: string
  incoming: number
  outgoing: number
  isEntry: boolean
  selected: boolean
}

export function CompactGraphNode({ data }: NodeProps<CompactGraphNodeData>) {
  return (
    <div
      className={cn(
        'min-w-[180px] rounded-md border bg-background p-3 text-sm shadow-none',
        data.isEntry && 'border-2 border-foreground',
        data.selected && 'ring-2 ring-foreground',
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <p className="font-medium">{data.title}</p>
      {data.note ? <p className="text-xs text-muted-foreground">{data.note}</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">
        in {data.incoming} · out {data.outgoing}
      </p>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}
```

- [ ] **Step 2: Implement `build-react-flow-graph.ts`**

Map each `NavigationGraphNode` to RF node. Compute incoming/outgoing counts from edges. For compact mode, fixed node dimensions (180×100). Map edges to RF edges with `sourceHandle` / `targetHandle` null (node boundary). Use `markerEnd` for direction.

- [ ] **Step 3: Wire GraphView Compact mode**

In `GraphView.tsx`:

- State: `mode: 'screen' | 'compact'` default `'screen'` per spec — implement compact first, then screen in Task 7
- Import `ReactFlow`, `Background`, `Controls`, `MiniMap`, `ReactFlowProvider`
- On mount: compute layout with compact dimensions, `fitView()`
- `onNodeClick`: set `selectedId`
- `onPaneClick`: clear `selectedId`
- Toolbar: `Tabs` or `ToggleGroup` for Screen / Compact

Start Task 6 with **compact only** behind toggle; screen mode placeholder until Task 7.

- [ ] **Step 4: Import React Flow CSS**

In `src/main.tsx` or `GraphView.tsx`:

```ts
import '@xyflow/react/dist/style.css'
```

- [ ] **Step 5: Manual verify**

Run: `npm run dev` → Graph View → Compact mode
Expected: `wireframe.mdx` shows home/login/signup nodes, directed edges, entry node emphasized, pan/zoom/minimap work

- [ ] **Step 6: Commit**

```bash
git add src/shell/graph/ src/shell/GraphView.tsx src/main.tsx
git commit -m "feat: graph view compact mode with react flow"
```

---

### Task 7: Screen View wireframe nodes

**Files:**
- Create: `src/shell/graph/ScreenGraphNode.tsx`
- Create: `src/shell/graph/useGraphLinkHandles.ts`
- Modify: `src/shell/graph/build-react-flow-graph.ts`
- Modify: `src/shell/GraphView.tsx`

**Interfaces:**
- Produces: `useGraphLinkHandles(containerRef, linkIds)` → `Map<linkId, { x: number; y: number }>` relative to node top-left
- Screen node renders `route.component` inside `WireframeViewProvider view="graph"`

- [ ] **Step 1: Implement ScreenGraphNode**

```tsx
import { useRef } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { WireframeViewProvider } from '@/runtime/WireframeViewContext'
import { useGraphLinkHandles } from './useGraphLinkHandles'

export type ScreenGraphNodeData = {
  screenId: string
  title: string
  isEntry: boolean
  selected: boolean
  outgoingLinkIds: string[]
  component: React.ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
}

export function ScreenGraphNode({ data }: NodeProps<ScreenGraphNodeData>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handles = useGraphLinkHandles(containerRef, data.outgoingLinkIds)
  const Screen = data.component

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-md border bg-background p-2',
        data.isEntry && 'border-2 border-foreground',
        data.selected && 'ring-2 ring-foreground',
      )}
    >
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={data.validScreenIds}
        modalIdsByScreen={data.modalIdsByScreen}
      >
        <div className="pointer-events-none origin-top-left scale-[0.65]">
          <Screen />
        </div>
      </WireframeViewProvider>
      {data.outgoingLinkIds.map((linkId) => {
        const point = handles.get(linkId)
        if (!point) return null
        return (
          <Handle
            key={linkId}
            id={linkId}
            type="source"
            position={Position.Right}
            style={{ left: point.x, top: point.y }}
            className="h-2 w-2"
          />
        )
      })}
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}
```

- [ ] **Step 2: Implement `useGraphLinkHandles`**

Use `ResizeObserver` + `querySelectorAll('[data-graph-link-id]')` relative to `containerRef`. Return center-right of each link element as handle position. Call `useUpdateNodeInternals` from React Flow when handles change.

- [ ] **Step 3: Update `build-react-flow-graph.ts` for screen mode**

- Larger default dimensions per node (measure after mount or use estimated 320×400 for layout; refine with `useUpdateNodeInternals`)
- RF edges use `sourceHandle: edge.linkId`
- Layout uses measured/estimated screen node sizes

- [ ] **Step 4: Set Screen View as default in GraphView**

`useState<GraphDisplayMode>('screen')` — matches spec.

- [ ] **Step 5: Manual verify**

Run: `npm run dev` → Graph View default
Expected: Scaled wireframes visible; edges originate near link controls on `wireframe.mdx` and `components.mdx`

- [ ] **Step 6: Commit**

```bash
git add src/shell/graph/ScreenGraphNode.tsx src/shell/graph/useGraphLinkHandles.ts src/shell/graph/build-react-flow-graph.ts src/shell/GraphView.tsx
git commit -m "feat: graph view screen mode with wireframe nodes"
```

---

### Task 8: Mode switch continuity and fit view

**Files:**
- Modify: `src/shell/GraphView.tsx`

- [ ] **Step 1: Implement mode switch behavior**

When `mode` changes:

1. Keep `selectedId` state
2. Recompute layout with mode-specific node dimensions
3. Call `setNodes` / `setEdges` from `buildReactFlowGraph`
4. `requestAnimationFrame` → `fitView({ nodes: selectedId ? [selectedId] : undefined, padding: 0.2 })` to center selected node

- [ ] **Step 2: Fit view on document change**

`useEffect` on `navigationGraph` + `mode`: layout + `fitView()` for full graph

- [ ] **Step 3: Manual verify against acceptance criteria**

Checklist from `GRAPH_VIEW.md` § Acceptance criteria (items 1–9).

- [ ] **Step 4: Run full verification**

Run: `npm test && npm run build && npm run check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/GraphView.tsx
git commit -m "feat: graph view mode switch preserves selection and viewport"
```

---

### Task 9: Update CONTEXT.md status

**Files:**
- Modify: `docs/CONTEXT.md`

- [ ] **Step 1: Update status table**

Change row:

```md
| Nav graph, unreachable validation, doc export | Not started |
```

to:

```md
| Graph View (shell tab, Screen + Compact modes) | Done |
| Unreachable validation, doc export | Not started |
```

Add under Key behaviors a short ### Graph View subsection pointing to `docs/GRAPH_VIEW.md`.

- [ ] **Step 2: Commit**

```bash
git add docs/CONTEXT.md
git commit -m "docs: record graph view in context status"
```

---

## Self-review (spec coverage)

| `GRAPH_VIEW.md` requirement | Task |
|-----------------------------|------|
| Third shell tab, per-document | Task 5 |
| Full-width canvas | Task 5 |
| Codegen errors block graph | Task 5 (`GraphView` stub) |
| Screen nodes, entry distinct | Tasks 1, 6, 7 |
| Edge rules (screen-screen only, no disabled/reserved/modal-open) | Task 1 |
| Modal-internal screen links included | Task 1 test |
| Screen View default, wireframe content, link-anchored edges | Tasks 3, 7 |
| Compact View cards with note + counts | Task 6 |
| Pan/zoom/fit/minimap | Task 6 |
| Select not navigate | Task 6 |
| Mode switch continuity | Task 8 |
| Out of scope items not implemented | Not tasked |

No placeholders found. Type names consistent: `NavigationGraph`, `NavigationEdge`, `linkId`, `GraphDisplayMode`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-27-graph-view.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
