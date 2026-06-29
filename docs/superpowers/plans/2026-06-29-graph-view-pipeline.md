# Graph View Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract GraphView's measure→layout→render state machine into a deep `useGraphPipeline` hook so GraphView becomes a thin ReactFlow adapter with testable orchestration logic.

**Architecture:** `useGraphPipeline` owns: measure gate (`screenNodeSizes`), Dagre layout inputs, dual-phase `buildReactFlowGraph` (nodes then edges with `linkRectsByScreen`), highlight/focus/selection state, and `layoutSignature`. Returns `{ phase, nodes, edges, measureLayer, layoutSignature, handlers }`. GraphView renders toolbar + conditional measure layer + ReactFlow canvas only.

**Tech Stack:** React 19, TypeScript 6, `@xyflow/react`, Vitest + `@testing-library/react` (if available) or hook logic extracted to pure `prepareGraphPipelineState` for unit tests

## Global Constraints

- Run `npm run build` + `npm run check` before claiming done
- Graph View UX unchanged per `docs/GRAPH_VIEW.md`
- No new dependencies unless `@testing-library/react` already present — prefer pure function tests
- Import `NavigationGraph` from `@/types/navigation` (complete shared-types plan first, or use plugin types temporarily)
- Min diff

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/shell/graph/graph-pipeline.ts` | Pure pipeline state: phases, layout, buildReactFlowGraph orchestration |
| `src/shell/graph/graph-pipeline.test.ts` | Unit tests without ReactFlow |
| `src/shell/graph/useGraphPipeline.ts` | React hook wrapping graph-pipeline + measure rects state |
| `src/shell/GraphView.tsx` | Thin: toolbar, hook, GraphFlowCanvas |

---

### Task 1: Pure graph pipeline state machine

**Files:**
- Create: `src/shell/graph/graph-pipeline.ts`
- Create: `src/shell/graph/graph-pipeline.test.ts`

**Interfaces:**
- Consumes: `NavigationGraph`, `routes`, `GraphDisplayMode`, `ScreenNodeSizeMap | null`, `linkRectsByScreen`, `selectedId`, preferences flags
- Produces:
  ```ts
  export type GraphPipelinePhase = 'measuring' | 'layout-pending' | 'ready'

  export type GraphPipelineInput = {
    graph: NavigationGraph
    routes: readonly RouteEntry[]
    mode: GraphDisplayMode
    screenNodeSizes: ScreenNodeSizeMap | null
    linkRectsByScreen: Map<string, Map<string, NodeRect>>
    selectedId: string | null
    showLinkIndicators: boolean
    showNoteIndicators: boolean
    layoutResetKey: number
  }

  export type GraphPipelineOutput = {
    phase: GraphPipelinePhase
    positions: Map<string, { x: number; y: number }>
    nodes: Node[]
    edges: Edge[]
    layoutSignature: string
    measureKey: string
    needsMeasureLayer: boolean
  }

  export function computeGraphPipeline(input: GraphPipelineInput): GraphPipelineOutput
  ```

- [ ] **Step 1: Write failing test for phase transitions**

```ts
import { describe, expect, it } from 'vitest'
import { computeGraphPipeline } from './graph-pipeline'

const minimalGraph = {
  nodes: [{ id: 'a', title: 'A', order: 0, isEntry: true }],
  edges: [],
}

