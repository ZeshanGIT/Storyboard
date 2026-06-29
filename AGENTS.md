# AGENTS.md — Storyboard

Agent tooling rules. **Complements** [`docs/CONTEXT.md`](docs/CONTEXT.md) — read both at session start. CONTEXT = what/where; AGENTS = how/rules. State conflict → trust CONTEXT.

Refs: [`VISION.md`](docs/VISION.md), [`MDX-COMPONENTS.md`](docs/MDX-COMPONENTS.md)

## Summary

Text-first UX spec via MDX + React components. Specify visibility, actions, nav — not visual design. Storybook for UX flows.

## Non-goals

No pixel-perfect mockups, design tooling, rich styling/animations/brand theming, Figma replacement. Wireframes look "designed" → vision violation.

## Build phases

Small vertical slices. ✓1 Foundation ✓2 Navigation ✓3 Primitives ✓4 Multi-document ✓5 Graph view | 6 Analysis (validation) 7 Polish → `VISION.md`, `FUTURE.md`

## Commands

```bash
npm run dev      # codegen on start + MDX save
npm run build    # codegen + tsc + vite
npm run check    # codegen + tsc + Biome
npm run fix      # Biome safe fixes + format
npm run codegen  # regen src/generated/ only
npm test         # Vitest plugin tests
npm run preview
```

Run `npm run build` + `npm run check` before claiming done.

## Conventions

### MDX content

- `src/content/*.mdx`, YAML frontmatter `title` required
- Multiple `<Screen>` per file
- `wireframe.mdx` = canonical example; don't edit `src/generated/`

### MDX components

- Register primitives in `src/mdx-components.ts` (no imports in MDX)
- API: [`MDX-COMPONENTS.md`](docs/MDX-COMPONENTS.md)
- Nav logic in `WireframeViewContext`, not primitives

### TypeScript

- `type` for props; export alongside components
- `import type` for type-only (`verbatimModuleSyntax`)
- No unused locals/parameters
- IDE: **TypeScript: Select TypeScript Version → Use Workspace Version** (`~6.0.x` from `node_modules`) so editor matches `npm run check`

### Codegen plugin

- Canonical MDX parse: `buildMdxDocument` — do not add parallel AST walks for screens/links/modals
- Link semantics: `classifyScreenLinks` / `ClassifiedLink`; graph edges and `graph-link-id` injection consume classified `linkId`s
- `extractScreens` is a thin wrapper; production path is `runFullCodegen` → `buildMdxDocument`
- Plugin touches → add tests (`npm test`)

### Styling

- Primitives: wireframe output (structural borders, semantic HTML, `disabled`/`danger` helpers) — shadcn internally OK
- Shell: full shadcn/Tailwind OK
- Graph View chrome: fixed blue navigation connectors in `src/shell/graph/graph-view.css`; wireframe content inside graph nodes stays structural
- No brand colors, shadows, typography systems elsewhere

### Naming

- Components: `PascalCase.tsx`
- Content: `kebab-case.mdx`
- Plugin/runtime: `camelCase.ts`

### Scope

- Min diff; no unrelated refactors
- No new deps without need
- Plugin touches → add tests
- No commits/PRs/new markdown unless asked

### Docs roles

| Doc | Role |
|-----|------|
| CONTEXT | architecture, status, flows |
| AGENTS | conventions, scope, checklist |
| MDX-COMPONENTS | minimal wireframe API |
| GRAPH_VIEW | graph tab UX requirements |
| VISION | product direction |

## Design decisions (preserve)

1. Intent over appearance
2. MDX = language (no separate DSL)
3. Screens first-class — stable `id`, nav via `goto`
4. Primitives ≠ shell chrome
5. Static analysis at codegen
6. `Link` for nav — `primary-btn`/`secondary-btn`, not `Button`

## Skills

Only `.agents/skills/` auto-discovered. Manual → `.agents/skill-archive/` (`@.agents/skill-archive/<name>/SKILL.md`). Cross-ref slash names → `skill-archive-routing` skill or Read target there. Post-install → `./scripts/archive-skills.sh`. User instructions override skill defaults.

## Checklist

- [ ] `VISION.md` if product behavior
- [ ] `GRAPH_VIEW.md` if graph tab behavior changes
- [ ] `CONTEXT.md` if architecture/codegen
- [ ] Wireframe-styled primitives
- [ ] New components → `mdx-components.ts`
- [ ] New content → `title` frontmatter
- [ ] `npm run test` (plugin/codegen)
- [ ] `npm run build` + `npm run check`
- [ ] Scope matches build phase


Git: This directory is not a git repository. The actual git repository is at /Users/seshan-12821/Data/Repos/WireframeX. You cannot cd there directly due to workspace restrictions, but you CAN run git commands using git -C /Users/seshan-12821/Data/Repos/WireframeX <command>. Changes made here sync automatically.