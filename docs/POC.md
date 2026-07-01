# POC — MDX Wireframe Codegen & Dual-View Shell

**Status:** Planned  
**Parent:** [`VISION.md`](VISION.md) · [`FUTURE.md`](FUTURE.md) · [`AGENTS.md`](../AGENTS.md)

This document defines the scope, requirements, and success criteria for the first proof-of-concept. The POC validates the core hypothesis: **MDX wireframes can be parsed, validated, codegen'd into routable screen components, and previewed in two modes from a stable dev shell.**

---

## Goal

When a developer runs `npm run dev`, OneSpec should:

1. Start the React dev app (Vite).
2. Watch the wireframe MDX file(s) and regenerate TypeScript on every change.

The generated output powers a **fixed shell** (`<App routes={routes} />`) with two views:

| View | Purpose |
|------|---------|
| **MDX Preview** | Read the full spec — all screens visible on one page |
| **Prototype View** | Click through the app — one screen per route |

Graph View, broken-link validation beyond duplicates, and additional components are **out of scope** for this POC.

---

## In scope

### 1. Dev command

`npm run dev` must:

- Start Vite with HMR for the React shell and generated files.
- Run an MDX watcher (Vite plugin) that processes wireframe MDX on startup and on file save.

No separate CLI process — the watcher lives inside the Vite dev pipeline.

### 2. Wireframe MDX (author input)

For the POC, use **one MDX file** with multiple `<Screen>` blocks:

**Path:** `src/content/wireframe.mdx` (replaces or supersedes `welcome.mdx` as the POC example)

**Authoring rules:**

- Screen IDs are **plain strings** in the source MDX.
- Navigation targets use the **generated** `Screens` map (available after first dev run).

**Example:**

```mdx
<Screen id="home" title="Home">
  <Text>Welcome back</Text>
  <Link goto={Screens.Login}>Login</Link>
  <Link goto={Screens.Signup}>Create account</Link>
</Screen>

<Screen id="login" title="Login">
  <Text>Sign in to continue</Text>
  <Link goto={Screens.Home}>Back</Link>
</Screen>

<Screen id="signup" title="Sign up">
  <Text>Create your account</Text>
  <Link goto={Screens.Home}>Back</Link>
</Screen>
```

### 3. Components (POC only)

Three wireframe primitives. Minimal styling — structure and behavior only.

| Component | Props | Behavior |
|-----------|-------|----------|
| `<Screen>` | `id: string`, `title: string`, `children` | Wraps one screen's content. Renders a semantic container with a stable DOM id for anchoring. |
| `<Text>` | `children` | Static copy (paragraph or span). |
| `<Link>` | `goto: string`, `children` | Navigation action. **View-dependent behavior** (see §6). |

No `<Button>`, `<Input>`, `<Card>`, or other primitives in this POC.

### 4. MDX watcher (codegen)

On each run (startup + MDX save), the watcher must:

1. **Read** the wireframe MDX file.
2. **Parse** to mdast via `remark` + `remark-mdx` (see § MDX parsing stack).
3. **Extract** each `<Screen>` node via `unist-util-visit`, then **serialize** the subtree with `remark-stringify` + `remark-mdx` (see § Screen extraction).
4. **Validate** screen IDs:
   - **Duplicate IDs** → hard error (log to terminal + block or surface in dev UI).
   - Other validations (broken `goto`, unreachable screens) → **deferred** post-POC.
5. **Generate** three artifacts (see §5).

Regeneration must trigger HMR so the dev app updates without a manual restart.

### 5. Generated files

Output directory: `src/generated/` (gitignored; produced only by dev/build).

#### 5a. `screens.generated.tsx`

One exported React component per screen. Each component's body is the **serialized `<Screen>` subtree** from mdast (Screen wrapper + children), embedded as JSX in the generated file.

