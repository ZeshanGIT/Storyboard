# Graph Link-Anchored Edges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In Screen View, draw edges from the **center of each navigable Link control** to the **best boundary side** of the destination screen — Figma-prototype-style — without nested React Flow subgraph nodes.

**Architecture:** Keep one React Flow node per screen (Dagre layout unchanged). Per outgoing edge, place an invisible `Handle` at the measured center of the matching `[data-graph-link-id]` element inside the screen node. Target side (`in-top` / `in-bottom` / `in-left` / `in-right`) comes from `computeTargetPort(linkRect, targetScreenRect)` — same geometry as screen↔screen port picking, but source is the link’s tiny rect. Edges stay above screens (`z-index` 3); wireframe link content stacks above handles inside the node (`z-10`). Compact View keeps boundary-only edges. Link-hover edge highlight (already shipped) is preserved.

**Tech Stack:** React 19, TypeScript 6, Vitest, `@xyflow/react` 12, `@dagrejs/dagre` 3 (layout only), codegen `NavigationEdge.linkId`

**Spec:** [`docs/GRAPH_VIEW.md`](../../GRAPH_VIEW.md) — update Screen View edges section (Task 6)

---

## Background for a new agent

### The problem

Graph View should answer: *“Which control on this screen leads to which screen?”* Authors expect prototype-style connectors (Figma reference) — lines start at the **button/link**, curve cleanly, and land on the **nearest sensible side** of the destination screen.

**Current state (after commit `da6b71b`):** Screen View uses **screen-boundary** edges only. Every edge exits a boundary handle (`out-*`) and enters a boundary handle (`in-*`) chosen by `computeEdgePorts(sourceScreen, targetScreen)`. Hovering a link highlights the matching edge, but the line does not originate at the link control.

**Earlier attempt (reverted in `da6b71b`):** DOM-measured per-link handles with `getBoundingClientRect` without zoom correction. Edges broke on pan/zoom/click. Code was deleted (`useGraphLinkHandles.ts`, `measure-link-handle-positions.ts`). See `git show da6b71b^:src/shell/graph/useGraphLinkHandles.ts` for the old hook shape.

**Rejected for now:** Nested React Flow nodes (screen = parent, link = child). High complexity; same visual result achievable with custom handles inside one screen node.

### Where to look

| Topic | Location |
|-------|----------|
| UX spec | [`docs/GRAPH_VIEW.md`](../../GRAPH_VIEW.md) |
| Architecture / commands | [`AGENTS.md`](../../../AGENTS.md), [`docs/CONTEXT.md`](../../CONTEXT.md) |
| Prior boundary-edge plan (shipped) | [`docs/superpowers/plans/2026-06-27-graph-screen-boundary-edges.md`](2026-06-27-graph-screen-boundary-edges.md) |
| Screen node measure gate | [`src/shell/graph/ScreenGraphMeasureLayer.tsx`](../../../src/shell/graph/ScreenGraphMeasureLayer.tsx) |
| Screen RF node | [`src/shell/graph/ScreenGraphNode.tsx`](../../../src/shell/graph/ScreenGraphNode.tsx) |
| Boundary handles (target sides) | [`src/shell/graph/BoundaryHandles.tsx`](../../../src/shell/graph/BoundaryHandles.tsx) |
| Port geometry | [`src/shell/graph/compute-edge-ports.ts`](../../../src/shell/graph/compute-edge-ports.ts) |
| Edge builder | [`src/shell/graph/build-react-flow-graph.ts`](../../../src/shell/graph/build-react-flow-graph.ts) |
| Canvas + hover highlight | [`src/shell/GraphView.tsx`](../../../src/shell/GraphView.tsx) |
| Link `graph-link-id` injection | [`src/plugin/inject-graph-link-ids.ts`](../../../src/plugin/inject-graph-link-ids.ts) |
| Link graph attrs + hover | [`src/components/wireframe/Link.tsx`](../../../src/components/wireframe/Link.tsx) |
| `linkId` on edges | codegen `NavigationEdge` in [`src/plugin/types.ts`](../../../src/plugin/types.ts) |
| Canonical example MDX | [`src/content/wireframe.mdx`](../../../src/content/wireframe.mdx) |

### Key IDs and data flow

