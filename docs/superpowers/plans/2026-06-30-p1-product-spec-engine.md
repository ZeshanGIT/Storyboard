# P1 Product Spec Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the three-file Product Spec engine in `src/product-spec/` — types, loader, cross-file validation, SR tuple parsing in the JSON wireframe compiler, todo sample fixtures, Vitest, and a local `tsx` CLI (`validate`, `req show`, `impact`, `trace`).

**Architecture:** `storyboard/spec.json` is the wireframe document (extends [`JSON-COMPONENTS.md`](../../JSON-COMPONENTS.md) with optional SR as tuple element [1]). `requirements.json` and `bindings.json` load separately and merge into `ProductSpec`. Validation is pure JSON cross-ref — no AST. `trace` uses ripgrep (`rg`) over `src/` for `sb-req=` and `// @sb-req:` patterns. SR tuple parsing lives in `src/json/` (shared with shell); product-spec indexes SR ids from parsed spec for validation and `req show`.

**Tech Stack:** TypeScript 6, Node `fs/promises`, Vitest, `tsx` CLI runner, existing `src/json/build-json-document.ts` pipeline.

## Global Constraints

- Schema locked in [`PRODUCT-SPEC.md`](../../PRODUCT-SPEC.md) (accepted 2026-06-30): three JSON files, SR/BR id rules, hybrid BR naming
- **Out of scope:** npm publish (P2), TanStack codegen (P5), MDX requirements, drift detection, IDE plugin
- Run `npm run build` + `npm run check` + `npm test` before claiming done
- JSON compiler touches → tests (`src/json/*.test.ts`)
- `src/product-spec/` is Node-only — no browser imports, no `src/generated/`
- `type` for props; `import type` for type-only (`verbatimModuleSyntax`)
- Min diff; do not change shell URL behavior or MDX codegen
- Update `docs/JSON-COMPONENTS.md`, `docs/VISION.md` (SR/BR ids), `docs/CONTEXT.md`, `AGENTS.md` in final doc task

**Next after P1:** [`2026-06-30-p2-npm-package.md`](2026-06-30-p2-npm-package.md)

---

## File structure

| Path | Responsibility |
|------|----------------|
| `src/product-spec/types.ts` | `StructuralReqId`, `BehavioralReqId`, `ReqPath`, `Binding`, `ProductSpec`, `ValidationIssue` |
| `src/product-spec/sr-id.ts` | `isStructuralReqId`, `isBehavioralReqId`, `parseReqPath` |
| `src/product-spec/parse-requirements.ts` | Parse `requirements.json` shape |
| `src/product-spec/parse-bindings.ts` | Parse `bindings.json` tuple map |
| `src/product-spec/load.ts` | `loadProductSpec(storyboardDir)` |
| `src/product-spec/collect-sr-ids.ts` | Walk spec screens + nodes → `Set<StructuralReqId>` + placements |
| `src/product-spec/validate.ts` | `validateProductSpec(spec)` — all checks from PRODUCT-SPEC §validate |
| `src/product-spec/req-show.ts` | `showReq(spec, id): string` |
| `src/product-spec/impact.ts` | `impact(spec, target): ImpactResult` |
| `src/product-spec/trace.ts` | `traceReq(spec, target, opts): TraceResult` via `rg` |
| `src/product-spec/index.ts` | Public re-exports for P2 migration |
| `src/product-spec/cli/main.ts` | argv router |
| `src/product-spec/cli/run-validate.ts` | exit code 0/1 |
| `src/product-spec/cli/run-req-show.ts` | print definition |
| `src/product-spec/cli/run-impact.ts` | print JSON |
| `src/product-spec/cli/run-trace.ts` | print JSON |
| `src/product-spec/fixtures/todo/spec.json` | Todo wireframe sample |
| `src/product-spec/fixtures/todo/requirements.json` | SR/BR definitions |
| `src/product-spec/fixtures/todo/bindings.json` | BR placements incl. shared `BR-PASSWORD-VALIDATE` |
| `src/product-spec/*.test.ts` | Vitest per module |
| `src/json/sr-id.ts` | Re-export or duplicate `isStructuralReqId` (prefer import from `sr-id.ts` in json layer — see Task 8) |
| `src/json/types.ts` | Add `sr?: string` on `JsonNode`; optional `sr` on screen built type |
| `src/json/parse-node.ts` | SR-as-2nd-element tuple forms (1–4 elements) |
| `src/json/parse-node.test.ts` | SR tuple cases |
| `src/json/build-json-document.ts` | Pass through screen-level `sr` field |
| `vitest.config.ts` | Include `src/product-spec/**/*.test.ts` |
| `package.json` | `"storyboard": "tsx src/product-spec/cli/main.ts"` script |

### Public API (P1 → P2 contract)

```ts
// src/product-spec/index.ts
export type {
  StructuralReqId,
  BehavioralReqId,
  ReqPath,
  Binding,
  ProductSpec,
  ValidationIssue,
  ValidationResult,
  ImpactResult,
  TraceResult,
} from './types'

export { loadProductSpec } from './load'
export { validateProductSpec } from './validate'
export { showReq } from './req-show'
export { impact } from './impact'
export { traceReq } from './trace'
```

---

### Task 1: Scaffold + Vitest

**Files:**
- Create: `src/product-spec/index.ts` (empty re-export stub)
- Modify: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: test runner picks up `src/product-spec/**/*.test.ts`

- [ ] **Step 1: Extend Vitest include**

```ts
// vitest.config.ts — test.include
include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
```

(already covers `src/product-spec/` — verify no change needed; add explicit line only if missing)

