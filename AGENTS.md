# AGENTS.md — WireframeX

Guidance for AI agents and automated tooling working in this repository.

**Complements** [`docs/CONTEXT.md`](docs/CONTEXT.md) — read **both** at session start. CONTEXT covers what exists and how the repo works; this file covers how to work in it (conventions, scope, checklists, non-goals). On conflict about **current state**, trust CONTEXT.

## Project summary

**WireframeX** (working name; vision doc: "MDX Wireframes") is a **text-first UX specification format**. Developers describe application screens and navigation flows in **MDX using React components** — not as visual mockups.

The goal is **not** to design interfaces. The goal is to specify:

- What is visible on each screen
- What actions are available
- Where actions navigate
- How screens connect

Think: **Storybook for UX flows** — the spec that exists *before* Figma.

Full product vision: [`docs/VISION.md`](docs/VISION.md)  
Authoring reference: [`docs/MDX-COMPONENTS.md`](docs/MDX-COMPONENTS.md)

## Problem being solved

Early-stage teams know product behavior but lack time or expertise for polished UX. Today they use ASCII diagrams, Markdown lists, or screenshots. Designers and AI agents must reconstruct intent from scattered artifacts. There is no "Mermaid for UI wireframes."

## Target outputs (from MDX source)

| Output | Description | Status |
|--------|-------------|--------|
| Clickable prototype | Minimal, navigable UI per MDX file | **Done** (Prototype View) |
| MDX preview | All screens stacked for spec review | **Done** |
| Static validation | Duplicate IDs, invalid `goto`, bad `Text` flags | **Done** (build-time) |
| Component catalog | Live demo of all primitives | **Done** (`components.mdx`) |
| Navigation graph | Auto-generated screen relationships | Not started |
| Unreachable / orphan screens | Graph reachability checks | Not started |
| Documentation export | Readable product spec output | Not started |
| Reverse references | "Referenced by" per screen | Not started |

## Current state

The repo is **past the initial POC**: a working dev shell, full wireframe primitive set, multi-file content, and codegen pipeline.

**Implemented today:**

- Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4 + MDX 3
- Wireframe primitives: `Screen`, `Text`, `Link`, `Input`, `Container`, `Image`, `Icon`, `Modal`, `TopBar`, `Divider`
- `src/content/*.mdx` — multiple spec files with YAML frontmatter (`title`)
- Codegen: per-document screens/routes + `contentDocuments` registry
- Dev shell: document menu, MDX Preview, Prototype View (History API router)
- Build-time AST validation (`extract-screens`, `validate-gotos`, `validate-text`)
- Example app (`wireframe.mdx`) and component catalog (`components.mdx`)
- Vitest coverage for plugin/codegen logic

**Not yet implemented:** graph view, unreachable-screen validation, doc export, vision extras (`Card`, `List`, `Section`, `BottomNav`, `Tabs`).

## Architecture

```
src/
  content/              # User-authored MDX specs (*.mdx + frontmatter)
  generated/            # AUTO-GENERATED — do not edit (gitignored)
    documents/{slug}/   # screens.generated.tsx, routes.generated.tsx
    content-documents.generated.tsx
    routes.generated.tsx
  components/
    wireframe/          # Wireframe primitives
    ui/                 # shadcn/ui (shell + primitive internals)
  runtime/              # WireframeViewContext, error overlay
  shell/                # Shell, DocumentMenu, PreviewView, PrototypeView, router
  plugin/               # extract, validate, generate, Vite wireframe plugin
  mdx-components.ts     # Registers MDX-available wireframe components
  App.tsx               # <Shell contentDocuments={…} />
```

**Data flow:**

```
src/content/*.mdx
  → remark parse (extract-screens + validators)
  → generate per-document screens + routes
  → generate contentDocuments registry
  → MDX Preview: import active document component
  → Prototype View: render active document routes
```

**Key design decisions — preserve these:**

