# Shared Navigation Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `NavigationGraph` and related types out of `src/plugin/types.ts` into a shared module so runtime shell code no longer imports from the Vite plugin package.

**Architecture:** Create `src/types/navigation.ts` as the seam contract. Plugin codegen imports types when building graphs and generated files. Shell graph view imports from `src/types/navigation.ts`. Plugin re-exports types for backward compatibility during migration, then removes navigation types from plugin-only surface.

**Tech Stack:** TypeScript 6, Vitest (import path smoke tests only)

## Global Constraints

- Run `npm run build` + `npm run check` before claiming done
- No runtime behavior change — types-only move
- Generated `navigation-graph.generated.ts` output shape unchanged
- Min diff; update `docs/CONTEXT.md` repo map

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/types/navigation.ts` | `NavigationEdge`, `NavigationGraphNode`, `NavigationGraph` |
| `src/plugin/types.ts` | Re-export navigation types from shared module; keep codegen-only types |
| `src/shell/GraphView.tsx` | Import from `@/types/navigation` |
| `src/shell/graph/build-react-flow-graph.ts` | Import from `@/types/navigation` |
| `src/shell/graph/ScreenGraphMeasureLayer.tsx` | Import from `@/types/navigation` |
| `src/shell/graph/*.test.ts` | Update imports |

---

### Task 1: Create shared navigation types module

**Files:**
- Create: `src/types/navigation.ts`

**Interfaces:**
- Produces:
  ```ts
  export type NavigationEdge = { id: string; fromScreenId: string; toScreenId: string; linkId: string; label?: string }
  export type NavigationGraphNode = { id: string; title: string; note?: string; order: number; isEntry: boolean }
  export type NavigationGraph = { nodes: readonly NavigationGraphNode[]; edges: readonly NavigationEdge[] }
  ```

- [ ] **Step 1: Create `src/types/navigation.ts`**

Copy type definitions verbatim from `src/plugin/types.ts` lines 8–27.

- [ ] **Step 2: Verify TypeScript resolves path**

Ensure `tsconfig` includes `src/types/` (it should via `src/**`).

Run: `npm run check`
Expected: PASS (file unused yet — no errors)

- [ ] **Step 3: Commit**

```bash
git add src/types/navigation.ts
git commit -m "feat: add shared navigation types module"
```

---

### Task 2: Plugin re-exports from shared module

**Files:**
- Modify: `src/plugin/types.ts`
- Modify: `src/plugin/extract-navigation-graph.ts`
- Modify: `src/plugin/generate.ts`

- [ ] **Step 1: Replace inline navigation types in plugin/types.ts**

```ts
// src/plugin/types.ts
export type { NavigationEdge, NavigationGraph, NavigationGraphNode } from '../types/navigation'
// keep ExtractedScreen, CodegenError, etc.
```

Remove duplicate type block for navigation types.

- [ ] **Step 2: Update plugin files that import navigation types**

Change:
```ts
import type { NavigationGraph } from './types'
```
to also allow:
```ts
import type { NavigationGraph } from '../types/navigation'
```
(Either works once re-exported — no change needed if importing from `./types`.)

- [ ] **Step 3: Run plugin tests**

Run: `npm test -- src/plugin/`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/plugin/types.ts
git commit -m "refactor(plugin): re-export navigation types from shared module"
```

---

### Task 3: Shell imports from shared module

**Files:**
- Modify: `src/shell/GraphView.tsx`
- Modify: `src/shell/graph/build-react-flow-graph.ts`
- Modify: `src/shell/graph/ScreenGraphMeasureLayer.tsx`
- Modify: `src/shell/graph/build-react-flow-graph.test.ts`

- [ ] **Step 1: Replace plugin imports**

In each file, change:
```ts
import type { NavigationGraph } from '../plugin/types'
// or '../../plugin/types'
```
to:
```ts
import type { NavigationGraph } from '@/types/navigation'
```

- [ ] **Step 2: Verify no shell→plugin type imports remain**

Run: `rg "plugin/types" src/shell/`
Expected: no matches

- [ ] **Step 3: Run build + tests**

Run: `npm test && npm run build && npm run check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/shell/
git commit -m "refactor(shell): import NavigationGraph from shared types"
```

---

### Task 4: Update CONTEXT.md

**Files:**
- Modify: `docs/CONTEXT.md`

- [ ] **Step 1: Add to repo map**

```
src/types/navigation.ts   # shared NavigationGraph contract (plugin + shell)
```

- [ ] **Step 2: Commit**

```bash
git add docs/CONTEXT.md
git commit -m "docs: document shared navigation types module"
```

---

## Self-review checklist

- [x] All four shell files importing plugin types updated
- [x] Generated output unchanged
- [x] No placeholder steps
