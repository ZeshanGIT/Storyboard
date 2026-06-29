# Document Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize multi-document naming rules (`primaryDocumentSlug`, `slugToRoutesAlias`) in one module and remove duplicated logic across codegen and shell; fold legacy single-doc `codegen.ts` entrypoint into tests using `runFullCodegen`.

**Architecture:** Extend `src/plugin/naming.ts` (or add `document-registry.ts` colocated in plugin) with registry functions. Codegen and shell import from there. Delete duplicate `primarySlug` / `slugToRoutesAlias` implementations. Migrate `codegen.ts` tests to `run-full-codegen` or inline `buildMdxDocument` + `generateDocumentFiles`.

**Tech Stack:** TypeScript 6, Vitest

## Global Constraints

- Run `npm run build` + `npm run check` + `npm test` before claiming done
- Document priority unchanged: `storyboard` → `wireframe` → first scanned doc
- `slugToRoutesAlias('user-flow')` → `userFlowRoutes` (existing camelCase rule)
- Min diff; update `docs/CONTEXT.md`

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/plugin/document-registry.ts` | `primaryDocumentSlug`, `slugToRoutesAlias`, `slugToGraphAlias` |
| `src/plugin/document-registry.test.ts` | Registry unit tests |
| `src/plugin/naming.ts` | Keep screen component naming only |
| `src/plugin/run-full-codegen.ts` | Use `primaryDocumentSlug` |
| `src/plugin/generate.ts` | Use registry for aggregate routes |
| `src/plugin/generate-documents.ts` | Import `slugToRoutesAlias` from registry |
| `src/shell/Shell.tsx` | Import `primaryDocumentSlug` from registry |
| `src/plugin/codegen.ts` | Delete or reduce to thin deprecated wrapper |

---

### Task 1: Document registry module

**Files:**
- Create: `src/plugin/document-registry.ts`
- Create: `src/plugin/document-registry.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function slugToRoutesAlias(slug: string): string
  export function slugToGraphAlias(slug: string): string  // `${slugToRoutesAlias(slug)}Graph`
  export function primaryDocumentSlug(slugs: readonly string[]): string | undefined
  ```

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { primaryDocumentSlug, slugToRoutesAlias, slugToGraphAlias } from './document-registry'

describe('document-registry', () => {
  it('slugToRoutesAlias camelCases slug', () => {
    expect(slugToRoutesAlias('user-flow')).toBe('userFlowRoutes')
    expect(slugToRoutesAlias('wireframe')).toBe('wireframeRoutes')
  })

  it('primaryDocumentSlug prefers storyboard then wireframe', () => {
    expect(primaryDocumentSlug(['wireframe', 'storyboard', 'other'])).toBe('storyboard')
    expect(primaryDocumentSlug(['wireframe', 'other'])).toBe('wireframe')
    expect(primaryDocumentSlug(['other'])).toBe('other')
    expect(primaryDocumentSlug([])).toBeUndefined()
  })

  it('slugToGraphAlias appends Graph suffix', () => {
    expect(slugToGraphAlias('wireframe')).toBe('wireframeRoutesGraph')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/plugin/document-registry.test.ts`

- [ ] **Step 3: Implement**

```ts
export function slugToRoutesAlias(slug: string): string {
  return `${slug.replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())}Routes`
}

export function slugToGraphAlias(slug: string): string {
  return `${slugToRoutesAlias(slug)}Graph`
}

export function primaryDocumentSlug(slugs: readonly string[]): string | undefined {
  const set = new Set(slugs)
  if (set.has('storyboard')) return 'storyboard'
  if (set.has('wireframe')) return 'wireframe'
  return slugs[0]
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/plugin/document-registry.ts src/plugin/document-registry.test.ts
git commit -m "feat(plugin): central document registry naming"
```

---

### Task 2: Wire codegen to registry

**Files:**
- Modify: `src/plugin/run-full-codegen.ts`
- Modify: `src/plugin/generate.ts`
- Modify: `src/plugin/generate-documents.ts`

- [ ] **Step 1: Replace inline primarySlug in run-full-codegen.ts**

```ts
import { primaryDocumentSlug } from './document-registry'

const primary = primaryDocumentSlug([...documentScreens.keys()])
return { ok: true, screens: primary ? (documentScreens.get(primary) ?? []) : [] }
```

- [ ] **Step 2: Replace slugToRoutesAlias in generate-documents.ts**

Delete local function; import from `./document-registry`.

- [ ] **Step 3: Replace primarySlug + slugToRoutesAlias in generate.ts**

Import from `./document-registry`; remove local `slugToRoutesAlias` and `primarySlug` logic.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/plugin/generate.test.ts src/plugin/generate-documents.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugin/run-full-codegen.ts src/plugin/generate.ts src/plugin/generate-documents.ts
git commit -m "refactor(plugin): use document registry in codegen"
```

---

### Task 3: Shell uses registry

**Files:**
- Modify: `src/shell/Shell.tsx`

**Note:** Shell runs in browser — it cannot import Node plugin modules if they pull Node APIs. `document-registry.ts` must stay pure (no `fs` imports). Verify before wiring.

- [ ] **Step 1: Move registry to shared location if plugin import fails build**

If Vite bundles shell with plugin import causes issues, move to `src/lib/document-registry.ts` instead. Test with `npm run build` first.

- [ ] **Step 2: Replace `defaultDocumentSlug` in Shell.tsx**

```ts
import { primaryDocumentSlug } from '@/lib/document-registry'

function defaultDocumentSlug(documents: readonly ContentDocumentEntry[]): string {
  return primaryDocumentSlug(documents.map((d) => d.slug)) ?? ''
}
```

Delete inline storyboard/wireframe lookup.

- [ ] **Step 3: Run build**

Run: `npm run build && npm run check`
Expected: PASS — no Node-only imports in client bundle

- [ ] **Step 4: Commit**

```bash
git add src/shell/Shell.tsx src/lib/document-registry.ts
git commit -m "refactor(shell): default document from shared registry"
```

---

### Task 4: Fold legacy codegen.ts

**Files:**
- Modify: `src/plugin/codegen.ts`
- Modify: any tests importing `runCodegen`

- [ ] **Step 1: Find usages**

Run: `rg "runCodegen|from './codegen'" src/`

- [ ] **Step 2: Migrate tests to buildMdxDocument + generateDocumentFiles**

If `generate.test.ts` uses `runCodegen`, replace with direct calls. Keep `codegen.ts` as deprecated one-liner re-exporting new path OR delete if zero imports.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/plugin/codegen.ts
git commit -m "refactor(plugin): fold legacy codegen entrypoint"
```

---

### Task 5: CONTEXT update

**Files:**
- Modify: `docs/CONTEXT.md`

- [ ] **Step 1: Document registry in repo map and locked decisions**

- [ ] **Step 2: Commit**

```bash
git add docs/CONTEXT.md
git commit -m "docs: document registry module"
```

---

## Self-review checklist

- [x] All four duplicate sites addressed (Shell, run-full-codegen, generate, generate-documents)
- [x] Shell bundle safety noted in Task 3
- [x] No placeholders
