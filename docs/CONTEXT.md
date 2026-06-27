# WireframeX — Session Context

**What exists + how repo works.** Complements [`AGENTS.md`](../AGENTS.md) — read both at session start. State conflict → trust this file.

| Read | Doc | Get |
|------|-----|-----|
| 1 | CONTEXT | built, codegen, shell, file map |
| 2 | AGENTS | conventions, commands, checklist |
| MDX authoring | MDX-COMPONENTS | minimal API |
| Graph tab UX | GRAPH_VIEW | graph view requirements |
| Product | VISION | north star |
| Backlog | FUTURE, POC | historical |

Don't duplicate AGENTS conventions or VISION philosophy here.

## What this is

Text-first UX spec: MDX + React components describe screens/nav — not mockups. One source → Preview + Prototype + Graph View. Storybook for UX flows.

Primitives = structure/behavior (wireframe-styled). Shell = Tailwind/shadcn.

## Status

POC shipped + extended. `npm run dev` → codegen, tri-view shell (Preview / Prototype / Graph), document picker.

| Area | Status |
|------|--------|
| Primitives: Screen, Text, Link, Input, Container, Image, Icon, Modal, TopBar, Divider | Done |
| MDX AST extract, validation (dup ids, bad goto, Text flags) | Done |
| Per-doc screens/routes + contentDocuments registry | Done |
| Multi-MDX + frontmatter titles, History API prototype router | Done |
| wireframe.mdx, components.mdx | Done |
| Graph View (shell tab, Screen + Compact modes) | Done |
| Unreachable validation, doc export | Not started |
| Card, List, Section, BottomNav, Tabs | Not started |

## Quick start

```bash
npm install && npm run dev    # localhost:5173
npm run check && npm run build && npm test
```

Author `src/content/*.mdx`. Don't hand-edit `src/generated/`.

```yaml
---
title: Wireframe App
---
```

Examples: `wireframe.mdx` (app), `components.mdx` (catalog).

## E2E flow

```
src/content/*.mdx
  → remark extract-screens + validators + navigation graph
  → src/generated/documents/{slug}/screens.generated.tsx
                        routes.generated.tsx
                        navigation-graph.generated.ts
  → content-documents.generated.tsx, routes.generated.tsx
  → Preview: stacked screens | Prototype: routes (first = entry) | Graph: navigationGraph
```

Vite plugin: `runFullCodegen` on `buildStart` + MDX save → full reload. CLI: `npm run codegen`.

## Repo map

```
src/content/*.mdx
src/generated/              # gitignored AUTO-GENERATED
src/components/wireframe/   # primitives
src/components/ui/          # shadcn
src/runtime/                # WireframeViewContext (preview|prototype|graph), WireframeErrorProvider
src/shell/                  # Shell, DocumentMenu, PreviewView, PrototypeView, GraphView, graph/, router
src/plugin/                 # extract, validate, generate, navigation graph
src/mdx-components.ts
src/App.tsx
```

## Key behaviors

### Content documents

Codegen scans MDX → `contentDocuments` with frontmatter `title`. Hamburger switches files (persists across all shell views). `wireframe.mdx` sorts first.

- **Preview:** all `<Screen>` blocks, `gap-8`
- **Prototype:** generated routes only (`key={slug}` resets router)
- **Graph:** per-doc `navigationGraph`; Screen or Compact sub-mode; full-width canvas

### Screen / Link / Modal

`<Screen id title>` — semantic section; preview = bordered card + anchor scroll.

`<Link goto>` — not Button:

| View | goto | Behavior |
|------|------|----------|
| preview | screen id | `href="#id"` scroll |
| preview | `_close`/`_back` | `#` noop |
| prototype | screen id | `navigate('/id')` |
| prototype | modal id | `openModal(id)` |
| prototype | `_close` | `closeModal()` |
| prototype | `_back` | `history.back()` |
| graph | any | non-interactive; edges from screen→screen links only |

Plain string `goto`. `GotoTarget` union in `routes.generated.tsx`. Flags: `primary-btn`, `secondary-btn`, `disabled`, `danger`.

`<Modal id>` in Screen — open via Link, dismiss backdrop/Escape/`_close`. Modal ids unique per screen, ≠ screen id.

### Codegen errors

Validation blocks run. Terminal: `[wireframe] Codegen failed: …` with filename prefix. Shell: `WireframeErrorProvider`. Stale generated files until success.

### Add screen

New `<Screen>` in MDX + save → codegen updates that doc's generated files. No shell edits.

### Graph View

Third shell tab; active document picker applies. Codegen `navigationGraph` → Screen View (default, wireframe nodes + boundary edges with link-hover highlight) or Compact View (cards with note/counts). Pan/zoom/fit/minimap; node click selects only. Full UX spec: [`GRAPH_VIEW.md`](GRAPH_VIEW.md).

## Tooling

Vite 8 + React 19 + TS 6 | MDX 3 (`@mdx-js/rollup`, `remark-frontmatter`, `@mdx-js/typescript-plugin`) | Tailwind 4 + shadcn | `@xyflow/react` + `@dagrejs/dagre` (Graph View) | Biome (excludes `src/generated/`, `*.mdx`) | Vitest plugin tests

## Locked decisions

- Multi MDX in `src/content/`, YAML `title`
- Plain string ids; `GotoTarget` codegen union
- Per-doc `generated/documents/{slug}/`
- `contentDocuments` feeds shell
- `Link` not `Button`; minimal History API router (no React Router)
- Generated gitignored; codegen before tsc in build/check
- `wireframe.mdx` = canonical example

## Next

[`FUTURE.md`](FUTURE.md): unreachable/orphan validation, doc export, vision extras, type consolidation. Plans: `docs/superpowers/plans/`.
