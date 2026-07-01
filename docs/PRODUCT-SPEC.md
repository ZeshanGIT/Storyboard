# Product Specification — Phase 1 Design

**Status:** Accepted (2026-06-30)  
**Parent:** [`VISION.md`](VISION.md) · [`JSON-COMPONENTS.md`](JSON-COMPONENTS.md) · [`CONTEXT.md`](CONTEXT.md)

This document defines the Product Specification schema, traceability conventions, and Phase 1 deliverables. It consolidates design decisions from the roadmap toward npm packaging, the cloud POC (TanStack Start + JSON), and traceability as OneSpec's core feature.

---

## Context: where we are

| Layer | Today | Target |
|-------|--------|--------|
| Wireframe spec (screens, nav) | MDX + JSON → shell views | One slice of Product Spec |
| Structural requirements (`SR-xxx`) | Not in schema | Linked to wireframe nodes + generated UI |
| Behavioral requirements (`BR-xxx`) | Not in schema | Linked via `// @sb-req:` + tests |
| Implementation | Manual React in this repo | Generated / AI-maintained app (TanStack Start for cloud POC) |
| Distribution | Private monolithic app | `npx @onespec-dev/cli` in any repo |

The current repo proves the **projection layer** (Preview / Prototype / Graph). Phase 1 adds **requirements**, **traceability**, and the schema foundation for everything that follows.

---

## Roadmap overview

Recommended sequencing (do not publish npm before the schema is stable):

```
1. Spec schema (requirements + traceability)     ← Phase 1 (this doc)
2. Minimal CLI + package shape
3. npm publish (0.x, explicit unstable)
4. Toy repo (todo app) for evaluation
5. TanStack Start cloud template + AI workflow
```

### Later phases (summary)

**Phase 2 — Package extraction + CLI**

- Split: `@onespec/spec`, `@onespec/shell`, `onespec` CLI
- `npx @onespec-dev/cli init` — embedded mode (power users) vs cloud template
- Publish 0.1.0 with: init, dev (shell), validate — no production codegen yet

**Phase 3 — Toy repo + traceability proof**

- Separate repo (e.g. todo app)
- Prove SR → UI, BR → comments → tests
- Cursor agent playbook: spec first, then implementation, then tests

**Phase 4 — Opinionated stack**

- TanStack Start + shadcn + Tailwind (cloud POC)
- AI + conventions + annotations before full codegen

---

## Design goals

### Token minimization

The spec is read frequently by AI agents. Every byte counts.

- **`spec.json`** — wireframe structure + SR placement only. No BR references. No descriptions.
- **SR as optional 2nd tuple element** — when a node is traceable, SR goes in position [1]; layout-only nodes (e.g. `Container:row`) omit it and use standard tuple forms.
- **`requirements.json`** — definitions only. Loaded on demand via CLI, not on every flow read.
- **`bindings.json`** — BR → spec placements. Loaded for impact analysis, not for flow understanding.

### Separation of concerns

| Task | File to edit |
|------|--------------|
| Change screen layout / navigation | `spec.json` |
| Change what a requirement *means* | `requirements.json` |
| Change where a behavior *applies* | `bindings.json` |

Editing a BR definition should not force you to see every screen that uses it. When you *want* impact visibility, CLI reads `bindings.json`.

---

## Three-file model

| File | Answers | Loaded when |
|------|---------|-------------|
| `spec.json` | *What exists, where (SR ids), how screens connect* | Every flow / wireframe read |
| `requirements.json` | *What each SR/BR means (descriptions, sub-trees)* | `req show`, validation, deep edits |
| `bindings.json` | *Which BR applies where (screen + optional SR)* | Impact analysis, trace, validation |

On disk: three files. In tooling: merge into one validated `ProductSpec` model.

### Why three files, not two?

**Option A — bindings inside `requirements.json`** (`appliesTo` on each BR):

- Pros: fewer files
- Cons: editing a BR definition always includes usage list; file grows mixed concerns; higher token cost when AI only needs definition

**Option B — separate `bindings.json`** (recommended):

