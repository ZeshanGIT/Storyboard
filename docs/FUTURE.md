# Future Ideas

**Status:** Backlog — not in POC scope  
**Parent:** [`VISION.md`](VISION.md) · [`POC.md`](POC.md)

Ideas to explore after the POC lands. Ordered roughly by proximity to the core framework; not a committed roadmap.

---

## 1. Routes-only registry — derive `ScreenId` from `routes`

### Problem

The POC generates a `registry` with two related exports: `Screens` (id map) and `routes` (shell route table). Even in one file, the same screen identity is expressed twice — once as map entries, once as route `id` fields. That invites drift and extra codegen logic.

### Proposal

Generate **only `routes`**. Treat the route table as the single source of truth. Use TypeScript to **derive** a `ScreenId` union type from `routes` for navigation props.

The shell contract stays unchanged:

```tsx
import { routes } from './generated/registry.generated'

function App() {
  return <Shell routes={routes} />
}
```

### Generated shape

```tsx
// AUTO-GENERATED — do not edit

import { Home, Login, Signup } from './screens.generated'

export const routes = [
  { id: 'home', path: '/home', component: Home },
  { id: 'login', path: '/login', component: Login },
  { id: 'signup', path: '/signup', component: Signup },
] as const

/** Derived — not authored separately */
export type ScreenId = (typeof routes)[number]['id']
// => 'home' | 'login' | 'signup'
```

No `Screens` object. IDs appear once, on each route entry.

### Authoring experience

Authors use **plain string literals** that match `<Screen id="…">` values:

```mdx
<Screen id="home" title="Home">
  <Text>Welcome back</Text>
  <Link goto="login">Login</Link>
  <Link goto="signup">Create account</Link>
</Screen>
```

Type safety comes from `goto: ScreenId` on `<Link>`, not from `Screens.Login`:

```tsx
type LinkProps = {
  goto: ScreenId
  children: ReactNode
}
```

| Expression | Result |
|------------|--------|
| `goto="login"` | Valid if `login` is a route id |
| `goto="signin"` | Type error — not in `ScreenId` union |
| `goto={Screens.Login}` | Not supported (no `Screens` map) |

**Trade-off:** No `Screens.Login` autocomplete prefix — authors type the id string directly. MDX/TS language service can still suggest members of the `ScreenId` union once codegen has run.

### Why this works

- `as const` on `routes` preserves literal `id` types.
- `(typeof routes)[number]['id']` is a standard indexed-access pattern — no runtime cost.
- Shell, prototype router, and anchor navigation all read from the same `routes` array.
- Adding a screen in MDX → new route entry → `ScreenId` union grows automatically.

### Optional derived helpers (runtime, zero duplication)

If object-style access is needed later, derive from `routes` — never hand-author a parallel map:

```ts
/** Runtime lookup: ScreenId → path (for prototype navigation) */
export const pathByScreenId = Object.fromEntries(
  routes.map((r) => [r.id, r.path]),
) as Record<ScreenId, string>

/** Runtime lookup: ScreenId → component name (for devtools / graph) */
export const screenTitlesById = … // from parse metadata if title isn't on routes
```

These are conveniences, not a second registry.

### Migration from POC

| POC | Future |
|-----|--------|
| `Screens.Login` in MDX | `"login"` string literal |
| `ScreenId` from `Screens` values | `ScreenId` from `routes[].id` |
| `registry` exports `Screens` + `routes` | `registry` exports `routes` + derived types only |

### Open questions

- **MDX typing:** Ensure `@mdx-js/typescript-plugin` (or generated `.d.ts` augmentation) surfaces `ScreenId` on `goto` in `.mdx` files.
- **String typos before first dev run:** Same as POC — no types until codegen runs once.
- **Graph View:** Can build edges by parsing MDX `goto` values and validating against `ScreenId` — no separate screen map required.

---

## 2. Graph View

Visualize screen relationships from parsed MDX + `routes`.

- Tree or graph layout (Mermaid, React Flow, or simple indented tree)
- Click node → jump to screen in Preview or Prototype
- Show `title` from `<Screen title="…">` on nodes

---

## 3. Navigation validation (beyond duplicate IDs)

Static analysis on MDX AST:

| Check | Severity |
|-------|----------|
| Broken `goto` (target not in `ScreenId`) | Error |
| Duplicate screen IDs | Error |
| Unreachable screens | Warning |
| Dead ends (no outgoing links) | Warning |
| Cyclic navigation | Info / optional warning |

Validate against derived `ScreenId` from `routes` — single source of truth.

---

## 4. Reverse references

Per screen, show which other screens link to it:

```
login
Referenced by: home, signup
```

Useful for impact analysis when changing or removing a screen.

---

## 5. Automatic Mermaid generation

Emit a Mermaid `flowchart` from navigation edges for embedding in docs or README.

---

## 6. Export targets

| Target | Purpose |
|--------|---------|
| Excalidraw | Hand-off to whiteboard |
| Figma | Designer starting point |
| React page skeletons | Dev implementation scaffold |
| Storybook | Stories per screen from generated components |

---

## 7. AI-assisted workflows

- Generate screen summaries from MDX content
- Suggest missing flows / dead ends
- Agent-friendly edit format (already MDX; add structured metadata?)

---

## 8. Accessibility checks

Lint wireframes for:

- Missing screen titles
- Links with no visible text
- Focus order hints in prototype mode

---

## 9. Permission-aware navigation

Model roles or flags on screens/links; validate that restricted flows are reachable only from allowed entry points.

---

## 10. User journey analysis

Define named journeys (sequences of screens) and verify they are satisfiable in the navigation graph.

---

## 11. Multiple MDX files

Scale beyond a single `wireframe.mdx`:

- Glob `src/content/**/*.mdx`
- Merge into one `routes` table (with namespace or flat ids)
- Cross-file `goto` validation

---

## 12. Production / CI mode

- Run codegen on `npm run build` (not only dev)
- Fail build on validation errors
- Optional: commit generated stubs for CI without running plugin

---

## 13. Virtual modules

Replace on-disk `src/generated/` with Vite virtual modules (`virtual:wireframe-registry`) for faster HMR and no gitignore dance — if IDE typing via generated `.d.ts` shim is solved.

---

## Relationship to POC

The POC intentionally ships **two exports in one registry file** (`Screens` + `routes`) to unblock dual-view navigation quickly. **§1 above** is the preferred long-term shape: one artifact (`routes`), types derived from it, string literals in MDX with `ScreenId` safety.

Implement POC first; refactor to routes-only when the plugin and MDX typing story are stable.
