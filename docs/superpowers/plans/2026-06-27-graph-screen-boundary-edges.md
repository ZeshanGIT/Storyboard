# Graph Screen Boundary Edges + Link Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragile DOM-measured per-link edge anchors in Screen View with stable screen-boundary edges (matching Compact View) and link-hover edge highlighting so authors can still see which control maps to which connection.

**Architecture:** Drop `useGraphLinkHandles` / `measure-link-handle-positions`. Screen nodes get one invisible source handle (`Position.Bottom`) and one target handle (`Position.Top`) — same TB boundary strategy as Compact nodes. Edges use `smoothstep` with offset/borderRadius for readable parallel routes. `WireframeViewProvider` gains optional `onGraphLinkHover(linkId | null)`; `Link` in graph view enables pointer events for hover and calls it. `GraphView` holds `highlightedLinkId` state and passes `data.linkId` on edges for CSS dim/highlight.

**Tech Stack:** React 19, TypeScript 6, Vitest, `@xyflow/react` 12, existing codegen `NavigationEdge.linkId`

**Spec:** [`docs/GRAPH_VIEW.md`](../../GRAPH_VIEW.md) — update Screen View edge section (Task 6)

## Global Constraints

- Graph View is third shell tab; active document picker applies
- Screen View shows wireframe content per node; edges must stay stable under pan/zoom/selection
- Compact View behavior unchanged except shared `smoothstep` edge type (Task 3)
- Multiple parallel screen→screen links remain multiple edges
- `_back` / `_close` / modal links do not produce screen→screen edges (unchanged codegen)
- No brand colors, shadows, or typography systems on graph chrome
- Min diff; no new npm dependencies; do not hand-edit `src/generated/`
- Run `npm run build` + `npm run check` before claiming done; plugin/graph pure logic → Vitest tests
- `npm run test` for touched test files

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/runtime/WireframeViewContext.tsx` | Optional `onGraphLinkHover` callback on provider |
| `src/components/wireframe/Link.tsx` | Graph-view hover → `onGraphLinkHover` |
| `src/shell/graph/build-react-flow-graph.ts` | Boundary edges, `data.linkId`, `smoothstep` |
| `src/shell/graph/build-react-flow-graph.test.ts` | Assert edge shape + linkId data |
| `src/shell/graph/ScreenGraphNode.tsx` | Top/bottom boundary handles only |
| `src/shell/GraphView.tsx` | `highlightedLinkId` state, edge className, provider wiring |
| `src/shell/graph/graph-view.css` | Dim/highlight edge styles |
| `docs/GRAPH_VIEW.md` | Screen View edge UX update |
| `docs/CONTEXT.md` | One-line graph edge behavior note |

**Delete after migration:**

| File | Reason |
|------|--------|
| `src/shell/graph/useGraphLinkHandles.ts` | DOM handle measurement removed |
| `src/shell/graph/measure-link-handle-positions.ts` | DOM handle measurement removed |
| `src/shell/graph/measure-link-handle-positions.test.ts` | Tests removed with module |

---

### Task 1: Graph link hover callback on WireframeViewProvider

**Files:**
- Modify: `src/runtime/WireframeViewContext.tsx`
- Modify: `src/components/wireframe/Link.tsx`

**Interfaces:**
- Produces:
  ```ts
  // WireframeViewContextValue
  onGraphLinkHover: (linkId: string | null) => void

  // WireframeViewProviderProps
  onGraphLinkHover?: (linkId: string | null) => void
  ```

- [ ] **Step 1: Extend context type and provider**

In `src/runtime/WireframeViewContext.tsx`, add to `WireframeViewContextValue`:

```ts
onGraphLinkHover: (linkId: string | null) => void
```

Add to `defaultValue`:

```ts
onGraphLinkHover: () => {},
```

Add optional prop to `WireframeViewProviderProps`:

```ts
onGraphLinkHover?: (linkId: string | null) => void
```

Destructure in provider with default `() => {}`, include in `useMemo` value.

- [ ] **Step 2: Wire hover on Link in graph view**

In `src/components/wireframe/Link.tsx`, destructure `onGraphLinkHover` from `useWireframeView()`.

Update graph attrs block — remove blanket `pointer-events-none`, add hover handlers when `graphLinkId` is set:

```tsx
const graphAttrs =
  view === 'graph' && graphLinkId
    ? {
        'data-graph-link-id': graphLinkId,
        tabIndex: -1 as const,
        onMouseEnter: () => onGraphLinkHover(graphLinkId),
        onMouseLeave: () => onGraphLinkHover(null),
        onFocus: () => onGraphLinkHover(graphLinkId),
        onBlur: () => onGraphLinkHover(null),
        className: cn('cursor-default'),
      }
    : undefined