```
MDX <Link goto="login">
  → codegen NavigationEdge { linkId: "home:0", fromScreenId, toScreenId }
  → inject-graph-link-ids adds graph-link-id="home:0" on Link JSX
  → buildReactFlowGraph: edge { sourceHandle: "home:0", targetHandle: "in-top", data: { linkId } }
  → ScreenGraphNode: invisible Handle id="home:0" at measured center of [data-graph-link-id="home:0"]
  → Link hover → GraphView highlightedLinkId → edge dim/highlight CSS
```

### Lessons (do not repeat)

1. **Never use raw viewport `getBoundingClientRect` deltas as Handle `left`/`top`** — divide by `containerRect.width / offsetWidth` (zoom scale). See removed `viewportDeltaToLocal` in `git show da6b71b^:src/shell/graph/measure-link-handle-positions.ts`.
2. **Call `updateNodeInternals(nodeId)`** after handle positions change and on viewport `transform` change (`useStore`).
3. **Do not rebuild `flowGraph.nodes` on hover** — only update edges for highlight (see `GraphFlowCanvas` in `GraphView.tsx`).
4. **No `hover:underline` on graph links** — causes layout shift / flicker (`Link.tsx`).

## Global Constraints

- Graph View is third shell tab; active document picker applies
- Screen View: wireframe per node; edges stable under pan/zoom/selection
- **Compact View unchanged** — boundary edges only
- Multiple parallel links = multiple edges with distinct `linkId`
- `_back` / `_close` / modal links → no screen→screen edges (codegen unchanged)
- No brand colors, shadows, or typography systems on graph chrome
- Min diff; no new npm dependencies; do not hand-edit `src/generated/`
- Run `npm run build` + `npm run check` before claiming done
- `npm run test` for touched graph/plugin files

---

## File structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/shell/graph/measure-link-handle-positions.ts` | Create | Scale-correct link center measurement |
| `src/shell/graph/measure-link-handle-positions.test.ts` | Create | Unit tests for viewport→local conversion |
| `src/shell/graph/compute-edge-ports.ts` | Modify | Add `computeTargetPort`, `linkCenterToRect` |
| `src/shell/graph/compute-edge-ports.test.ts` | Modify | Tests for link→screen target side |
| `src/shell/graph/useGraphLinkHandles.ts` | Create | Measure + `updateNodeInternals` hook |
| `src/shell/graph/ScreenGraphNode.tsx` | Modify | Per-link handles, z-index layering |
| `src/shell/graph/build-react-flow-graph.ts` | Modify | Screen edges: `sourceHandle: linkId`, dynamic `targetHandle` |
| `src/shell/graph/build-react-flow-graph.test.ts` | Modify | Screen edge handle assertions |
| `src/shell/graph/graph-view.css` | Modify | Link-handle + layer comments |
| `src/shell/GraphView.tsx` | Modify | Optional: merge link positions into target ports (Task 5) |
| `docs/GRAPH_VIEW.md` | Modify | Screen View edge copy |
| `docs/CONTEXT.md` | Modify | One-line behavior note |

**Do not change:** `BoundaryHandles.tsx` (target handles), `CompactGraphNode.tsx`, Dagre layout, codegen plugins (unless tests require).

---

### Task 1: Link center measurement (scale-correct)

**Files:**
- Create: `src/shell/graph/measure-link-handle-positions.ts`
- Create: `src/shell/graph/measure-link-handle-positions.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GraphLinkHandlePosition = { x: number; y: number }

  export function viewportDeltaToLocal(
    deltaX: number,
    deltaY: number,
    container: Pick<HTMLElement, 'offsetWidth' | 'offsetHeight'>,
    containerViewport: Pick<DOMRect, 'width' | 'height'>,
  ): GraphLinkHandlePosition

  export function measureLinkHandlePositions(
    container: HTMLElement,
    linkIds: readonly string[],
  ): Map<string, GraphLinkHandlePosition>
  ```

- [ ] **Step 1: Write failing tests**

`src/shell/graph/measure-link-handle-positions.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { viewportDeltaToLocal } from './measure-link-handle-positions'

describe('viewportDeltaToLocal', () => {
  it('returns deltas unchanged at zoom 1', () => {
    expect(
      viewportDeltaToLocal(
        60,
        40,
        { offsetWidth: 200, offsetHeight: 100 },
        { width: 200, height: 100 },
      ),
    ).toEqual({ x: 60, y: 40 })
  })

  it('divides by zoom when zoomed in', () => {
    expect(
      viewportDeltaToLocal(
        120,
        80,
        { offsetWidth: 200, offsetHeight: 100 },
        { width: 400, height: 200 },
      ),
    ).toEqual({ x: 60, y: 40 })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/shell/graph/measure-link-handle-positions.test.ts`

