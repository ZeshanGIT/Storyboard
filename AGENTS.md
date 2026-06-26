# AGENTS.md — WireframeX

Guidance for AI agents and automated tooling working in this repository.

## Project summary

**WireframeX** (working name; vision doc: "MDX Wireframes") is a **text-first UX specification format**. Developers describe application screens and navigation flows in **MDX using React components** — not as visual mockups.

The goal is **not** to design interfaces. The goal is to specify:

- What is visible on each screen
- What actions are available
- Where actions navigate
- How screens connect

Think: **Storybook for UX flows** — the spec that exists *before* Figma.

Full product vision: [`docs/VISION.md`](docs/VISION.md)

## Preliminary analysis

### Problem being solved

Early-stage teams know product behavior but lack time or expertise for polished UX. Today they use ASCII diagrams, Markdown lists, or screenshots. Designers and AI agents must reconstruct intent from scattered artifacts. There is no "Mermaid for UI wireframes."

### Target outputs (from one MDX source)

| Output | Description | Status |
|--------|-------------|--------|
| Documentation | Readable product spec | Not started |
| Clickable prototype | Minimal, unstyled, navigable UI | Not started |
| Navigation graph | Auto-generated screen relationships | Not started |
| Static validation | Broken links, duplicate IDs, unreachable screens | Not started |
| Reverse references | "Referenced by" per screen | Not started |

### Current state

The repo is an **early scaffold**, not the finished framework:

- Vite + React 19 + TypeScript + Tailwind CSS 4 + MDX 3
- Single demo page: `src/content/welcome.mdx`
- One sample component: `MdxButton` (styled — placeholder, not aligned with vision)
- No `<Screen>`, routing, `goto`, screen registry, graph, or validation
- `README.md` is still the default Vite template

### Proposed architecture (not yet implemented)

```
src/
  components/       # Wireframe primitives (<Screen>, <Button>, <Text>, …)
  runtime/          # Prototype shell, navigation, screen rendering
  analysis/         # MDX/static analysis: graph, validation, reverse refs
  content/          # Example wireframe MDX files (user-authored specs)
  mdx-components.ts # MDX component registry (maps tags → React components)
```

**Data flow (target):**

```
MDX wireframe files
  → parse / compile (MDX + React)
  → runtime renders active screen + handles navigation
  → analysis pass extracts Screen IDs, goto edges, validates graph
  → outputs: prototype UI | docs | nav graph | diagnostics
```

**Key design decisions agents should preserve:**

1. **Intent over appearance** — wireframe components use minimal or no styling. Express structure and behavior only.
2. **MDX is the language** — extend via React components; do not invent a separate DSL.
3. **Screens are first-class** — each screen has a stable `id`; navigation uses typed references (e.g. `Screens.Login`), not raw strings.
4. **Separation of concerns** — wireframe components ≠ app chrome. Tailwind may style the prototype *shell* (layout, dev tools), not the wireframe primitives.
5. **Static analysis is a core feature** — navigation graph and validation are not optional extras.

### Suggested build phases

Agents should prefer **small, vertical slices** over building all components at once.

1. **Foundation** — `<Screen>`, screen registry (`Screens`), prototype router, one multi-screen example MDX
2. **Navigation** — `<Button goto={…}>`, clickable prototype with screen transitions
3. **Primitives** — `<Text>`, `<Input>`, `<Card>`, `<List>`, `<Section>` (minimal styling)
4. **Analysis** — extract edges from MDX/AST; render nav graph; validate broken/duplicate/unreachable links
5. **Views** — documentation mode, graph view, reverse-reference panel
6. **Polish** — CLI, export hooks, accessibility checks (see VISION.md future ideas)

## Non-goals

Do **not** build or optimize for:

- Pixel-perfect mockups or high-fidelity prototyping
- Visual design tooling or design-system replacement
- Rich styling, animations, or brand theming in wireframe components
- Replacing Figma

If a change makes wireframes look "designed," it likely violates the vision.

## Tech stack