```

Apply `graphAttrs` to both non-button and `Button` graph link branches. Keep `handleClick` no-op when `view === 'graph'`.

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/runtime/WireframeViewContext.tsx src/components/wireframe/Link.tsx
git commit -m "feat(graph): add link hover callback for edge highlighting"
```

---

### Task 2: Boundary edges in build-react-flow-graph

**Files:**
- Modify: `src/shell/graph/build-react-flow-graph.ts`
- Modify: `src/shell/graph/build-react-flow-graph.test.ts`

**Interfaces:**
- Produces edge objects with:
  ```ts
  {
    id: string
    source: string
    target: string
    type: 'smoothstep'
    pathOptions: { borderRadius: 8, offset: 24 }
    markerEnd: { type: MarkerType.ArrowClosed }
    data: { linkId: string }
    zIndex: 0
  }
  ```
- Screen-mode edges **no longer** set `sourceHandle`

- [ ] **Step 1: Write failing test for screen edge data**

Append to `src/shell/graph/build-react-flow-graph.test.ts`:

```ts
import type { NavigationGraph } from '../../plugin/types'

const linkedGraph: NavigationGraph = {
  nodes: [
    { id: 'home', title: 'Home', order: 0, isEntry: true },
    { id: 'login', title: 'Login', order: 1, isEntry: false },
  ],
  edges: [
    {
      id: 'home:0->login',
      fromScreenId: 'home',
      toScreenId: 'login',
      linkId: 'home:0',
    },
  ],
}

describe('buildReactFlowGraph screen mode edges', () => {
  it('uses boundary edges with linkId data and no per-link sourceHandle', () => {
    const Home = () => null
    const Login = () => null
    const screenNodeSizes = new Map([
      ['home', { width: 140, height: 90 }],
      ['login', { width: 220, height: 310 }],
    ])

    const { edges } = buildReactFlowGraph({
      graph: linkedGraph,
      routes: [
        { id: 'home', path: '/home', component: Home },
        { id: 'login', path: '/login', component: Login },
      ],
      mode: 'screen',
      selectedId: null,
      positions: new Map([
        ['home', { x: 0, y: 0 }],
        ['login', { x: 0, y: 200 }],
      ]),
      screenNodeSizes,
    })

    expect(edges).toHaveLength(1)
    expect(edges[0]).toEqual(
      expect.objectContaining({
        source: 'home',
        target: 'login',
        type: 'smoothstep',
        data: { linkId: 'home:0' },
      }),
    )
    expect(edges[0]?.sourceHandle).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/shell/graph/build-react-flow-graph.test.ts`
Expected: FAIL — `type` is `default` or `sourceHandle` still set

- [ ] **Step 3: Update buildScreenGraph and buildCompactGraph edges**

In `src/shell/graph/build-react-flow-graph.ts`, replace both edge maps with:

```ts
const edges: Edge[] = graph.edges.map((edge) => ({
  id: edge.id,
  source: edge.fromScreenId,
  target: edge.toScreenId,
  type: 'smoothstep',
  pathOptions: { borderRadius: 8, offset: 24 },
  markerEnd: { type: MarkerType.ArrowClosed },
  data: { linkId: edge.linkId },
  zIndex: 0,
}))
```

Remove `sourceHandle: edge.linkId` from screen edges.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/shell/graph/build-react-flow-graph.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/graph/build-react-flow-graph.ts src/shell/graph/build-react-flow-graph.test.ts
git commit -m "feat(graph): use boundary smoothstep edges with linkId metadata"
```

---

### Task 3: ScreenGraphNode boundary handles

**Files:**
- Modify: `src/shell/graph/ScreenGraphNode.tsx`
- Delete: `src/shell/graph/useGraphLinkHandles.ts`
- Delete: `src/shell/graph/measure-link-handle-positions.ts`
- Delete: `src/shell/graph/measure-link-handle-positions.test.ts`

**Interfaces:**
- Consumes: `ScreenGraphNodeData` unchanged except `outgoingLinkIds` no longer used for handles (keep field for now — removed in Task 3 cleanup or keep for future; **remove from data** in Task 3 step 3)

- [ ] **Step 1: Replace ScreenGraphNode implementation**

`src/shell/graph/ScreenGraphNode.tsx`:

```tsx
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { type ComponentType } from 'react'
import { WireframeViewProvider } from '@/runtime/WireframeViewContext'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'
import type { MeasuredScreenNodeSize } from './screen-node-size'