- Pros: spec stays minimal; requirements stay pure definitions; bindings edited independently; CLI `impact BR-001` loads only bindings
- Cons: one more file to validate

Recommendation: **Option B** — `bindings.json`.

SR placement does **not** need a bindings file. The spec tuple *is* the structural binding — `requirements.json` holds descriptions only.

---

## File layout

```
onespec/
  spec.json           # wireframes + SR ids only (minimal)
  requirements.json   # SR/BR definitions and sub-trees
  bindings.json       # BR → [screen, sr?] placements
  DESIGN.md           # style guide (cloud POC; not Phase 1)
  ARCHITECTURE.md     # stack conventions (cloud POC; not Phase 1)
```

---

## ID scheme

| Kind | Prefix | Example | Placement | Implementation trace |
|------|--------|---------|-----------|----------------------|
| Structural | `SR-` | `SR-001` | Optional 2nd tuple element, or screen-level `sr` | `sb-req="SR-001"` on TSX |
| Behavioral (local) | `BR-` | `BR-001` | `bindings.json` only | `// @sb-req: BR-001` or `// @sb-req: BR-001/2` |
| Behavioral (shared) | `BR-` | `BR-PASSWORD-VALIDATE` | `bindings.json` only | `// @sb-req: BR-PASSWORD-VALIDATE/MIN-LEN` |

> **Done (2026-06-30):** [`VISION.md`](VISION.md) aligned to `SR-` / `BR-` ids (Task 12).

### SR ids

Sequential numeric: `SR-001`, `SR-002`, …

### BR ids — hybrid naming

Two BR kinds, two naming conventions:

| Kind | Parent id | Child path segments | When to use |
|------|-----------|---------------------|-------------|
| **Shared / util** | `BR-{DOMAIN}-{NAME}` | **Named slugs** — `MIN-LEN`, `SPECIAL` | Reused across screens; leaves referenced in shared code/tests |
| **Screen-local** | `BR-{NNN}` (sequential) | **Numeric** — `1`, `2`, `3` | Single-screen flows; no shared implementation |

Examples:

```
BR-PASSWORD-VALIDATE           shared parent
BR-PASSWORD-VALIDATE/MIN-LEN   shared child (named slug)
BR-PASSWORD-VALIDATE/SPECIAL   shared child (named slug)

BR-001                         screen-local parent (login submit)
BR-001/1                       screen-local child (disable while loading)
BR-001/2                       screen-local child (navigate on success)
```

**Child keys** in `requirements.json` → `children` object keys **are** the path segment. Full path = `{parentId}/{childKey}/…`.

Rules for named child slugs:

- Uppercase kebab: `MIN-LEN`, `SPECIAL`, `MAX-RETRIES`
- Short and stable — max ~20 characters
- Prefer abbreviations over full words (`MIN-LEN` not `MINIMUM-LENGTH`)
- Do not renumber when inserting siblings — slug identity is stable

Rules for numeric child keys:

- String digits only: `"1"`, `"2"`, `"3"`
- Fine for screen-local BRs where leaves are not grep'd in isolation

Deep nesting (`BR-001/2/1`) is allowed but avoid beyond two levels in Phase 1 unless truly hierarchical.

Do not pre-assign global serial numbers to every leaf (e.g. `BR-047`). Paths encode hierarchy; CLI resolves them.

---

## Wireframe tuples with SR

Extends [`JSON-COMPONENTS.md`](JSON-COMPONENTS.md). **SR is optional.** Most traceable primitives get one; layout/grouping nodes usually do not.

### When to use SR

| Use SR | Skip SR |
|--------|---------|
| Inputs, links, buttons, modals | `Container:row`, `Container:col` — layout grouping only |
| Text that carries product meaning | Pure spacing / alignment wrappers |
| Images, icons with spec significance | `Divider` and other non-semantic chrome |

Rule of thumb: if removing the node would not remove a **product requirement**, it probably does not need an SR.

### Parse rule

