# Graph Screen Node Measure-Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixed 320×400 screen graph nodes and `scale-[0.65]` hacks with measured per-screen dimensions fed to Dagre, showing a loading state until layout is ready so the graph never visibly jumps.

**Architecture:** A hidden off-screen measure layer renders each screen with the same chrome as `ScreenGraphNode`, collects `getBoundingClientRect()` sizes, then runs Dagre with those dimensions. `GraphView` shows a spinner until all sizes are known; only then mounts `ReactFlow` with final node sizes and positions. Compact mode keeps fixed card dimensions and skips measurement.

**Tech Stack:** React 19, TypeScript 6, Vitest, `@xyflow/react`, `@dagrejs/dagre`, existing wireframe primitives + shadcn shell

**Spec:** [`docs/GRAPH_VIEW.md`](../../GRAPH_VIEW.md) — Screen View nodes, variable node size, layout on document/mode change

## Global Constraints

- Graph View is a third top-level shell tab labeled **Graph View**
- Active document from document picker applies; switching documents switches the graph
- Screen View shows scaled wireframe content per node with edges anchored to triggering controls
- **Layout algorithm accounts for variable node size** (Screen View)
- Compact View uses fixed card nodes; unchanged behavior
- Mode switch recalculates layout; selected node stays selected and centered
- Clicking a node selects it; does not navigate to Preview/Prototype
- No brand colors, shadows, or typography systems on graph chrome
- Run `npm run build` + `npm run check` before claiming done; shell graph changes need Vitest tests where pure logic is extracted
- Min diff; no unrelated refactors; no new npm dependencies
- Do not hand-edit `src/generated/`

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/shell/graph/screen-node-size.ts` | Shared types + helpers for measured screen node dimensions |
| `src/shell/graph/screen-node-size.test.ts` | Unit tests for size helpers |
| `src/shell/graph/ScreenGraphNodeShell.tsx` | Shared chrome wrapper used by measure layer and live nodes |
| `src/shell/graph/ScreenGraphMeasureLayer.tsx` | Hidden off-screen render + measure all screens |
| `src/shell/graph/GraphLoadingState.tsx` | Centered spinner shown while measuring |
| `src/shell/graph/build-react-flow-graph.ts` | Accept per-node measured sizes instead of fixed constants |
| `src/shell/graph/build-react-flow-graph.test.ts` | Tests for variable-size screen nodes |
| `src/shell/graph/ScreenGraphNode.tsx` | Remove scale + fixed size; use shared shell + measured dims |
| `src/shell/graph/layout-navigation-graph.test.ts` | Extend test for heterogeneous node sizes |
| `src/shell/GraphView.tsx` | Measure → layout → show graph orchestration + loading gate |

---

### Task 1: Screen node size types and build-graph variable sizes

**Files:**
- Create: `src/shell/graph/screen-node-size.ts`
- Create: `src/shell/graph/screen-node-size.test.ts`
- Modify: `src/shell/graph/build-react-flow-graph.ts`
- Create: `src/shell/graph/build-react-flow-graph.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type MeasuredScreenNodeSize = { width: number; height: number }
  export type ScreenNodeSizeMap = ReadonlyMap<string, MeasuredScreenNodeSize>

  export function normalizeMeasuredSize(rect: { width: number; height: number }): MeasuredScreenNodeSize
  export function isScreenMeasurementComplete(
    expectedScreenIds: readonly string[],
    sizes: ScreenNodeSizeMap,
  ): boolean
  ```
- Modifies `BuildReactFlowGraphInput`:
  ```ts
  export type BuildReactFlowGraphInput = {
    graph: NavigationGraph
    routes: readonly RouteEntry[]
    mode: GraphDisplayMode
    selectedId: string | null
    positions: Map<string, { x: number; y: number }>
    screenNodeSizes?: ScreenNodeSizeMap // required when mode === 'screen'
  }
  ```
- Removes `SCREEN_NODE_WIDTH` and `SCREEN_NODE_HEIGHT` exports (no longer used for layout or nodes)

- [ ] **Step 1: Write the failing tests**

`src/shell/graph/screen-node-size.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  isScreenMeasurementComplete,
  normalizeMeasuredSize,
} from './screen-node-size'