export type ScreenGraphNodeData = {
  screenId: string
  title: string
  isEntry: boolean
  selected: boolean
  component: ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  measuredSize: MeasuredScreenNodeSize
  onGraphLinkHover?: (linkId: string | null) => void
}

export type ScreenGraphNodeType = Node<ScreenGraphNodeData, 'screen'>

export function ScreenGraphNode({ data }: NodeProps<ScreenGraphNodeType>) {
  const Screen = data.component

  return (
    <ScreenGraphNodeShell
      isEntry={data.isEntry}
      selected={data.selected}
      width={data.measuredSize.width}
      height={data.measuredSize.height}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="wireframe-graph-boundary-handle"
      />
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={data.validScreenIds}
        modalIdsByScreen={data.modalIdsByScreen}
        onGraphLinkHover={data.onGraphLinkHover}
      >
        <Screen />
      </WireframeViewProvider>
      <Handle
        type="source"
        position={Position.Bottom}
        className="wireframe-graph-boundary-handle"
      />
    </ScreenGraphNodeShell>
  )
}
```

- [ ] **Step 2: Remove outgoingLinkIds from buildScreenGraph node data**

In `src/shell/graph/build-react-flow-graph.ts`, delete `outgoingByScreen` map and `outgoingLinkIds` from node `data`. Add `onGraphLinkHover` to `BuildReactFlowGraphInput`:

```ts
export type BuildReactFlowGraphInput = {
  graph: NavigationGraph
  routes: readonly RouteEntry[]
  mode: GraphDisplayMode
  selectedId: string | null
  positions: Map<string, { x: number; y: number }>
  screenNodeSizes?: ScreenNodeSizeMap
  onGraphLinkHover?: (linkId: string | null) => void
}
```

Pass `onGraphLinkHover: input.onGraphLinkHover` into each screen node's `data`.

- [ ] **Step 3: Delete obsolete measurement modules**

```bash
rm src/shell/graph/useGraphLinkHandles.ts \
   src/shell/graph/measure-link-handle-positions.ts \
   src/shell/graph/measure-link-handle-positions.test.ts
```

- [ ] **Step 4: Update graph-view.css handle class**

In `src/shell/graph/graph-view.css`, rename/replace `.wireframe-graph-link-handle` with:

```css
.react-flow__handle.wireframe-graph-boundary-handle {
  opacity: 0;
  width: 1px;
  height: 1px;
  min-width: 0;
  min-height: 0;
  border: none;
  pointer-events: none;
}
```

- [ ] **Step 5: Typecheck and test**

Run: `npm run check && npm test -- src/shell/graph/`
Expected: PASS (remove measure-link test from suite by deletion)

- [ ] **Step 6: Commit**

```bash
git add -A src/shell/graph/ src/shell/graph/graph-view.css
git commit -m "refactor(graph): screen nodes use top/bottom boundary handles"
```

---

### Task 4: GraphView highlight state and edge styling

**Files:**
- Modify: `src/shell/GraphView.tsx`
- Modify: `src/shell/graph/graph-view.css`

**Interfaces:**
- Consumes: `BuildReactFlowGraphInput.onGraphLinkHover`, edge `data.linkId`
- Produces: highlighted edges via `className` on edge objects

- [ ] **Step 1: Add highlight state in GraphView**

In `src/shell/GraphView.tsx`:

```ts
const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)

const onGraphLinkHover = useCallback((linkId: string | null) => {
  setHighlightedLinkId(linkId)
}, [])
```

Pass `onGraphLinkHover` into `buildReactFlowGraph({ ..., onGraphLinkHover })`.

Clear highlight on pane click — extend `onClearSelection`:

```ts
const onClearSelection = useCallback(() => {
  setSelectedId(null)
  setHighlightedLinkId(null)
}, [])
```

- [ ] **Step 2: Apply edge className in flowGraph useMemo**

After `buildReactFlowGraph`, map edges:

```ts
const flowGraph = useMemo(() => {
  const base = buildReactFlowGraph({
    navigationGraph,
    routes,
    mode,
    selectedId,
    positions,
    screenNodeSizes: mode === 'screen' ? (screenNodeSizes ?? undefined) : undefined,
    onGraphLinkHover,
  })

  if (!highlightedLinkId) return base

  return {
    ...base,
    edges: base.edges.map((edge) => ({
      ...edge,
      className:
        edge.data?.linkId === highlightedLinkId
          ? 'wireframe-graph-edge-highlighted'
          : 'wireframe-graph-edge-dimmed',
    })),
  }
}, [
  navigationGraph,
  routes,
  mode,
  selectedId,
  positions,
  screenNodeSizes,
  onGraphLinkHover,
  highlightedLinkId,
])
```

Add `highlightedLinkId` to `GraphFlowCanvas` only if needed — not required; mapping happens in parent.

- [ ] **Step 3: Update GraphFlowCanvas defaultEdgeOptions**

In `GraphFlowCanvas`, change `defaultEdgeOptions`:

```ts
defaultEdgeOptions={{
  type: 'smoothstep',
  pathOptions: { borderRadius: 8, offset: 24 },
  zIndex: 0,
}}
```

- [ ] **Step 4: Add CSS for highlight/dim**

Append to `src/shell/graph/graph-view.css`:

```css
.react-flow__edge.wireframe-graph-edge-dimmed .react-flow__edge-path {
  opacity: 0.25;
}