If `tuple[1]` is a string matching `^SR-`, it is a structural requirement id and shifts remaining elements right. **Otherwise** parse as standard [`JSON-COMPONENTS.md`](JSON-COMPONENTS.md) forms — no SR on that node.

This disambiguates automatically:

```json
["Container:row", [["Input", "SR-010", { "placeholder": "Email" }]]]
```

Here `tuple[1]` is an array (children) → no SR on the container.

```json
["Input", "SR-010", { "placeholder": "Email" }]
```

Here `tuple[1]` is `"SR-010"` → SR present.

### Forms with SR (optional)

When a node **is** traceable, SR is always the second element:

```
[tag, sr]                        leaf, SR only
[tag, sr, props]                 leaf with props
[tag, sr, text]                  text leaf (Text, Link label)
[tag, sr, props, text]           text leaf with props
[tag, sr, children]              container, no props
[tag, sr, props, children]       container with props
```

### Forms without SR (standard)

Layout and other non-traceable nodes use existing forms unchanged:

```
[tag]
[tag, props]
[tag, text]
[tag, props, text]
[tag, props, children]
[tag, children]
```

### Examples

```json
["Container:row", [
  ["Input", "SR-010", { "placeholder": "Email" }],
  ["Input", "SR-011", { "placeholder": "Password" }]
]]
["Link:primary-btn", "SR-012", { "goto": "dashboard" }, "Login"]
["Text", "SR-013", "Welcome back"]
["Divider"]
```

Compare to props-based SR (rejected — extra tokens on nodes that *do* have SR):

```json
["Input", { "sr": "SR-010", "placeholder": "Email" }]
```

### Screen-level SR

Screens are not tuples. Optional screen-level SR uses a single field:

```json
"login": {
  "sr": "SR-001",
  "title": "Login",
  "nodes": [ ... ]
}
```

Omit `sr` on screen if the screen itself has no traceable structural requirement.

---

## `spec.json` — wireframes only

No descriptions. No behavioral requirements. SR ids only.

```json
{
  "title": "Todo App",
  "screens": {
    "login": {
      "sr": "SR-001",
      "title": "Login",
      "nodes": [
        ["Container:row", [
          ["Input", "SR-010", { "placeholder": "Email" }],
          ["Input", "SR-011", { "placeholder": "Password" }]
        ]],
        ["Link:primary-btn", "SR-012", { "goto": "dashboard" }, "Login"]
      ]
    },
    "signup": {
      "sr": "SR-002",
      "title": "Sign up",
      "nodes": [
        ["Input", "SR-020", { "placeholder": "Email" }],
        ["Input", "SR-021", { "placeholder": "Password" }],
        ["Link:primary-btn", "SR-022", { "goto": "home" }, "Create account"]
      ]
    }
  }
}
```

### Rules

- SR on nodes → 2nd tuple element
- Optional `sr` on screen object → screen-level structural requirement
- **No `behaviors`** — BR bindings live in `bindings.json`
- Wireframe nav rules unchanged (`goto`, modals, etc.) — see [`JSON-COMPONENTS.md`](JSON-COMPONENTS.md)
- First screen key (object insertion order) = prototype/graph entry

---

## `requirements.json` — definitions only

Descriptions and behavioral sub-trees. No placement. No `appliesTo`.

```json
{
  "structural": {
    "SR-001": { "description": "Login screen" },
    "SR-010": { "description": "Email input on login screen" },
    "SR-011": { "description": "Password input on login screen" },
    "SR-012": { "description": "Login submit button" },
    "SR-002": { "description": "Sign up screen" },
    "SR-020": { "description": "Email input on signup screen" },
    "SR-021": { "description": "Password input on signup screen" },
    "SR-022": { "description": "Create account submit button" }
  },
  "behavioral": {
    "BR-001": {
      "description": "Authenticate when Login is pressed",
      "children": {
        "1": { "description": "Disable Login while request is in flight" },
        "2": { "description": "Navigate to Dashboard on success" },
        "3": { "description": "Show error message on failure" }
      }
    },
    "BR-PASSWORD-VALIDATE": {
      "description": "Password must meet policy",
      "children": {
        "MIN-LEN": { "description": "Minimum 8 characters" },
        "SPECIAL": { "description": "At least one special character" }
      }
    },
    "BR-002": {
      "description": "Create account when Create account is pressed",
      "children": {
        "1": { "description": "Validate all fields before submit" },
        "2": { "description": "Navigate to Home on success" }
      }
    }
  }
}
```