1. **Intent over appearance** — wireframes express structure and behavior, not brand design.
2. **MDX is the language** — React components in MDX; no separate DSL.
3. **Screens are first-class** — stable `id` per `<Screen>`; navigation via `goto` string matching that id.
4. **Separation of concerns** — wireframe primitives ≠ dev shell chrome. Shell may use Tailwind/shadcn; primitives stay wireframe-styled.
5. **Static analysis is core** — validation at codegen time; graph/reachability still to come.
6. **`Link` for navigation** — not a separate `Button` primitive (`primary-btn` / `secondary-btn` flags on `Link`).

## Build phases (progress)

Prefer **small, vertical slices**. Completed phases marked ✓.

1. ✓ **Foundation** — `<Screen>`, prototype router, multi-screen MDX
2. ✓ **Navigation** — `<Link goto>`, preview anchors + prototype History API
3. ✓ **Primitives** — `Text`, `Input`, `Container`, `Image`, `Icon`, `Modal`, `TopBar`, `Divider`
4. ✓ **Multi-document** — scan `src/content/`, frontmatter titles, document menu
5. **Analysis** — nav graph view; unreachable/broken link diagnostics
6. **Views** — documentation export, reverse-reference panel
7. **Polish** — CLI, export hooks, accessibility checks (see `VISION.md`)

## Non-goals

Do **not** build or optimize for:

- Pixel-perfect mockups or high-fidelity prototyping
- Visual design tooling or design-system replacement
- Rich styling, animations, or brand theming in wireframe output
- Replacing Figma

If a change makes wireframes look "designed," it likely violates the vision.

## Tech stack

| Layer | Choice |
|-------|--------|
| Build | Vite 8 |
| UI | React 19 |
| Language | TypeScript 6 (strict: `verbatimModuleSyntax`, `noUnusedLocals`) |
| Content | MDX 3 (`@mdx-js/rollup`, `@mdx-js/react`, `remark-frontmatter`) |
| Shell styling | Tailwind CSS 4 + shadcn/ui |
| Lint / format | Biome |
| Tests | Vitest |

## Commands

```bash
npm run dev      # Dev server (codegen on start + MDX save)
npm run build    # Codegen + typecheck + production build
npm run check    # Codegen + typecheck + Biome
npm run fix      # Biome safe fixes + format
npm run codegen  # Regenerate src/generated/ only
npm test         # Vitest (plugin tests)
npm run preview  # Preview production build
```

Always run `npm run build` and `npm run check` before claiming work is complete.

## Repository layout

```
docs/
  CONTEXT.md            # Current state — read first each session
  VISION.md             # Product north star
  MDX-COMPONENTS.md     # Wireframe component API for authors
  POC.md                # POC requirements (historical)
  FUTURE.md             # Backlog
src/
  content/              # *.mdx specs (frontmatter required for menu title)
  generated/            # Codegen output (gitignored)
  components/wireframe/ # Primitives
  components/ui/        # shadcn/ui
  shell/                # Dev shell
  plugin/               # Codegen pipeline
  mdx-components.ts
  App.tsx
.agents/skills/         # Superpowers workflow skills
```

## Conventions for agents

### MDX content files

- Place specs in `src/content/*.mdx`.
- Start each file with YAML frontmatter: `title` (shown in document menu).
- Use multiple `<Screen>` blocks per file.
- `wireframe.mdx` is the canonical example app; add other files for catalogs or additional apps.
- Do not edit `src/generated/` — run `npm run codegen` or save MDX in dev.

### MDX components

- Register every wireframe primitive in `src/mdx-components.ts` so MDX files use them without imports.
- Use PascalCase in MDX (`<Screen>`, `<Link>`).
- Use plain string `goto` matching `<Screen id>` or `<Modal id>` on the current screen.
- See [`docs/MDX-COMPONENTS.md`](docs/MDX-COMPONENTS.md) for props, flags, and self-closing tags.
- Keep primitives **presentational and behavior-focused**. Navigation logic lives in `WireframeViewContext`, not in individual components.

### TypeScript

- Use `type` for props objects; export types alongside components.
- Respect `verbatimModuleSyntax` — `import type` for type-only imports.
- No unused locals/parameters (enforced by tsconfig).

### Styling wireframe primitives

Primitives use shadcn/ui internally (inputs, dialogs, buttons) but output should read as **wireframe**, not polished product UI:

- Structural borders, spacing, semantic HTML
- `disabled` / `danger` affordances via shared helpers
- No brand colors, shadows, or typography systems beyond wireframe defaults

The **dev shell** (header, tabs, document menu) may use full shadcn styling.

### File naming

- Components: `PascalCase.tsx` (`Screen.tsx`, `Link.tsx`)
- Content: `kebab-case.mdx` (`wireframe.mdx`, `components.mdx`)
- Plugin/runtime: `camelCase.ts` or descriptive folder names

### Scope discipline

- Minimize diff size; do not refactor unrelated code.
- Do not add dependencies without clear need.
- Add tests for codegen, validation, or navigation behavior when touching the plugin.
- Do not create commits or PRs unless explicitly asked.
- Do not create new markdown docs unless the user asks.

### Documentation

| Document | Role |
|----------|------|
| `docs/CONTEXT.md` | **Complement** — current architecture, status, flows (update after milestones) |
| `docs/AGENTS.md` | This file — conventions, scope, checklist |
| `docs/MDX-COMPONENTS.md` | Agent-facing wireframe API; keep **minimal** (attached on every wireframe build) |
| `docs/VISION.md` | Product direction |

CONTEXT answers *what*; AGENTS answers *how*. Keep both in sync when behavior or agent expectations change.

## Component API (implemented)

Authoring details: [`docs/MDX-COMPONENTS.md`](docs/MDX-COMPONENTS.md).

| Component | Purpose |
|-----------|---------|
| `<Screen id title>` | Navigable screen root |
| `<Link goto>` | Navigation (text link or `primary-btn` / `secondary-btn`) |
| `<Text>` | Copy (`h1`–`h4` flags or body) |
| `<Input>` | Form fields (`type`, `label`, `hint`, `error`, …) |
| `<Container>` | Layout (`row`, `border`, `distribute`, `align`) |
| `<Image>` | Placeholder (`aspect`) |
| `<Icon>` | Lucide icon by `name` |
| `<Modal id>` | Overlay flow on current screen |
| `<TopBar>` | Screen header (`title`, `showBack`, actions) |
| `<Divider>` | Horizontal rule (optional `label`) |

Global flags on all except `Screen`: `disabled`, `danger`.

## Example MDX

```mdx
---
title: My App
---

<Screen id="home" title="Home">
  <Text h1>Welcome back</Text>
  <Link goto="login">Login</Link>
  <Link goto="signup" primary-btn>Create account</Link>
</Screen>

<Screen id="login" title="Login">
  <TopBar title="MyApp" showBack />
  <Input label="Email" placeholder="you@example.com" required />
  <Link goto="home" primary-btn>Sign in</Link>
</Screen>
```

## Open questions (mostly resolved)

| Question | Decision |
|----------|----------|
| One MDX file vs many | **Many** files in `src/content/`, registry via codegen |
| Screen discovery | **Compile-time** scan + AST extract per file |
| Analysis timing | **Build-time** plugin + CLI (`npm run codegen`) |
| Router | **Minimal History API** in shell — no React Router |
| Navigation primitive | **`Link`** with `goto` — not `Button` |

Remaining backlog items: graph timing/export, CLI packaging — see `FUTURE.md`.

## Skills and workflows

Superpowers skills under `.agents/skills/`:

- `brainstorming` — before creative/feature work
- `writing-plans` / `executing-plans` — multi-step implementation
- `subagent-driven-development` — parallel task execution
- `systematic-debugging` — bugs and test failures

User instructions in this file take precedence over skill defaults.

## Quick checklist for agents

Before opening a PR or reporting done:

- [ ] Read `docs/VISION.md` if touching product behavior
- [ ] Read `docs/CONTEXT.md` if changing architecture or codegen
- [ ] Wireframe components remain wireframe-styled (not polished UI)
- [ ] New MDX components registered in `mdx-components.ts`
- [ ] New content files include `title` frontmatter
- [ ] `npm run test` passes (if plugin/codegen touched)
- [ ] `npm run build` passes
- [ ] `npm run check` passes
- [ ] Scope matches a build phase — don't boil the ocean