.react-flow__edge.wireframe-graph-edge-highlighted .react-flow__edge-path {
  stroke-width: 2.5;
  opacity: 1;
}
```

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`

Verify on `wireframe.mdx` Graph View (Screen mode):
1. Edges run bottom→top between nodes; stable when zooming/panning/clicking nodes
2. Hover "Login" on home → only `home:0->login` edge highlighted, others dimmed
3. Hover "Create account" → only signup edge highlighted
4. Hover "Sign in" on login card → login→home edge highlighted
5. Click pane → selection and highlight clear

- [ ] **Step 6: Commit**

```bash
git add src/shell/GraphView.tsx src/shell/graph/graph-view.css
git commit -m "feat(graph): highlight edge on link hover in screen view"
```

---

### Task 5: Docs and final verification

**Files:**
- Modify: `docs/GRAPH_VIEW.md`
- Modify: `docs/CONTEXT.md`

- [ ] **Step 1: Update GRAPH_VIEW Screen View edges section**

Replace the Screen View **Edges** subsection (lines ~101–105) with:

```markdown
### Edges

Edges connect **screen node boundaries** (out from the bottom, in from the top) so routes stay stable while panning and zooming. Parallel links from the same screen are separate edges.

**Hover a link or button** inside a screen node to highlight the edge for that navigation. Other edges dim while hovered. This shows which control maps to which connection without anchoring lines to pixel positions inside the wireframe.

Modal-opening links do not draw edges to other screens. They may show a local affordance on the triggering control within the node.
```

Update acceptance criterion 4 to:

```markdown
4. Screen View shows scaled wireframe content per node; edges use boundary anchors; hovering a navigable link highlights its edge.
```

- [ ] **Step 2: Update CONTEXT graph one-liner**

In `docs/CONTEXT.md`, Graph View row / Key behaviors section, change Screen View edge description to boundary edges + link-hover highlight.

- [ ] **Step 3: Full verification**

Run: `npm test`
Expected: PASS

Run: `npm run build && npm run check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/GRAPH_VIEW.md docs/CONTEXT.md
git commit -m "docs(graph): screen view boundary edges and link-hover highlight"
```

---

## Self-review

**Issue list coverage:**

| Issue | Task |
|-------|------|
| Edges not starting on link controls | Task 2–3 — boundary anchors (by design); Task 4 hover shows mapping |
| Handle position vs path mismatch | Task 3 — remove DOM handles |
| Mystery source on Welcome card | Task 3 — single bottom source |
| All incoming edges share one target | Task 3 — top target; TB layout correct for returns |
| Arrows float in margin | Task 3 — top-center boundary, not left margin |
| Return edges hit wrong spot on Home | Task 3 — top of home node |
| Wrong-looking create-account destination | Task 2–3 — no crossed per-link handle coords |
| Wide overlapping beziers | Task 2 — smoothstep + offset |
| Self-loop on sign-in | Task 3 — removes left-target artifact |
| Edge hits wrong node side | Task 3 — top/bottom only |
| Handle dots visible | Task 3 — invisible boundary handles |
| No edge labels | Task 4 — hover highlight disambiguates |
| Back affordance disconnected | Out of scope — `_back` still no edge (document in GRAPH_VIEW out-of-scope) |
| Compact vs Screen asymmetry | Task 3 — both use top/bottom TB handles |
| Spec gap on per-link anchors | Task 6 — spec updated |

**Placeholder scan:** None.

**Type consistency:** `onGraphLinkHover` flows `GraphView` → `buildReactFlowGraph` → `ScreenGraphNodeData` → `WireframeViewProvider` → `Link`. `highlightedLinkId` matches `edge.data.linkId` from codegen.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-27-graph-screen-boundary-edges.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