### Structural (`structural`)

- **What** must exist — descriptions only
- **Where** it exists → implied by `spec.json` (find SR id in tuples)

### Behavioral (`behavioral`)

- **What** the behavior means — descriptions + optional `children` tree
- **Where** it applies → `bindings.json`, not here
- **Shared BRs** — semantic parent id (`BR-PASSWORD-VALIDATE`) + named child slugs
- **Screen-local BRs** — numeric parent id (`BR-001`) + numeric child keys (`1`, `2`)

---

## `bindings.json` — BR placements

Maps each BR to one or more spec locations. Compact tuple form: `[screenId, srId?]`.

```json
{
  "BR-001": [
    ["login", "SR-012"]
  ],
  "BR-PASSWORD-VALIDATE": [
    ["login", "SR-011"],
    ["signup", "SR-021"]
  ],
  "BR-002": [
    ["signup", "SR-022"]
  ]
}
```

### Binding forms

| Form | Meaning |
|------|---------|
| `["login", "SR-011"]` | BR applies to a specific element (password input on login) |
| `["login"]` | BR applies to the whole screen (no specific SR anchor) |

Validator checks:

- `screenId` exists in `spec.json`
- `srId` (when present) appears in that screen's tuples or screen-level `sr`
- `brId` exists in `requirements.json`

### Reusing behavioral requirements

Define once in `requirements.json`. Reference multiple placements in `bindings.json`:

```
requirements.json   →  BR-PASSWORD-VALIDATE defined once
bindings.json       →  BR-PASSWORD-VALIDATE → login/SR-011, signup/SR-021
spec.json           →  SR-011 and SR-021 on respective password inputs (no BR knowledge)
```

Structural IDs remain per-surface. Shared behavior is per-BR, not per-SR.

---

## Traceability in implementation

### Structural — React/HTML attribute

```tsx
<Input sb-req="SR-011" placeholder="Password" />
<button sb-req="SR-012" type="submit">Login</button>
```

### Behavioral — comment annotations

```ts
// @sb-req: BR-001
async function handleLogin() { ... }

// @sb-req: BR-001/1
setSubmitting(true);

// @sb-req: BR-PASSWORD-VALIDATE/MIN-LEN
export function minLength(password: string) { ... }
```

Shared validator (one impl, many surfaces):

```ts
// lib/validate-password.ts
// @sb-req: BR-PASSWORD-VALIDATE/MIN-LEN
export function minLength(password: string) { ... }

// @sb-req: BR-PASSWORD-VALIDATE/SPECIAL
export function hasSpecialChar(password: string) { ... }
```

Screen-specific wiring:

```tsx
// features/login/LoginForm.tsx
<Input sb-req="SR-011" ... />
// @sb-req: BR-PASSWORD-VALIDATE

// features/signup/SignupForm.tsx
<Input sb-req="SR-021" ... />
// @sb-req: BR-PASSWORD-VALIDATE
```

### Why different mechanisms for SR vs BR

| Kind | Mechanism | Rationale |
|------|-----------|-----------|
| SR | `sb-req=` attribute | Maps to a specific UI element |
| BR | `// @sb-req:` comment | Behavior spans multiple lines/files; comment marks entry point |

---

## Tests

Comments provide **navigation**. Tests provide **verification**.

### Occurrence-scoped test names

When the same BR applies on multiple screens, use:

```
{screenId}__{brPath}
```

| Test name | What it proves |
|-----------|----------------|
| `login__BR-PASSWORD-VALIDATE/MIN-LEN` | Login password field rejects input shorter than 8 chars |
| `signup__BR-PASSWORD-VALIDATE/MIN-LEN` | Signup password field rejects input shorter than 8 chars |
| `login__BR-001/2` | Login navigates to dashboard on success |

