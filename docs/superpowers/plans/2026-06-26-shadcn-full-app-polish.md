# shadcn Full-App Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize shadcn Lyra on WireframeX and reimplement shell + wireframe primitives as polished shadcn-backed UI while preserving MDX API and Link-only navigation.

**Architecture:** shadcn CLI adds `src/components/ui/*` and theme CSS. Existing `src/components/wireframe/*` become thin wrappers composing shadcn. Shell uses shadcn Tabs and Alert directly. No MDX/codegen contract changes.

**Tech Stack:** shadcn/ui (Lyra preset), Vite 8, React 19, Tailwind CSS 4, lucide-react

## Global Constraints

- Preset: `lyra`; template: `vite`
- Work in worktree: `.worktrees/core-wireframe-components` on branch `feat/core-wireframe-components`
- `Link` only component with `goto`; `Button` has no navigation
- Wireframe `Input` stays `readOnly` + `disabled` (display-only prototype)
- Use `flex` + `gap-*`, never `space-y-*` or `space-x-*` (shadcn + project rules)
- Run `npm run check && npm run test && npm run build` before claiming done
- Commit after each task; do not commit secrets

**Spec:** [`docs/superpowers/specs/2026-06-26-shadcn-full-app-polish-design.md`](../specs/2026-06-26-shadcn-full-app-polish-design.md)

---

## File structure

| File | Responsibility |
|------|----------------|
| `components.json` | shadcn config (CLI) |
| `src/lib/utils.ts` | `cn()` helper |
| `src/components/ui/*` | shadcn primitives |
| `src/index.css` | Lyra CSS variables + Tailwind import |
| `src/components/wireframe/*.tsx` | MDX-facing wrappers over shadcn |
| `src/shell/Shell.tsx` | Dev shell with Tabs |
| `src/runtime/WireframeErrorOverlay.tsx` | Alert-based error panel |
| `vite.config.ts` / `tsconfig.app.json` | `@/` path alias (if init adds) |

---

### Task 1: Initialize shadcn Lyra

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/` (via CLI)
- Modify: `src/index.css`, `vite.config.ts`, `tsconfig.app.json`, `package.json`

- [ ] **Step 1: Run shadcn init**

From worktree root:

```bash
cd .worktrees/core-wireframe-components
npx shadcn@latest init --preset lyra --template vite --defaults
```

If CLI prompts for alias, use `@` → `src`.

- [ ] **Step 2: Verify init output**

Run: `npx shadcn@latest info --json`  
Expected: `config` non-null, `preset` includes lyra, `tailwindVersion` v4

- [ ] **Step 3: Verify `@/` alias**

`tsconfig.app.json` should include:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

`vite.config.ts` should include:

```ts
import path from 'node:path'
// in defineConfig:
resolve: { alias: { '@': path.resolve(__dirname, './src') } },
```

Add manually if CLI missed them.

- [ ] **Step 4: Run check**

Run: `npm run check`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components.json src/lib src/index.css vite.config.ts tsconfig.app.json package.json package-lock.json
git commit -m "feat: initialize shadcn with Lyra preset"
```

---

### Task 2: Install shadcn components

**Files:**
- Create: `src/components/ui/button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `separator.tsx`, `tabs.tsx`, `alert.tsx`, `badge.tsx`

- [ ] **Step 1: Add components via CLI**

```bash
npx shadcn@latest add button input label card separator tabs alert badge
```

If `field` is available: `npx shadcn@latest add field field-label field-group` (optional — use if init registry lists them).

- [ ] **Step 2: Review added files**

Read each file under `src/components/ui/`. Fix any hardcoded `@/components/ui` paths that don't match project alias. Verify lucide icon imports match project.

- [ ] **Step 3: Run check**

Run: `npm run check`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui package.json package-lock.json
git commit -m "feat: add shadcn ui components for wireframe and shell"
```

---

### Task 3: Restyle dev shell

**Files:**
- Modify: `src/shell/Shell.tsx`

**Interfaces:**
- Consumes: `@/components/ui/tabs` — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

- [ ] **Step 1: Replace Shell layout and toggle**