```tsx
// AUTO-GENERATED — do not edit

import { Screen, Text, Link } from '../components/wireframe'
import { Screens } from './screens-map.generated'

export function Home() {
  return (
    <Screen id="home" title="Home">
      <Text>Welcome back</Text>
      <Link goto={Screens.Login}>Login</Link>
      <Link goto={Screens.Signup}>Create account</Link>
    </Screen>
  )
}

export function Login() {
  return (
    <Screen id="login" title="Login">
      ...
    </Screen>
  )
}
```

Naming: screen id `home` → component `Home` (PascalCase). Collision rules (e.g. `user-profile` → `UserProfile`) must be documented in the plugin.

#### 5b. `routes.generated.tsx`

Route table consumed by the shell:

```tsx
// AUTO-GENERATED — do not edit

import { Home, Login, Signup } from './screens.generated'

export const routes = [
  {
    id: 'home',
    path: '/home',
    component: Home,
  },
  {
    id: 'login',
    path: '/login',
    component: Login,
  },
  {
    id: 'signup',
    path: '/signup',
    component: Signup,
  },
] as const
```

Path convention: `/{id}` (POC). Default route `/` redirects to the first screen in document order.

#### 5c. `screens-map.generated.ts`

Typed map for use in MDX `goto` props and in generated screen components:

```ts
// AUTO-GENERATED — do not edit

export const Screens = {
  Home: 'home',
  Login: 'login',
  Signup: 'signup',
} as const

export type ScreenId = (typeof Screens)[keyof typeof Screens]
```

Key naming: id `login` → `Screens.Login`. Must stay stable and predictable so authors can reference it after first codegen.

**MDX authoring note:** Authors import or receive `Screens` via the MDX component provider / generated types. Exact wiring (global vs import) is an implementation detail; the POC must make `goto={Screens.Login}` work in the source MDX file.

### 6. Dual behavior for `<Link goto={…}>`

Navigation mode is determined by the **active view**, not by separate components.

| View | `<Link>` behavior |
|------|-------------------|
| **MDX Preview** | Anchor navigation. Each `<Screen>` exposes its `id` as a DOM anchor (e.g. `id="screen-home"` or `id="home"`). Clicking a link scrolls/jumps to the target screen section on the same page. |
| **Prototype View** | Client-side route navigation. Clicking a link navigates to `/{targetScreenId}` and renders only that screen's generated component via the route table. |

Implementation sketch:

- Shell provides a `WireframeViewContext`: `'preview' | 'prototype'`.
- `<Link>` reads context + `goto` and either renders `<a href="#home">` or uses the router to push `/login`.

### 7. Dev shell

The shell is **hand-written** and does not change when MDX changes. Only generated files change.

```tsx
import { routes } from './generated/routes.generated'

function App() {
  return <Shell routes={routes} />
}
```

**Shell responsibilities:**

- View switcher: MDX Preview ↔ Prototype View.
- **MDX Preview pane:** Renders the full wireframe MDX document (or concatenation of all generated screen components on one scrollable page).
- **Prototype pane:** Router driven by `routes` — `<Route path={route.path} element={<route.component />} />` or equivalent minimal router.
- Display codegen errors (e.g. duplicate screen IDs) when validation fails.

The shell must not embed screen-specific logic. New screens added in MDX appear automatically after regeneration.

---

## Out of scope (POC)

| Item | Notes |
|------|-------|
| Graph View | Planned for a later phase |
| Broken `goto` validation | Only duplicate screen IDs in POC |
| Unreachable / cyclic navigation analysis | Post-POC |
| Multiple MDX files | Single file for POC |
| Production build polish | Dev experience first; `npm run build` may run the same plugin |
| Rich styling | Wireframe components stay minimal |
| `<Button>`, `<Input>`, etc. | Deferred |
| Reverse references | Deferred |
| Committed generated files | Generated output lives in `src/generated/`, gitignored |

---

## Technical approach

### MDX parsing stack

The watcher parses MDX to **mdast** (markdown AST with MDX extensions). It does **not** compile MDX to JavaScript — compilation for Preview stays with `@mdx-js/rollup` (already installed).

#### Dependencies

Add to **devDependencies** for the Vite plugin:

| Package | Version | Role |
|---------|---------|------|
| [`remark`](https://github.com/remarkjs/remark) | `^15` | Pipeline entry point; includes `remark-parse` and **`remark-stringify`** |
| [`remark-mdx`](https://github.com/mdx-js/mdx/tree/main/packages/remark-mdx) | `^3.1` | Parses **and serializes** JSX, import/export, and expressions in mdast |
| [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit) | `^5` | Walks the AST to find `<Screen>` and `<Link>` nodes |

```json
{
  "devDependencies": {
    "remark": "^15.0.1",
    "remark-mdx": "^3.1.1",
    "unist-util-visit": "^5.0.0"
  }
}
```

**Do not add** as direct dependencies for the POC:

| Package | Why skip |
|---------|----------|
| `@mdx-js/mdx` | Compile-only API; Preview already uses `@mdx-js/rollup` |
| `remark-parse` | Bundled inside `remark` |
| `remark-stringify` | Bundled inside `remark`; **must** be paired with `remark-mdx` to serialize JSX nodes |
| `unified` | Transitive dependency of `remark` |
| `vfile` | Transitive; optional when using `parse()` / `stringify()` directly |

#### Parse and extract pipeline

Per the [remark-mdx docs](https://github.com/mdx-js/mdx/blob/main/packages/remark-mdx/readme.md), `remark-mdx` adds MDX syntax support for **both parsing and serializing**. Use `unist-util-visit` to find each `mdxJsxFlowElement` where `node.name === 'Screen'`, then stringify that node back to MDX/JSX for codegen.

```ts
/// <reference types="remark-mdx" />

import { remark } from 'remark'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

const processor = remark().use(remarkMdx)
const tree = processor.parse(mdxSource) as Root

visit(tree, 'mdxJsxFlowElement', (node) => {
  if (node.name !== 'Screen') return

  const id = node.attributes.find(
    (a) => a.type === 'mdxJsxAttribute' && a.name === 'id',
  )?.value

  const title = node.attributes.find(
    (a) => a.type === 'mdxJsxAttribute' && a.name === 'title',
  )?.value

  // Serialize this Screen subtree → MDX/JSX string for screens.generated.tsx
  const chunk = processor.stringify({
    type: 'root',
    children: [node],
  })
})
```

#### Screen extraction (`remark-stringify`)

Screen content for codegen is produced by **stringifying each `<Screen>` mdast subtree** — not by slicing raw source text.

| Step | Tool |
|------|------|
| Parse full MDX file | `remark().use(remarkMdx).parse(source)` |
| Find screens | `unist-util-visit` → `mdxJsxFlowElement` where `name === 'Screen'` |
| Serialize each screen | `remark().use(remarkMdx).stringify({ type: 'root', children: [screenNode] })` |
| Wrap in generated TSX | Embed serialized JSX in each `export function Home() { return (…) }` |

**Why stringify, not source slice?**

- Clean per-node boundaries from the AST (no offset edge cases).
- Same tree used for validation and future transforms (broken `goto`, graph edges).
- Generated output is normalized — acceptable because **MDX Preview** still renders the author's original file via `@mdx-js/rollup`.

**Round-trip note:** Stringify may normalize formatting (whitespace, quotes, attribute wrapping). Semantic content — tags, props, expressions like `goto={Screens.Login}` — must round-trip correctly. MDX Preview remains the authoritative view of the author's source formatting.

#### mdast node types used in the POC

| Node type | POC use |
|-----------|---------|
| `mdxJsxFlowElement` | Block-level JSX: `<Screen>`, `<Link>`, `<Text>` |
| `mdxJsxAttribute` | String props: `id="home"`, `title="Home"` |
| `mdxJsxAttributeValueExpression` | Expression props: `goto={Screens.Login}` |

#### Two pipelines, one MDX file

```
wireframe.mdx
    │
    ├─► remark + remark-mdx + unist-util-visit   →  codegen (Vite plugin)
    │       parse → visit Screen nodes → remark-stringify per screen
    │       screens.generated.tsx
    │       routes.generated.tsx
    │       screens-map.generated.ts
    │
    └─► @mdx-js/rollup (existing)                →  MDX Preview (full render)
```

Same source file, different jobs — parse for extraction/validation; compile for Preview rendering.

### Vite plugin

Implement the watcher as a **Vite plugin** (`wireframePlugin` or similar):

- **`buildStart` / `configureServer`:** Parse MDX → visit screens → stringify → write generated files.
- **`handleHotUpdate`:** Re-run when `*.mdx` under `src/content/` changes.
- Emit files to `src/generated/` on disk for simpler IDE support on `Screens` and generated components.

Plugin implementation lives in `src/plugin/` and imports `remark`, `remark-mdx`, and `unist-util-visit` only — not `@mdx-js/mdx`.

### Directory layout (target)

```
src/
  content/
    wireframe.mdx          # Author-edited wireframe spec
  components/
    wireframe/
      Screen.tsx
      Text.tsx
      Link.tsx
      index.ts
  generated/               # Gitignored — watcher output
    screens.generated.tsx
    routes.generated.tsx
    screens-map.generated.ts
  shell/
    App.tsx                # View switcher + routes
    PreviewView.tsx
    PrototypeView.tsx
  plugin/
    wireframe-plugin.ts    # remark + remark-mdx parse, validate, codegen
    extract-screens.ts     # AST walk, remark-stringify, duplicate-id check
  mdx-components.ts        # Registers Screen, Text, Link (+ Screens for MDX)
```

---

## Acceptance criteria

The POC is **done** when all of the following work:

1. **`npm run dev`** starts the app and watcher without extra steps.
2. Editing `src/content/wireframe.mdx` regenerates `screens`, `routes`, and `Screens` within one save + HMR cycle.
3. **Duplicate screen IDs** produce a clear error and do not silently overwrite.
4. **`Screens.Login`** (etc.) resolves correctly in MDX and in generated files.
5. **MDX Preview** shows all screens; clicking `<Link goto={Screens.X}>` scrolls to the target screen anchor.
6. **Prototype View** shows one screen per path; clicking `<Link>` navigates to the correct route.
7. Adding a new `<Screen id="about" …>` block to MDX creates `About`, a new route `/about`, and `Screens.About` — with **no shell code changes**.
8. `npm run build` and `npm run lint` pass (plugin runs on build or generated stubs exist for CI).

---

## Example end-to-end flow

```
Developer writes wireframe.mdx
        │
        ▼
remark + remark-mdx parse wireframe.mdx → mdast
        │
        ├── unist-util-visit finds <Screen> nodes
        ├── validates unique IDs
        ├── remark-stringify serializes each Screen subtree
        │
        ├── writes screens.generated.tsx
        ├── writes routes.generated.tsx
        └── writes screens-map.generated.ts
        │
        ▼
Shell imports routes
        │
        ├── Preview: full document, anchor links
        └── Prototype: /home, /login, … per route table
```

---

## Open decisions (resolve during implementation)

| Question | POC default |
|----------|-------------|
| Preview source: raw MDX vs stacked generated components | Prefer **raw MDX render** via `@mdx-js/rollup` for true WYSIWYG spec view; generated components power Prototype only |
| MDX parse library | **`remark` + `remark-mdx` + `unist-util-visit`** — see § MDX parsing stack |
| Screen chunk extraction | **`remark-stringify`** + `remark-mdx` on each `<Screen>` mdast subtree |
| Router library | Minimal custom router vs `react-router` — choose smallest thing that supports `routes` table |
| Anchor id format | `id={screenId}` on `<Screen>` root element |
| First screen / default route | Redirect `/` → first screen in MDX document order |
| `Screens` in MDX before first run | Document that first dev run generates the map; initial authoring may use string literals until map exists |
| Routes-only registry (no `Screens` map) | Deferred — see [`FUTURE.md` §1](FUTURE.md#1-routes-only-registry--derive-screenid-from-routes) |

---

## Success metric

The POC proves that **codegen from MDX + a stable shell** is viable: authors edit one MDX file, and two views (documentation + clickable prototype) stay in sync automatically. If this works, the next phase adds Graph View, `goto` validation, and more components.
