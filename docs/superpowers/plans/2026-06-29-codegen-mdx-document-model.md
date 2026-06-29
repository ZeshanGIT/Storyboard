# Codegen MDX Document Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parse each MDX file once into a typed `MdxDocument`, classify all links through one seam, and derive modal metadata from AST — eliminating duplicate parses, divergent goto rules, and regex modal extraction.

**Architecture:** Introduce `parseMdxDocument` + `buildMdxDocument` as the deep codegen module. `buildMdxDocument` walks the AST once to produce screens (with `modalIds`, classified links, and pre-assigned `linkId`s). Validators, navigation graph extraction, and `graph-link-id` injection become thin consumers. `runFullCodegen` passes the built document through instead of re-parsing source per consumer.

**Tech Stack:** TypeScript 6, remark/remark-mdx, mdast, Vitest, existing Vite plugin codegen pipeline

## Global Constraints

- Run `npm run build` + `npm run check` before claiming done; plugin changes need `npm test`
- Do not hand-edit `src/generated/`
- Min diff; preserve existing validation error messages and codes (`CodegenErrorCode`)
- Graph edge rules unchanged: screen→screen only; skip `_close`, `_back`, modal targets, `disabled` links
- `linkId` format stays `${screenId}:${linkIndex}` (index among navigable link candidates in screen, same order as today)
- Update `docs/CONTEXT.md` codegen section when done

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/plugin/mdx-ast.ts` | Shared remark processor, `getStringAttr`, `getGotoValue`, `isNamedNode`, `getLinkLabel` |
| `src/plugin/mdx-ast.test.ts` | Unit tests for AST helpers |
| `src/plugin/parse-mdx-document.ts` | `parseMdxDocument(source)` → tree or `PARSE_ERROR` |
| `src/plugin/parse-mdx-document.test.ts` | Parse error / success tests |
| `src/plugin/classify-links.ts` | `classifyLinks(tree, screens)` → per-screen classified links + goto/modal errors |
| `src/plugin/classify-links.test.ts` | Link classification + graph edge tests |
| `src/plugin/build-mdx-document.ts` | `buildMdxDocument(source)` — orchestrates parse, screens, modals, links, text validation |
| `src/plugin/build-mdx-document.test.ts` | End-to-end document build tests |
| `src/plugin/inject-graph-link-ids.ts` | Simplify to inject from pre-classified `linkId`s (no target re-match) |
| `src/plugin/extract-screens.ts` | Thin wrapper: `buildMdxDocument` → `ExtractedScreen[]` |
| `src/plugin/extract-navigation-graph.ts` | Consume `MdxDocument` or classified links — no re-parse |
| `src/plugin/validate-gotos.ts` | Re-export modal collection; goto errors move to classify/build |
| `src/plugin/types.ts` | Add `ClassifiedLink`, `MdxScreen`, `MdxDocument`; extend `ExtractedScreen` with `modalIds` |
| `src/plugin/generate.ts` | Use `screen.modalIds` instead of regex; pass classified links to injection |
| `src/plugin/run-full-codegen.ts` | Single `buildMdxDocument` per file |
| `src/plugin/codegen-integration.test.ts` | MDX → graph edges → generated `graph-link-id` alignment |

---

### Task 1: Shared MDX AST helpers

**Files:**
- Create: `src/plugin/mdx-ast.ts`
- Create: `src/plugin/mdx-ast.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const mdxProcessor: Processor
  export function isNamedNode(name: string): (node) => node is MdxJsxElement
  export function getStringAttr(node: MdxJsxElement, name: string): string | undefined
  export function getGotoValue(node: MdxJsxElement): string | undefined
  export function hasBooleanAttr(node: MdxJsxElement, name: string): boolean
  export function getLinkLabel(node: MdxJsxElement): string | undefined
  export function stringifyMdxNode(node: MdxJsxElement): string
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/plugin/mdx-ast.test.ts
import { describe, expect, it } from 'vitest'
import { mdxProcessor, getGotoValue, getStringAttr, isNamedNode } from './mdx-ast'

