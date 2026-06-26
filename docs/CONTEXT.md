# WireframeX — Session Context

**Purpose:** Onboard a new chat or contributor in one read. Describes **what exists today** and **how the repo works**.

For agent rules, conventions, and checklists → [`AGENTS.md`](../AGENTS.md).  
For product direction → [`VISION.md`](VISION.md).  
For POC spec and acceptance criteria → [`POC.md`](POC.md).  
For post-POC ideas → [`FUTURE.md`](FUTURE.md).

---

## What this is

**WireframeX** (working name) is a **text-first UX spec format**: developers describe screens and navigation in **MDX + React components**, not mockups.

One source file should eventually drive documentation, a clickable prototype, and a navigation graph. Think **Storybook for UX flows** — intent before Figma.

**Not a design tool.** Wireframe primitives are structural (borders, semantic HTML). Tailwind styles the **dev shell** only.

---

## Current status (POC complete)

The first POC is **shipped**. Running `npm run dev` gives:

1. **Codegen** from `src/content/wireframe.mdx` → `src/generated/` (gitignored)
2. **Dual-view dev shell** — MDX Preview (all screens stacked) and Prototype View (one screen per route)

| Area | Status |
|------|--------|
| Wireframe primitives (`Screen`, `Text`, `Link`) | Done |
| MDX → AST extraction + duplicate-ID validation | Done |
| Three generated artifacts + Vite watcher plugin | Done |
| Dev shell + minimal History API router | Done |
| Canonical 3-screen example (`home`, `login`, `signup`) | Done |
| Navigation graph view | Not started |
| Broken `goto` / unreachable screen validation | Not started |
| Extra primitives (`Button`, `Input`, `Card`, …) | Not started |
| Documentation export mode | Not started |

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 — codegen runs on start + MDX save
npm run check        # codegen + typecheck + Biome lint/format check
npm run fix          # apply Biome formatting and safe fixes
npm run build        # production build (codegen → tsc → vite)
npm test             # vitest (plugin unit tests)
```

**Author the app** in `src/content/wireframe.mdx`. Do not edit `src/generated/` by hand.

---

## End-to-end flow

```
src/content/wireframe.mdx
        │
        ▼  remark + remark-mdx (extract-screens.ts)
        │  validate duplicate screen ids
        ▼
src/generated/
  screens-map.generated.ts   ← Screens.Home, Screens.Login, …
  screens.generated.tsx      ← one React component per screen
  routes.generated.tsx       ← { id, path, component }[]
        │
        ├─► MDX Preview: imports wireframe.mdx directly (all screens visible)
        │
        └─► Prototype View: renders active route component from routes.generated.tsx
```

**Vite plugin** (`src/plugin/wireframe-plugin.ts`) runs codegen in `buildStart` and on MDX save under `src/content/`, then triggers HMR. **CLI fallback:** `npm run codegen` (used before `tsc` in build/check).

---

## Repository map (implemented)

```
src/
  content/wireframe.mdx       # Author input — single POC spec file
  generated/                  # AUTO-GENERATED (gitignored)
  components/wireframe/         # Screen, Text, Link primitives
  runtime/WireframeViewContext.tsx   # view: 'preview' | 'prototype', navigate()
  shell/                        # Shell, PreviewView, PrototypeView, router, error banner
  plugin/                       # extract-screens, generate, codegen, wireframe-plugin
  mdx-components.ts             # Registers wireframe components for MDX
  App.tsx                       # <Shell routes={routes} />
```

---

## Key behaviors

### `<Screen id title>`

Semantic `<section>` with `id={screenId}` for anchor navigation in Preview mode.

### `<Link goto={…}>`

Behavior depends on `WireframeViewContext`:

| View | `goto` value | Behavior |
|------|----------------|----------|
| **preview** | `'login'` or `Screens.Login` | `<a href="#login">` — scroll to screen section |
| **prototype** | same | `navigate('/login')` via History API |

Authors import `Screens` from generated map for typed `goto` in MDX:

```mdx
import { Screens } from '../generated/screens-map.generated'

<Link goto={Screens.Login}>Login</Link>
```

### Codegen errors

Duplicate screen IDs fail codegen. Terminal logs `[wireframe] Codegen failed: …`. Shell shows `CodegenErrorBanner`. Previous generated files are **not** overwritten on failure.

### Adding a screen

Append a `<Screen>` block to `wireframe.mdx` and save. Codegen creates component, route, and `Screens` entry — **no shell edits**. Verified in POC acceptance tests.

---

## Tooling notes

| Concern | Tool |
|---------|------|
| App build | Vite 8 + React 19 |
| MDX compile | `@mdx-js/rollup` |
| MDX typecheck / IDE | `@mdx-js/typescript-plugin` in `tsconfig.app.json` |
| Lint + format | Biome (`biome.json`; excludes `src/generated/`, `*.mdx`) |
| Typecheck | `tsc -b` (app + node project refs) |
| Tests | Vitest (`src/plugin/*.test.ts`) |

MDX files are **not** linted by Biome. MDX typing is handled by the TypeScript MDX plugin, not the linter.

---

## POC decisions (locked for now)

- **One MDX file** with multiple `<Screen>` blocks (`wireframe.mdx`)
- **Plain string** screen ids in source; **generated `Screens` map** for `goto` in MDX
- **Three generated files** (not a single registry — see `FUTURE.md` for consolidation ideas)
- **Minimal router** in shell — no React Router
- **Link** instead of **Button** for navigation in POC
- **Generated output** gitignored; `npm run codegen` runs before typecheck in build/check

---

## What to work on next

See [`FUTURE.md`](FUTURE.md). Highest-signal items:

- Graph view from extracted navigation edges
- Validate broken `goto` targets and unreachable screens
- More wireframe primitives (`Input`, `Card`, `Section`, …)
- Routes-only registry (derive `ScreenId` from `routes`, drop separate `Screens` object)
- Documentation export mode

Implementation plans from the POC build live under `docs/superpowers/plans/` (historical reference).

---

## Relationship to AGENTS.md

| Document | Audience | Content |
|----------|----------|---------|
| **CONTEXT.md** (this file) | Humans + agents starting a session | Current architecture, status, flows, file map |
| **AGENTS.md** | Agents and automation | Conventions, non-goals, commands checklist, scope discipline |
| **VISION.md** | Product | North star, philosophy, full component target API |
| **POC.md** | Engineering | POC requirements and acceptance criteria |

When AGENTS.md and this file disagree on **current state**, trust **this file** — AGENTS.md may lag after milestones.