Replace raw `slate-*` styling and manual buttons with semantic tokens + Tabs:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Inside return — replace header toggle + conditional main:
<div className="min-h-screen bg-background text-foreground">
  <header className="border-b px-6 py-4">
    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
      <h1 className="text-lg font-semibold tracking-tight">WireframeX</h1>
      <Tabs
        value={view}
        onValueChange={(v) => setView(v as ActiveView)}
      >
        <TabsList>
          <TabsTrigger value="preview">MDX Preview</TabsTrigger>
          <TabsTrigger value="prototype">Prototype View</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  </header>
  <main className="mx-auto max-w-3xl px-6 py-8">
    {view === 'preview' ? (
      <PreviewView validScreenIds={validScreenIds} />
    ) : (
      <PrototypeView routes={routes} />
    )}
  </main>
</div>
```

Keep `WireframeErrorProvider` wrapper unchanged.

- [ ] **Step 2: Run check + dev smoke**

Run: `npm run check`  
Run: `npm run dev` — verify Tabs switch Preview/Prototype

- [ ] **Step 3: Commit**

```bash
git add src/shell/Shell.tsx
git commit -m "feat: restyle shell with shadcn Tabs and theme tokens"
```

---

### Task 4: Restyle error overlay

**Files:**
- Modify: `src/runtime/WireframeErrorOverlay.tsx`

**Interfaces:**
- Consumes: `@/components/ui/alert`, `@/components/ui/button`

- [ ] **Step 1: Replace custom red panel with Alert**

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'
```

Replace outer `div` with:

```tsx
<div className="fixed bottom-4 right-4 z-50 max-w-md max-h-[40vh] overflow-y-auto">
  <Alert variant="destructive">
    <AlertTitle className="flex items-center justify-between gap-3">
      Wireframe error
      <CopyButton ... />
    </AlertTitle>
    <AlertDescription asChild>
      <ul className="mt-2 flex flex-col gap-2">
        {errors.map(...)}
      </ul>
    </AlertDescription>
  </Alert>
</div>
```

Replace `CopyButton` inner button with `<Button variant="ghost" size="icon">`. Icons: no size classes on icon (shadcn rule).

Replace `space-y-2` with `flex flex-col gap-2`.

- [ ] **Step 2: Run check**

Run: `npm run check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/runtime/WireframeErrorOverlay.tsx
git commit -m "feat: restyle error overlay with shadcn Alert"
```

---

### Task 5: Rewire Screen + remove wireframeStyles

**Files:**
- Modify: `src/components/wireframe/Screen.tsx`
- Delete: `src/components/wireframe/wireframeStyles.ts`

**Interfaces:**
- Consumes: `@/components/ui/card` — `Card`, `CardHeader`, `CardTitle`, `CardContent`

- [ ] **Step 1: Rewrite Screen**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Screen({ id, title, children }: ScreenProps) {
  return (
    <ScreenProvider screenId={id}>
      <section id={id} aria-label={title} className="scroll-mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </section>
    </ScreenProvider>
  )
}
```

- [ ] **Step 2: Delete wireframeStyles.ts**

Remove file. Grep for imports — update Section/Card in Task 6.

- [ ] **Step 3: Run check**

Run: `npm run check`  
Expected: FAIL until Section/Card updated — if so, do Task 6 first or fix imports inline in same commit batch.

- [ ] **Step 4: Commit**

```bash
git add src/components/wireframe/Screen.tsx
git rm src/components/wireframe/wireframeStyles.ts
git commit -m "feat: Screen uses shadcn Card; drop wireframeStyles"
```

---

### Task 6: Rewire Heading, Text, Separator

**Files:**
- Modify: `src/components/wireframe/Heading.tsx`, `Text.tsx`, `Separator.tsx`

- [ ] **Step 1: Heading**

```tsx
const headingClasses = {
  1: 'text-2xl font-semibold tracking-tight',
  2: 'text-xl font-semibold tracking-tight',
  3: 'text-lg font-medium',
} as const

export function Heading({ level = 2, children }: HeadingProps) {
  const Tag = headingTags[level]
  return <Tag className={headingClasses[level]}>{children}</Tag>
}
```

- [ ] **Step 2: Text**

```tsx
export function Text({ children }: TextProps) {
  return <p className="text-muted-foreground">{children}</p>
}
```

- [ ] **Step 3: Separator**

```tsx
import { Separator as ShadcnSeparator } from '@/components/ui/separator'