Binding `[screen, sr]` from `bindings.json` determines which `screenId` prefixes the test.

### Two test layers (both valid)

1. **Unit tests** on shared helpers — leaf paths, no screen prefix  
   `@sb-req: BR-PASSWORD-VALIDATE/MIN-LEN` on `validatePassword.minLength`

2. **Screen / integration tests** — occurrence prefix  
   `login__BR-PASSWORD-VALIDATE/MIN-LEN` for user-visible behavior on that screen

Phase 1 POC: require layer 2 for screen-bound flows. Layer 1 optional for shared validators.

### Trace chain

```
BR-001  →  requirements.json (definition)
       →  bindings.json [["login", "SR-012"]] (placement)
       →  spec.json SR-012 on login submit link (structure)
       →  // @sb-req: BR-001 (implementation)
       →  login__BR-001/2 (test)
```

---

## CLI (Phase 1 stubs → Phase 2 full)

```bash
onespec req show BR-PASSWORD-VALIDATE    # definition tree from requirements.json
onespec req show SR-011                  # SR description + where in spec (derived)
onespec impact BR-PASSWORD-VALIDATE      # bindings + affected screens/SRs
onespec impact login                     # all BRs bound to this screen
onespec trace SR-011                     # files:lines with sb-req=
onespec trace BR-PASSWORD-VALIDATE       # all // @sb-req matches
onespec trace login__BR-001              # tests + impl for occurrence
onespec validate                         # cross-file refs, orphan ids, bad paths
```

Phase 1 implementation: ripgrep over `src/` for trace; JSON cross-ref for validate. No AST required.

### `validate` checks (Phase 1)

- Every SR in `spec.json` exists in `requirements.json` → `structural`
- Every SR in `requirements.json` appears in `spec.json` (warn if unused)
- Every BR in `bindings.json` exists in `requirements.json` → `behavioral`
- Every `[screen, sr?]` in bindings references valid spec locations
- Every child path in requirements tree is well-formed (valid parent id + child key segment)
- Named child slugs on shared BRs match `^[A-Z][A-Z0-9-]*$`; numeric keys on local BRs match `^[0-9]+$`
- (Later) Warn on missing `sb-req` / `@sb-req` traces in implementation

---

## Mental model

```
┌─────────────────────────────────────────────────────────┐
│  requirements.json                                      │
│  WHAT things mean (descriptions, BR sub-trees)            │
└─────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ defs                         │ defs
┌────────┴──────────┐       ┌──────────┴─────────────────┐
│  spec.json         │       │  bindings.json              │
│  WHERE (SR tuples) │◄──────│  WHICH BR → screen + SR     │
│  wireframe + nav   │ refs  │  (impact / trace index)     │
└────────────────────┘       └─────────────────────────────┘
         │
         ▼ projects to
┌─────────────────────────────────────────────────────────┐
│  Shell views · Implementation · Tests                     │
│  sb-req= · // @sb-req: · {screen}__{br} test names      │
└─────────────────────────────────────────────────────────┘
```

**Read patterns:**

| Agent task | Files to load |
|------------|---------------|
| Understand app flow | `spec.json` only |
| Implement a BR | `requirements.json` + `bindings.json` + `spec.json` (target screen) |
| Review BR impact | `bindings.json` + `onespec impact` |
| Edit wireframe layout | `spec.json` only |

---

## Init modes (future — for context)

### Mode 1 — Embedded (OSS / power users)

```
my-app/
  src/...
  onespec/
    spec.json
    requirements.json
    bindings.json
    DESIGN.md          # optional
```

### Mode 2 — Cloud POC template

```
todo-poc/
  app/                 # TanStack Start
  onespec/
    spec.json
    requirements.json
    bindings.json
    DESIGN.md
    ARCHITECTURE.md
  src/features/...     # generated + AI-maintained
```

---

## Decisions (Phase 1)

