# Phase 1: Wireframe Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the three POC wireframe components (`Screen`, `Text`, `Link`) with view-dependent link behavior and register them for MDX.

**Architecture:** Components live in `src/components/wireframe/` with minimal structural styling. Navigation mode is driven by `WireframeViewContext` (`'preview' | 'prototype'`). The shell (Phase 4) will provide the provider; Phase 1 ships a default `'preview'` context so components render and typecheck standalone.

**Tech Stack:** React 19, TypeScript 6 (strict), MDX 3 component registry

**Prerequisite:** None — first phase.

**Definition of Done:** See [overview § Phase 1](./2026-06-26-poc-overview.md#phase-1-wireframe-primitives).

---

## File structure (this phase)

| File | Responsibility |
|------|----------------|
| `src/runtime/WireframeViewContext.tsx` | Context: `view`, `navigate` |
| `src/components/wireframe/Screen.tsx` | Screen container with anchor `id` |
| `src/components/wireframe/Text.tsx` | Static copy |
| `src/components/wireframe/Link.tsx` | View-dependent navigation |
| `src/components/wireframe/index.ts` | Barrel export |
| `src/mdx-components.ts` | Register wireframe components for MDX |

---

### Task 1: WireframeViewContext

**Files:**
- Create: `src/runtime/WireframeViewContext.tsx`

- [ ] **Step 1: Create context module**

```tsx
import { createContext, useContext, type ReactNode } from 'react'

export type WireframeView = 'preview' | 'prototype'

export type WireframeViewContextValue = {
  view: WireframeView
  navigate: (path: string) => void
}

const defaultValue: WireframeViewContextValue = {
  view: 'preview',
  navigate: () => {},
}

const WireframeViewContext = createContext<WireframeViewContextValue>(defaultValue)

export type WireframeViewProviderProps = {
  view: WireframeView
  navigate: (path: string) => void
  children: ReactNode
}

export function WireframeViewProvider({
  view,
  navigate,
  children,
}: WireframeViewProviderProps) {
  return (
    <WireframeViewContext.Provider value={{ view, navigate }}>
      {children}
    </WireframeViewContext.Provider>
  )
}

export function useWireframeView(): WireframeViewContextValue {
  return useContext(WireframeViewContext)
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS (new file compiles)

- [ ] **Step 3: Commit**

```bash
git add src/runtime/WireframeViewContext.tsx
git commit -m "feat: add WireframeViewContext for dual-view navigation"
```

---

### Task 2: Screen component

**Files:**
- Create: `src/components/wireframe/Screen.tsx`

- [ ] **Step 1: Implement Screen**

```tsx
import type { ReactNode } from 'react'

export type ScreenProps = {
  id: string
  title: string
  children: ReactNode
}

export function Screen({ id, title, children }: ScreenProps) {
  return (
    <section id={id} aria-label={title} className="border border-current p-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}
```

Anchor format: `id={screenId}` on root element (POC default per `docs/POC.md`).

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/wireframe/Screen.tsx
git commit -m "feat: add Screen wireframe primitive"
```

---

### Task 3: Text component

**Files:**
- Create: `src/components/wireframe/Text.tsx`

- [ ] **Step 1: Implement Text**

```tsx
import type { ReactNode } from 'react'

export type TextProps = {
  children: ReactNode
}

export function Text({ children }: TextProps) {
  return <p>{children}</p>
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/wireframe/Text.tsx
git commit -m "feat: add Text wireframe primitive"
```

---

### Task 4: Link component

**Files:**
- Create: `src/components/wireframe/Link.tsx`

- [ ] **Step 1: Implement Link**

```tsx
import type { ReactNode } from 'react'
import { useWireframeView } from '../../runtime/WireframeViewContext'

export type LinkProps = {
  goto: string
  children: ReactNode
}

export function Link({ goto, children }: LinkProps) {
  const { view, navigate } = useWireframeView()

  if (view === 'preview') {
    return (
      <a href={`#${goto}`} className="underline">
        {children}
      </a>
    )
  }

  return (
    <button
      type="button"
      className="underline"
      onClick={() => navigate(`/${goto}`)}
    >
      {children}
    </button>
  )
}
```

Prototype mode uses `navigate('/{id}')` — path convention from POC.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/wireframe/Link.tsx
git commit -m "feat: add Link wireframe primitive with dual-view behavior"
```

---

### Task 5: Barrel export and MDX registry

**Files:**
- Create: `src/components/wireframe/index.ts`
- Modify: `src/mdx-components.ts`

- [ ] **Step 1: Create barrel**

```ts
export { Screen, type ScreenProps } from './Screen'
export { Text, type TextProps } from './Text'
export { Link, type LinkProps } from './Link'
```

- [ ] **Step 2: Register in mdx-components.ts**

Replace contents of `src/mdx-components.ts`:

```ts
import { Screen, Text, Link } from './components/wireframe'

const components = {
  Screen,
  Text,
  Link,
}

declare global {
  type MDXProvidedComponents = typeof components
}

export function useMDXComponents(): MDXProvidedComponents {
  return components
}
```

- [ ] **Step 3: Verify build and lint**

Run: `npm run build && npm run lint`
Expected: PASS (MdxButton no longer referenced — remove in Phase 5 or now if build fails)

If `welcome.mdx` still imports `MdxButton`, either keep `MdxButton` registered temporarily or skip until Phase 5. Minimal fix for this phase: leave `MdxButton` in registry alongside wireframe components until Phase 5 removes `welcome.mdx`.

```ts
import { MdxButton } from './components/MdxButton'
import { Screen, Text, Link } from './components/wireframe'

const components = {
  MdxButton,
  Screen,
  Text,
  Link,
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/wireframe/index.ts src/mdx-components.ts
git commit -m "feat: register wireframe components in MDX provider"
```

---

### Task 6: Phase 1 verification

**Files:** None (verification only)

- [ ] **Step 1: Run full verification**

Run: `npm run build && npm run lint`
Expected: Both exit 0

- [ ] **Step 2: Manual smoke test (optional)**

Temporarily render components in `App.tsx`:

```tsx
import { Screen, Text, Link } from './components/wireframe'
import { WireframeViewProvider } from './runtime/WireframeViewContext'

function App() {
  return (
    <WireframeViewProvider view="preview" navigate={() => {}}>
      <Screen id="home" title="Home">
        <Text>Welcome</Text>
        <Link goto="login">Login</Link>
      </Screen>
    </WireframeViewProvider>
  )
}
```

Revert before commit if only smoke-testing; Phase 4 replaces `App.tsx`.

- [ ] **Step 3: Confirm Phase 1 DoD**

Check every item in [overview § Phase 1 DoD](./2026-06-26-poc-overview.md#phase-1-wireframe-primitives).

---

## Self-review

| POC requirement | Task |
|-----------------|------|
| `<Screen id title>` | Task 2 |
| `<Text>` | Task 3 |
| `<Link goto>` view-dependent | Task 4 |
| Register in mdx-components | Task 5 |
| Minimal styling | All components — border/underline only |

No placeholders. Proceed to [Phase 2](./2026-06-26-poc-phase-2-codegen-core.md).