describe('computeGraphPipeline', () => {
  it('returns measuring phase in screen mode without sizes', () => {
    const out = computeGraphPipeline({
      graph: minimalGraph,
      routes: [{ id: 'a', path: '/a', component: () => null }],
      mode: 'screen',
      screenNodeSizes: null,
      linkRectsByScreen: new Map(),
      selectedId: null,
      showLinkIndicators: true,
      showNoteIndicators: true,
      layoutResetKey: 0,
    })
    expect(out.phase).toBe('measuring')
    expect(out.needsMeasureLayer).toBe(true)
  })

  it('returns ready phase in compact mode without measure', () => {
    const out = computeGraphPipeline({
      graph: minimalGraph,
      routes: [{ id: 'a', path: '/a', component: () => null }],
      mode: 'compact',
      screenNodeSizes: null,
      linkRectsByScreen: new Map(),
      selectedId: null,
      showLinkIndicators: true,
      showNoteIndicators: true,
      layoutResetKey: 0,
    })
    expect(out.phase).toBe('ready')
    expect(out.nodes.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/shell/graph/graph-pipeline.test.ts`

- [ ] **Step 3: Implement by extracting logic from GraphView.tsx**

Move into `computeGraphPipeline`:
- `graphSignature` / `measureKey` computation (lines 212–218)
- `positions` useMemo body (lines 232–258)
- `flowGraphInput` + dual `buildReactFlowGraph` calls (lines 284–318)
- `isScreenLayoutReady` / phase derivation
- `layoutSignature` computation (lines 322–328)

Keep imports from existing modules: `layoutNavigationGraph`, `buildReactFlowGraph`, compact node dimensions.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shell/graph/graph-pipeline.ts src/shell/graph/graph-pipeline.test.ts
git commit -m "feat(graph): pure graph pipeline state machine"
```

---

### Task 2: useGraphPipeline hook

**Files:**
- Create: `src/shell/graph/useGraphPipeline.ts`

**Interfaces:**
- Produces:
  ```ts
  export type UseGraphPipelineArgs = {
    navigationGraph: NavigationGraph
    routes: readonly RouteEntry[]
    mode: GraphDisplayMode
    showLinkIndicators: boolean
    showNoteIndicators: boolean
  }

  export function useGraphPipeline(args: UseGraphPipelineArgs): {
    pipeline: GraphPipelineOutput
    screenNodeSizes: ScreenNodeSizeMap | null
    setScreenNodeSizes: (sizes: ScreenNodeSizeMap) => void
    selectedId: string | null
    highlightedLinkId: string | null
    focusTargetScreenId: string | null
    layoutResetKey: number
    linkRectsByScreen: Map<string, Map<string, NodeRect>>
    onSelectNode: (id: string) => void
    onClearSelection: () => void
    onGraphLinkHover: (linkId: string | null) => void
    onGraphLinkFocus: (linkId: string, targetScreenId: string) => void
    onFocusTargetHandled: () => void
    onLinkRects: (screenId: string, rects: Map<string, NodeRect>) => void
    onRequestLayoutReset: () => void
    setMode: (mode: GraphDisplayMode) => void
    mode: GraphDisplayMode
  }
  ```

- [ ] **Step 1: Move React state from GraphView into hook**

State to move:
- `mode`, `selectedId`, `layoutResetKey`, `screenNodeSizes`, `highlightedLinkId`, `focusTargetScreenId`, `linkRectsByScreen`
- `prevMeasureInputsRef` effect for resetting sizes on measureKey change
- All `useCallback` handlers

Call `computeGraphPipeline` inside `useMemo` with current state.

- [ ] **Step 2: Verify build compiles**

Run: `npm run check`
Expected: PASS (hook unused until Task 3)

- [ ] **Step 3: Commit**

```bash
git add src/shell/graph/useGraphPipeline.ts
git commit -m "feat(graph): useGraphPipeline hook"
```

---

### Task 3: Slim GraphView

**Files:**
- Modify: `src/shell/GraphView.tsx`

- [ ] **Step 1: Replace inline state with useGraphPipeline**

```tsx
export function GraphView({ navigationGraph, routes, documentFilename }: GraphViewProps) {
  const { showLinkIndicators, showNoteIndicators } = useWireframeDisplayPreferences()
  const pipeline = useGraphPipeline({
    navigationGraph,
    routes,
    showLinkIndicators,
    showNoteIndicators,
  })

  // codegen error checks unchanged
  // toolbar uses pipeline.mode / pipeline.setMode
  // measure layer when pipeline.pipeline.needsMeasureLayer
  // GraphFlowCanvas when pipeline.pipeline.phase === 'ready'
}
```

- [ ] **Step 2: Delete duplicated logic now in hook/pipeline**

GraphView should drop below ~150 lines of orchestration.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
Verify: Graph tab loads, Screen/Compact toggle works, edges anchor, hover highlight, fit view, minimap.

- [ ] **Step 4: Run automated checks**

Run: `npm test && npm run build && npm run check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/GraphView.tsx
git commit -m "refactor(graph): GraphView uses useGraphPipeline"
```

---

### Task 4: Pipeline edge case tests

**Files:**
- Modify: `src/shell/graph/graph-pipeline.test.ts`

- [ ] **Step 1: Add test — dual buildReactFlowGraph produces edges with linkRects**

Use fixture graph with one edge; provide `linkRectsByScreen` map; assert edge count and `layoutSignature` changes when positions change.

- [ ] **Step 2: Add test — layoutResetKey changes signature**

- [ ] **Step 3: Run tests**

Run: `npm test -- src/shell/graph/graph-pipeline.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/shell/graph/graph-pipeline.test.ts
git commit -m "test(graph): pipeline layout signature and edge cases"
```

---

## Self-review checklist

- [x] Phase machine covers screen measure gate
- [x] Dual buildReactFlowGraph preserved inside pipeline
- [x] GraphView UX requirements delegated to existing GraphFlowCanvas unchanged
- [x] No placeholders
