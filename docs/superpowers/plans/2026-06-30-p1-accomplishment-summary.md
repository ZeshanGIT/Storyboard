# P1 Product Spec Engine — Accomplishment Summary

**Date:** 2026-06-30  
**Branch range:** `7b97178` → `e9babf1` (13 commits)  
**Plan:** [`2026-06-30-p1-product-spec-engine.md`](2026-06-30-p1-product-spec-engine.md)  
**Execution:** Subagent-driven development (Composer 2.5, per-task implement + review)  
**Schema:** [`PRODUCT-SPEC.md`](../../PRODUCT-SPEC.md) (accepted 2026-06-30)

---

## What we set out to do

Implement **Phase 1 (P1)** of the Product Spec platform: the three-file JSON model (`spec.json`, `requirements.json`, `bindings.json`), validation, traceability helpers, SR tuple parsing in the JSON wireframe compiler, a todo sample, Vitest coverage, and a local `tsx` CLI — **without** npm publish (that is P2).

---

## What shipped

### 1. Product Spec engine (`src/product-spec/`)

| Module | Role |
|--------|------|
| `types.ts` | `ProductSpec`, `RequirementsFile`, `BindingsFile`, `ValidationResult`, `ImpactResult`, `TraceResult` |
| `sr-id.ts` | `isStructuralReqId`, `isBehavioralReqId`, `parseReqPath`, child-key validators |
| `parse-requirements.ts` | Parse `requirements.json` |
| `parse-bindings.ts` | Parse `bindings.json` (`[screen]` or `[screen, sr]`) |
| `load.ts` | `loadProductSpec(storyboardDir)` — reads trio, validates wireframe via `buildJsonDocument` |
| `collect-sr-ids.ts` | `collectSrIds`, `collectSrPlacements`, `listScreenIds` |
| `validate.ts` | `validateProductSpec` — full PRODUCT-SPEC §validate cross-file rules |
| `req-show.ts` | `showReq(spec, id)` — SR description + placements, or BR definition tree |
| `impact.ts` | `impact(spec, target)` — by BR id or screen id |
| `trace.ts` | `traceReq(spec, target, opts)` — ripgrep over `src/` for `sb-req=` and `// @sb-req:` |
| `index.ts` | Public API (P2 → `@storyboard/spec` contract) |
| `cli/` | `validate`, `req show`, `impact`, `trace` command runners |

### 2. JSON wireframe SR tuples (`src/json/`)

- Optional **SR as 2nd tuple element** (`^SR-[A-Z0-9-]+$`) in `parse-node.ts`
- `JsonNode.sr` and screen-level `JsonScreenBuilt.sr` in `build-json-document.ts`
- Tests in `parse-node.test.ts`

### 3. Todo sample (`src/product-spec/fixtures/todo/`)

Full Phase 1 fixture trio:

- **Screens:** `home`, `edit-task` (modal)
- **SRs:** SR-001, SR-010–014, SR-020
- **BRs:** BR-001–004 + shared `BR-PASSWORD-VALIDATE` (MIN-LEN, SPECIAL) on edit-task/SR-020
- Passes `validateProductSpec` and `buildJsonDocument`

### 4. Local CLI

```bash
npm run storyboard -- validate
npm run storyboard -- req show SR-011
npm run storyboard -- impact BR-PASSWORD-VALIDATE
npm run storyboard -- impact home
npm run storyboard -- trace SR-011
```

Resolves `storyboard/` under the current working directory. `trace` requires `rg` (ripgrep) on PATH.

### 5. Documentation

| Doc | Change |
|-----|--------|
| `PRODUCT-SPEC.md` | Status → Accepted; open questions resolved |
| `ROADMAP.md` | P1 items 2–8 marked ✓; focus → P2 |
| `JSON-COMPONENTS.md` | §Structural requirements (SR) tuple forms |
| `VISION.md` | Traceability ids `UI-`/`BH-` → `SR-`/`BR-` |
| `CONTEXT.md` | Product Spec layer + `src/product-spec/` in repo map |
| `AGENTS.md` | `PRODUCT-SPEC.md` ref, `npm run storyboard`, `rg` note |

### 6. Planning artifacts (this session)