| Layer | Choice |
|-------|--------|
| Build | Vite 8 |
| UI | React 19 |
| Language | TypeScript 6 (strict: `verbatimModuleSyntax`, `noUnusedLocals`) |
| Content | MDX 3 (`@mdx-js/rollup`, `@mdx-js/react`) |
| Styling | Tailwind CSS 4 (app shell only; not wireframe primitives) |
| Lint | Oxlint |

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Typecheck + production build
npm run lint     # Oxlint
npm run preview  # Preview production build
```

Always run `npm run build` and `npm run lint` before claiming work is complete.

## Repository layout

```
docs/VISION.md          # Product north star — read before feature work
src/
  App.tsx               # App entry (will grow into prototype shell)
  main.tsx              # React bootstrap
  mdx-components.ts     # Register MDX-available components
  components/           # React components (wireframe primitives live here)
  content/              # User-authored wireframe MDX
  index.css             # Tailwind import
.vscode/settings.json   # MDX language service enabled
.agents/skills/         # Superpowers workflow skills (plans, brainstorming, etc.)
```

## Conventions for agents

### MDX components

- Register every wireframe primitive in `src/mdx-components.ts` so MDX files can use them without imports.
- Use PascalCase component names in MDX (`<Screen>`, `<Button>`).
- Prefer explicit props over magic strings: `goto={Screens.Login}` not `goto="login"`.
- Keep components **presentational and behavior-focused**. Navigation logic belongs in runtime/context, not in individual primitives.

### TypeScript

- Use `type` for props objects; export types alongside components.
- Respect `verbatimModuleSyntax` — use `import type` for type-only imports.
- No unused locals/parameters (enforced by tsconfig).

### Styling wireframe primitives

Default wireframe appearance should be **structural**:

- Borders, spacing, semantic HTML
- No brand colors, shadows, or typography systems
- Use elements that communicate role: `<button>`, `<input>`, `<nav>`, headings

The existing `MdxButton` (indigo, rounded, hover) is a **demo artifact** — replace or restyle when building real wireframe components.

### File naming

- Components: `PascalCase.tsx` (`Screen.tsx`, `Button.tsx`)
- Content: `kebab-case.mdx` or grouped by feature (`auth/login.mdx`)
- Runtime/analysis modules: `camelCase.ts` or descriptive folder names

### Scope discipline

- Minimize diff size; do not refactor unrelated code.
- Do not add dependencies without clear need — prefer MDX + React built-ins first.
- Do not add tests unless requested or they cover real navigation/analysis behavior.
- Do not create commits or PRs unless explicitly asked.

### Documentation

- `docs/VISION.md` is authoritative for product direction.
- Do not create new markdown docs unless the user asks.
- When implementing features, align naming and examples with VISION.md (`<Screen id={Screens.Welcome} title="Home">`, etc.).

## Component API (target)

From the vision doc. Implement incrementally; keep APIs stable once introduced.

| Component | Purpose |
|-----------|---------|
| `<Screen id title>` | Declares a navigable screen |
| `<Button goto>` | Action that navigates to another screen |
| `<Text>` | Static copy |
| `<Input>` | Form field (label, type; no styling) |
| `<Card>`, `<List>`, `<Section>` | Layout grouping |
| `<Modal>`, `<Dialog>` | Overlay flows (behavior only) |
| `<BottomNav>`, `<Tabs>` | Multi-section navigation within or across screens |

`Screens` — a registry object/enum of all screen IDs, used for type-safe `goto` and static analysis.

## Example target MDX

```mdx
<Screen id="welcome" title="Home">
  <Text>Welcome back</Text>
  <Button goto={Screens.Login}>Login</Button>
  <Button goto={Screens.Signup}>Create Account</Button>
</Screen>
```

## Open questions (resolve during implementation)

These are intentionally undecided. Pick one approach per feature and document it in code comments or a short ADR only if the user asks:

- **One MDX file vs many** — single app spec vs one file per screen
- **Screen discovery** — compile-time glob vs explicit manifest
- **Analysis timing** — build-time plugin vs runtime AST walk
- **Router** — lightweight context router vs React Router (prefer minimal for prototype)

When blocked, propose the simplest option that satisfies the vision and move forward.

## Skills and workflows

This repo includes Superpowers skills under `.agents/skills/`:

- `brainstorming` — before creative/feature work
- `writing-plans` / `executing-plans` — multi-step implementation
- `subagent-driven-development` — parallel task execution
- `systematic-debugging` — bugs and test failures

User instructions in this file take precedence over skill defaults.

## Quick checklist for agents

Before opening a PR or reporting done:

- [ ] Read `docs/VISION.md` if touching product behavior
- [ ] Wireframe components remain minimal/unstyled
- [ ] New MDX components registered in `mdx-components.ts`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Changes match a phase above (don't boil the ocean)
