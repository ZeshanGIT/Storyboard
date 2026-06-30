# AGENTS.md — OneSpec

Agent tooling rules. **AGENTS is a workspace rule.** Attach [`docs/CONTEXT.md`](docs/CONTEXT.md) for architecture/status. AGENTS = how/rules; CONTEXT = what/where. Conflict → trust CONTEXT.

Refs: [`VISION.md`](docs/VISION.md), [`PRODUCT-SPEC.md`](docs/PRODUCT-SPEC.md), [`MDX-COMPONENTS.md`](docs/MDX-COMPONENTS.md), [`JSON-COMPONENTS.md`](docs/JSON-COMPONENTS.md)

## Commands

```bash
npm run dev       # codegen on start + MDX save; JSON playground /playground/json/...
npm run build     # codegen + tsc + vite
npm run check     # codegen + tsc + Biome
npm run fix       # Biome safe fixes + format
npm run codegen   # regen src/generated/ only
npm test          # Vitest plugin tests
npm run preview
npm run onespec  # init | dev | validate | req show | impact | trace
```

Run `npm run build` + `npm run check` before claiming done.

## Conventions

### MDX content

- `src/content/*.mdx`, YAML `title` required; multiple `<Screen>` per file
- `wireframe.mdx` = canonical example; don't edit `src/generated/`

### MDX components

- Register in `src/mdx-components.ts` (no imports in MDX); API → [`MDX-COMPONENTS.md`](docs/MDX-COMPONENTS.md)
- Nav logic in `WireframeViewContext`, not primitives

### TypeScript

- `type` for props; export alongside components; `import type` for type-only (`verbatimModuleSyntax`)
- No unused locals/parameters
- IDE: **TypeScript: Use Workspace Version** (`~6.0.x`) to match `npm run check`

### Codegen plugin

- Canonical parse: `buildMdxDocument` — no parallel AST walks
- Links: `classifyScreenLinks` / `ClassifiedLink`; graph + `graph-link-id` use classified `linkId`s
- Path: `runFullCodegen` → `buildMdxDocument`; `extractScreens` = thin wrapper
- Plugin touches → tests (`npm test`)

### JSON compiler (`src/json/`)

- Browser-only, no `src/generated/`; shared `classifyGotoLink` + `WireframeDocumentBundle`
- Parse: `buildJsonDocument`; stamp `graphLinkId` at build time
- API → [`JSON-COMPONENTS.md`](docs/JSON-COMPONENTS.md); touches → tests

### App routing (code)

- URLs: `/mdx/{docSlug}/{view}[/{screenId}]`, `/playground/json/{docSlug}/{view}[/{screenId}]` — `view` = `preview` | `prototype` | `graph`
- Graph query when `view=graph`: `?graphMode=screen|compact&focus={screenId}`
- Codec: `src/lib/app-url.ts`; hook: `src/shell/use-app-url.ts` (no React Router)
- `App.tsx`: MDX vs playground via `parseAppUrl`
- Prototype paths: `/mdx/{docSlug}/{screenId}` (MDX) or `/playground/json/{docSlug}/{screenId}` (JSON `{ playground: true }`)

### Styling

- Primitives: wireframe (structural borders, semantic HTML, `disabled`/`danger`); shadcn internals OK
- Shell: shadcn/Tailwind OK; Graph chrome blue connectors in `src/shell/graph/graph-view.css`
- No brand colors, shadows, typography systems elsewhere

### Naming

- Components `PascalCase.tsx`; content `kebab-case.mdx`; plugin/runtime `camelCase.ts`

### Scope

- Min diff; no unrelated refactors; no new deps without need; no commits/PRs/new markdown unless asked
- Plugin/JSON touches → tests

## Skills

- Auto: `.agents/skills/`; manual: `.agents/skill-archive/` (`@…/SKILL.md`); post-install `./scripts/archive-skills.sh`
- User instructions override skill defaults

## Checklist

- [ ] `VISION.md` product behavior; `PRODUCT-SPEC.md` schema/traceability; `GRAPH_VIEW.md` graph tab; `CONTEXT.md` arch/codegen/URLs; `JSON-COMPONENTS.md` JSON API
- [ ] Wireframe primitives; new components → `mdx-components.ts`; new content → `title` frontmatter
- [ ] `npm run test` (+ `src/lib/app-url.test.ts` if URLs); `npm run build` + `npm run check`; scope matches build phase

Git: workspace dir not git root. Repo: `/Users/seshan-12821/Data/Repos/WireframeX` — use `git -C …`. Changes sync automatically.

Subagents: **composer-2.5 only** — never composer-2.5-fast.
