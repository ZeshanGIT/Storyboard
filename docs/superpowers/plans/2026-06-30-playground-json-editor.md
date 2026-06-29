# Playground JSON Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a split-pane JSON playground with Monaco on the left and the existing Shell (Preview / Prototype / Graph + graph sub-modes) on the right, compiling editor text in-browser via the existing JSON pipeline.

**Architecture:** Keep compile logic pure and testable (`compilePlaygroundJson` → `buildJsonDocument` → `jsonToWireframeDocumentBundle`). `PlaygroundApp` owns editor text state, debounces compile input, and renders `PlaygroundSplitLayout` with `PlaygroundJsonEditor` + `Shell` in `embedded` layout mode. Monaco loads via `@monaco-editor/react` with Vite worker imports (no CDN). MDX playground deferred.

**Tech Stack:** TypeScript 6, React 19, Vite 8, Vitest, `@monaco-editor/react`, `monaco-editor`, existing `src/json/` compiler + `Shell`.

## Global Constraints

- Run `npm run build` + `npm run check` before claiming done; playground compile tests need `npm test`
- Do not hand-edit `src/generated/`; do not change MDX codegen
- JSON path stays in `src/json/` and `src/playground/` — no JSON imports in `src/plugin/`
- Wireframe primitives stay structural; playground chrome may use shadcn/Tailwind
- Editor content **not** in URL (deferred per app-url plan); slug stays `playground`
- Update `docs/CONTEXT.md` when playground UX changes (Task 5)
- Min diff; no MDX editor, no localStorage, no bidirectional MDX↔JSON (YAGNI)

**Prerequisite:** JSON playground pipeline ✓ ([`2026-06-29-json-playground-pipeline.md`](2026-06-29-json-playground-pipeline.md)), URL state ✓ ([`2026-06-29-app-url-state.md`](2026-06-29-app-url-state.md))

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/playground/monaco-setup.ts` | Vite worker config + `loader.config({ monaco })` — import once before Editor mounts |
| `src/playground/compile-playground-json.ts` | Pure `compilePlaygroundJson(text)` → parse JSON + `buildJsonDocument` |
| `src/playground/compile-playground-json.test.ts` | Vitest for compile helper |
| `src/playground/use-debounced-value.ts` | Generic debounce hook for editor → compile |
| `src/playground/PlaygroundJsonEditor.tsx` | Monaco wrapper (`language="json"`, controlled `value`/`onChange`) |
| `src/playground/PlaygroundSplitLayout.tsx` | Horizontal split + drag resize handle |
| `src/playground/PlaygroundApp.tsx` | Wire editor → debounced compile → bundle → Shell |
| `src/shell/Shell.tsx` | Optional `layout="embedded"` for split-pane height/width |
| `vite.config.ts` | `optimizeDeps.include: ['monaco-editor']` |
| `package.json` | Add `@monaco-editor/react`, `monaco-editor` |
| `docs/CONTEXT.md` | Document split editor + Monaco |

---

### Task 1: Monaco dependencies and Vite worker setup

**Files:**
- Modify: `package.json`
- Create: `src/playground/monaco-setup.ts`
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: side-effect module that configures `self.MonacoEnvironment` and `@monaco-editor/react` loader before any `<Editor />` render

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install @monaco-editor/react monaco-editor
```

- [ ] **Step 2: Add `optimizeDeps` entry in `vite.config.ts`**

Inside the `defineConfig({ ... })` object, add:

```ts
  optimizeDeps: {
    include: ['monaco-editor'],
  },
```

- [ ] **Step 3: Create `src/playground/monaco-setup.ts`**

```ts
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    return new editorWorker()
  },
}

loader.config({ monaco })
```

JSON-only playground — skip css/html/ts workers (YAGNI).

- [ ] **Step 4: Verify dev server starts**

Run: `npm run dev`
Expected: no new errors; existing app still loads at `/mdx/storyboard/preview` and `/playground/json/playground/preview`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/playground/monaco-setup.ts
git commit -m "chore: add Monaco editor deps and Vite worker setup"
```

---

### Task 2: Pure JSON compile helper

**Files:**
- Create: `src/playground/compile-playground-json.ts`
- Create: `src/playground/compile-playground-json.test.ts`

**Interfaces:**
- Consumes: `buildJsonDocument` from `@/json/build-json-document`
- Produces:
  ```ts
  import type { JsonDocumentBuilt } from '@/json/build-json-document'

  export type CompilePlaygroundJsonResult =
    | { ok: true; document: JsonDocumentBuilt }
    | { ok: false; errors: readonly string[] }

  export function compilePlaygroundJson(text: string): CompilePlaygroundJsonResult
  ```

- [ ] **Step 1: Write the failing test**

Create `src/playground/compile-playground-json.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { compilePlaygroundJson } from './compile-playground-json'