describe('mdx-ast', () => {
  it('parses goto string literal from Link', () => {
    const tree = mdxProcessor.parse('<Link goto="home">Go</Link>')
    let linkNode: unknown
    tree.children.forEach((child) => {
      if (isNamedNode('Link')(child)) linkNode = child
    })
    expect(linkNode).toBeDefined()
    expect(getGotoValue(linkNode as never)).toBe('home')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/plugin/mdx-ast.test.ts`
Expected: FAIL — cannot find module `./mdx-ast`

- [ ] **Step 3: Implement `mdx-ast.ts`**

Extract from `extract-screens.ts`, `validate-gotos.ts`, `extract-navigation-graph.ts`:

```ts
import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'

export type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement

export const mdxProcessor = remark().use(remarkFrontmatter).use(remarkMdx)

export function isNamedNode(name: string) {
  return (node: { type?: string; name?: string | null }): node is MdxJsxElement =>
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === name
}

export function getStringAttr(node: MdxJsxElement, name: string): string | undefined {
  const attr = node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  return undefined
}

export function getGotoValue(node: MdxJsxElement): string | undefined {
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

export function hasBooleanAttr(node: MdxJsxElement, name: string): boolean {
  return node.attributes.some((a) => a.type === 'mdxJsxAttribute' && a.name === name)
}

export function getLinkLabel(node: MdxJsxElement): string | undefined {
  for (const child of node.children) {
    if (child.type === 'text' && child.value.trim()) return child.value.trim()
  }
  return undefined
}

export function stringifyMdxNode(node: MdxJsxElement): string {
  const chunk = mdxProcessor.stringify({ type: 'root', children: [node] } as Root)
  return chunk.trim()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/plugin/mdx-ast.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugin/mdx-ast.ts src/plugin/mdx-ast.test.ts
git commit -m "refactor(plugin): extract shared MDX AST helpers"
```

---

### Task 2: Document types

**Files:**
- Modify: `src/plugin/types.ts`

**Interfaces:**
- Produces:
  ```ts
  export type LinkClassification =
    | 'screen-edge'
    | 'modal'
    | 'reserved'
    | 'disabled-skip'
    | 'invalid-missing-goto'
    | 'invalid-expression-goto'
    | 'invalid-target'

  export type ClassifiedLink = {
    classification: LinkClassification
    goto?: string
    label?: string
    linkId?: string
    toScreenId?: string
  }

  export type MdxScreen = {
    id: string
    title: string
    order: number
    jsx: string
    modalIds: readonly string[]
    links: readonly ClassifiedLink[]
    note?: string
  }

  export type MdxDocument = {
    tree: Root
    screens: readonly MdxScreen[]
  }

  // Extend ExtractedScreen:
  export type ExtractedScreen = {
    id: string
    title: string
    jsx: string
    order: number
    modalIds: readonly string[]
  }
  ```

- [ ] **Step 1: Add types to `types.ts`**

Add `LinkClassification`, `ClassifiedLink`, `MdxScreen`, `MdxDocument`. Add `modalIds: readonly string[]` to `ExtractedScreen` (default `[]` at call sites until Task 5).

- [ ] **Step 2: Fix compile errors from new required field**

Run: `npm run check`
Expected: TypeScript errors where `ExtractedScreen` literals omit `modalIds` — fix in Task 5; for now add `modalIds: []` to test fixtures in existing test files:

```ts
// In extract-screens.test.ts and any fixture screens — add modalIds: [] when constructing ExtractedScreen manually
```

- [ ] **Step 3: Commit**

```bash
git add src/plugin/types.ts src/plugin/*.test.ts
git commit -m "feat(plugin): add MdxDocument and ClassifiedLink types"
```

---

### Task 3: Link classification module

**Files:**
- Create: `src/plugin/classify-links.ts`
- Create: `src/plugin/classify-links.test.ts`

**Interfaces:**
- Consumes: `Root` tree, `screenIds: Set<string>`, `modalIdsByScreen: Map<string, Set<string>>` from `collectModalIdsByScreen`
- Produces:
  ```ts
  export function classifyScreenLinks(
    tree: Root,
    screenIds: Set<string>,
    modalIdsByScreen: Map<string, Set<string>>,
  ): { linksByScreen: Map<string, ClassifiedLink[]>; errors: CodegenError[] }
  ```

- [ ] **Step 1: Write failing tests**

```ts
// src/plugin/classify-links.test.ts
import { describe, expect, it } from 'vitest'
import { mdxProcessor } from './mdx-ast'
import { classifyScreenLinks } from './classify-links'
import { collectModalIdsByScreen } from './validate-gotos'

const SAMPLE = `
<Screen id="home" title="Home">
  <Link goto="settings">Settings</Link>
  <Link goto="missing">Bad</Link>
  <Link goto="_back">Back</Link>
  <Link goto="settings" disabled>Disabled</Link>
</Screen>
<Screen id="settings" title="Settings" />
`

describe('classifyScreenLinks', () => {
  it('assigns screen-edge linkIds in visit order', () => {
    const tree = mdxProcessor.parse(SAMPLE) as import('mdast').Root
    const screenIds = new Set(['home', 'settings'])
    const { modalIdsByScreen } = collectModalIdsByScreen(tree, screenIds)
    const { linksByScreen, errors } = classifyScreenLinks(tree, screenIds, modalIdsByScreen)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('INVALID_GOTO')
    const homeLinks = linksByScreen.get('home') ?? []
    expect(homeLinks[0]).toMatchObject({
      classification: 'screen-edge',
      linkId: 'home:0',
      toScreenId: 'settings',
    })
    expect(homeLinks[1].classification).toBe('invalid-target')
    expect(homeLinks[2].classification).toBe('reserved')
    expect(homeLinks[3].classification).toBe('disabled-skip')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/plugin/classify-links.test.ts`

- [ ] **Step 3: Implement `classify-links.ts`**

Logic mirrors `extract-navigation-graph.ts` edge rules + `validate-gotos.ts` error messages:

```ts
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { getGotoValue, getLinkLabel, hasBooleanAttr, isNamedNode } from './mdx-ast'
import { CodegenError, type ClassifiedLink } from './types'

const RESERVED_GOTO = new Set(['_close', '_back'])
const isScreenNode = isNamedNode('Screen')
const isLinkNode = isNamedNode('Link')

export function classifyScreenLinks(
  tree: Root,
  screenIds: Set<string>,
  modalIdsByScreen: Map<string, Set<string>>,
): { linksByScreen: Map<string, ClassifiedLink[]>; errors: CodegenError[] } {
  const linksByScreen = new Map<string, ClassifiedLink[]>()
  const errors: CodegenError[] = []
  let activeScreenId: string | undefined
  let linkIndex = 0

  visit(tree, (node) => {
    if (isScreenNode(node)) {
      activeScreenId = node.attributes.find(/* use getStringAttr */)?.value as string | undefined
      // use getStringAttr from mdx-ast
      linkIndex = 0
      return
    }
    if (!isLinkNode(node) || !activeScreenId) return

    const label = getLinkLabel(node)
    const linkContext = label ? ` on link "${label}"` : ''
    const goto = getGotoValue(node)

    if (!goto) {
      errors.push(new CodegenError('INVALID_GOTO', `Link${linkContext} in screen "${activeScreenId}" is missing a goto attribute`, activeScreenId))
      pushLink(linksByScreen, activeScreenId, { classification: 'invalid-missing-goto', label })
      return
    }

    if (hasBooleanAttr(node, 'disabled')) {
      pushLink(linksByScreen, activeScreenId, { classification: 'disabled-skip', goto, label })
      return
    }

    if (RESERVED_GOTO.has(goto)) {
      pushLink(linksByScreen, activeScreenId, { classification: 'reserved', goto, label })
      return
    }

    const screenModalIds = modalIdsByScreen.get(activeScreenId) ?? new Set<string>()
    if (screenModalIds.has(goto)) {
      pushLink(linksByScreen, activeScreenId, { classification: 'modal', goto, label })
      return
    }

    if (!screenIds.has(goto)) {
      errors.push(new CodegenError('INVALID_GOTO', `Invalid goto "${goto}"${linkContext} in screen "${activeScreenId ?? 'unknown'}" — no screen with id "${goto}", and no modal with id "${goto}" in this screen`, activeScreenId))
      pushLink(linksByScreen, activeScreenId, { classification: 'invalid-target', goto, label })
      return
    }

    const linkId = `${activeScreenId}:${linkIndex}`
    linkIndex += 1
    pushLink(linksByScreen, activeScreenId, {
      classification: 'screen-edge',
      goto,
      label,
      linkId,
      toScreenId: goto,
    })
  })

  return { linksByScreen, errors }
}

function pushLink(map: Map<string, ClassifiedLink[]>, screenId: string, link: ClassifiedLink) {
  const list = map.get(screenId) ?? []
  list.push(link)
  map.set(screenId, list)
}
```

(Finish `activeScreenId` assignment using `getStringAttr(node, 'id')` from mdx-ast.)

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- src/plugin/classify-links.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/plugin/classify-links.ts src/plugin/classify-links.test.ts
git commit -m "feat(plugin): classify links through single seam"
```

---

### Task 4: buildMdxDocument orchestrator

**Files:**
- Create: `src/plugin/build-mdx-document.ts`
- Create: `src/plugin/build-mdx-document.test.ts`
- Create: `src/plugin/parse-mdx-document.ts`

**Interfaces:**
- Produces:
  ```ts
  export function parseMdxDocument(source: string):
    | { ok: true; tree: Root }
    | { ok: false; errors: CodegenError[] }

  export function buildMdxDocument(source: string):
    | { ok: true; document: MdxDocument }
    | { ok: false; errors: CodegenError[] }
  ```

- [ ] **Step 1: Write failing integration test**

```ts
// src/plugin/build-mdx-document.test.ts
import { describe, expect, it } from 'vitest'
import { buildMdxDocument } from './build-mdx-document'

const SAMPLE = `
<Screen id="home" title="Home">
  <Link goto="detail">Detail</Link>
  <Modal id="confirm"><Text>Sure?</Text></Modal>
</Screen>
<Screen id="detail" title="Detail" />
`

describe('buildMdxDocument', () => {
  it('returns screens with modalIds and classified links in one pass', () => {
    const result = buildMdxDocument(SAMPLE)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.screens).toHaveLength(2)
    expect(result.document.screens[0].modalIds).toEqual(['confirm'])
    expect(result.document.screens[0].links[0]).toMatchObject({
      classification: 'screen-edge',
      linkId: 'home:0',
      toScreenId: 'detail',
    })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement parse + build**

`parseMdxDocument` wraps `mdxProcessor.parse` with `PARSE_ERROR` handling (copy from `extract-screens.ts`).

`buildMdxDocument`:
1. Parse source
2. Walk screens (duplicate screen id / missing id checks from `extract-screens.ts`)
3. `collectModalIdsByScreen` + modal errors
4. `classifyScreenLinks`
5. `collectTextErrors(tree)` from `validate-text.ts`
6. Merge all errors; return `{ ok: false }` if any
7. Build `MdxScreen[]` with `jsx` via `stringifyMdxNode`, `note` via `getStringAttr`

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- src/plugin/build-mdx-document.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/plugin/parse-mdx-document.ts src/plugin/build-mdx-document.ts src/plugin/build-mdx-document.test.ts
git commit -m "feat(plugin): build MdxDocument in single AST walk"
```

---

### Task 5: Refactor extract-screens to use buildMdxDocument

**Files:**
- Modify: `src/plugin/extract-screens.ts`
- Modify: `src/plugin/extract-screens.test.ts`

**Interfaces:**
- Produces: same `extractScreens(source): CodegenResult` signature — callers unchanged

- [ ] **Step 1: Run existing tests as baseline**

Run: `npm test -- src/plugin/extract-screens.test.ts`
Expected: PASS (may fail if `modalIds` required — add to expectations)

- [ ] **Step 2: Replace implementation**

```ts
import { buildMdxDocument } from './build-mdx-document'
import type { CodegenResult, ExtractedScreen } from './types'

export function extractScreens(source: string): CodegenResult {
  const built = buildMdxDocument(source)
  if (!built.ok) return built
  const screens: ExtractedScreen[] = built.document.screens.map((s) => ({
    id: s.id,
    title: s.title,
    jsx: s.jsx,
    order: s.order,
    modalIds: s.modalIds,
  }))
  return { ok: true, screens }
}
```

Remove duplicated parse/visit logic and imports of `collectGotoErrors` (now inside build).

- [ ] **Step 3: Update tests to assert modalIds**

Add test: screen with modal populates `modalIds`.

- [ ] **Step 4: Run all plugin extract tests**

Run: `npm test -- src/plugin/extract-screens.test.ts src/plugin/validate-gotos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugin/extract-screens.ts src/plugin/extract-screens.test.ts
git commit -m "refactor(plugin): extract-screens delegates to buildMdxDocument"
```

---

### Task 6: Refactor extract-navigation-graph

**Files:**
- Modify: `src/plugin/extract-navigation-graph.ts`
- Modify: `src/plugin/extract-navigation-graph.test.ts`

**Interfaces:**
- Consumes: `MdxDocument` or `readonly MdxScreen[]`
- Produces: same `extractNavigationGraph` — change signature to:
  ```ts
  export function extractNavigationGraph(document: MdxDocument): NavigationGraph
  export function extractNavigationGraphFromScreens(screens: readonly MdxScreen[]): NavigationGraph
  ```
  Keep a deprecated overload `extractNavigationGraph(source, screens)` that calls `buildMdxDocument` only in tests if needed — **prefer updating all call sites**.

- [ ] **Step 1: Add test using MdxDocument fixture**

```ts
it('builds edges from classified screen-edge links', () => {
  const built = buildMdxDocument(SAMPLE_WITH_TWO_SCREENS)
  if (!built.ok) throw new Error('fixture')
  const graph = extractNavigationGraph(built.document)
  expect(graph.edges).toHaveLength(1)
  expect(graph.edges[0].linkId).toBe('home:0')
})
```

- [ ] **Step 2: Rewrite extract-navigation-graph.ts**

- `buildNodes` from screens (notes from `MdxScreen.note`)
- Edges from `screen.links.filter(l => l.classification === 'screen-edge')` mapped to `NavigationEdge`
- Remove local parse, `collectModalIdsByScreen`, duplicate helpers

- [ ] **Step 3: Run tests**

Run: `npm test -- src/plugin/extract-navigation-graph.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/plugin/extract-navigation-graph.ts src/plugin/extract-navigation-graph.test.ts
git commit -m "refactor(plugin): navigation graph from classified links"
```

---

### Task 7: Simplify graph-link-id injection

**Files:**
- Modify: `src/plugin/inject-graph-link-ids.ts`
- Modify: `src/plugin/inject-graph-link-ids.test.ts`

**Interfaces:**
- New signature:
  ```ts
  export function injectGraphLinkIdsFromClassification(
    screenJsx: string,
    links: readonly ClassifiedLink[],
  ): string
  ```

- [ ] **Step 1: Write test — linkId injected without target re-match**

Use screen JSX with two links to same target; classified links carry distinct `linkId`s.

- [ ] **Step 2: Implement**

Parse screen JSX fragment once. Visit links in order; for each navigable link candidate (`screen-edge`), inject `graph-link-id` from next classified `screen-edge` entry's `linkId`. Skip disabled/reserved/modal same as today.

Remove `edges` parameter and goto===target matching loop.

- [ ] **Step 3: Update `generate.ts` `buildScreensFile`**

```ts
// Pass screen.links from MdxDocument — requires generateDocumentFiles to accept MdxDocument or links map
const jsx = injectGraphLinkIdsFromClassification(s.jsx, s.links)
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/plugin/inject-graph-link-ids.test.ts src/plugin/generate.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/plugin/inject-graph-link-ids.ts src/plugin/inject-graph-link-ids.test.ts src/plugin/generate.ts
git commit -m "refactor(plugin): inject graph-link-id from classified linkIds"
```

---

### Task 8: Remove regex modal extraction

**Files:**
- Modify: `src/plugin/generate.ts`
- Modify: `src/plugin/generate.test.ts`

- [ ] **Step 1: Write test — routes use modalIds from ExtractedScreen**

```ts
it('routes.generated modalIds come from ExtractedScreen.modalIds not regex', () => {
  const screens = [{ id: 'a', title: 'A', order: 0, jsx: '<Modal id="m" />', modalIds: ['m'] as const }]
  const content = buildRoutesFile(screens) // export for test or test via generateDocumentFiles
  expect(content).toContain("modalIds: ['m']")
})
```

- [ ] **Step 2: Delete `MODAL_ID_PATTERN`, `extractModalIdsForScreen`, `extractModalIds`**

In `buildRoutesFile`:
```ts
const screenModalIds = s.modalIds
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/plugin/generate.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generate.ts src/plugin/generate.test.ts
git commit -m "refactor(plugin): modal ids from AST not regex"
```

---

### Task 9: Wire run-full-codegen single parse path

**Files:**
- Modify: `src/plugin/run-full-codegen.ts`
- Modify: `src/plugin/generate.ts` (`generateDocumentFiles` signature)
- Modify: `src/plugin/codegen.ts` (legacy path)

- [ ] **Step 1: Change run-full-codegen loop**

```ts
for (const doc of documents) {
  const source = await readFile(join(contentDir, doc.filename), 'utf8')
  const built = buildMdxDocument(source)
  if (!built.ok) { /* prefix errors with filename */ continue }

  const screens: ExtractedScreen[] = built.document.screens.map(/* map */)
  const graph = extractNavigationGraph(built.document)
  await generateDocumentFiles(doc.slug, built.document, graph, outDir)
}
```

- [ ] **Step 2: Update `generateDocumentFiles`**

Accept `MdxDocument` (or `screens: MdxScreen[]`) for link injection; keep emitting same generated file shapes.

- [ ] **Step 3: Update legacy `codegen.ts`**

```ts
const built = buildMdxDocument(source)
// same pattern
```

- [ ] **Step 4: Run full test suite + build**

Run: `npm test && npm run build && npm run check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugin/run-full-codegen.ts src/plugin/generate.ts src/plugin/codegen.ts
git commit -m "refactor(plugin): single parse path in runFullCodegen"
```

---

### Task 10: Codegen integration test + CONTEXT update

**Files:**
- Create: `src/plugin/codegen-integration.test.ts`
- Modify: `docs/CONTEXT.md`

- [ ] **Step 1: Integration test**

```ts
import { describe, expect, it } from 'vitest'
import { buildMdxDocument } from './build-mdx-document'
import { extractNavigationGraph } from './extract-navigation-graph'
import { injectGraphLinkIdsFromClassification } from './inject-graph-link-ids'

describe('codegen integration', () => {
  it('graph linkIds align with injected graph-link-id attributes', () => {
    const mdx = `
<Screen id="a" title="A"><Link goto="b">Next</Link></Screen>
<Screen id="b" title="B" />
`
    const built = buildMdxDocument(mdx)
    if (!built.ok) throw new Error('fixture')
    const graph = extractNavigationGraph(built.document)
    const edge = graph.edges[0]
    const jsx = injectGraphLinkIdsFromClassification(
      built.document.screens[0].jsx,
      built.document.screens[0].links,
    )
    expect(edge.linkId).toBe('a:0')
    expect(jsx).toContain('graph-link-id="a:0"')
  })
})
```

- [ ] **Step 2: Update CONTEXT.md**

Add under codegen flow: single `buildMdxDocument` parse; classified links; `ExtractedScreen.modalIds`.

- [ ] **Step 3: Final verification**

Run: `npm test && npm run build && npm run check`

- [ ] **Step 4: Commit**

```bash
git add src/plugin/codegen-integration.test.ts docs/CONTEXT.md
git commit -m "test(plugin): codegen linkId integration; update CONTEXT"
```

---

## Self-review checklist

- [x] Unified parse (Task 4, 9) — covers candidate 1
- [x] classifyLinks seam (Task 3) — covers candidate 2
- [x] Modal metadata from AST (Task 8) — covers candidate 3
- [x] No TBD placeholders
- [x] Type names consistent: `MdxDocument`, `ClassifiedLink`, `linkId`, `modalIds`
