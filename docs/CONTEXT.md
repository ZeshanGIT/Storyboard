# Storyboard — Session Context

**What exists + how repo works.** [`AGENTS.md`](../AGENTS.md) = workspace rules (how). Attach this file for architecture/status. Conflict → trust CONTEXT.

On demand: [`MDX-COMPONENTS.md`](MDX-COMPONENTS.md), [`JSON-COMPONENTS.md`](JSON-COMPONENTS.md), [`GRAPH_VIEW.md`](GRAPH_VIEW.md), [`VISION.md`](VISION.md), [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md), [`ROADMAP.md`](ROADMAP.md), [`FUTURE.md`](FUTURE.md)

## Status

**Branch:** `p2-npm-package` (P2 work; not yet merged to `master`).

| Track | Status | Notes |
|-------|--------|-------|
| OSS shell A1–A5+ | ✓ | Preview, Prototype, Graph, JSON+MDX playground, URL state |
| OSS A6 Analysis | ◐ | Unreachable/orphan validation → [`FUTURE.md`](FUTURE.md) §3–4 |
| OSS A7 Polish | ○ | Doc export, backlog primitives |
| P1 Product Spec engine | ✓ | Three-file model, validate, trace helpers |
| P2 npm package | ◐ | Workspaces extracted; CLI wired; human `npm publish` pending |
| Rename → `@onespec-dev` | ○ | Planned — [`2026-06-30-onespec-dev-rename-phases.md`](superpowers/plans/2026-06-30-onespec-dev-rename-phases.md) |

**Current focus:** P2 publish-ready (`0.1.0`) or Phase 1–3 of OneSpec rename, then P3 toy-repo traceability POC.

Shipped: wireframe primitives (Screen–Divider), `buildMdxDocument`, multi-MDX + doc picker, Graph View (Screen/Compact), JSON+MDX playground (Monaco), `WireframeDocumentBundle`, npm workspaces with `@onespec-dev/{spec,shell,cli}`.

Not started: unreachable validation, doc export, npm publish, primitives Card, List, Section, BottomNav, Tabs.

## Architecture

MDX or JSON → `WireframeDocumentBundle` → shared `Shell` (Preview | Prototype | Graph). Primitives wireframe-styled; shell chrome Tailwind/shadcn.

**Monorepo (npm workspaces)**

```
packages/spec/     @onespec-dev/spec   — Product Spec load, validate, req show, impact, trace
packages/shell/    @onespec-dev/shell  — buildMdxDocument, JSON compiler, Vite plugin, Shell, graph
packages/cli/      @onespec-dev/cli    — storyboard bin: init | dev | validate | req | impact | trace
src/               OSS app only       — content, playground, adapters, generated; dogfoods @onespec-dev/shell
```

Build: `npm run build:packages` → `codegen` → root `tsc` + Vite. Codegen entry: `packages/shell/src/plugin/run-codegen.ts`.

**MDX codegen**

```
src/content/*.mdx → buildMdxDocument (packages/shell plugin)
  → navigation graph + graph-link-id inject → src/generated/documents/{slug}/
  → src/adapters/content-documents → MdxApp → Shell (@onespec-dev/shell)
```

Vite: `runFullCodegen` on buildStart + MDX save.

**JSON / playground** (no `src/generated/` for JSON tuples)

```
JSON tuples → buildJsonDocument (@onespec-dev/shell) → jsonToWireframeDocumentBundle
  → PlaygroundApp → Shell
MDX editor → compilePlaygroundMdx → mdxToWireframeDocumentBundle (routePrefix /playground/mdx/{slug})
```

`App.tsx` routes MDX vs playground from URL. Split pane: Monaco + Shell; errors via `WireframeErrorProvider` (`packages/shell`).

**Product Spec**

```
storyboard/{spec,requirements,bindings}.json
  → loadProductSpec → validateProductSpec (@onespec-dev/spec)
  → npm run storyboard — init | dev | validate | req show | impact | trace (@onespec-dev/cli)
```

Consumer convention: `storyboard/` directory at project root (rename to `onespec/` planned in rename Phase 4). JSON wireframes accept optional SR as tuple element [1] (`packages/shell/src/json/parse-node.ts`). Schema → [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md).

**Consumer CLI (P2)**

```bash
npm run storyboard -- init                    # embedded: storyboard/ trio + sample MDX
npm run storyboard -- init --template cloud   # todo-poc/ stub
npm run storyboard -- dev [--port 5173]       # JSON mode via defineStoryboardConfig
npm run storyboard -- validate | req show | impact | trace
```