describe('normalizeMeasuredSize', () => {
  it('ceil dimensions and enforce a 1px minimum', () => {
    expect(normalizeMeasuredSize({ width: 120.2, height: 0 })).toEqual({
      width: 121,
      height: 1,
    })
  })
})

describe('isScreenMeasurementComplete', () => {
  it('returns true only when every expected screen id has a size', () => {
    const sizes = new Map([['home', { width: 100, height: 80 }]])
    expect(isScreenMeasurementComplete(['home'], sizes)).toBe(true)
    expect(isScreenMeasurementComplete(['home', 'login'], sizes)).toBe(false)
  })
})
```

`src/shell/graph/build-react-flow-graph.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { NavigationGraph } from '../../plugin/types'
import { buildReactFlowGraph } from './build-react-flow-graph'

const graph: NavigationGraph = {
  nodes: [
    { id: 'home', title: 'Home', order: 0, isEntry: true },
    { id: 'login', title: 'Login', order: 1, isEntry: false },
  ],
  edges: [],
}

describe('buildReactFlowGraph screen mode', () => {
  it('applies per-node measured sizes to screen nodes', () => {
    const Home = () => null
    const Login = () => null
    const screenNodeSizes = new Map([
      ['home', { width: 140, height: 90 }],
      ['login', { width: 220, height: 310 }],
    ])

    const { nodes } = buildReactFlowGraph({
      graph,
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

    expect(nodes).toHaveLength(2)
    expect(nodes[0]?.style).toEqual(expect.objectContaining({ width: 140, height: 90 }))
    expect(nodes[1]?.style).toEqual(expect.objectContaining({ width: 220, height: 310 }))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/shell/graph/screen-node-size.test.ts src/shell/graph/build-react-flow-graph.test.ts`
Expected: FAIL — modules/functions not found; `screenNodeSizes` not accepted

- [ ] **Step 3: Implement types, helpers, and build-graph changes**

`src/shell/graph/screen-node-size.ts`:

```ts
export type MeasuredScreenNodeSize = {
  width: number
  height: number
}

export type ScreenNodeSizeMap = ReadonlyMap<string, MeasuredScreenNodeSize>

export function normalizeMeasuredSize(rect: {
  width: number
  height: number
}): MeasuredScreenNodeSize {
  return {
    width: Math.max(1, Math.ceil(rect.width)),
    height: Math.max(1, Math.ceil(rect.height)),
  }
}

export function isScreenMeasurementComplete(
  expectedScreenIds: readonly string[],
  sizes: ScreenNodeSizeMap,
): boolean {
  return expectedScreenIds.every((id) => sizes.has(id))
}
```

In `src/shell/graph/build-react-flow-graph.ts`:

1. Remove `SCREEN_NODE_WIDTH` and `SCREEN_NODE_HEIGHT` constants.
2. Import `ScreenNodeSizeMap` from `./screen-node-size`.
3. Add optional `screenNodeSizes?: ScreenNodeSizeMap` to `BuildReactFlowGraphInput`.
4. In `buildScreenGraph`, resolve each node's size:

```ts
function buildScreenGraph({
  graph,
  routes,
  selectedId,
  positions,
  screenNodeSizes,
}: Omit<BuildReactFlowGraphInput, 'mode'> & {
  screenNodeSizes: ScreenNodeSizeMap
}): {
  nodes: ScreenGraphNodeType[]
  edges: Edge[]
} {
  // ...existing setup...

  const nodes: ScreenGraphNodeType[] = graph.nodes.flatMap((node) => {
    const route = routeById.get(node.id)
    const measured = screenNodeSizes.get(node.id)
    if (!route || !measured) return []

    return [
      {
        id: node.id,
        type: 'screen' as const,
        position: positions.get(node.id) ?? { x: 0, y: 0 },
        className: 'wireframe-graph-node',
        style: { width: measured.width, height: measured.height, zIndex: 2 },
        zIndex: 2,
        data: {
          screenId: node.id,
          title: node.title,
          isEntry: node.isEntry,
          selected: node.id === selectedId,
          outgoingLinkIds: outgoingByScreen.get(node.id) ?? [],
          component: route.component,
          validScreenIds,
          modalIdsByScreen,
          measuredSize: measured,
        },
      },
    ]
  })

  // ...edges unchanged...
}
```

5. In `buildReactFlowGraph`, when `mode === 'screen'`, require `screenNodeSizes`:

```ts
export function buildReactFlowGraph(input: BuildReactFlowGraphInput): {
  nodes: Node[]
  edges: Edge[]
} {
  if (input.mode === 'compact') {
    return buildCompactGraph(input)
  }

  if (!input.screenNodeSizes) {
    return { nodes: [], edges: [] }
  }

  return buildScreenGraph({ ...input, screenNodeSizes: input.screenNodeSizes })
}
```

6. Add `measuredSize: MeasuredScreenNodeSize` to `ScreenGraphNodeData` in `ScreenGraphNode.tsx` (type only in this task — implementation in Task 3).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/shell/graph/screen-node-size.test.ts src/shell/graph/build-react-flow-graph.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/graph/screen-node-size.ts src/shell/graph/screen-node-size.test.ts \
  src/shell/graph/build-react-flow-graph.ts src/shell/graph/build-react-flow-graph.test.ts \
  src/shell/graph/ScreenGraphNode.tsx
git commit -m "feat(graph): accept measured per-screen node sizes for Dagre layout"
```

---

### Task 2: Shared screen node shell and hidden measure layer

**Files:**
- Create: `src/shell/graph/ScreenGraphNodeShell.tsx`
- Create: `src/shell/graph/ScreenGraphMeasureLayer.tsx`

**Interfaces:**
- Consumes: `ScreenNodeSizeMap`, `normalizeMeasuredSize`, `isScreenMeasurementComplete` from Task 1; `RouteEntry`, `NavigationGraph`, `WireframeViewProvider`
- Produces:
  ```ts
  export type ScreenGraphNodeShellProps = {
    isEntry: boolean
    selected?: boolean
    width: number
    height: number
    containerRef?: RefObject<HTMLDivElement | null>
    children: ReactNode
  }

  export function ScreenGraphNodeShell(props: ScreenGraphNodeShellProps): JSX.Element

  export type ScreenGraphMeasureLayerProps = {
    graph: NavigationGraph
    routes: readonly RouteEntry[]
    onMeasured: (sizes: ScreenNodeSizeMap) => void
  }

  export function ScreenGraphMeasureLayer(props: ScreenGraphMeasureLayerProps): JSX.Element
  ```

- [ ] **Step 1: Implement ScreenGraphNodeShell**

`src/shell/graph/ScreenGraphNodeShell.tsx`:

```tsx
import type { ReactNode, RefObject } from 'react'
import { cn } from '@/lib/utils'

export type ScreenGraphNodeShellProps = {
  isEntry: boolean
  selected?: boolean
  width?: number
  height?: number
  containerRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
}

export function ScreenGraphNodeShell({
  isEntry,
  selected = false,
  width,
  height,
  containerRef,
  children,
}: ScreenGraphNodeShellProps) {
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative box-border w-fit border bg-background p-2',
        isEntry && 'border-2 border-foreground',
        selected && 'ring-2 ring-foreground',
      )}
      style={
        width !== undefined && height !== undefined
          ? { width, height }
          : undefined
      }
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Implement ScreenGraphMeasureLayer**

`src/shell/graph/ScreenGraphMeasureLayer.tsx`:

```tsx
import { type ComponentType, useLayoutEffect, useRef } from 'react'
import type { NavigationGraph } from '../../plugin/types'
import { WireframeViewProvider } from '@/runtime/WireframeViewContext'
import { modalIdsByScreenFromRoutes, type RouteEntry } from '../router'
import {
  isScreenMeasurementComplete,
  normalizeMeasuredSize,
  type ScreenNodeSizeMap,
} from './screen-node-size'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'

export type ScreenGraphMeasureLayerProps = {
  graph: NavigationGraph
  routes: readonly RouteEntry[]
  onMeasured: (sizes: ScreenNodeSizeMap) => void
}

type MeasureItemProps = {
  screenId: string
  isEntry: boolean
  component: ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  onSize: (screenId: string, size: { width: number; height: number }) => void
}

function MeasureItem({
  screenId,
  isEntry,
  component: Screen,
  validScreenIds,
  modalIdsByScreen,
  onSize,
}: MeasureItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    onSize(screenId, normalizeMeasuredSize(element.getBoundingClientRect()))
  })

  return (
    <ScreenGraphNodeShell isEntry={isEntry} containerRef={ref}>
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={validScreenIds}
        modalIdsByScreen={modalIdsByScreen}
      >
        <Screen />
      </WireframeViewProvider>
    </ScreenGraphNodeShell>
  )
}

export function ScreenGraphMeasureLayer({
  graph,
  routes,
  onMeasured,
}: ScreenGraphMeasureLayerProps) {
  const collectedRef = useRef(new Map<string, { width: number; height: number }>())
  const routeById = new Map(routes.map((route) => [route.id, route]))
  const validScreenIds = routes.map((route) => route.id)
  const modalIdsByScreen = modalIdsByScreenFromRoutes(routes)
  const expectedScreenIds = graph.nodes
    .map((node) => node.id)
    .filter((id) => routeById.has(id))

  const handleSize = (screenId: string, size: { width: number; height: number }) => {
    collectedRef.current.set(screenId, size)
    if (isScreenMeasurementComplete(expectedScreenIds, collectedRef.current)) {
      onMeasured(collectedRef.current)
    }
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0"
      style={{ visibility: 'hidden' }}
    >
      {graph.nodes.map((node) => {
        const route = routeById.get(node.id)
        if (!route) return null
        return (
          <MeasureItem
            key={node.id}
            screenId={node.id}
            isEntry={node.isEntry}
            component={route.component}
            validScreenIds={validScreenIds}
            modalIdsByScreen={modalIdsByScreen}
            onSize={handleSize}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: PASS (or only unrelated pre-existing issues)

- [ ] **Step 4: Commit**

```bash
git add src/shell/graph/ScreenGraphNodeShell.tsx src/shell/graph/ScreenGraphMeasureLayer.tsx
git commit -m "feat(graph): add hidden screen measure layer for node sizing"
```

---

### Task 3: Refactor ScreenGraphNode to use measured sizes

**Files:**
- Modify: `src/shell/graph/ScreenGraphNode.tsx`

**Interfaces:**
- Consumes: `ScreenGraphNodeShell`, `measuredSize` on `ScreenGraphNodeData` from Task 1
- Produces: `ScreenGraphNode` rendering wireframe at natural size inside measured shell (no CSS scale)

- [ ] **Step 1: Replace fixed box + scale with shared shell**

`src/shell/graph/ScreenGraphNode.tsx`:

```tsx
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { type ComponentType, useRef } from 'react'
import { WireframeViewProvider } from '@/runtime/WireframeViewContext'
import type { MeasuredScreenNodeSize } from './screen-node-size'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'
import { useGraphLinkHandles } from './useGraphLinkHandles'

export type ScreenGraphNodeData = {
  screenId: string
  title: string
  isEntry: boolean
  selected: boolean
  outgoingLinkIds: string[]
  component: ComponentType
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  measuredSize: MeasuredScreenNodeSize
}

export type ScreenGraphNodeType = Node<ScreenGraphNodeData, 'screen'>

export function ScreenGraphNode({ data }: NodeProps<ScreenGraphNodeType>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handles = useGraphLinkHandles(containerRef, data.outgoingLinkIds)
  const Screen = data.component

  return (
    <ScreenGraphNodeShell
      containerRef={containerRef}
      isEntry={data.isEntry}
      selected={data.selected}
      width={data.measuredSize.width}
      height={data.measuredSize.height}
    >
      <WireframeViewProvider
        view="graph"
        navigate={() => {}}
        validScreenIds={data.validScreenIds}
        modalIdsByScreen={data.modalIdsByScreen}
      >
        <Screen />
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
    </ScreenGraphNodeShell>
  )
}
```

Note: move `Handle` elements inside the shell so positions stay relative to the measured container (same as before).

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/shell/graph/ScreenGraphNode.tsx
git commit -m "refactor(graph): render screen nodes at measured natural size"
```

---

### Task 4: Graph loading state and GraphView orchestration

**Files:**
- Create: `src/shell/graph/GraphLoadingState.tsx`
- Modify: `src/shell/GraphView.tsx`

**Interfaces:**
- Consumes: `ScreenGraphMeasureLayer`, `ScreenNodeSizeMap`, `buildReactFlowGraph`, `layoutNavigationGraph`, `useWireframeDisplayPreferences`
- Produces: Screen mode gated behind measure pass; compact mode immediate; no visible graph until sizes known

- [ ] **Step 1: Implement GraphLoadingState**

`src/shell/graph/GraphLoadingState.tsx`:

```tsx
import { Loader2 } from 'lucide-react'

export function GraphLoadingState() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">Laying out graph</span>
    </div>
  )
}
```

- [ ] **Step 2: Wire measure → layout → render in GraphView**

Key changes in `src/shell/GraphView.tsx`:

1. Remove imports of `SCREEN_NODE_WIDTH` / `SCREEN_NODE_HEIGHT`.
2. Import `GraphLoadingState`, `ScreenGraphMeasureLayer`, `ScreenNodeSizeMap`.
3. Import `useWireframeDisplayPreferences` from `@/runtime/WireframeDisplayPreferences`.
4. Add state:

```tsx
const [screenNodeSizes, setScreenNodeSizes] = useState<ScreenNodeSizeMap | null>(null)
const { showLinkIndicators, showNoteIndicators } = useWireframeDisplayPreferences()

const measureKey = `${graphSignature}|${showLinkIndicators}|${showNoteIndicators}`
```

5. Reset sizes when measurement inputs change:

```tsx
useEffect(() => {
  if (mode !== 'screen') {
    setScreenNodeSizes(null)
    return
  }
  setScreenNodeSizes(null)
}, [measureKey, mode])
```

6. Compute layout only when sizes are ready (screen mode) or immediately (compact):

```tsx
const positions = useMemo(() => {
  const layoutNodes =
    mode === 'compact'
      ? navigationGraph.nodes.map((node) => ({
          id: node.id,
          width: COMPACT_NODE_WIDTH,
          height: COMPACT_NODE_HEIGHT,
        }))
      : screenNodeSizes
        ? navigationGraph.nodes.flatMap((node) => {
            const size = screenNodeSizes.get(node.id)
            return size ? [{ id: node.id, width: size.width, height: size.height }] : []
          })
        : []

  if (layoutNodes.length !== navigationGraph.nodes.length) {
    return new Map<string, { x: number; y: number }>()
  }

  const layoutEdges = navigationGraph.edges.map((edge) => ({
    id: edge.id,
    from: edge.fromScreenId,
    to: edge.toScreenId,
  }))

  return layoutNavigationGraph(layoutNodes, layoutEdges)
}, [navigationGraph, mode, screenNodeSizes])
```

7. Pass sizes into `buildReactFlowGraph`:

```tsx
const flowGraph = useMemo(
  () =>
    buildReactFlowGraph({
      graph: navigationGraph,
      routes,
      mode,
      selectedId,
      positions,
      screenNodeSizes: mode === 'screen' ? (screenNodeSizes ?? undefined) : undefined,
    }),
  [navigationGraph, routes, mode, selectedId, positions, screenNodeSizes],
)
```

8. Gate canvas render:

```tsx
const isScreenLayoutReady = mode === 'compact' || screenNodeSizes !== null

// inside return, replace the ReactFlowProvider block body:
<div className="relative h-full">
  {mode === 'screen' && screenNodeSizes === null ? (
    <>
      <ScreenGraphMeasureLayer
        graph={navigationGraph}
        routes={routes}
        onMeasured={setScreenNodeSizes}
      />
      <GraphLoadingState />
    </>
  ) : null}
  {isScreenLayoutReady ? (
    <ReactFlowProvider>
      <div className="h-full">
        <GraphFlowCanvas
          flowGraph={flowGraph}
          graphSignature={graphSignature}
          mode={mode}
          layoutResetKey={layoutResetKey}
          selectedId={selectedId}
          onSelectNode={onSelectNode}
          onClearSelection={onClearSelection}
          onRequestLayoutReset={onRequestLayoutReset}
        />
      </div>
    </ReactFlowProvider>
  ) : null}
</div>
```

9. Keep toolbar visible during loading so mode toggle still works.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Verify:
1. Open Graph View → brief spinner, then graph with tight node bounds (home node much smaller than login/signup).
2. No visible node jump after first paint.
3. Switch to Compact → immediate layout, fixed cards.
4. Switch back to Screen → spinner, remeasure, selected node centered.
5. Toggle link/note indicators → brief remeasure, graph updates.
6. Reset layout button still fits view.

- [ ] **Step 4: Commit**

```bash
git add src/shell/graph/GraphLoadingState.tsx src/shell/GraphView.tsx
git commit -m "feat(graph): measure screen nodes before layout with loading gate"
```

---

### Task 5: Layout tests and final verification

**Files:**
- Modify: `src/shell/graph/layout-navigation-graph.test.ts`

**Interfaces:**
- Consumes: existing `layoutNavigationGraph`

- [ ] **Step 1: Add heterogeneous size layout test**

Append to `src/shell/graph/layout-navigation-graph.test.ts`:

```ts
  it('spaces nodes using each node own width and height', () => {
    const positions = layoutNavigationGraph(
      [
        { id: 'home', width: 120, height: 80 },
        { id: 'login', width: 280, height: 360 },
      ],
      [{ id: 'e1', from: 'home', to: 'login' }],
    )

    const home = positions.get('home')
    const login = positions.get('login')
    expect(home).toBeDefined()
    expect(login).toBeDefined()
    expect(login?.y).toBeGreaterThan((home?.y ?? 0) + 80)
  })
```

- [ ] **Step 2: Run full verification**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: `npm run check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/shell/graph/layout-navigation-graph.test.ts
git commit -m "test(graph): cover heterogeneous node sizes in Dagre layout"
```

---

## Self-review

**Spec coverage:**
| Requirement | Task |
|-------------|------|
| Variable screen node size for layout | Tasks 1, 2, 4 |
| Screen View wireframe content, link-anchored edges | Task 3 (`useGraphLinkHandles` unchanged) |
| No visible layout jump on open | Task 4 (spinner gate) |
| Compact mode unchanged | Task 4 (compact bypasses measure) |
| Mode switch relayout + selection centering | Task 4 (existing `GraphFlowCanvas` effects) |
| Indicator toggles affect rendered size | Task 4 (`measureKey` includes prefs) |

**Placeholder scan:** None.

**Type consistency:** `ScreenNodeSizeMap`, `MeasuredScreenNodeSize`, `measuredSize` on node data, and `screenNodeSizes` on `BuildReactFlowGraphInput` align across tasks.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-27-graph-screen-node-measure-layout.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
