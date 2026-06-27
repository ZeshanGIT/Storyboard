# WireframeX — Session Context

**Purpose:** Onboard a new chat or contributor in one read. Describes **what exists today** and **how the repo works**.

This file **complements** [`AGENTS.md`](../AGENTS.md) — it does not replace it. Read **both** at session start: CONTEXT for situational awareness (architecture, status, flows); AGENTS for how to work (conventions, scope, checklists, non-goals). Keep them in sync after milestones — **current state** lives here; **rules of engagement** live there. On conflict about what is implemented, trust this file.

| Read | Document | You get |
|------|----------|---------|
| 1 | **CONTEXT.md** (this file) | What is built, how codegen and the shell work, file map |
| 2 | **AGENTS.md** | Conventions, commands, scope discipline, agent checklist |
| When authoring MDX | **MDX-COMPONENTS.md** | Minimal wireframe API (agent prompt attachment) |
| For product direction | **VISION.md** | North star and long-term goals |
| Historical / backlog | **POC.md**, **FUTURE.md** | POC criteria, post-POC ideas |

Do not duplicate AGENTS conventions here (naming, scope rules, checklist). Do not duplicate VISION philosophy here. Link instead.

---

## MDX-COMPONENTS.md — agent reference

[`MDX-COMPONENTS.md`](MDX-COMPONENTS.md) is the **default prompt attachment** when building or editing wireframes with an AI agent. Treat it as a **token budget**: every line should earn its place.

**Document:** Stay as short as possible. Prefer tables and one-line component entries over prose. Do not duplicate `CONTEXT.md` or `VISION.md` here — only what an author needs to write valid MDX.

**API design:** Primitives should **do more with less** — few components, few props, boolean flags over enums where possible, plain-string `goto` over registries, one `Link` with variants instead of separate button/nav types. When extending the library, add the smallest surface that unlocks the most specs; update this file in the same PR and keep the diff tiny.

Live examples: `src/content/wireframe.mdx`, `src/content/components.mdx`.

---

## What this is

**WireframeX** (working name) is a **text-first UX spec format**: developers describe screens and navigation in **MDX + React components**, not mockups.

One MDX source should eventually drive documentation, a clickable prototype, and a navigation graph. Think **Storybook for UX flows** — intent before Figma.

**Not a design tool.** Wireframe primitives express structure and behavior. The **dev shell** (header, tabs, document menu) uses Tailwind and shadcn/ui. Primitives lean on shadcn building blocks internally but stay wireframe-styled in output.

---

## Current status

The **POC is shipped and extended**. Running `npm run dev` gives:

1. **Codegen** from every `src/content/*.mdx` → `src/generated/` (gitignored)
2. **Dual-view dev shell** — MDX Preview (stacked screens) and Prototype View (one screen per route)
3. **Document picker** — hamburger menu lists all content MDX files (title from YAML frontmatter)

