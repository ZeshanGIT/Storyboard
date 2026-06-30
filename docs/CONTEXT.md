# Storyboard — Session Context

**What exists + how repo works.** [`AGENTS.md`](../AGENTS.md) = workspace rules (how). Attach this file for architecture/status. Conflict → trust CONTEXT.

On demand: [`MDX-COMPONENTS.md`](MDX-COMPONENTS.md), [`JSON-COMPONENTS.md`](JSON-COMPONENTS.md), [`GRAPH_VIEW.md`](GRAPH_VIEW.md), [`VISION.md`](VISION.md), [`FUTURE.md`](FUTURE.md)

## Status

Phase ✓1–5 (Foundation → Graph view). **Next:** phase 6 validation (unreachable/orphan), doc export → [`FUTURE.md`](FUTURE.md).

Shipped: primitives (Screen–Divider), `buildMdxDocument` validation, multi-MDX + document picker, Graph View (Screen/Compact), JSON+MDX playground (Monaco), URL-driven shell.

Not started: unreachable validation, doc export; primitives Card, List, Section, BottomNav, Tabs.

## Architecture

MDX or JSON → `WireframeDocumentBundle` → shared `Shell` (Preview | Prototype | Graph). Primitives wireframe-styled; shell Tailwind/shadcn.

**MDX codegen**

```
src/content/*.mdx → buildMdxDocument (1 AST parse: screens, modalIds, classified links/linkIds)
  → navigation graph + graph-link-id inject → src/generated/documents/{slug}/
  → contentDocuments → mdxContentDocumentsToBundles → MdxApp → Shell
```

Vite: `runFullCodegen` on buildStart + MDX save.

**JSON / playground** (no `src/generated/`)

```
JSON tuples → buildJsonDocument → jsonToWireframeDocumentBundle → PlaygroundApp → Shell
MDX editor → compilePlaygroundMdx → mdxToWireframeDocumentBundle (routePrefix /playground/mdx/{slug})
```

`App.tsx` routes MDX vs playground from URL. Split pane: Monaco + Shell; errors via `WireframeErrorProvider`.

**Product Spec** (P1, Node-only)

```
storyboard/{spec,requirements,bindings}.json → loadProductSpec → validateProductSpec
  → npm run storyboard (validate | req show | impact | trace)
```

`src/product-spec/` — types, loader, SR indexing, cross-file validation, CLI. JSON wireframes accept optional SR as tuple element [1] (`src/json/parse-node.ts`). Schema → [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md).

## Repo map

| Path | Role |
|------|------|
| `src/content/*.mdx` | Authoring |
| `src/generated/` | MDX codegen output (gitignored) |
| `src/plugin/` | `buildMdxDocument`, classify-links, codegen |
| `src/json/` | Browser JSON compiler |
| `src/mdx-playground/` | Browser MDX compile + bundle |
| `src/playground/` | PlaygroundApp, Monaco editor |
| `src/shell/` | Shell, views, graph/, `use-app-url.ts` |
| `src/runtime/` | WireframeViewContext, WireframeErrorProvider |
| `src/components/wireframe/` | Primitives |
| `src/lib/app-url.ts` | URL parse/build/legacy |
| `src/product-spec/` | Product Spec load, validate, CLI |
| `src/MdxApp.tsx`, `src/App.tsx` | App entry |

## Shell behavior

**URLs:** MDX `/mdx/{docSlug}/{view}[/{screenId}]`; playground `/playground/{source}/{docSlug}/{view}[/{screenId}]`; graph `?graphMode=screen|compact&focus={screenId}`. Legacy paths redirect; invalid segments normalized.

**Views:** Preview — all screens; Prototype — generated routes, URL `screenId`; Graph — per-doc `navigationGraph`, Dagre LR, Screen (link-anchored edges) or Compact. Doc picker persists across views; `storyboard.mdx` first.

**Link / Modal:** `<Link goto>` not Button — preview `#scroll`; prototype `navigate` / `openModal` / `_close` / `_back`; graph non-interactive (screen→screen edges only). Details → [`MDX-COMPONENTS.md`](MDX-COMPONENTS.md).

**Codegen errors:** block run; `[wireframe] Codegen failed:` in terminal; shell via `WireframeErrorProvider`.

**Graph View UX:** [`GRAPH_VIEW.md`](GRAPH_VIEW.md)

## Locked decisions

Intent over appearance; MDX = language; screens first-class (`id`, `goto`); primitives ≠ shell; MDX static codegen / JSON browser compile; `Link` not `Button`; History API only; generated gitignored; single `buildMdxDocument` parse; both paths → `WireframeDocumentBundle`; URL-driven shell with per-doc `routePrefix`.

## Tooling

Vite 8, React 19, TS 6, MDX 3, Tailwind 4 + shadcn, `@xyflow/react` + `@dagrejs/dagre`, Biome (excludes `src/generated/`, `*.mdx`), Vitest (plugin)

**Monorepo packages:** npm workspaces under `packages/` — `@storyboard/spec` (Product Spec engine), `@storyboard/shell` (Vite plugin, Shell, wireframe primitives, JSON compiler), `storyboard` CLI (`packages/cli`). The OSS root app dogfoods `@storyboard/shell` via `workspace:*`; playground stays in root `src/playground/` (not published in 0.1.0).
