# Core Wireframe Components (Option 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Option 1 wireframe primitive set so authors can describe typical auth/settings/list flows in MDX without inventing markup.

**Architecture:** Seven new presentational components live alongside existing `Screen`, `Text`, and `Link` in `src/components/wireframe/`. All use minimal structural styling (borders, semantic HTML, no brand theme). Navigation stays on `Link` only; `Button` expresses in-screen actions with no `goto`. No plugin/codegen changes — goto validation already targets `<Link>` only.

**Tech Stack:** React 19, TypeScript 6, MDX 3 component registry, Tailwind CSS 4 (structural classes only on primitives)

**Out of scope (follow-up plan):** shadcn init, dev shell polish, `Tabs`, `BottomNav`, `Modal`/`Dialog`, form controls beyond `Input`.

---

## Component inventory

| Component | Status | Role |
|-----------|--------|------|
| `Screen` | exists | Screen container + title |
| `Text` | exists | Body copy |
| `Link` | exists | Navigation (`goto`) |
| `Heading` | **new** | In-screen headings (`level` 1–3) |
| `Input` | **new** | Labelled form field (display only) |
| `Button` | **new** | Action with no navigation |
| `Section` | **new** | Group blocks inside a screen |
| `Card` | **new** | Bounded content area |
| `List` | **new** | `<ul>` wrapper |
| `ListItem` | **new** | `<li>` row |
| `Separator` | **new** | Horizontal rule between groups |

### Navigation contract (locked)

- **`Link`** — only component with `goto`. Preview → `#id` anchor; Prototype → `navigate('/{id}')`.
- **`Button`** — no `goto` prop. Renders `<button>` for spec intent; no navigation side effects.
- **`ListItem`** — no `goto`; put `<Link>` inside when a row navigates.

### Styling contract (locked)

Match existing wireframe look — structural, not designed:

- Container pattern: `border border-current` (+ padding where needed)
- No brand colors, shadows, rounded corners, hover states
- Prefer `flex flex-col gap-*` over `space-y-*` (fix `Screen` while touching layout)
- Optional shared helper in `src/components/wireframe/wireframeStyles.ts`:

```ts
export const wireframeBox = 'border border-current p-3'
export const wireframeStack = 'flex flex-col gap-2'
```

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/components/wireframe/wireframeStyles.ts` | Shared Tailwind class strings (optional DRY) |
| `src/components/wireframe/Heading.tsx` | `level` 1–3 heading |
| `src/components/wireframe/Input.tsx` | Label + disabled/read-only input |
| `src/components/wireframe/Button.tsx` | Non-nav button |
| `src/components/wireframe/Section.tsx` | Titled/untitled grouping |
| `src/components/wireframe/Card.tsx` | Bordered card block |
| `src/components/wireframe/List.tsx` | `List` + `ListItem` exports |
| `src/components/wireframe/Separator.tsx` | `<hr>` with wireframe border |
| `src/components/wireframe/Screen.tsx` | Minor gap fix (`space-y` → `gap`) |
| `src/components/wireframe/index.ts` | Barrel exports |
| `src/mdx-components.ts` | Register all primitives for MDX |
| `src/content/wireframe.mdx` | Demo all new components on login/signup screens |

**No changes:** `src/plugin/*`, `src/shell/*`, codegen templates (unless import path drift — unlikely).

---

### Task 1: Shared layout helpers + Screen gap fix

**Files:**
- Create: `src/components/wireframe/wireframeStyles.ts`
- Modify: `src/components/wireframe/Screen.tsx`

- [ ] **Step 1: Add shared class constants**

Sketch — export `wireframeBox`, `wireframeStack` as above.

- [ ] **Step 2: Update Screen to use `wireframeStack`**

Replace inner `space-y-2` with `flex flex-col gap-2` (import from `wireframeStyles` or inline — pick one, stay consistent).

- [ ] **Step 3: Verify**

Run: `npm run check`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/wireframe/wireframeStyles.ts src/components/wireframe/Screen.tsx
git commit -m "refactor: shared wireframe layout classes"
```

---

### Task 2: Heading

**Files:**
- Create: `src/components/wireframe/Heading.tsx`

**API:**

```tsx
type HeadingProps = {
  level?: 1 | 2 | 3   // default 2
  children: ReactNode
}
```

**Render sketch:** map `level` → `h1` | `h2` | `h3`. No extra styling beyond default browser weight/size or a single `font-medium` if needed for readability in Preview.

- [ ] **Step 1: Implement `Heading`**
- [ ] **Step 2: Export from `index.ts`**
- [ ] **Step 3: Run `npm run check` — PASS**
- [ ] **Step 4: Commit** — `feat: add Heading wireframe primitive`

---

### Task 3: Input

**Files:**
- Create: `src/components/wireframe/Input.tsx`

**API:**

```tsx
type InputProps = {
  label: string
  type?: 'text' | 'email' | 'password' | 'number'   // default 'text'
  placeholder?: string
}
```

**Render sketch:**

```tsx
<label className="flex flex-col gap-1">
  <span>{label}</span>
  <input type={type} placeholder={placeholder} readOnly disabled className="border border-current px-2 py-1" />
</label>
```

Wireframe fields are **display-only** — `readOnly` + `disabled` prevents accidental interaction in Prototype; still shows field intent.

- [ ] **Step 1: Implement `Input`**
- [ ] **Step 2: Export from `index.ts`**
- [ ] **Step 3: Run `npm run check` — PASS**
- [ ] **Step 4: Commit** — `feat: add Input wireframe primitive`

---

### Task 4: Button

**Files:**
- Create: `src/components/wireframe/Button.tsx`

**API:**

```tsx
type ButtonProps = {
  type?: 'button' | 'submit'   // default 'button'
  children: ReactNode
}
```

**Render sketch:** `<button type={type} className="border border-current px-2 py-1">{children}</button>` — no `onClick`, no `goto`.

- [ ] **Step 1: Implement `Button`**
- [ ] **Step 2: Export from `index.ts`**
- [ ] **Step 3: Run `npm run check` — PASS**
- [ ] **Step 4: Commit** — `feat: add Button wireframe primitive`

---

### Task 5: Section and Card

**Files:**
- Create: `src/components/wireframe/Section.tsx`
- Create: `src/components/wireframe/Card.tsx`

**API (both):**

```tsx
type SectionProps = { title?: string; children: ReactNode }
type CardProps = { title?: string; children: ReactNode }
```

**Render sketch:**

- `Section` → `<section className={wireframeBox}>` + optional `<h3>{title}</h3>` + `{children}`
- `Card` → `<div className={wireframeBox} role="group">` + optional title + `{children}`

Use `wireframeStack` for inner children layout.

- [ ] **Step 1: Implement `Section` and `Card`**
- [ ] **Step 2: Export both from `index.ts`**
- [ ] **Step 3: Run `npm run check` — PASS**
- [ ] **Step 4: Commit** — `feat: add Section and Card wireframe primitives`

---

### Task 6: List and ListItem

**Files:**
- Create: `src/components/wireframe/List.tsx`

**API:**

```tsx
type ListProps = { children: ReactNode }
type ListItemProps = { children: ReactNode }
```

**Render sketch:**

- `List` → `<ul className="list-disc pl-5 flex flex-col gap-1">`
- `ListItem` → `<li>`

Authors compose navigation rows as:

```mdx
<List>
  <ListItem><Link goto={Screens.Settings}>Settings</Link></ListItem>
</List>
```

- [ ] **Step 1: Implement `List` and `ListItem` in one file**
- [ ] **Step 2: Export both from `index.ts`**
- [ ] **Step 3: Run `npm run check` — PASS**
- [ ] **Step 4: Commit** — `feat: add List and ListItem wireframe primitives`

---

### Task 7: Separator

**Files:**
- Create: `src/components/wireframe/Separator.tsx`

**API:**

```tsx
type SeparatorProps = Record<string, never>   // no props v1
```

**Render sketch:** `<hr className="border-current my-2" />`

- [ ] **Step 1: Implement `Separator`**
- [ ] **Step 2: Export from `index.ts`**
- [ ] **Step 3: Run `npm run check` — PASS**
- [ ] **Step 4: Commit** — `feat: add Separator wireframe primitive`

---

### Task 8: MDX registry

**Files:**
- Modify: `src/components/wireframe/index.ts`
- Modify: `src/mdx-components.ts`

- [ ] **Step 1: Barrel-export all primitives** (existing + new)

- [ ] **Step 2: Register every export in `mdx-components.ts`**

Sketch:

```ts
const components = {
  Screen, Text, Link,
  Heading, Input, Button,
  Section, Card, List, ListItem, Separator,
}
```

Ensure `MDXProvidedComponents` global type updates via `typeof components`.

- [ ] **Step 3: Run `npm run check` — PASS**
- [ ] **Step 4: Commit** — `feat: register core wireframe components in MDX`

---

### Task 9: Expand demo MDX

**Files:**
- Modify: `src/content/wireframe.mdx`

- [ ] **Step 1: Enrich `login` and `signup` screens** to exercise new primitives

Target coverage in demo:

| Screen | Components to show |
|--------|-------------------|
| `home` | unchanged (Links only) — keeps POC minimal |
| `login` | `Heading`, `Input` (email + password), `Button` (Submit), `Link` (Back) |
| `signup` | `Section` wrapping inputs, `Card` for terms blurb, `Separator`, `List`/`ListItem` for bullet requirements, `Button` + `Link` |

Sketch (login):

```mdx
<Screen id="login" title="Login">
  <Heading level={1}>Sign in</Heading>
  <Input label="Email" type="email" placeholder="you@example.com" />
  <Input label="Password" type="password" />
  <Button type="submit">Sign in</Button>
  <Link goto={Screens.Home}>Back</Link>
</Screen>
```

- [ ] **Step 2: Save MDX → confirm codegen + HMR** (dev server or `npm run codegen`)

Run: `npm run codegen && npm run build`  
Expected: PASS; three screens still codegen; no duplicate IDs

- [ ] **Step 3: Commit** — `docs: expand wireframe demo with core components`

---

### Task 10: End-to-end verification

**Files:** None

- [ ] **Step 1: Automated checks**

Run: `npm run check && npm run test && npm run build`  
Expected: all exit 0

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`

| Check | Expected |
|-------|----------|
| MDX Preview | All screens visible; login/signup show new components with borders |
| Prototype View | Navigate home → login → signup; Links work; Buttons/Inputs non-interactive |
| Invalid `goto` | Still surfaces on `Link` only (unchanged behavior) |

- [ ] **Step 3: Confirm definition of done**

- [ ] All 7 new components implemented and exported
- [ ] Registered in `mdx-components.ts` — usable in MDX without imports
- [ ] Demo MDX exercises each new component at least once
- [ ] No plugin/codegen changes required
- [ ] Styling remains structural (no brand theme on primitives)
- [ ] `npm run check` and `npm run build` pass

---

## Self-review

| Requirement | Task |
|-------------|------|
| `Heading` (level 1–3) | Task 2 |
| `Input` (label, type, placeholder) | Task 3 |
| `Button` (no goto) | Task 4 |
| `Section` | Task 5 |
| `Card` | Task 5 |
| `List` + `ListItem` | Task 6 |
| `Separator` | Task 7 |
| MDX registration | Task 8 |
| Demo content | Task 9 |
| Link-only navigation | Tasks 4, 6 (documented); no plugin change |
| Minimal styling / vision alignment | All tasks |
| shadcn / shell polish | Explicitly deferred |

No placeholders. Plugin unchanged — goto validation remains `Link`-only per `validate-gotos.ts`.

---

## Follow-up (not this plan)

1. **shadcn + shell polish** — init shadcn, restyle `Shell` header/view toggle/error banner only
2. **Option 2** — `Tabs`, `BottomNav`
3. **Option 3** — `Modal`, `Dialog`
4. **Static analysis** — extend AST walk if `Button goto` is ever added (not planned)