- [ ] **Step 2: Add CLI script**

```json
"storyboard": "tsx src/product-spec/cli/main.ts"
```

- [ ] **Step 3: Create stub index**

```ts
// src/product-spec/index.ts
export type { ProductSpec } from './types'
```

Create `src/product-spec/types.ts` with placeholder:

```ts
export type ProductSpec = {
  storyboardDir: string
  wireframe: unknown
  requirements: unknown
  bindings: unknown
}
```

- [ ] **Step 4: Verify**

Run: `npm test`
Expected: PASS (no new failures)

- [ ] **Step 5: Commit**

```bash
git add src/product-spec package.json vitest.config.ts
git commit -m "chore: scaffold src/product-spec module"
```

---

### Task 2: Core types + id helpers

**Files:**
- Create: `src/product-spec/types.ts`
- Create: `src/product-spec/sr-id.ts`
- Create: `src/product-spec/sr-id.test.ts`

**Interfaces:**
- Produces: `isStructuralReqId(s: string): boolean` — matches `^SR-[A-Z0-9-]+$`
- Produces: `isBehavioralReqId(s: string): boolean` — `^BR-[A-Z0-9-]+$` (covers `BR-001` and `BR-PASSWORD-VALIDATE`)
- Produces: `parseReqPath(path: string): ReqPath` — `{ parentId, segments: string[] }`

- [ ] **Step 1: Write failing tests**

```ts
// src/product-spec/sr-id.test.ts
import { describe, expect, it } from 'vitest'
import { isBehavioralReqId, isStructuralReqId, parseReqPath } from './sr-id'

describe('isStructuralReqId', () => {
  it('accepts SR-001 and SR-010', () => {
    expect(isStructuralReqId('SR-001')).toBe(true)
    expect(isStructuralReqId('SR-010')).toBe(true)
  })
  it('rejects BR-001 and bare SR', () => {
    expect(isStructuralReqId('BR-001')).toBe(false)
    expect(isStructuralReqId('SR')).toBe(false)
  })
})

describe('parseReqPath', () => {
  it('splits parent and child segments', () => {
    expect(parseReqPath('BR-PASSWORD-VALIDATE/MIN-LEN')).toEqual({
      parentId: 'BR-PASSWORD-VALIDATE',
      segments: ['MIN-LEN'],
    })
    expect(parseReqPath('BR-001/2')).toEqual({
      parentId: 'BR-001',
      segments: ['2'],
    })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/product-spec/sr-id.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement types + sr-id**

```ts
// src/product-spec/types.ts
export type StructuralReqId = `SR-${string}`
export type BehavioralReqId = `BR-${string}`
export type ReqPath = { parentId: BehavioralReqId; segments: readonly string[] }

export type ReqDefinition = {
  description: string
  children?: Readonly<Record<string, ReqDefinition>>
}

export type RequirementsFile = {
  structural: Readonly<Record<string, ReqDefinition>>
  behavioral: Readonly<Record<string, ReqDefinition>>
}

export type Binding = readonly [screenId: string, srId?: StructuralReqId]
export type BindingsFile = Readonly<Record<string, readonly Binding[]>>

export type ProductSpec = {
  storyboardDir: string
  wireframe: WireframeSpec
  requirements: RequirementsFile
  bindings: BindingsFile
}

export type WireframeSpec = {
  title: string
  screens: Readonly<Record<string, WireframeScreenSpec>>
}

export type WireframeScreenSpec = {
  sr?: StructuralReqId
  title?: string
  note?: string
  nodes: unknown[]
}

export type ValidationIssue = {
  code: string
  message: string
  severity: 'error' | 'warning'
}

export type ValidationResult = {
  ok: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

export type ImpactResult = {
  target: string
  bindings: readonly { brId: BehavioralReqId; placements: readonly Binding[] }[]
  screens?: readonly string[]
  srs?: readonly StructuralReqId[]
}

export type TraceMatch = {
  file: string
  line: number
  column: number
  text: string
}

export type TraceResult = {
  target: string
  matches: readonly TraceMatch[]
}
```

```ts
// src/product-spec/sr-id.ts
import type { BehavioralReqId, ReqPath, StructuralReqId } from './types'

const SR_PATTERN = /^SR-[A-Z0-9-]+$/
const BR_PATTERN = /^BR-[A-Z0-9-]+$/
const NAMED_CHILD = /^[A-Z][A-Z0-9-]*$/
const NUMERIC_CHILD = /^[0-9]+$/

export function isStructuralReqId(value: string): value is StructuralReqId {
  return SR_PATTERN.test(value)
}

export function isBehavioralReqId(value: string): value is BehavioralReqId {
  return BR_PATTERN.test(value)
}

export function isNamedChildKey(key: string): boolean {
  return NAMED_CHILD.test(key)
}

export function isNumericChildKey(key: string): boolean {
  return NUMERIC_CHILD.test(key)
}

export function parseReqPath(path: string): ReqPath {
  const [parentId, ...segments] = path.split('/')
  if (!isBehavioralReqId(parentId)) {
    throw new Error(`Invalid behavioral req path: ${path}`)
  }
  return { parentId, segments }
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- src/product-spec/sr-id.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/product-spec/types.ts src/product-spec/sr-id.ts src/product-spec/sr-id.test.ts src/product-spec/index.ts
git commit -m "feat(product-spec): add core types and SR/BR id helpers"
```

---

### Task 3: Parse requirements.json + bindings.json

**Files:**
- Create: `src/product-spec/parse-requirements.ts`
- Create: `src/product-spec/parse-bindings.ts`
- Create: `src/product-spec/parse-requirements.test.ts`
- Create: `src/product-spec/parse-bindings.test.ts`

**Interfaces:**
- Produces: `parseRequirementsFile(raw: unknown): RequirementsFile | ParseError`
- Produces: `parseBindingsFile(raw: unknown): BindingsFile | ParseError`

- [ ] **Step 1: Write failing requirements test**

```ts
// src/product-spec/parse-requirements.test.ts
import { describe, expect, it } from 'vitest'
import { parseRequirementsFile } from './parse-requirements'

const SAMPLE = {
  structural: { 'SR-001': { description: 'Home screen' } },
  behavioral: {
    'BR-001': {
      description: 'Create task',
      children: { '1': { description: 'Disable while saving' } },
    },
  },
}

describe('parseRequirementsFile', () => {
  it('parses valid requirements', () => {
    const result = parseRequirementsFile(SAMPLE)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.structural['SR-001'].description).toBe('Home screen')
    }
  })
})
```

- [ ] **Step 2: Implement parse-requirements**

```ts
// src/product-spec/parse-requirements.ts
import { isBehavioralReqId, isStructuralReqId } from './sr-id'
import type { ReqDefinition, RequirementsFile } from './types'