| Area | Status |
|------|--------|
| Wireframe primitives (`Screen`, `Text`, `Link`, `Input`, `Container`, `Image`, `Icon`, `Modal`, `TopBar`, `Divider`) | Done |
| MDX → AST extraction per content file | Done |
| Build-time validation: duplicate screen/modal IDs, invalid `goto`, invalid `Text` flags | Done |
| Per-document screens + routes codegen | Done |
| `contentDocuments` registry (preview component + prototype routes per file) | Done |
| Multi-MDX content dir + frontmatter titles | Done |
| Dev shell + History API prototype router | Done |
| Example app (`wireframe.mdx`: `home`, `login`, `signup`) | Done |
| Component catalog (`components.mdx`: all primitives/variants) | Done |
| Navigation graph view | Not started |
| Unreachable screen validation | Not started |
| Documentation export mode | Not started |
| `Card`, `List`, `Section`, `BottomNav`, `Tabs` (vision extras) | Not started |

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 — codegen on start + MDX save
npm run check        # codegen + typecheck + Biome
npm run fix          # Biome safe fixes + format
npm run build        # codegen → tsc → vite
npm test             # vitest (plugin unit tests)
```

**Author specs** in `src/content/*.mdx`. Do not edit `src/generated/` by hand.

**Primary app spec:** `src/content/wireframe.mdx`  
**Component showcase:** `src/content/components.mdx`

Each file starts with YAML frontmatter (`title`) used in the document menu:

```yaml
---
title: Wireframe App
---
```

---

## End-to-end flow

```
src/content/*.mdx
        │
        ▼  remark + remark-mdx + remark-frontmatter (extract-screens.ts)
        │  per file: extract <Screen> blocks
        │  validate duplicate ids, gotos, text flags
        ▼
src/generated/
  documents/{slug}/
    screens.generated.tsx    ← one React component per screen
    routes.generated.tsx     ← { id, path, component }[] + modalIds
  content-documents.generated.tsx
                             ← slug, title, MDX component, routes[]
  routes.generated.tsx       ← GotoTarget union (all docs) + wireframe routes re-export
        │
        ├─► MDX Preview: active document's MDX component (screens stacked, gap-8)
        │
        └─► Prototype View: active document's routes (first screen = entry)
```

**Vite plugin** (`src/plugin/wireframe-plugin.ts`) runs `runFullCodegen` in `buildStart` and on any `src/content/*.mdx` save, then full-reloads. **CLI:** `npm run codegen` (runs before `tsc` in build/check).

---

## Repository map (implemented)

```
src/
  content/
    wireframe.mdx              # 3-screen example app
    components.mdx             # primitive catalog (all variants)
  generated/                   # AUTO-GENERATED (gitignored)
    documents/{slug}/          # per-file screens + routes
    content-documents.generated.tsx
    routes.generated.tsx
  components/
    wireframe/                 # Screen, Text, Link, Input, …
    ui/                        # shadcn/ui (shell + primitive internals)
  runtime/
    WireframeViewContext.tsx   # preview | prototype, navigate, modals
    WireframeErrorProvider.tsx
  shell/
    Shell.tsx                  # header, document menu, view tabs
    DocumentMenu.tsx           # hamburger + slide-out doc list
    PreviewView.tsx
    PrototypeView.tsx
    router.tsx                 # History API hook
  plugin/                      # extract, validate, generate, vite plugin
  mdx-components.ts            # MDX component registry
  App.tsx                      # <Shell contentDocuments={…} />
```

---

## Key behaviors

### Content documents

Codegen scans `src/content/*.mdx`, reads `title` from frontmatter, and emits `contentDocuments`. The shell shows a hamburger (preview + prototype) to switch files. Selection persists across Preview / Prototype tabs.

- **Preview** renders the selected file's MDX (all `<Screen>` blocks visible, `gap-8` between sections).
- **Prototype** uses that file's generated `routes` only (`key={slug}` resets router on switch).

`wireframe.mdx` sorts first in the menu; other files alphabetically.

### `<Screen id title>`

Semantic `<section>` with `id={screenId}`. In preview mode: bordered card, optional title label, `scroll-mt-8` for anchor links.

### `<Link goto="…">`

Navigation primitive (not `<Button>`). Behavior depends on `WireframeViewContext`:

| View | `goto` | Behavior |
|------|--------|----------|
| **preview** | screen id | `<a href="#id">` — scroll to screen |
| **preview** | `_close` / `_back` | `#` (non-navigating affordance) |
| **prototype** | screen id | `navigate('/id')` via History API |
| **prototype** | modal id (same screen) | `openModal(id)` |
| **prototype** | `_close` | `closeModal()` |
| **prototype** | `_back` | `history.back()` |

Authors use **plain string** `goto` values matching `<Screen id>` or `<Modal id>` on the current screen. `GotoTarget` type is generated in `routes.generated.tsx` (union across all documents).

Variant flags: `primary-btn`, `secondary-btn` (else text link). Global: `disabled`, `danger`.

### Modals

`<Modal id>` inside a `<Screen>`. Open via `<Link goto="modal-id">`. Dismiss via backdrop, Escape, or `goto="_close"`. Modal ids must be unique per screen and must not collide with a screen id.

### Codegen errors

Validation failures block codegen for the run. Terminal logs `[wireframe] Codegen failed: …`. Errors are prefixed with filename (e.g. `components.mdx: …`). Shell surfaces messages via `WireframeErrorProvider`. Previously generated files may remain until a successful run overwrites them.

### Adding a screen

Append a `<Screen>` block to the target `.mdx` file and save. Codegen updates that document's `screens.generated.tsx` and `routes.generated.tsx` — **no shell edits**.

---

## Tooling notes

| Concern | Tool |
|---------|------|
| App build | Vite 8 + React 19 |
| MDX compile | `@mdx-js/rollup` + `remark-frontmatter` |
| MDX typecheck / IDE | `@mdx-js/typescript-plugin` in `tsconfig.app.json` |
| UI primitives (shell) | shadcn/ui (base-lyra), Tailwind CSS 4 |
| Lint + format | Biome (excludes `src/generated/`, `*.mdx`) |
| Typecheck | `tsc -b` |
| Tests | Vitest (`src/plugin/*.test.ts`) |

MDX files are **not** linted by Biome.

---

## Locked decisions

- **Multiple MDX files** in `src/content/`, each with YAML `title` frontmatter
- **Plain string** screen/modal ids in MDX; **`GotoTarget`** type generated from all documents
- **Per-document** screens/routes under `src/generated/documents/{slug}/`
- **`contentDocuments`** registry feeds the shell (preview component + prototype routes)
- **`Link`** for navigation (not a separate `Button` primitive)
- **Minimal router** in shell — no React Router
- **Generated output** gitignored; `npm run codegen` before typecheck in build/check
- **`wireframe.mdx`** remains the canonical example app; other files (e.g. `components.mdx`) are showcases or additional specs

---

## What to work on next

See [`FUTURE.md`](FUTURE.md). Highest-signal items:

- Navigation graph view from extracted `goto` edges
- Unreachable screen / orphan validation
- Documentation export mode
- Vision extras: `Card`, `List`, `Section`, `BottomNav`, `Tabs`
- Consolidate generated types (routes-only `ScreenId` derivation — see FUTURE §1)

Historical implementation plans: `docs/superpowers/plans/`.

---

## Relationship to other docs

| Document | Role | Complements CONTEXT by… |
|----------|------|-------------------------|
| **AGENTS.md** | Rules of engagement | Supplying conventions, non-goals, commands, and the done-checklist CONTEXT omits |
| **MDX-COMPONENTS.md** | Wireframe authoring API | Giving agents the minimal tag reference when writing MDX (attach on every wireframe build) |
| **VISION.md** | Product north star | Carrying philosophy and long-term targets beyond current implementation |
| **POC.md** | POC acceptance criteria | Historical engineering spec for the first milestone |
| **FUTURE.md** | Backlog | Ideas not yet in scope |

**CONTEXT + AGENTS together** = full agent onboarding. CONTEXT answers *what* and *where*; AGENTS answers *how* and *what not to do*. Update both when a milestone changes behavior or agent expectations.
