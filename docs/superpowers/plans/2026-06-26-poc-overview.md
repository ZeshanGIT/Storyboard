# POC Implementation — Phase Overview

> **For agentic workers:** Each phase has its own detailed plan. Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement phase-by-phase. Complete phases in order — each produces working, testable software.

**Goal:** Prove that MDX wireframes can be parsed, validated, codegen'd into routable screen components, and previewed in two modes (MDX Preview + Prototype View) from a stable dev shell.

**Parent spec:** [`docs/POC.md`](../../POC.md)

**Tech stack:** Vite 8, React 19, TypeScript 6, MDX 3 (`@mdx-js/rollup`), Tailwind 4 (shell only), remark 15 + remark-mdx 3.1 + unist-util-visit 5

---

## Phase map

| Phase | Plan file | Delivers |
|-------|-----------|----------|
| **1** | [`2026-06-26-poc-phase-1-wireframe-primitives.md`](./2026-06-26-poc-phase-1-wireframe-primitives.md) | `<Screen>`, `<Text>`, `<Link>`, view context, MDX registry |
| **2** | [`2026-06-26-poc-phase-2-codegen-core.md`](./2026-06-26-poc-phase-2-codegen-core.md) | AST extraction, validation, three generated file writers |
| **3** | [`2026-06-26-poc-phase-3-vite-plugin.md`](./2026-06-26-poc-phase-3-vite-plugin.md) | Vite watcher plugin, HMR, `src/generated/` output |
| **4** | [`2026-06-26-poc-phase-4-dev-shell.md`](./2026-06-26-poc-phase-4-dev-shell.md) | Dual-view shell, router, error display |
| **5** | [`2026-06-26-poc-phase-5-integration.md`](./2026-06-26-poc-phase-5-integration.md) | Example wireframe, build/CI, full acceptance criteria |

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
 primitives    codegen      watcher      shell        E2E
```

Phases 1 and 2 are independently testable without Vite. Phase 3 wires codegen into dev. Phase 4 consumes generated `routes`. Phase 5 validates the full POC acceptance criteria from `docs/POC.md`.

---

## Definition of Done — per phase

### Phase 1: Wireframe Primitives

- [ ] `src/components/wireframe/Screen.tsx`, `Text.tsx`, `Link.tsx`, and `index.ts` exist
- [ ] `<Screen>` renders a semantic container (`<section>`) with `id={screenId}` for anchor navigation
- [ ] `<Text>` renders static copy with no brand styling (structural only)
- [ ] `<Link>` reads `WireframeViewContext` and renders anchor (`href="#login"`) in `'preview'` mode
- [ ] `<Link>` calls `navigate('/login')` from context in `'prototype'` mode
- [ ] `WireframeViewContext` exported from `src/runtime/WireframeViewContext.tsx` with `view`, `navigate`
- [ ] `Screen`, `Text`, `Link` registered in `src/mdx-components.ts`
- [ ] `npm run build` and `npm run lint` pass (no generated files required yet)

### Phase 2: Codegen Core

- [ ] `src/plugin/extract-screens.ts` parses MDX via remark + remark-mdx and extracts `<Screen>` nodes
- [ ] Each screen yields: `id`, `title`, serialized JSX subtree (via remark-stringify)
- [ ] Duplicate screen IDs produce a typed `CodegenError` with screen id and line hint
- [ ] `src/plugin/naming.ts` converts `home` → `Home`, `user-profile` → `UserProfile` (documented rules)
- [ ] `src/plugin/generate.ts` writes `screens.generated.tsx`, `routes.generated.tsx`, `screens-map.generated.ts`
- [ ] Vitest unit tests pass for extraction, naming, and duplicate-ID validation
- [ ] Running codegen manually (test script or vitest) produces valid TypeScript in a temp dir

### Phase 3: Vite Plugin

- [ ] `remark`, `remark-mdx`, `unist-util-visit` added to `devDependencies`
- [ ] `src/plugin/wireframe-plugin.ts` implements Vite plugin with `buildStart`, `configureServer`, `handleHotUpdate`
- [ ] Plugin watches `src/content/wireframe.mdx` (and `src/content/*.mdx` if present)
- [ ] On startup and MDX save: parse → validate → write three files to `src/generated/`
- [ ] `src/generated/` added to `.gitignore`
- [ ] Plugin registered in `vite.config.ts` (runs before MDX compile)
- [ ] Editing `wireframe.mdx` triggers HMR within one save cycle
- [ ] Codegen errors logged to terminal; plugin does not silently overwrite on duplicate IDs

### Phase 4: Dev Shell

- [ ] `src/shell/Shell.tsx` — view switcher (MDX Preview ↔ Prototype View)
- [ ] `src/shell/PreviewView.tsx` — renders `wireframe.mdx` via existing `@mdx-js/rollup` pipeline
- [ ] `src/shell/PrototypeView.tsx` — minimal client router driven by `routes` from `routes.generated.tsx`
- [ ] `src/shell/router.tsx` — `usePrototypeRouter` with `navigate`, `currentPath`, `/` → first route redirect
- [ ] `Shell` wraps active view in `WireframeViewProvider` with correct `view` mode
- [ ] Codegen error banner shown in shell when plugin reports validation failure
- [ ] `src/App.tsx` imports `routes` from generated and renders `<Shell routes={routes} />`
- [ ] Shell contains **no** screen-specific logic — new screens appear only via codegen

### Phase 5: Integration & Acceptance

- [ ] `src/content/wireframe.mdx` replaces `welcome.mdx` with 3-screen POC example (home, login, signup)
- [ ] `goto={Screens.Login}` works in MDX (via import or provider wiring)
- [ ] `MdxButton` and `welcome.mdx` removed (or clearly superseded)
- [ ] `npm run build` runs codegen plugin and succeeds without committed generated files
- [ ] All 8 acceptance criteria from `docs/POC.md` verified manually (checklist in phase 5 plan)
- [ ] Adding `<Screen id="about" …>` creates `About`, `/about`, `Screens.About` with zero shell changes

---

## Full POC acceptance criteria (Phase 5 gate)

From [`docs/POC.md`](../../POC.md#acceptance-criteria):

1. `npm run dev` starts app and watcher without extra steps
2. Editing `wireframe.mdx` regenerates all three artifacts within one save + HMR cycle
3. Duplicate screen IDs → clear error, no silent overwrite
4. `Screens.Login` resolves in MDX and generated files
5. MDX Preview shows all screens; `<Link>` scrolls to target anchor
6. Prototype View shows one screen per path; `<Link>` navigates correctly
7. New `<Screen>` block → new component, route, and `Screens` entry — no shell edits
8. `npm run build` and `npm run lint` pass

---

## Execution handoff

Start with **Phase 1** plan. After each phase DoD is met, proceed to the next.

**Subagent-Driven (recommended):** Dispatch a fresh subagent per task within a phase; review between tasks.

**Inline Execution:** Batch tasks within a phase using executing-plans; checkpoint after each phase DoD.