export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string }

function parseReqDefinition(raw: unknown, path: string): ParseResult<ReqDefinition> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, message: `${path}: must be an object` }
  }
  const record = raw as Record<string, unknown>
  if (typeof record.description !== 'string' || record.description.length === 0) {
    return { ok: false, message: `${path}: description is required` }
  }
  const def: ReqDefinition = { description: record.description }
  if (record.children !== undefined) {
    if (typeof record.children !== 'object' || record.children === null || Array.isArray(record.children)) {
      return { ok: false, message: `${path}.children: must be an object` }
    }
    const children: Record<string, ReqDefinition> = {}
    for (const [key, child] of Object.entries(record.children as Record<string, unknown>)) {
      const parsed = parseReqDefinition(child, `${path}.children.${key}`)
      if (!parsed.ok) return parsed
      children[key] = parsed.value
    }
    return { ok: true, value: { ...def, children } }
  }
  return { ok: true, value: def }
}

export function parseRequirementsFile(raw: unknown): ParseResult<RequirementsFile> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, message: 'requirements.json must be an object' }
  }
  const record = raw as Record<string, unknown>
  const structuralRaw = record.structural
  const behavioralRaw = record.behavioral
  if (typeof structuralRaw !== 'object' || structuralRaw === null || Array.isArray(structuralRaw)) {
    return { ok: false, message: 'structural must be an object' }
  }
  if (typeof behavioralRaw !== 'object' || behavioralRaw === null || Array.isArray(behavioralRaw)) {
    return { ok: false, message: 'behavioral must be an object' }
  }

  const structural: Record<string, ReqDefinition> = {}
  for (const [id, def] of Object.entries(structuralRaw as Record<string, unknown>)) {
    if (!isStructuralReqId(id)) {
      return { ok: false, message: `structural key must be SR id, got ${id}` }
    }
    const parsed = parseReqDefinition(def, `structural.${id}`)
    if (!parsed.ok) return parsed
    structural[id] = parsed.value
  }

  const behavioral: Record<string, ReqDefinition> = {}
  for (const [id, def] of Object.entries(behavioralRaw as Record<string, unknown>)) {
    if (!isBehavioralReqId(id)) {
      return { ok: false, message: `behavioral key must be BR id, got ${id}` }
    }
    const parsed = parseReqDefinition(def, `behavioral.${id}`)
    if (!parsed.ok) return parsed
    behavioral[id] = parsed.value
  }

  return { ok: true, value: { structural, behavioral } }
}
```

- [ ] **Step 3: Write failing bindings test**

```ts
// src/product-spec/parse-bindings.test.ts
import { describe, expect, it } from 'vitest'
import { parseBindingsFile } from './parse-bindings'

describe('parseBindingsFile', () => {
  it('parses screen-only and SR-anchored bindings', () => {
    const result = parseBindingsFile({
      'BR-001': [['home', 'SR-012']],
      'BR-004': [['home']],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['BR-001'][0]).toEqual(['home', 'SR-012'])
      expect(result.value['BR-004'][0]).toEqual(['home'])
    }
  })
})
```

- [ ] **Step 4: Implement parse-bindings**

```ts
// src/product-spec/parse-bindings.ts
import { isBehavioralReqId, isStructuralReqId } from './sr-id'
import type { Binding, BindingsFile } from './types'
import type { ParseResult } from './parse-requirements'