- [ ] **Step 3: Implement**

`measure-link-handle-positions.ts` — measure **center** of each `[data-graph-link-id]`:

```ts
const center = linkCenterViewportDelta(rect, containerRect)
const position = viewportDeltaToLocal(center.x, center.y, container, containerRect)

function linkCenterViewportDelta(
  linkRect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  containerRect: Pick<DOMRect, 'left' | 'top'>,
): { x: number; y: number } {
  return {
    x: linkRect.left - containerRect.left + linkRect.width / 2,
    y: linkRect.top - containerRect.top + linkRect.height / 2,
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shell/graph/measure-link-handle-positions.ts src/shell/graph/measure-link-handle-positions.test.ts
git commit -m "feat(graph): add zoom-correct link center measurement"
```

---

### Task 2: Target port from link rect to screen rect

**Files:**
- Modify: `src/shell/graph/compute-edge-ports.ts`
- Modify: `src/shell/graph/compute-edge-ports.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function linkCenterToRect(
    center: { x: number; y: number },
    size?: number,
  ): NodeRect

  export function computeTargetPort(
    linkRect: NodeRect,
    targetScreen: NodeRect,
  ): string  // e.g. 'in-top'
  ```

- [ ] **Step 1: Write failing tests**

```ts
describe('computeTargetPort', () => {
  it('targets top when link is above screen', () => {
    const link = linkCenterToRect({ x: 50, y: 10 })
    const screen = { x: 0, y: 100, width: 100, height: 80 }
    expect(computeTargetPort(link, screen)).toBe('in-top')
  })

  it('targets bottom when link is below screen', () => {
    const link = linkCenterToRect({ x: 50, y: 200 })
    const screen = { x: 0, y: 0, width: 100, height: 80 }
    expect(computeTargetPort(link, screen)).toBe('in-bottom')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement**

Reuse `computeEdgePorts` internally; return only `targetHandle`:

```ts
export function linkCenterToRect(
  center: { x: number; y: number },
  size = 2,
): NodeRect {
  const half = size / 2
  return {
    x: center.x - half,
    y: center.y - half,
    width: size,
    height: size,
  }
}

export function computeTargetPort(linkRect: NodeRect, targetScreen: NodeRect): string {
  return computeEdgePorts(linkRect, targetScreen).targetHandle
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shell/graph/compute-edge-ports.ts src/shell/graph/compute-edge-ports.test.ts
git commit -m "feat(graph): compute target port from link rect to screen"
```

---

### Task 3: useGraphLinkHandles hook

**Files:**
- Create: `src/shell/graph/useGraphLinkHandles.ts`

**Interfaces:**
- Consumes: `measureLinkHandlePositions`
- Produces: `useGraphLinkHandles(containerRef, linkIds) → Map<linkId, {x,y}>`

- [ ] **Step 1: Implement hook**

Pattern (from pre-`da6b71b` code, fixed):

```ts
import { useNodeId, useStore, useUpdateNodeInternals } from '@xyflow/react'
import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { measureLinkHandlePositions, type GraphLinkHandlePosition } from './measure-link-handle-positions'

export function useGraphLinkHandles(
  containerRef: RefObject<HTMLDivElement | null>,
  linkIds: readonly string[],
): Map<string, GraphLinkHandlePosition> {
  const nodeId = useNodeId()
  const updateNodeInternals = useUpdateNodeInternals()
  const transform = useStore((state) => state.transform)
  const [handles, setHandles] = useState<Map<string, GraphLinkHandlePosition>>(() => new Map())
  const [version, setVersion] = useState(0)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    setHandles(measureLinkHandlePositions(container, linkIds))
    setVersion((v) => v + 1)
  }, [containerRef, linkIds])

  useLayoutEffect(() => {
    if (nodeId) updateNodeInternals(nodeId)
  }, [version, transform, nodeId, updateNodeInternals])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, measure])

  return handles
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`

- [ ] **Step 3: Commit**

```bash
git add src/shell/graph/useGraphLinkHandles.ts
git commit -m "feat(graph): restore link handle measurement hook with zoom fix"
```

---

### Task 4: ScreenGraphNode — per-link source handles + layering

**Files:**
- Modify: `src/shell/graph/ScreenGraphNode.tsx`
- Modify: `src/shell/graph/ScreenGraphNodeShell.tsx` (if `containerRef` needed on shell)
- Modify: `src/shell/graph/graph-view.css`

**Interfaces:**
- Consumes: `outgoingLinkIds: string[]` on `ScreenGraphNodeData` (re-add from `build-react-flow-graph`)
- Renders: `BoundaryHandles` (targets only is OK — keep all 8) + per-link `Handle` sources

- [ ] **Step 1: Update ScreenGraphNode**

```tsx
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { type ComponentType, useRef } from 'react'
// ...existing imports...
import { useGraphLinkHandles } from './useGraphLinkHandles'

