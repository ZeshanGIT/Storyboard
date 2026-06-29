# Storyboard — Session Context

**What exists + how repo works.** Complements [`AGENTS.md`](../AGENTS.md) — read both at session start. State conflict → trust this file.

| Read | Doc | Get |
|------|-----|-----|
| 1 | CONTEXT | built, codegen, shell, file map |
| 2 | AGENTS | conventions, commands, checklist |
| MDX authoring | MDX-COMPONENTS | minimal API |
| JSON authoring | JSON-COMPONENTS | browser/SaaS tuple spec |
| Graph tab UX | GRAPH_VIEW | graph view requirements |
| Product | VISION | north star |
| Backlog | FUTURE, POC | historical |

Don't duplicate AGENTS conventions or VISION philosophy here.

## What this is

Text-first UX spec: MDX or JSON describes screens/nav — not mockups. Both paths → `WireframeDocumentBundle` → Preview + Prototype + Graph View. Storybook for UX flows.

Primitives = structure/behavior (wireframe-styled). Shell = Tailwind/shadcn.

## Status

POC shipped + extended. `npm run dev` → codegen, tri-view shell (Preview / Prototype / Graph), document picker.

| Area | Status |
|------|--------|
| Primitives: Screen, Text, Link, Input, Container, Image, Icon, Modal, TopBar, Divider | Done |
| MDX parse + validation via `buildMdxDocument` (dup ids, goto, Text flags, classified links, modalIds) | Done |
| Per-doc screens/routes + contentDocuments registry | Done |
| Multi-MDX + frontmatter titles, History API prototype router | Done |
| storyboard.mdx, wireframe.mdx, components.mdx | Done |
| Graph View (shell tab, Screen + Compact modes) | Done |
| JSON playground (browser compile, Monaco split editor, no codegen) | Done |
| URL-driven shell (view, doc, prototype screen, graph query in browser URL) | Done |
| Unreachable validation, doc export | Not started |
| Card, List, Section, BottomNav, Tabs | Not started |

## Quick start

```bash
npm install && npm run dev    # localhost:5173 — MDX at /mdx/...; JSON playground at /playground/json/...
npm run check && npm run build && npm test
```

Author `src/content/*.mdx`. Don't hand-edit `src/generated/`.

```yaml
---
title: Wireframe App
---
```

Examples: `storyboard.mdx` (intro), `wireframe.mdx` (Workforge demo), `components.mdx` (catalog).

## E2E flow

```
src/content/*.mdx
  → buildMdxDocument (single AST parse per file)
     screens with modalIds, classified links, linkIds
  → extractNavigationGraph from classified screen-edge links
  → inject graph-link-id into generated screen JSX
  → src/generated/documents/{slug}/screens.generated.tsx
                        routes.generated.tsx   # paths /mdx/{slug}/{screenId}
                        navigation-graph.generated.ts
  → content-documents.generated.tsx, routes.generated.tsx
  → mdxContentDocumentsToBundles → WireframeDocumentBundle[]
  → MdxApp → Shell: Preview | Prototype (routes, first = entry) | Graph (navigationGraph)
```

Each MDX file is parsed once via `buildMdxDocument`. Screens carry `modalIds` from AST modal collection (not regex). Links are classified (`screen-edge`, `modal`, `reserved`, invalid variants) with pre-assigned `linkId`s used by both the navigation graph and generated `graph-link-id` attributes.

Vite plugin: `runFullCodegen` on `buildStart` + MDX save → full reload. CLI: `npm run codegen`.

## JSON flow (playground / SaaS path)

```
JSON document (tuple nodes, colon-modifier tags — see JSON-COMPONENTS.md)
  → buildJsonDocument (browser)
     parse tuples, validate, classify links (shared classifyGotoLink)
     stamp graphLinkId on Link nodes at build time
  → jsonToWireframeDocumentBundle (slug, { playground?: boolean })
     routePrefix /mdx/{slug} or /playground/json/{slug}; runtime Screen components, routes, navigationGraph
  → PlaygroundApp → Shell (same Preview / Prototype / Graph views)
```

Entry: `App.tsx` picks MDX vs playground from parsed URL → `MdxApp` or `PlaygroundApp` → `Shell`. Sample: `src/json/sample-wireframe.json`. Canonical playground path: `/playground/json/playground/...`; legacy `/playground` and `/playground/{screenId}` redirect on load.

Playground UI: split pane — Monaco JSON editor (left, debounced compile) + Shell (right). Initial content from `sample-wireframe.json`. Compile errors surface via `WireframeErrorProvider`.

No `src/generated/` involvement. MDX and JSON paths are separate; both produce `WireframeDocumentBundle` for the shell.

## Repo map