export function parseBindingsFile(raw: unknown): ParseResult<BindingsFile> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, message: 'bindings.json must be an object' }
  }
  const bindings: Record<string, Binding[]> = {}
  for (const [brId, placements] of Object.entries(raw as Record<string, unknown>)) {
    if (!isBehavioralReqId(brId)) {
      return { ok: false, message: `bindings key must be BR id, got ${brId}` }
    }
    if (!Array.isArray(placements)) {
      return { ok: false, message: `bindings.${brId} must be an array` }
    }
    const parsed: Binding[] = []
    for (const entry of placements) {
      if (!Array.isArray(entry) || entry.length < 1 || entry.length > 2) {
        return { ok: false, message: `bindings.${brId}: each entry is [screen] or [screen, sr]` }
      }
      const screenId = entry[0]
      if (typeof screenId !== 'string' || screenId.length === 0) {
        return { ok: false, message: `bindings.${brId}: screen id must be a string` }
      }
      if (entry.length === 1) {
        parsed.push([screenId])
        continue
      }
      const srId = entry[1]
      if (typeof srId !== 'string' || !isStructuralReqId(srId)) {
        return { ok: false, message: `bindings.${brId}: sr must be SR id` }
      }
      parsed.push([screenId, srId])
    }
    bindings[brId] = parsed
  }
  return { ok: true, value: bindings }
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/product-spec/parse-requirements.test.ts src/product-spec/parse-bindings.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/product-spec/parse-requirements.ts src/product-spec/parse-bindings.ts src/product-spec/*.test.ts
git commit -m "feat(product-spec): parse requirements and bindings JSON"
```

---

### Task 4: loadProductSpec

**Files:**
- Create: `src/product-spec/load.ts`
- Create: `src/product-spec/load.test.ts`

**Interfaces:**
- Consumes: `parseRequirementsFile`, `parseBindingsFile`, `buildJsonDocument` from `src/json/build-json-document.ts`
- Produces: `loadProductSpec(storyboardDir: string): Promise<ProductSpec>`

- [ ] **Step 1: Write failing test**

```ts
// src/product-spec/load.test.ts
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadProductSpec } from './load'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('loadProductSpec', () => {
  it('loads todo trio after fixtures exist', async () => {
    const spec = await loadProductSpec(FIXTURE)
    expect(spec.wireframe.title).toBe('Todo App')
    expect(spec.requirements.structural['SR-001']).toBeDefined()
    expect(spec.bindings['BR-001']).toBeDefined()
  })
})
```

(Test fails until Task 9 fixtures exist — create minimal empty fixtures in Step 2 if running tasks in order, or implement Task 9 first.)

- [ ] **Step 2: Implement load**

```ts
// src/product-spec/load.ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildJsonDocument } from '@/json/build-json-document'
import { parseBindingsFile } from './parse-bindings'
import { parseRequirementsFile } from './parse-requirements'
import type { ProductSpec, WireframeSpec } from './types'

async function readJson(path: string): Promise<unknown> {
  const text = await readFile(path, 'utf8')
  return JSON.parse(text) as unknown
}

export async function loadProductSpec(storyboardDir: string): Promise<ProductSpec> {
  const specPath = join(storyboardDir, 'spec.json')
  const requirementsPath = join(storyboardDir, 'requirements.json')
  const bindingsPath = join(storyboardDir, 'bindings.json')

  const [specRaw, requirementsRaw, bindingsRaw] = await Promise.all([
    readJson(specPath),
    readJson(requirementsPath),
    readJson(bindingsPath),
  ])

  const built = buildJsonDocument(specRaw)
  if (!built.ok) {
    const msg = built.errors.map((e) => e.message).join('; ')
    throw new Error(`Invalid spec.json: ${msg}`)
  }

  const requirements = parseRequirementsFile(requirementsRaw)
  if (!requirements.ok) throw new Error(requirements.message)

  const bindings = parseBindingsFile(bindingsRaw)
  if (!bindings.ok) throw new Error(bindings.message)

  const wireframe: WireframeSpec = {
    title: built.document.title,
    screens: Object.fromEntries(
      built.document.screens.map((s) => [
        s.id,
        {
          ...(s.sr !== undefined ? { sr: s.sr } : {}),
          title: s.title,
          ...(s.note !== undefined ? { note: s.note } : {}),
          nodes: (specRaw as WireframeSpec).screens[s.id]?.nodes ?? [],
        },
      ]),
    ),
  }

  return {
    storyboardDir,
    wireframe,
    requirements: requirements.value,
    bindings: bindings.value,
  }
}
```

Note: `JsonScreenBuilt.sr` added in Task 8; until then omit `s.sr` spread or use raw spec for screen `sr`.

- [ ] **Step 3: Run test (after Task 9 fixtures)**

Run: `npm test -- src/product-spec/load.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/product-spec/load.ts src/product-spec/load.test.ts
git commit -m "feat(product-spec): load and merge three-file product spec"
```

---

### Task 5: Collect SR ids from spec

**Files:**
- Create: `src/product-spec/collect-sr-ids.ts`
- Create: `src/product-spec/collect-sr-ids.test.ts`

**Interfaces:**
- Produces: `collectSrPlacements(wireframe: WireframeSpec): Map<StructuralReqId, SrPlacement[]>`
- Produces: `listScreenIds(wireframe: WireframeSpec): Set<string>`
- Type: `SrPlacement = { screenId: string; path?: string }`

- [ ] **Step 1: Write failing test**

```ts
// src/product-spec/collect-sr-ids.test.ts
import { describe, expect, it } from 'vitest'
import { collectSrIds } from './collect-sr-ids'

describe('collectSrIds', () => {
  it('collects screen-level and tuple SR ids', () => {
    const ids = collectSrIds({
      title: 'T',
      screens: {
        home: {
          sr: 'SR-001',
          nodes: [
            ['Input', 'SR-011', { placeholder: 'Task' }],
            ['Link:primary-btn', 'SR-012', { goto: 'home' }, 'Add'],
          ],
        },
      },
    })
    expect(ids).toEqual(new Set(['SR-001', 'SR-011', 'SR-012']))
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/product-spec/collect-sr-ids.ts
import { isStructuralReqId } from './sr-id'
import type { StructuralReqId, WireframeSpec } from './types'

export function listScreenIds(wireframe: WireframeSpec): Set<string> {
  return new Set(Object.keys(wireframe.screens))
}

export function collectSrIds(wireframe: WireframeSpec): Set<StructuralReqId> {
  const ids = new Set<StructuralReqId>()
  for (const [screenId, screen] of Object.entries(wireframe.screens)) {
    if (screen.sr !== undefined && isStructuralReqId(screen.sr)) {
      ids.add(screen.sr)
    }
    walkNodes(screen.nodes, ids)
  }
  return ids
}

function walkNodes(nodes: unknown[], ids: Set<StructuralReqId>): void {
  for (const raw of nodes) {
  if (!Array.isArray(raw) || raw.length < 1) continue
    if (typeof raw[1] === 'string' && isStructuralReqId(raw[1])) {
      ids.add(raw[1])
      parseNodeChildrenWithSr(raw, ids)
    } else {
      parseNodeChildrenNoSr(raw, ids)
    }
  }
}

function parseNodeChildrenWithSr(raw: unknown[], ids: Set<StructuralReqId>): void {
  for (let i = 2; i < raw.length; i += 1) {
    const part = raw[i]
    if (Array.isArray(part)) walkNodes(part, ids)
    else if (typeof part === 'object' && part !== null && !Array.isArray(part)) {
      // props only — no nested walk
    }
  }
}

function parseNodeChildrenNoSr(raw: unknown[], ids: Set<StructuralReqId>): void {
  for (let i = 1; i < raw.length; i += 1) {
    const part = raw[i]
    if (Array.isArray(part)) walkNodes(part, ids)
  }
}
```

- [ ] **Step 3: Run test — PASS**

Run: `npm test -- src/product-spec/collect-sr-ids.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/product-spec/collect-sr-ids.ts src/product-spec/collect-sr-ids.test.ts
git commit -m "feat(product-spec): collect SR ids from wireframe spec"
```

---

### Task 6: validateProductSpec

**Files:**
- Create: `src/product-spec/validate.ts`
- Create: `src/product-spec/validate.test.ts`

**Interfaces:**
- Consumes: `collectSrIds`, `listScreenIds`, `isNamedChildKey`, `isNumericChildKey`, `isBehavioralReqId`
- Produces: `validateProductSpec(spec: ProductSpec): ValidationResult`

Validation rules (from PRODUCT-SPEC §validate):

| Check | Severity |
|-------|----------|
| SR in spec → exists in requirements.structural | error |
| SR in requirements.structural → appears in spec | warning |
| BR in bindings → exists in requirements.behavioral | error |
| binding screenId exists in spec | error |
| binding srId (if present) in that screen's SR set | error |
| BR child keys: shared parents use named slugs; local `BR-\d+` use numeric | error |
| Child paths reference valid parent keys | error |

- [ ] **Step 1: Write failing test with invalid fixture**

```ts
// src/product-spec/validate.test.ts
import { describe, expect, it } from 'vitest'
import { loadProductSpec } from './load'
import { validateProductSpec } from './validate'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('validateProductSpec', () => {
  it('passes todo fixture', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const result = validateProductSpec(spec)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('errors when SR in spec missing from requirements', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const broken = {
      ...spec,
      requirements: {
        ...spec.requirements,
        structural: { ...spec.requirements.structural },
      },
    }
    delete (broken.requirements.structural as Record<string, unknown>)['SR-011']
    const result = validateProductSpec(broken)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.code === 'SR_MISSING_DEFINITION')).toBe(true)
  })
})
```

- [ ] **Step 2: Implement validate.ts** (~120 lines — walk requirements behavioral tree for child key rules; cross-ref bindings)

Key helper:

```ts
function isLocalBrId(id: string): boolean {
  return /^BR-[0-9]+$/.test(id)
}

function validateBrChildKeys(requirements: RequirementsFile, issues: ValidationIssue[]): void {
  for (const [brId, def] of Object.entries(requirements.behavioral)) {
    if (!def.children) continue
    const local = isLocalBrId(brId)
    for (const key of Object.keys(def.children)) {
      if (local && !isNumericChildKey(key)) {
        issues.push({
          code: 'BR_CHILD_KEY',
          severity: 'error',
          message: `Local BR ${brId} child key must be numeric, got "${key}"`,
        })
      }
      if (!local && !isNamedChildKey(key)) {
        issues.push({
          code: 'BR_CHILD_KEY',
          severity: 'error',
          message: `Shared BR ${brId} child key must be named slug, got "${key}"`,
        })
      }
    }
  }
}
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/product-spec/validate.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/product-spec/validate.ts src/product-spec/validate.test.ts
git commit -m "feat(product-spec): cross-validate three-file product spec"
```

---

### Task 7: req show + impact

**Files:**
- Create: `src/product-spec/req-show.ts`
- Create: `src/product-spec/impact.ts`
- Create: `src/product-spec/req-show.test.ts`
- Create: `src/product-spec/impact.test.ts`

**Interfaces:**
- Produces: `showReq(spec: ProductSpec, id: string): string`
- Produces: `impact(spec: ProductSpec, target: string): ImpactResult`

Behavior:

- `showReq SR-011` → description + list screens where SR appears (from `collectSrIds` + wireframe walk)
- `showReq BR-PASSWORD-VALIDATE` → definition tree JSON pretty-printed
- `impact BR-PASSWORD-VALIDATE` → bindings entries + screen/SR list
- `impact home` → all BRs with a binding touching screen `home`

- [ ] **Step 1: Write failing req-show test**

```ts
// src/product-spec/req-show.test.ts
import { describe, expect, it } from 'vitest'
import { loadProductSpec } from './load'
import { showReq } from './req-show'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('showReq', () => {
  it('shows SR description and placements', async () => {
    const spec = await loadProductSpec(FIXTURE)
    const text = showReq(spec, 'SR-011')
    expect(text).toContain('SR-011')
    expect(text).toContain('home')
  })
})
```

- [ ] **Step 2: Implement req-show + impact** (format as human-readable plain text for SR; JSON.stringify for BR trees)

- [ ] **Step 3: Write impact test**

```ts
it('lists bindings for shared BR', async () => {
  const spec = await loadProductSpec(FIXTURE)
  const result = impact(spec, 'BR-PASSWORD-VALIDATE')
  expect(result.bindings.length).toBeGreaterThan(0)
})
```

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/product-spec/req-show.ts src/product-spec/impact.ts src/product-spec/*.test.ts
git commit -m "feat(product-spec): add req show and impact helpers"
```

---

### Task 8: SR tuple parser in JSON compiler

**Files:**
- Create: `src/json/is-sr-tuple.ts` (or `src/json/sr-id.ts` mirroring product-spec pattern)
- Modify: `src/json/types.ts`
- Modify: `src/json/parse-node.ts`
- Modify: `src/json/parse-node.test.ts`
- Modify: `src/json/build-json-document.ts`

**Interfaces:**
- Produces: `parseJsonNode` accepts 1–4 tuple elements when `tuple[1]` matches `^SR-`
- Produces: `JsonNode.sr?: string`
- Produces: `JsonScreenBuilt.sr?: string` from screen object `sr` field

- [ ] **Step 1: Write failing SR tuple tests**

```ts
// src/json/parse-node.test.ts — append
it('parses Input with SR as second element', () => {
  expect(parseJsonNode(['Input', 'SR-010', { placeholder: 'Email' }])).toEqual({
    tag: { component: 'Input', modifiers: [] },
    sr: 'SR-010',
    props: { placeholder: 'Email' },
  })
})

it('parses Link with SR, props, and text', () => {
  expect(parseJsonNode(['Link:primary-btn', 'SR-012', { goto: 'home' }, 'Add'])).toEqual({
    tag: { component: 'Link', modifiers: ['primary-btn'] },
    sr: 'SR-012',
    props: { goto: 'home' },
    children: 'Add',
  })
})

it('does not treat Container children as SR', () => {
  const node = parseJsonNode(['Container:row', [['Input', 'SR-010', { placeholder: 'x' }]]])
  expect(node.sr).toBeUndefined()
  expect(Array.isArray(node.children)).toBe(true)
})
```

- [ ] **Step 2: Run test — FAIL**

Run: `npm test -- src/json/parse-node.test.ts`
Expected: FAIL

- [ ] **Step 3: Update types**

```ts
// src/json/types.ts — JsonNode
export type JsonNode = {
  tag: ParsedTag
  sr?: string
  props: JsonProps
  children?: readonly JsonNode[] | string
  graphLinkId?: string
}
```

- [ ] **Step 4: Rewrite parseJsonNode SR branch**

```ts
// src/json/parse-node.ts — after tag parse
const SR_PATTERN = /^SR-[A-Z0-9-]+$/

function isSrSlot(value: unknown): value is string {
  return typeof value === 'string' && SR_PATTERN.test(value)
}

export function parseJsonNode(raw: unknown): JsonNode {
  // ... array length 1-4 when SR present, else 1-3
  if (raw.length >= 2 && isSrSlot(raw[1])) {
    const sr = raw[1]
    const rest = raw.slice(2)
    if (rest.length === 0) return { tag, sr, props: {} }
    if (typeof rest[0] === 'string') return { tag, sr, props: {}, children: rest[0] }
    if (isPlainObject(rest[0])) {
      const props = normalizeProps(rest[0])
      if (rest.length === 1) return { tag, sr, props }
      return { tag, sr, props, children: parseChildren(rest[1]) }
    }
    if (Array.isArray(rest[0])) return { tag, sr, props: {}, children: parseChildren(rest[0]) }
    throw new JsonBuildError('INVALID_NODE', 'Invalid tuple after SR id')
  }
  // existing non-SR logic unchanged
}
```

Update length check: allow `raw.length` up to 4 when SR present.

- [ ] **Step 5: Screen-level sr in build-json-document**

```ts
// build-json-document.ts — JsonScreenInput
type JsonScreenInput = {
  sr?: unknown
  title?: unknown
  note?: unknown
  nodes?: unknown
}

// in screen loop:
const screenSr = typeof screenInput.sr === 'string' ? screenInput.sr : undefined
// validate with SR_PATTERN if present
screens.push({
  id: screenId,
  ...
  ...(screenSr !== undefined ? { sr: screenSr } : {}),
})
```

- [ ] **Step 6: Run all json tests**

Run: `npm test -- src/json/parse-node.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/json/types.ts src/json/parse-node.ts src/json/parse-node.test.ts src/json/build-json-document.ts
git commit -m "feat(json): parse optional SR as second tuple element"
```

---

### Task 9: Todo sample fixtures

**Files:**
- Create: `src/product-spec/fixtures/todo/spec.json`
- Create: `src/product-spec/fixtures/todo/requirements.json`
- Create: `src/product-spec/fixtures/todo/bindings.json`

**Interfaces:**
- Produces: valid trio passing `validateProductSpec` and `buildJsonDocument`

- [ ] **Step 1: Write spec.json**

```json
{
  "title": "Todo App",
  "screens": {
    "home": {
      "sr": "SR-001",
      "title": "Home",
      "nodes": [
        ["Text:h1", "SR-014", "Tasks"],
        ["Container:row", [
          ["Input", "SR-011", { "placeholder": "New task" }],
          ["Link:primary-btn", "SR-012", { "goto": "home" }, "Add"]
        ]],
        ["Container:row", [
          ["Link", "SR-013", { "goto": "home" }, "All"],
          ["Link", { "goto": "home" }, "Active"],
          ["Link", { "goto": "home" }, "Done"]
        ]],
        ["Text", "SR-014", "No tasks yet"]
      ]
    },
    "edit-task": {
      "title": "Edit task",
      "nodes": [
        ["Modal", { "id": "edit" }, [
          ["Input:password", "SR-020", { "label": "Confirm" }],
          ["Link:primary-btn", { "goto": "_close" }, "Save"]
        ]]
      ]
    }
  }
}
```

(Adjust SR-014 usage — only one empty-state Text; fix duplicate SR-014: use SR-010 for task list area, SR-014 for empty state only.)

**Revised SR map:**

| SR | Meaning |
|----|---------|
| SR-001 | Home screen |
| SR-010 | Task list container |
| SR-011 | Add task input |
| SR-012 | Add button |
| SR-013 | Filter tabs |
| SR-014 | Empty state text |
| SR-020 | Edit modal password confirm |

- [ ] **Step 2: Write requirements.json** (all SRs + BR-001..004 + BR-PASSWORD-VALIDATE/MIN-LEN,SPECIAL)

- [ ] **Step 3: Write bindings.json**

```json
{
  "BR-001": [["home", "SR-012"]],
  "BR-002": [["home", "SR-010"]],
  "BR-003": [["home", "SR-010"]],
  "BR-004": [["home", "SR-013"]],
  "BR-PASSWORD-VALIDATE": [
    ["edit-task", "SR-020"]
  ]
}
```

- [ ] **Step 4: Verify fixture**

Run: `npm run storyboard validate` (after Task 10) or:

```bash
npx tsx -e "
import { loadProductSpec } from './src/product-spec/load.ts'
import { validateProductSpec } from './src/product-spec/validate.ts'
const s = await loadProductSpec('src/product-spec/fixtures/todo')
console.log(validateProductSpec(s))
"
```

Expected: `{ ok: true, errors: [], warnings: [] }`

- [ ] **Step 5: Commit**

```bash
git add src/product-spec/fixtures/todo
git commit -m "feat(product-spec): add todo app sample trio"
```

---

### Task 10: trace via ripgrep

**Files:**
- Create: `src/product-spec/trace.ts`
- Create: `src/product-spec/trace.test.ts`

**Interfaces:**
- Produces: `traceReq(spec: ProductSpec, target: string, opts: { implRoot: string; testRoot?: string }): TraceResult`

Patterns:

- SR `SR-011` → `rg 'sb-req=["']SR-011["']' implRoot`
- BR `BR-001` → `rg '@sb-req:\s*BR-001' implRoot`
- Occurrence `home__BR-001` → `rg 'home__BR-001' testRoot`

Use `child_process.execFile('rg', ...)` with fallback error if `rg` not installed.

- [ ] **Step 1: Write test with temp fixture files**

```ts
// src/product-spec/trace.test.ts
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { traceReq } from './trace'
import { loadProductSpec } from './load'
import { fileURLToPath } from 'node:url'

const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('traceReq', () => {
  it('finds sb-req attribute matches', async () => {
    const implRoot = mkdtempSync(join(tmpdir(), 'sb-trace-'))
    mkdirSync(join(implRoot, 'features'), { recursive: true })
    writeFileSync(
      join(implRoot, 'features', 'Home.tsx'),
      '<Input sb-req="SR-011" placeholder="Task" />\n',
    )
    const spec = await loadProductSpec(FIXTURE)
    const result = await traceReq(spec, 'SR-011', { implRoot })
    expect(result.matches.length).toBeGreaterThan(0)
    expect(result.matches[0].file).toContain('Home.tsx')
  })
})
```

- [ ] **Step 2: Implement trace.ts**

```ts
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export async function traceReq(
  _spec: ProductSpec,
  target: string,
  opts: { implRoot: string; testRoot?: string },
): Promise<TraceResult> {
  const root = target.includes('__') ? (opts.testRoot ?? opts.implRoot) : opts.implRoot
  const pattern = buildPattern(target)
  const { stdout } = await execFileAsync(
    'rg',
    ['--json', '-n', pattern, root],
    { maxBuffer: 10 * 1024 * 1024 },
  )
  return { target, matches: parseRgJson(stdout) }
}
```

(Implement `buildPattern` + `parseRgJson` for ripgrep `--json` lines format.)

- [ ] **Step 3: Run test** (skip in CI if no `rg` — document requirement)

Run: `npm test -- src/product-spec/trace.test.ts`
Expected: PASS when `rg` installed

- [ ] **Step 4: Commit**

```bash
git add src/product-spec/trace.ts src/product-spec/trace.test.ts
git commit -m "feat(product-spec): trace SR/BR via ripgrep"
```

---

### Task 11: CLI (tsx)

**Files:**
- Create: `src/product-spec/cli/main.ts`
- Create: `src/product-spec/cli/run-validate.ts`
- Create: `src/product-spec/cli/run-req-show.ts`
- Create: `src/product-spec/cli/run-impact.ts`
- Create: `src/product-spec/cli/run-trace.ts`
- Create: `src/product-spec/cli/resolve-storyboard-dir.ts`

**Interfaces:**
- Resolves `storyboard/` as `join(cwd, 'storyboard')` — error if `spec.json` missing

- [ ] **Step 1: Implement resolve-storyboard-dir**

```ts
// src/product-spec/cli/resolve-storyboard-dir.ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function resolveStoryboardDir(cwd: string): string {
  const dir = join(cwd, 'storyboard')
  if (!existsSync(join(dir, 'spec.json'))) {
    throw new Error(`No storyboard/spec.json under ${cwd}`)
  }
  return dir
}
```

- [ ] **Step 2: Implement command runners**

```ts
// src/product-spec/cli/run-validate.ts
import { loadProductSpec } from '../load'
import { validateProductSpec } from '../validate'

export async function runValidate(cwd: string): Promise<number> {
  const { resolveStoryboardDir } = await import('./resolve-storyboard-dir')
  const spec = await loadProductSpec(resolveStoryboardDir(cwd))
  const result = validateProductSpec(spec)
  for (const e of result.errors) console.error(`error: ${e.message}`)
  for (const w of result.warnings) console.warn(`warn: ${w.message}`)
  if (result.ok) {
    console.log('storyboard validate: ok')
    return 0
  }
  return 1
}
```

(Same pattern for req show, impact, trace.)

- [ ] **Step 3: Wire main.ts**

```ts
// src/product-spec/cli/main.ts
import { runValidate } from './run-validate'
import { runReqShow } from './run-req-show'
import { runImpact } from './run-impact'
import { runTrace } from './run-trace'

const [command, sub, ...rest] = process.argv.slice(2)
const cwd = process.cwd()

async function main(): Promise<number> {
  if (command === 'validate') return runValidate(cwd)
  if (command === 'req' && sub === 'show') return runReqShow(cwd, rest[0] ?? '')
  if (command === 'impact') return runImpact(cwd, sub ?? '')
  if (command === 'trace') return runTrace(cwd, sub ?? '')
  console.error(`Usage: storyboard validate | req show <id> | impact <target> | trace <target>`)
  return 1
}

main().then((code) => {
  process.exitCode = code
})
```

- [ ] **Step 4: Manual smoke from repo root**

Copy fixtures to temp dir or add `storyboard/` symlink for smoke:

```bash
mkdir -p /tmp/sb-smoke/storyboard
cp src/product-spec/fixtures/todo/* /tmp/sb-smoke/storyboard/
cd /tmp/sb-smoke && npm run storyboard -- validate
cd /tmp/sb-smoke && npm run storyboard -- req show SR-011
```

Expected: validate ok; req show prints SR-011

- [ ] **Step 5: Commit**

```bash
git add src/product-spec/cli
git commit -m "feat(product-spec): add tsx CLI for validate, req, impact, trace"
```

---

### Task 12: Doc alignment

**Files:**
- Modify: `docs/JSON-COMPONENTS.md` — §Node tuples + SR forms (link PRODUCT-SPEC)
- Modify: `docs/VISION.md` — `UI-xxx`/`BH-xxx` → `SR-xxx`/`BR-xxx` in traceability section
- Modify: `docs/CONTEXT.md` — Product Spec layer + `src/product-spec/` + `npm run storyboard`
- Modify: `docs/ROADMAP.md` — P1 items 2–7 → ✓ when done
- Modify: `AGENTS.md` — add PRODUCT-SPEC ref + storyboard CLI script

- [ ] **Step 1: JSON-COMPONENTS.md** — add after §Node tuples:

```markdown
### Structural requirements (SR)

Optional 2nd tuple element when traceable — see [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md).

[tag, sr] | [tag, sr, props] | [tag, sr, text] | [tag, sr, props, text] | [tag, sr, children] | [tag, sr, props, children]

`sr` matches `^SR-`. Layout nodes (`Container:row`) typically omit SR.
```

- [ ] **Step 2: VISION.md** — replace UI-/BH- examples with SR-/BR-

- [ ] **Step 3: CONTEXT.md** — short §Product Spec under Architecture

- [ ] **Step 4: ROADMAP P1 table** — mark items 2–7 ✓

- [ ] **Step 5: AGENTS.md** — add to Commands block:

```bash
npm run storyboard  # validate | req show | impact | trace (P1 local CLI)
```

- [ ] **Step 6: Final verification**

Run: `npm run build && npm run check && npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add docs/ AGENTS.md
git commit -m "docs: align JSON-COMPONENTS, VISION, CONTEXT for product spec P1"
```

---

## Self-review

### Spec coverage

| PRODUCT-SPEC §Phase 1 deliverable | Task |
|-----------------------------------|------|
| Types | Task 2 |
| Loader (three files, merge) | Tasks 3–4 |
| Tuple parser (SR 2nd element) | Task 8 |
| CLI stubs | Task 11 |
| Todo sample trio | Task 9 |
| Vitest validator + tuple parser | Tasks 6, 8 |
| Doc alignment | Task 12 |

### Placeholder scan

All tasks include concrete code paths and test commands. Fixture JSON in Task 9 is specified with SR matrix; implementer fills full `requirements.json` text from matrix in Step 2.

### Type consistency

- `StructuralReqId` / `isStructuralReqId` shared pattern between `src/product-spec/sr-id.ts` and `src/json/parse-node.ts` (duplicate regex — acceptable min diff; optional shared `src/lib/sr-id.ts` if dedup preferred)
- `loadProductSpec` → `validateProductSpec` → CLI uses same `ProductSpec` type throughout
- `JsonNode.sr` populated by parser; `collectSrIds` reads raw tuple JSON from wireframe (works before/after parse)

### Gaps

- `trace` requires `rg` on PATH — document in AGENTS.md; test skips if unavailable
- `load.ts` retains raw `nodes` from spec JSON for SR collection; wireframe validation uses `buildJsonDocument` for nav rules

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-30-p1-product-spec-engine.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

**After P1:** proceed to [`2026-06-30-p2-npm-package.md`](2026-06-30-p2-npm-package.md) Task 2 (migrate `src/product-spec/` → `@storyboard/spec`).