export type ScreenGraphNodeData = {
  // ...existing fields...
  outgoingLinkIds: string[]
}

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
      <BoundaryHandles className="wireframe-graph-boundary-handle" />
      {data.outgoingLinkIds.map((linkId) => {
        const point = handles.get(linkId)
        if (!point) return null
        return (
          <Handle
            key={linkId}
            id={linkId}
            type="source"
            position={Position.Right}
            style={{
              left: point.x,
              top: point.y,
              transform: 'translate(-50%, -50%)',
            }}
            className="wireframe-graph-link-handle"
          />
        )
      })}
      <div className="relative z-10">
        <WireframeViewProvider
          view="graph"
          navigate={() => {}}
          validScreenIds={data.validScreenIds}
          modalIdsByScreen={data.modalIdsByScreen}
          onGraphLinkHover={data.onGraphLinkHover}
        >
          <Screen />
        </WireframeViewProvider>
      </div>
    </ScreenGraphNodeShell>
  )
}
```

`position={Position.Right}` sets bezier exit direction; actual anchor is `left`/`top`.

- [ ] **Step 2: CSS layering**

`graph-view.css`:

```css
/* Handles behind wireframe content; edges (z-index 3) above screen node (z-index 2) */
.react-flow__handle.wireframe-graph-link-handle {
  opacity: 0;
  width: 1px;
  height: 1px;
  min-width: 0;
  min-height: 0;
  border: none;
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 3: Re-add `outgoingLinkIds` in buildScreenGraph**

In `build-react-flow-graph.ts`, restore `outgoingByScreen` map; pass `outgoingLinkIds` on node `data`.

- [ ] **Step 4: Manual smoke — handles only**

Run: `npm run dev` → Graph View → edges should start nearer link centers (target still screen-screen ports until Task 5).

- [ ] **Step 5: Commit**

```bash
git add src/shell/graph/ScreenGraphNode.tsx src/shell/graph/graph-view.css src/shell/graph/build-react-flow-graph.ts
git commit -m "feat(graph): anchor screen view edge sources at link centers"
```

---

### Task 5: Per-edge target ports from measured link positions

**Files:**
- Modify: `src/shell/graph/build-react-flow-graph.ts`
- Modify: `src/shell/GraphView.tsx`
- Modify: `src/shell/graph/build-react-flow-graph.test.ts`

**Problem:** At graph build time, link centers are unknown. Target port must update after measurement.

**Architecture:** Screen nodes report `Map<linkId, {x,y}>` (parent-local) via callback. `GraphView` stores `linkPositionsByScreen`. When building edges for screen mode, convert link center to flow coords and call `computeTargetPort`.

**Interfaces:**
- `ScreenGraphNodeData.onLinkPositions?: (positions: Map<string, {x,y}>) => void`
- `GraphView` state: `linkPositionsByScreen: Map<string, Map<string, {x,y}>>`

- [ ] **Step 1: Add callback wiring**

`useGraphLinkHandles` — after measure, invoke optional `onMeasured(positions)` prop (thread from `ScreenGraphNode` → `GraphView`).

`GraphView`:

```ts
const [linkPositionsByScreen, setLinkPositionsByScreen] = useState<
  Map<string, Map<string, { x: number; y: number }>>
>(() => new Map())

const onLinkPositions = useCallback((screenId: string, positions: Map<string, { x: number; y: number }>) => {
  setLinkPositionsByScreen((prev) => {
    const next = new Map(prev)
    next.set(screenId, positions)
    return next
  })
}, [])
```

Pass `onLinkPositions` into `buildReactFlowGraph` → screen node `data`.

- [ ] **Step 2: Screen-mode edge builder**

Split `buildGraphEdges` into compact (screen-screen ports) vs screen:

```ts
function buildScreenGraphEdges(
  graph: NavigationGraph,
  getScreenRect: (id: string) => NodeRect | undefined,
  linkPositionsByScreen: Map<string, Map<string, { x: number; y: number }>>,
  screenPositions: Map<string, { x: number; y: number }>,
): Edge[] {
  return graph.edges.map((edge) => {
    const targetRect = getScreenRect(edge.toScreenId)
    const localLink = linkPositionsByScreen.get(edge.fromScreenId)?.get(edge.linkId)
    const sourcePos = screenPositions.get(edge.fromScreenId)

    let targetHandle = 'in-top'
    if (targetRect && localLink && sourcePos) {
      const linkInFlow = linkCenterToRect({
        x: sourcePos.x + localLink.x,
        y: sourcePos.y + localLink.y,
      })
      targetHandle = computeTargetPort(linkInFlow, targetRect)
    } else if (targetRect) {
      const sourceRect = getScreenRect(edge.fromScreenId)
      if (sourceRect) targetHandle = computeEdgePorts(sourceRect, targetRect).targetHandle
    }

    return {
      id: edge.id,
      source: edge.fromScreenId,
      target: edge.toScreenId,
      sourceHandle: edge.linkId,
      targetHandle,
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { linkId: edge.linkId },
      zIndex: GRAPH_EDGE_Z_INDEX,
      interactionWidth: 20,
    }
  })
}
```

- [ ] **Step 3: Update edges when link positions change**

In `GraphFlowCanvas`, add `useEffect` that only updates edges when `linkPositionsByScreen` changes — do **not** call `setNodes`.

Include `linkPositionsByScreen` in `baseFlowGraph` useMemo deps in `GraphView`.

- [ ] **Step 4: Tests**

Update `build-react-flow-graph.test.ts` — screen edge has `sourceHandle: 'home:0'`.

- [ ] **Step 5: Manual smoke on `wireframe.mdx`**

Verify:
1. `home → login` / `home → signup` start at Login / Create account centers
2. `login → home` / `signup → home` enter **bottom** of Welcome (not through signup)
3. Zoom in/out, click nodes — anchors stable
4. Hover link and edge — highlight + dim still work
5. Compact mode unchanged

- [ ] **Step 6: Commit**

```bash
git add src/shell/graph/build-react-flow-graph.ts src/shell/graph/build-react-flow-graph.test.ts src/shell/GraphView.tsx src/shell/graph/useGraphLinkHandles.ts src/shell/graph/ScreenGraphNode.tsx
git commit -m "feat(graph): pick target port from measured link to screen geometry"
```

---

### Task 6: Docs and final verification

**Files:**
- Modify: `docs/GRAPH_VIEW.md`
- Modify: `docs/CONTEXT.md`

- [ ] **Step 1: Update GRAPH_VIEW Screen View edges**

```markdown
### Edges

Edges originate from the **navigable link or button** that triggers the transition (connector anchored at the control’s center). They terminate on the **nearest sensible boundary** of the destination screen (top, bottom, left, or right), chosen from relative positions — similar to Figma prototype connectors.

Edges render above screen cards so paths stay visible. **Hover a link or edge** to highlight that connection; other edges dim.

Parallel links from the same screen remain separate edges. Routes stay stable while panning and zooming.
```

Update acceptance criterion 4 accordingly.

- [ ] **Step 2: Update CONTEXT.md** graph one-liner.

- [ ] **Step 3: Full verification**

```bash
npm test
npm run check
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add docs/GRAPH_VIEW.md docs/CONTEXT.md
git commit -m "docs(graph): link-anchored edges with smart target ports"
```

---

## Self-review

| Requirement | Task |
|-------------|------|
| Edge starts at link center | 1, 3, 4 |
| Target side from link→screen geometry | 2, 5 |
| Edges above screens | Already in `graph-view.css`; preserve |
| Links above handles inside node | 4 |
| Zoom-stable measurement | 1, 3 |
| Link + edge hover highlight | Preserve `GraphView` behavior |
| Compact mode unchanged | 5 (`buildGraphEdges` for compact only) |
| No nested RF nodes | Design choice documented |
| No new npm deps | ✓ |

**Placeholder scan:** None.

**Out of scope:** ELK, nested subgraph nodes, true obstacle-avoidance routing, per-link target handles on destination screen.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-06-27-graph-link-anchored-edges.md`.

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks

**2. Inline Execution** — run tasks in session with executing-plans checkpoints

Which approach?