export function Separator(_props: SeparatorProps) {
  return <ShadcnSeparator className="my-2" />
}
```

- [ ] **Step 4: Run check + commit**

Run: `npm run check`  
Commit: `feat: wireframe Heading, Text, Separator use shadcn tokens`

---

### Task 7: Rewire Input and Button

**Files:**
- Modify: `src/components/wireframe/Input.tsx`, `Button.tsx`

- [ ] **Step 1: Input**

```tsx
import { Input as ShadcnInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Input({ label, type = 'text', placeholder }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ShadcnInput type={type} placeholder={placeholder} readOnly disabled />
    </div>
  )
}
```

- [ ] **Step 2: Button**

```tsx
import { Button as ShadcnButton } from '@/components/ui/button'

export function Button({ type = 'button', children }: ButtonProps) {
  return <ShadcnButton type={type}>{children}</ShadcnButton>
}
```

- [ ] **Step 3: Run check + commit**

Run: `npm run check`  
Commit: `feat: wireframe Input and Button use shadcn`

---

### Task 8: Rewire Section and Card

**Files:**
- Modify: `src/components/wireframe/Section.tsx`, `Card.tsx`

- [ ] **Step 1: Section**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Section({ title, children }: SectionProps) {
  return (
    <Card>
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-4 pt-0">{children}</CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Card**

```tsx
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Card({ title, children }: CardProps) {
  return (
    <ShadcnCard>
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-2 pt-0">{children}</CardContent>
    </ShadcnCard>
  )
}
```

Note: wireframe `Card` wraps shadcn `Card` — import alias avoids name clash.

- [ ] **Step 3: Run check + commit**

Run: `npm run check`  
Commit: `feat: wireframe Section and Card use shadcn Card`

---

### Task 9: Rewire List and Link

**Files:**
- Modify: `src/components/wireframe/List.tsx`, `Link.tsx`

- [ ] **Step 1: List**

```tsx
export function List({ children }: ListProps) {
  return <ul className="flex flex-col gap-1 list-disc pl-5 text-sm">{children}</ul>
}
```

- [ ] **Step 2: Link — prototype mode uses Button variant link**

In `Link.tsx`, replace prototype `<button className="underline">` with:

```tsx
import { Button } from '@/components/ui/button'

// prototype branch:
return (
  <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/${goto}`)}>
    {children}
  </Button>
)
```

Preview branch: keep `<a href={`#${goto}`}>` but add `className="text-primary underline-offset-4 hover:underline"`.

Invalid goto span: use `Badge variant="destructive"` or keep red border — pick Badge for polish:

```tsx
import { Badge } from '@/components/ui/badge'
return <Badge variant="destructive">{children}</Badge>
```

- [ ] **Step 3: Run check + commit**

Run: `npm run check && npm run test`  
Commit: `feat: wireframe List and Link use shadcn styling`

---

### Task 10: End-to-end verification

**Files:** None

- [ ] **Step 1: Full automated suite**

```bash
npm run check && npm run test && npm run build
```

Expected: all exit 0

- [ ] **Step 2: Manual smoke**

```bash
npm run dev
```

| Check | Expected |
|-------|----------|
| MDX Preview | 3 screens, Lyra Card/Button/Input styling |
| Prototype | home → login → signup via Links |
| Inputs | disabled/readOnly |
| Buttons | no navigation |
| Tabs | switch views |
| Invalid goto | Badge or error styling on bad Link |

- [ ] **Step 3: Confirm definition of done**

- [ ] shadcn Lyra initialized with ui components
- [ ] All wireframe wrappers use shadcn
- [ ] Shell + error overlay polished
- [ ] MDX API unchanged
- [ ] `npm run check`, `test`, `build` pass

---

## Self-review

| Spec requirement | Task |
|------------------|------|
| Lyra preset init | Task 1 |
| Install ui components | Task 2 |
| Shell Tabs + tokens | Task 3 |
| Error Alert overlay | Task 4 |
| Screen → Card | Task 5 |
| Heading/Text/Separator | Task 6 |
| Input/Button | Task 7 |
| Section/Card | Task 8 |
| List/Link | Task 9 |
| Remove wireframeStyles | Task 5 |
| Link-only goto preserved | Task 9 |
| Display-only Input | Task 7 |
| E2E verification | Task 10 |

No placeholders found. Types consistent across tasks.

---

## Follow-up (not this plan)

- Update `docs/CONTEXT.md` / `AGENTS.md` to reflect polished prototype direction
- shadcn `Field`/`FieldGroup` if form layouts expand
- Option 2 primitives: Tabs, BottomNav wireframe wrappers