| Question | Decision |
|----------|----------|
| How many JSON files? | **Three** — `spec.json`, `requirements.json`, `bindings.json` |
| SR placement in spec? | **Optional 2nd tuple element** when traceable (not props key) |
| BR placement in spec? | **None** — bindings file only |
| Sub-requirements? | **Tree** in requirements; path = `{parentId}/{childKey}` |
| BR naming? | **Hybrid** — shared: `BR-{DOMAIN}-{NAME}` + named child slugs; local: `BR-{NNN}` + numeric children |
| Reuse BRs? | **Define once** in requirements; **multiple entries** in bindings |
| Test naming? | **`{screenId}__{brPath}`** for surface tests |
| Structural trace? | **`sb-req="SR-xxx"`** on TSX |
| Behavioral trace? | **`// @sb-req: BR-xxx`** comment |
| SR descriptions? | **requirements.json** only; placement derived from spec |
| MDX in OSS? | Keep MDX path for power users; cloud POC is **JSON only** |

---

## Resolved questions (2026-06-30)

| Question | Decision |
|----------|----------|
| SR granularity | **One SR per traceable primitive** (`Input`, `Link`, meaningful `Text`, etc.); layout wrappers (`Container:row`, `Divider`) skip SR |
| Annotate parent or leaves? | **Both** — parent and leaf `sb-req` / `@sb-req` allowed; CLI `trace` returns all matches |
| Binding without SR? | **Both forms** — `["login"]` screen-scoped and `["login", "SR-012"]` SR-anchored bindings are valid |
| Package name on npm | **`onespec`** bin; published as `@onespec-dev/cli@0.1.0` |
| VISION.md alignment | **Done (2026-06-30)** — `UI-xxx`/`BH-xxx` → `SR-xxx`/`BR-xxx` (Task 12) |
| Ultra-minimal screen keys | **Defer** — keep `title`, `nodes`, etc. unless a token audit demands shortening |

---

## Phase 1 deliverables

1. **This document** — accepted schema + conventions
2. **Types** — `StructuralReqId`, `BehavioralReqId`, `ReqPath`, `Binding`, merged `ProductSpec`
3. **Loader** — read three files, merge, validate cross-references
4. **Tuple parser** — SR-as-2nd-element extension to JSON wireframe parser
5. **CLI stubs** — `req show`, `impact`, `trace`, `validate`
6. **Sample** — todo app `spec.json` + `requirements.json` + `bindings.json` with shared `BR-PASSWORD-VALIDATE`

### Out of scope for Phase 1

- Codegen to TanStack Start
- MDX requirements support
- Drift detection
- IDE plugin
- npm publish

---

## Suggested todo app scope (Phase 1 sample)

| Area | Examples |
|------|----------|
| Screens | home, add-task (or inline on home) |
| SRs | task list, add input, add button, filter tabs, empty state |
| BRs | create task, complete task, delete task, filter tasks |
| Shared BR | `BR-PASSWORD-VALIDATE` with named children (`MIN-LEN`, …) reused on edit modal |
| Nested BR | create task → disable while saving, clear on success, show error |

Draft the full SR/BR matrix before implementing the validator.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Three files drift out of sync | `onespec validate` on every save / CI |
| Publish npm before schema stable | Phase 1 schema first; 0.x with explicit instability |
| Tuple parser ambiguity | Strict `^SR-` detection on element [1]; tests for all forms |
| Codegen before traceability | Manual AI workflow in toy repo first |
| Todo app scope creep | Local state + Vitest; no auth/sync/backend in POC |

---

## Relationship to existing docs

| Doc | Role |
|-----|------|
| [`VISION.md`](VISION.md) | North star — update traceability section when schema accepted |
| [`JSON-COMPONENTS.md`](JSON-COMPONENTS.md) | Base tuple syntax — extend with SR-as-2nd-element forms |
| [`CONTEXT.md`](CONTEXT.md) | Current repo architecture — Product Spec layer sits above wireframe bundle |
| [`AGENTS.md`](../AGENTS.md) | Add PRODUCT-SPEC to doc table when implementation starts |