Published install (when published): `npx @onespec-dev/cli@0.1.0` — npm name `storyboard` is taken. `trace` needs `rg` on PATH.

## Repo map

| Path | Role |
|------|------|
| `packages/spec/src/` | Product Spec types, load, validate, trace helpers; todo fixture under `__tests__/fixtures/todo/` |
| `packages/shell/src/plugin/` | `buildMdxDocument`, classify-links, codegen |
| `packages/shell/src/json/` | JSON wireframe compiler |
| `packages/shell/src/shell/` | Shell, views, graph/, routing hooks |
| `packages/shell/src/runtime/` | WireframeViewContext, WireframeErrorProvider |
| `packages/shell/src/components/wireframe/` | Primitives |
| `packages/shell/src/lib/` | `app-url.ts`, `app-routes.ts`, `app-base-path.ts` |
| `packages/shell/src/vite/` | `detectStoryboardMode`, `defineStoryboardConfig`, `createStoryboardDevServer`, JSON loader |
| `packages/shell/template/` | Consumer Vite scaffold (JSON dev default) |
| `packages/cli/src/` | Commander CLI, init templates (`embedded/`, `cloud/`) |
| `src/content/*.mdx` | OSS MDX authoring |
| `src/content/*.json` | JSON companion docs (e.g. `wireframe.json`) |
| `src/generated/` | MDX codegen output (gitignored) |
| `src/adapters/` | OSS bundle adapters (`content-documents`, `mdx-documents`, `json-documents`) |
| `src/mdx-playground/` | Browser MDX compile + bundle |
| `src/playground/` | PlaygroundApp, Monaco (not published 0.1.0) |
| `src/components/ui/` | shadcn (shell wireframe primitives import via `@/` in monorepo) |
| `src/MdxApp.tsx`, `src/App.tsx` | OSS app entry |

Removed from root (now in `packages/shell/`): `src/plugin/`, `src/shell/`, `src/json/`, `src/runtime/`, `src/product-spec/`.

## Shell behavior

**URLs:** MDX `/mdx/{docSlug}/{view}[/{screenId}]`; playground `/playground/{source}/{docSlug}/{view}[/{screenId}]`; graph `?graphMode=screen|compact&focus={screenId}`. Legacy paths redirect; invalid segments normalized.

**Views:** Preview — all screens; Prototype — generated routes, URL `screenId`; Graph — per-doc `navigationGraph`, Dagre LR, Screen (link-anchored edges) or Compact. Doc picker persists across views; `storyboard.mdx` first in OSS content.

**Link / Modal:** `<Link goto>` not Button — preview `#scroll`; prototype `navigate` / `openModal` / `_close` / `_back`; graph non-interactive (screen→screen edges only). Details → [`MDX-COMPONENTS.md`](MDX-COMPONENTS.md).

**Codegen errors:** block run; `[wireframe] Codegen failed:` in terminal; shell via `WireframeErrorProvider`.

**Graph View UX:** [`GRAPH_VIEW.md`](GRAPH_VIEW.md)

## Locked decisions

Intent over appearance; MDX = language; screens first-class (`id`, `goto`); primitives ≠ shell; MDX static codegen / JSON browser compile; `Link` not `Button`; History API only; generated gitignored; single `buildMdxDocument` parse; both paths → `WireframeDocumentBundle`; URL-driven shell with per-doc `routePrefix`; Product Spec trio under `storyboard/`; P2 publish `0.1.0` unstable — no production codegen (P5).

## Tooling

Vite 8, React 19, TS 6, MDX 3, Tailwind 4 + shadcn, `@xyflow/react` + `@dagrejs/dagre`, Biome (includes `packages/**`; excludes `src/generated/`, `*.mdx`, `packages/*/dist/`), Vitest.

```bash
npm run dev              # OSS Vite app
npm run build            # build:packages + codegen + tsc + vite
npm run build:packages   # tsc @onespec-dev/{shell,spec,cli}
npm run check            # codegen + tsc + biome
npm test                 # root Vitest (OSS adapters/playground; ~19 tests)
npm test -w @onespec-dev/spec -w @onespec-dev/shell -w @onespec-dev/cli  # package suites (~115 tests)
npm run storyboard -- …  # CLI from packages/cli
```

Phase detail + publish gate → [`ROADMAP.md`](ROADMAP.md). P2 implementation plan → [`superpowers/plans/2026-06-30-p2-npm-package.md`](superpowers/plans/2026-06-30-p2-npm-package.md).