```
src/content/*.mdx
src/generated/              # gitignored AUTO-GENERATED (MDX only)
src/json/                   # browser JSON compiler + renderer
src/types/                  # navigation, goto, WireframeDocumentBundle
src/lib/app-routes.ts       # path constants, screenRoutePath
src/lib/app-url.ts          # parseAppUrl / buildAppUrl, legacy resolution
src/playground/             # PlaygroundApp, Monaco JSON editor, split layout
src/MdxApp.tsx              # MDX documents → Shell
src/components/wireframe/   # primitives
src/components/ui/          # shadcn
src/runtime/                # WireframeViewContext (preview|prototype|graph), WireframeErrorProvider
src/shell/                  # Shell, DocumentMenu, PreviewView, PrototypeView, GraphView, graph/, router
  adapters/mdx-documents.ts # ContentDocumentEntry → WireframeDocumentBundle
  use-app-url.ts            # History API hook (URL = shell state)
src/plugin/                 # codegen: buildMdxDocument, classify-links, generate, wireframe-plugin
  build-mdx-document.ts     # single parse entry (screens, modalIds, classified links)
  classify-links.ts         # navigation link semantics seam
  mdx-ast.ts                # shared remark/AST helpers
  extract-screens.ts        # thin wrapper → buildMdxDocument
  extract-navigation-graph.ts
  inject-graph-link-ids.ts
  run-full-codegen.ts
src/mdx-components.ts
src/App.tsx                 # MDX vs playground from parsed URL
```

## Key behaviors

### URL state

Browser URL is source of truth for shell navigation:

- MDX app: `/mdx/{docSlug}/{view}[/{screenId}]`
- Playground: `/playground/{source}/{docSlug}/{view}[/{screenId}]`
- Graph query: `?graphMode=screen|compact&focus={screenId}`

Legacy flat paths (`/`, `/login`, `/playground`, `/playground/{screenId}`) redirect on load. Invalid prototype `screenId` or graph query on non-graph views are normalized. Codec: `src/lib/app-url.ts`; hook: `src/shell/use-app-url.ts`.

### Content documents

Codegen scans MDX → `contentDocuments` with frontmatter `title`. Hamburger switches files (persists across all shell views). `storyboard.mdx` sorts first.

- **Preview:** all `<Screen>` blocks, `gap-8`
- **Prototype:** generated routes only; active screen from URL `screenId` (`key={slug}` remounts on doc switch)
- **Graph:** per-doc `navigationGraph`; Screen or Compact sub-mode; full-width canvas

### Screen / Link / Modal

`<Screen id title>` — semantic section; preview = bordered card + anchor scroll.

`<Link goto>` — not Button:

| View | goto | Behavior |
|------|------|----------|
| preview | screen id | `href="#id"` scroll |
| preview | `_close`/`_back` | `#` noop |
| prototype | screen id | `navigate` to `{routePrefix}/{id}` (e.g. `/mdx/wireframe/login`) |
| prototype | modal id | `openModal(id)` |
| prototype | `_close` | `closeModal()` |
| prototype | `_back` | `history.back()` |
| graph | any | non-interactive; edges from screen→screen links only |

Plain string `goto`. Runtime `GotoTarget` in `src/types/goto.ts`; MDX codegen still emits per-doc unions in `routes.generated.tsx`. Flags: `primary-btn`, `secondary-btn`, `disabled`, `danger`.

`<Modal id>` in Screen — open via Link, dismiss backdrop/Escape/`_close`. Modal ids unique per screen, ≠ screen id.

### Codegen errors

Validation blocks run. Terminal: `[wireframe] Codegen failed: …` with filename prefix. Shell: `WireframeErrorProvider`. Stale generated files until success.

### Add screen

New `<Screen>` in MDX + save → codegen updates that doc's generated files. No shell edits.

### Graph View

Third shell tab; active document picker applies. Codegen `navigationGraph` → Dagre **left-to-right** layout. Screen View (default): wireframe nodes, link-anchored edges (control boundary → smart screen boundary ports), link/edge hover highlight, blue connector styling. Compact View: cards with note/counts, boundary edges only. Pan/zoom/fit/minimap; node click selects only. Full UX spec: [`GRAPH_VIEW.md`](GRAPH_VIEW.md).

## Tooling

Vite 8 + React 19 + TS 6 | MDX 3 (`@mdx-js/rollup`, `remark-frontmatter`, `@mdx-js/typescript-plugin`) | Tailwind 4 + shadcn | `@xyflow/react` + `@dagrejs/dagre` (Graph View) | Biome (excludes `src/generated/`, `*.mdx`) | Vitest plugin tests

## Locked decisions

- Multi MDX in `src/content/`, YAML `title`
- Plain string ids; `GotoTarget` codegen union
- Per-doc `generated/documents/{slug}/`
- `contentDocuments` feeds shell
- `Link` not `Button`; minimal History API router (no React Router)
- Generated gitignored; codegen before tsc in build/check
- `storyboard.mdx` = intro showcase; `wireframe.mdx` = canonical demo example
- Graph View: Dagre LR layout; Screen View edges anchor at link controls
- Single MDX parse per file via `buildMdxDocument`; `modalIds` from AST; `linkId` from classified `screen-edge` links
- MDX codegen + JSON browser compile both produce `WireframeDocumentBundle` for `Shell`
- URL-driven shell: `/mdx/...` (MDX), `/playground/json/...` (JSON playground); `routePrefix` scopes prototype `Link` paths per document

## Next

[`FUTURE.md`](FUTURE.md): unreachable/orphan validation (phase 6 — now unblocked by classified links), doc export, vision extras.

Architecture deepening (Plan 1 ✓): shared navigation types, `WireframeDocumentBundle`, graph view pipeline — see [`2026-06-29-architecture-deepening-overview.md`](superpowers/plans/2026-06-29-architecture-deepening-overview.md). JSON playground pipeline ✓ — [`2026-06-29-json-playground-pipeline.md`](superpowers/plans/2026-06-29-json-playground-pipeline.md). URL state ✓ — [`2026-06-29-app-url-state.md`](superpowers/plans/2026-06-29-app-url-state.md).