| Doc | Purpose |
|-----|---------|
| [`2026-06-30-p1-product-spec-engine.md`](2026-06-30-p1-product-spec-engine.md) | P1 implementation plan (written before execution) |
| [`2026-06-30-p2-npm-package.md`](2026-06-30-p2-npm-package.md) | P2 npm package plan (locked decisions noted) |
| `.superpowers/sdd/progress.md` | SDD task ledger |

---

## PRODUCT-SPEC Phase 1 deliverables — checklist

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Accepted schema + conventions | ✓ `PRODUCT-SPEC.md` |
| 2 | Types (`StructuralReqId`, `BehavioralReqId`, `ReqPath`, `Binding`, `ProductSpec`) | ✓ |
| 3 | Loader — read three files, merge, cross-validate | ✓ |
| 4 | Tuple parser — SR as optional 2nd element | ✓ |
| 5 | CLI stubs — `req show`, `impact`, `trace`, `validate` | ✓ |
| 6 | Sample todo app JSON trio | ✓ |
| 7 | Vitest — validator + tuple parser | ✓ |
| 8 | Doc alignment | ✓ |

**Out of scope (correctly not built):** npm publish, TanStack codegen, MDX requirements, drift detection.

---

## Commits (oldest → newest)

```
f8341d0 chore: scaffold src/product-spec module
2b3d35d feat(product-spec): add core types and SR/BR id helpers
5b52533 feat(product-spec): parse requirements and bindings JSON
f174b68 feat(product-spec): load and merge three-file product spec
afa6b43 feat(product-spec): collect SR ids from wireframe spec
fcb55c3 feat(product-spec): cross-validate three-file product spec
caab47f feat(product-spec): add req show and impact helpers
ff4f1dc feat(json): parse optional SR as second tuple element
513a267 feat(product-spec): add todo app sample trio
9b9056a feat(product-spec): trace SR/BR via ripgrep
b81ae29 feat(product-spec): add tsx CLI for validate, req, impact, trace
aa5bf52 docs: align JSON-COMPONENTS, VISION, CONTEXT for product spec P1
e9babf1 docs: fix VISION BR id and PRODUCT-SPEC alignment notes
```

**Diff size:** 40 files, +2519 / −361 lines

---

## Verification

At completion:

- `npm test` — **129 tests** passed (48 files)
- `npm run build` — pass
- `npm run check` — pass

Quick CLI smoke (from a directory with `storyboard/`):

```bash
mkdir -p /tmp/sb-demo/storyboard
cp src/product-spec/fixtures/todo/* /tmp/sb-demo/storyboard/
cd /tmp/sb-demo && npm run storyboard -- validate
# → storyboard validate: ok
```

---

## Architecture (mental model)

```
storyboard/spec.json          wireframe + SR placement
storyboard/requirements.json  SR/BR definitions
storyboard/bindings.json      BR → [screen, sr?]

loadProductSpec()  →  ProductSpec
validateProductSpec()  →  cross-file errors/warnings
showReq / impact / trace  →  traceability CLI helpers

spec.json tuples  →  buildJsonDocument (nav rules) + collectSrIds (SR index)
```

---

## Known follow-ups (non-blocking)

Documented in final branch review; safe to address during P2:

1. **CLI error handling** — `main()` has no `.catch()`; missing/invalid `storyboard/` can throw instead of exit 1
2. **parse-node message** — arity error still says “1–3 elements” when SR allows 4
3. **`SR_PATTERN` duplication** — same regex in `sr-id.ts`, `parse-node.ts`, `build-json-document.ts` (consolidate when packaging)
4. **`load.ts` → `@/json`** — P2 must decide package boundary for JSON compiler vs `@storyboard/spec`
5. **PRODUCT-SPEC §Relationship** — a few rows still use future tense (“when implementation starts”)

---

## What’s next

**P2 — npm package** per [`2026-06-30-p2-npm-package.md`](2026-06-30-p2-npm-package.md):

- `@storyboard/spec` ← migrate `src/product-spec/`
- `@storyboard/shell` ← extract Vite plugin + Shell
- `storyboard` CLI ← `npx storyboard init | dev | validate | …`
- Publish `0.1.0` (unstable)

P1 gate is cleared; ROADMAP current focus is P2.