const VALID = JSON.stringify(
  {
    title: 'Demo',
    screens: {
      home: {
        title: 'Home',
        nodes: [['Text:h1', 'Hello']],
      },
    },
  },
  null,
  2,
)

describe('compilePlaygroundJson', () => {
  it('accepts valid wireframe JSON', () => {
    const result = compilePlaygroundJson(VALID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.title).toBe('Demo')
  })

  it('rejects invalid JSON syntax', () => {
    const result = compilePlaygroundJson('{ broken')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]).toMatch(/JSON/i)
  })

  it('rejects valid JSON with wireframe validation errors', () => {
    const result = compilePlaygroundJson(JSON.stringify({ title: 'X', screens: {} }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/playground/compile-playground-json.test.ts`
Expected: FAIL — `compilePlaygroundJson` not found

- [ ] **Step 3: Implement `src/playground/compile-playground-json.ts`**

```ts
import { buildJsonDocument, type JsonDocumentBuilt } from '@/json/build-json-document'

export type CompilePlaygroundJsonResult =
  | { ok: true; document: JsonDocumentBuilt }
  | { ok: false; errors: readonly string[] }

export function compilePlaygroundJson(text: string): CompilePlaygroundJsonResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    return { ok: false, errors: [`JSON parse error: ${message}`] }
  }

  const built = buildJsonDocument(raw)
  if (!built.ok) {
    return { ok: false, errors: built.errors.map((entry) => entry.message) }
  }

  return { ok: true, document: built.document }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/playground/compile-playground-json.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/playground/compile-playground-json.ts src/playground/compile-playground-json.test.ts
git commit -m "feat: add pure compile helper for playground JSON editor"
```

---

### Task 3: Debounce hook, Monaco editor, split layout

**Files:**
- Create: `src/playground/use-debounced-value.ts`
- Create: `src/playground/PlaygroundJsonEditor.tsx`
- Create: `src/playground/PlaygroundSplitLayout.tsx`

**Interfaces:**
- Consumes: `./monaco-setup` (side-effect import in editor file)
- Produces:
  ```ts
  // use-debounced-value.ts
  export function useDebouncedValue<T>(value: T, delayMs: number): T

  // PlaygroundJsonEditor.tsx
  export type PlaygroundJsonEditorProps = {
    value: string
    onChange: (next: string) => void
  }
  export function PlaygroundJsonEditor(props: PlaygroundJsonEditorProps): JSX.Element

  // PlaygroundSplitLayout.tsx
  export type PlaygroundSplitLayoutProps = {
    editor: React.ReactNode
    panel: React.ReactNode
    defaultEditorWidth?: number
  }
  export function PlaygroundSplitLayout(props: PlaygroundSplitLayoutProps): JSX.Element
  ```

- [ ] **Step 1: Create `src/playground/use-debounced-value.ts`**

```ts
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
```

- [ ] **Step 2: Create `src/playground/PlaygroundJsonEditor.tsx`**

```tsx
import Editor from '@monaco-editor/react'
import './monaco-setup'

export type PlaygroundJsonEditorProps = {
  value: string
  onChange: (next: string) => void
}

export function PlaygroundJsonEditor({ value, onChange }: PlaygroundJsonEditorProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-muted/30">
      <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        JSON
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language="json"
          theme="vs"
          value={value}
          onChange={(next) => onChange(next ?? '')}
          options={{
            automaticLayout: true,
            fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
          }}
          loading={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/playground/PlaygroundSplitLayout.tsx`**

```tsx
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const MIN_EDITOR_WIDTH = 280
const MIN_PANEL_WIDTH = 360
const DEFAULT_EDITOR_WIDTH = 420

export type PlaygroundSplitLayoutProps = {
  editor: ReactNode
  panel: ReactNode
  defaultEditorWidth?: number
}

export function PlaygroundSplitLayout({
  editor,
  panel,
  defaultEditorWidth = DEFAULT_EDITOR_WIDTH,
}: PlaygroundSplitLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [editorWidth, setEditorWidth] = useState(defaultEditorWidth)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)

  const clampWidth = useCallback((next: number) => {
    const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth
    const maxEditor = Math.max(MIN_EDITOR_WIDTH, containerWidth - MIN_PANEL_WIDTH)
    return Math.min(Math.max(next, MIN_EDITOR_WIDTH), maxEditor)
  }, [])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!dragState.current) return
      const delta = event.clientX - dragState.current.startX
      setEditorWidth(clampWidth(dragState.current.startWidth + delta))
    }

    const onPointerUp = () => {
      dragState.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [clampWidth])

  return (
    <div ref={containerRef} className="flex h-screen w-full overflow-hidden">
      <div className="h-full shrink-0 overflow-hidden" style={{ width: editorWidth }}>
        {editor}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor"
        className={cn(
          'w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/40',
          dragState.current ? 'bg-primary/40' : '',
        )}
        onPointerDown={(event) => {
          dragState.current = { startX: event.clientX, startWidth: editorWidth }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
      />
      <div className="min-w-0 flex-1 overflow-hidden">{panel}</div>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b --pretty false 2>&1 | head -20`
Expected: no errors in new playground files

- [ ] **Step 5: Commit**

```bash
git add src/playground/use-debounced-value.ts src/playground/PlaygroundJsonEditor.tsx src/playground/PlaygroundSplitLayout.tsx
git commit -m "feat: add playground Monaco editor and split layout"
```

---

### Task 4: Shell embedded layout mode

**Files:**
- Modify: `src/shell/Shell.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type ShellLayout = 'standalone' | 'embedded'

  export type ShellProps = {
    documents: readonly WireframeDocumentBundle[]
    appDefaults: Pick<AppUrlState, 'app' | 'source'>
    layout?: ShellLayout // default 'standalone'
  }
  ```

- [ ] **Step 1: Extend `ShellProps` and root layout classes**

In `src/shell/Shell.tsx`, add after imports:

```ts
export type ShellLayout = 'standalone' | 'embedded'
```

Change `ShellProps`:

```ts
export type ShellProps = {
  documents: readonly WireframeDocumentBundle[]
  appDefaults: Pick<AppUrlState, 'app' | 'source'>
  layout?: ShellLayout
}
```

Update function signature:

```ts
export function Shell({ documents, appDefaults, layout = 'standalone' }: ShellProps) {
  const embedded = layout === 'embedded'
```

Replace the outer wrapper `div` className:

```tsx
        <div
          className={cn(
            'bg-background text-foreground',
            embedded ? 'flex h-full min-h-0 flex-col' : 'min-h-screen',
          )}
        >
```

Replace header element and inner container:

```tsx
          <header className="border-b">
            <div
              className={cn(
                'mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4',
                embedded ? 'max-w-none' : 'max-w-5xl',
              )}
            >
```

Replace `main` className:

```tsx
          <main
            className={cn(
              'mx-auto',
              embedded
                ? view === 'graph'
                  ? 'flex min-h-0 flex-1 flex-col'
                  : 'min-h-0 flex-1 overflow-y-auto px-6 py-8'
                : view === 'graph'
                  ? 'h-[calc(100vh-73px)] max-w-none'
                  : 'max-w-3xl px-6 py-8',
            )}
          >
```

- [ ] **Step 2: Verify MDX app unchanged**

Run: `npm run dev`
Open: `/mdx/wireframe/preview`
Expected: layout identical to before (full viewport, centered content)

- [ ] **Step 3: Commit**

```bash
git add src/shell/Shell.tsx
git commit -m "feat: add embedded layout mode for split-pane shell"
```

---

### Task 5: Wire PlaygroundApp and update CONTEXT

**Files:**
- Modify: `src/playground/PlaygroundApp.tsx`
- Modify: `docs/CONTEXT.md`

**Interfaces:**
- Consumes: `compilePlaygroundJson`, `useDebouncedValue`, `PlaygroundJsonEditor`, `PlaygroundSplitLayout`, `jsonToWireframeDocumentBundle`, `Shell` with `layout="embedded"`

- [ ] **Step 1: Replace `src/playground/PlaygroundApp.tsx`**

```tsx
import { useMemo, useState } from 'react'
import sample from '@/json/sample-wireframe.json'
import { jsonToWireframeDocumentBundle } from '@/json/to-document-bundle'
import { WireframeErrorProvider } from '@/runtime/WireframeErrorProvider'
import { Shell } from '@/shell/Shell'
import { compilePlaygroundJson } from './compile-playground-json'
import { PlaygroundJsonEditor } from './PlaygroundJsonEditor'
import { PlaygroundSplitLayout } from './PlaygroundSplitLayout'
import { useDebouncedValue } from './use-debounced-value'

const INITIAL_EDITOR_TEXT = JSON.stringify(sample, null, 2)
const COMPILE_DEBOUNCE_MS = 300

export function PlaygroundApp() {
  const [editorText, setEditorText] = useState(INITIAL_EDITOR_TEXT)
  const debouncedText = useDebouncedValue(editorText, COMPILE_DEBOUNCE_MS)

  const compiled = useMemo(() => compilePlaygroundJson(debouncedText), [debouncedText])

  const documents = useMemo(() => {
    if (!compiled.ok) return []
    return [jsonToWireframeDocumentBundle(compiled.document, 'playground', { playground: true })]
  }, [compiled])

  const errors = useMemo(() => (compiled.ok ? [] : [...compiled.errors]), [compiled])

  return (
    <PlaygroundSplitLayout
      editor={<PlaygroundJsonEditor value={editorText} onChange={setEditorText} />}
      panel={
        <WireframeErrorProvider initialErrors={errors}>
          <Shell
            documents={documents}
            appDefaults={{ app: 'playground', source: 'json' }}
            layout="embedded"
          />
        </WireframeErrorProvider>
      }
    />
  )
}
```

- [ ] **Step 2: Update `docs/CONTEXT.md`**

In the **JSON flow** section, after the playground entry line, add:

```markdown
Playground UI: split pane — Monaco JSON editor (left, debounced compile) + Shell (right). Initial content from `sample-wireframe.json`. Compile errors surface via `WireframeErrorProvider`.
```

In the **Status** table, change JSON playground row to:

```markdown
| JSON playground (browser compile, Monaco split editor, no codegen) | Done |
```

(Apply when implementation completes — if still in progress during Task 5, use "In progress" until final verify.)

- [ ] **Step 3: Manual verify**

Run: `npm run dev`

Open: `/playground/json/playground/preview`

Expected:
- Left: Monaco with formatted sample JSON
- Right: Preview of Workforge demo screens
- Edit JSON (e.g. change a `Text` string) → preview updates after ~300ms
- Prototype tab → `/playground/json/playground/prototype/home` (or entry screen); links navigate
- Graph tab → Screen / Compact sub-modes work; pan/zoom/fit work in right pane
- Drag separator resizes editor width
- Introduce `{ broken` → error overlay with JSON parse message; right shows "No documents"

- [ ] **Step 4: Run full checks**

Run:

```bash
npm test
npm run build
npm run check
```

Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/playground/PlaygroundApp.tsx docs/CONTEXT.md
git commit -m "feat: wire playground JSON editor to shell split pane"
```

---

## Out of scope (follow-up plans)

- MDX Monaco editor + `mdxToWireframeDocumentBundle` (`/playground/mdx/…`)
- Editor draft persistence (`localStorage` / SaaS)
- JSON Schema diagnostics in Monaco
- Format-on-save / Prettier integration
- Editor content in URL

---

## Self-review

### Spec coverage

| Requirement | Task |
|-------------|------|
| Monaco JSON editor left | Task 1, 3 |
| Existing Shell right (Preview / Prototype / Graph) | Task 4, 5 |
| Graph Screen + Compact sub-modes | Unchanged — Task 5 manual verify |
| In-browser JSON compile | Task 2, 5 |
| Debounced compile while typing | Task 3, 5 |
| Resizable split | Task 3 |
| MDX deferred | Out of scope |
| `npm run build` + `npm run check` | Task 5 |
| CONTEXT update | Task 5 |

### Placeholder scan

No TBD/TODO/similar-to steps. All code blocks complete.

### Type consistency

- `CompilePlaygroundJsonResult.document` is `JsonDocumentBuilt` → matches `jsonToWireframeDocumentBundle(built, …)` first arg
- `ShellLayout` / `layout` prop used consistently in Task 4 and Task 5
- `PlaygroundSplitLayout` props: `panel` (not `preview`) in Task 3 and Task 5
