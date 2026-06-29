# Architecture Deepening — Plan Overview

> **For agentic workers:** Four independent implementation plans address the architecture review findings. Execute in the order below unless noted.

**Source:** Architecture review (2026-06-29) — six deepening candidates across codegen plugin, runtime seams, and graph view shell.

## Execution order

| Order | Plan | Goal | Depends on |
|-------|------|------|------------|
| 1 | [`2026-06-29-codegen-mdx-document-model.md`](2026-06-29-codegen-mdx-document-model.md) | Single MDX parse, classified links, structured modal metadata | — |
| 2 | [`2026-06-29-shared-navigation-types.md`](2026-06-29-shared-navigation-types.md) | Move `NavigationGraph` types out of plugin into shared module | Plan 1 optional (can run in parallel) |
| 3 | [`2026-06-29-document-registry.md`](2026-06-29-document-registry.md) | Centralize slug/primary-doc naming; fold legacy codegen | Plan 1 optional |
| 4 | [`2026-06-29-graph-view-pipeline.md`](2026-06-29-graph-view-pipeline.md) | Deepen GraphView orchestration into `useGraphPipeline` | Plan 2 recommended (imports shared types) |

**Phase 6 alignment:** Plan 1 is prerequisite for unreachable-screen / orphan validation (future work). Plans 2–4 are independent polish that can ship separately.

## What each plan delivers

- **Plan 1:** One parse per MDX file; `classifyLinks` owns navigation semantics; modal ids from AST not regex; integration test MDX → graph → `graph-link-id`.
- **Plan 2:** `src/types/navigation.ts` — shell no longer imports from `src/plugin/`.
- **Plan 3:** `document-registry.ts` — single source for `primaryDocumentSlug`, `slugToRoutesAlias`; legacy `codegen.ts` folded.
- **Plan 4:** `useGraphPipeline` hook — GraphView becomes thin ReactFlow adapter; pipeline unit-testable without ReactFlow.

## Global constraints (all plans)

- Run `npm run build` + `npm run check` before claiming done
- Plugin changes require Vitest tests (`npm test`)
- Do not hand-edit `src/generated/`
- Min diff; no unrelated refactors; no new deps unless required
- Update `docs/CONTEXT.md` when architecture/codegen changes
- Wireframe primitives stay structural; shell may use shadcn/Tailwind
