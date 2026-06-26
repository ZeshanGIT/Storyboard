# shadcn Full-App Polish — Design Spec

**Date:** 2026-06-26  
**Status:** Approved  
**Branch:** `feat/core-wireframe-components` (worktree `.worktrees/core-wireframe-components`)

## Summary

Initialize shadcn/ui with the **Lyra** preset on the WireframeX Vite app. Restyle the dev shell and reimplement all wireframe MDX primitives as thin wrappers around shadcn components. MDX author API, codegen, and Link-only navigation stay unchanged.

## Goals

- Full-app polished look using shadcn Lyra out of the box
- Wireframe MDX components (`Screen`, `Button`, `Input`, etc.) render shadcn internally
- Dev shell (header, view toggle, error overlay) uses shadcn directly
- Preserve spec semantics: screen IDs, `Link goto`, display-only inputs, non-navigating buttons

## Non-Goals

- Changing MDX component names or props
- Adding `goto` to `Button`
- Plugin/codegen logic changes (except import paths if alias changes)
- `Tabs`, `BottomNav`, `Modal` wireframe primitives (future)
- Replacing MDX with raw shadcn exports

## Approach

**Thin wrapper pattern (Option 1):** Keep `src/components/wireframe/*` as the MDX-facing API. Each file imports and composes shadcn primitives from `src/components/ui/*`. Authors never import shadcn in MDX.

## shadcn Setup

| Setting | Value |
|---------|-------|
| Preset | `lyra` |
| Template | `vite` |
| Tailwind | v4 (`src/index.css`) |
| Icons | `lucide-react` (already installed) |
| Path alias | `@/` → `src/` |

### Components to install

`button`, `input`, `label`, `card`, `separator`, `tabs`, `alert`, `badge`

Add `field` + related if available in Lyra registry after init.

## Wireframe Wrapper Mapping

| Wireframe | shadcn implementation | Notes |
|-----------|----------------------|-------|
| `Screen` | `Card` + `CardHeader`/`CardTitle` + `CardContent` | Keep `id`, `ScreenProvider`, `aria-label` |
| `Heading` | Semantic `h1`–`h3` with theme typography | `level` prop 1–3, default 2 |
| `Text` | `<p className="text-muted-foreground">` | Body copy |
| `Input` | `Label` + `Input` | `readOnly` + `disabled` — display-only prototype |
| `Button` | `Button` | No `goto`, no `onClick` nav |
| `Section` | `Card` with optional `CardTitle` | Grouping inside screen |
| `Card` | Full Card composition | `CardHeader`/`CardTitle`/`CardContent` |
| `List` / `ListItem` | Themed `ul` / `li` | No shadcn list primitive; use semantic tokens |
| `Separator` | shadcn `Separator` | Replace custom `<hr>` |
| `Link` | Preview: `<a>`; Prototype: `Button variant="link"` | Navigation logic unchanged |

### Remove

- `src/components/wireframe/wireframeStyles.ts` — replaced by shadcn semantic tokens

## Dev Shell Mapping

| Area | Current | Target |
|------|---------|--------|
| `Shell` layout | Raw Tailwind `slate-*` | `bg-background`, `text-foreground`, semantic borders |
| View toggle | Custom bordered buttons | shadcn `Tabs` (`TabsList` + `TabsTrigger`) |
| `WireframeErrorOverlay` | Custom red floating panel | shadcn `Alert` destructive + ghost `Button` for copy |

## Unchanged Contracts

- `Link` — only component with `goto`
- `Button` — no navigation
- `ListItem` — no `goto`; nest `Link` for nav rows
- Codegen dynamic wireframe imports (`generate.ts`)
- `mdx-components.ts` registry (same export names)
- Demo MDX structure in `wireframe.mdx` (may tweak spacing only)

## Vision Alignment Note

This shifts prototype **appearance** from bare structural wireframes to polished Lyra UI. Spec **semantics** (screens, navigation, validation) are unchanged. Prototypes look designed; the MDX source still describes structure and flow.

## Verification

```bash
npm run check && npm run test && npm run build
npm run dev  # manual smoke
```

| Check | Expected |
|-------|----------|
| MDX Preview | All screens visible; Lyra styling on primitives |
| Prototype View | home → login → signup via Links; Inputs disabled; Buttons no nav |
| Invalid goto | Still surfaces on Link only |
| Codegen | 3 screens, dynamic imports include used components |

## File Touch List

| File | Action |
|------|--------|
| `components.json` | Create (shadcn init) |
| `src/index.css` | Modify (Lyra theme vars) |
| `src/lib/utils.ts` | Create (`cn` helper) |
| `src/components/ui/*` | Create (shadcn CLI) |
| `tsconfig*.json`, `vite.config.ts` | Modify (`@/` alias if needed) |
| `src/components/wireframe/*.tsx` | Modify (shadcn wrappers) |
| `src/components/wireframe/wireframeStyles.ts` | Delete |
| `src/shell/Shell.tsx` | Modify |
| `src/runtime/WireframeErrorOverlay.tsx` | Modify |
