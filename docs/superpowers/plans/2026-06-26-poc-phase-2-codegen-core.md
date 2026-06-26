# Phase 2: Codegen Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parse wireframe MDX to mdast, extract `<Screen>` nodes, validate duplicate IDs, and generate three TypeScript artifacts — without Vite integration yet.

**Architecture:** Pure functions in `src/plugin/` use `remark` + `remark-mdx` for parse/stringify and `unist-util-visit` for AST walk. `generate.ts` writes files to a caller-supplied output directory. Vitest tests cover extraction and naming.

**Tech Stack:** remark 15, remark-mdx 3.1, unist-util-visit 5, vitest

**Prerequisite:** [Phase 1](./2026-06-26-poc-phase-1-wireframe-primitives.md) complete.

**Definition of Done:** See [overview § Phase 2](./2026-06-26-poc-overview.md#phase-2-codegen-core).

---

## File structure (this phase)

| File | Responsibility |
|------|----------------|
| `src/plugin/types.ts` | `ExtractedScreen`, `CodegenError`, `CodegenResult` |
| `src/plugin/naming.ts` | `screenIdToComponentName`, `screenIdToScreensKey` |
| `src/plugin/extract-screens.ts` | remark parse, visit Screen nodes, stringify subtrees |
| `src/plugin/generate.ts` | Write three generated files |
| `src/plugin/extract-screens.test.ts` | Vitest tests |
| `src/plugin/naming.test.ts` | Vitest tests |

---

### Task 1: Add dependencies and vitest

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install -D remark@^15.0.1 remark-mdx@^3.1.1 unist-util-visit@^5.0.0 vitest@^3.0.0 @types/mdast
```

- [ ] **Step 2: Add test script to package.json**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add remark and vitest for wireframe codegen"
```

---

### Task 2: Types and naming utilities

**Files:**
- Create: `src/plugin/types.ts`
- Create: `src/plugin/naming.ts`
- Create: `src/plugin/naming.test.ts`

- [ ] **Step 1: Write failing naming tests**

```ts
import { describe, expect, it } from 'vitest'
import { screenIdToComponentName, screenIdToScreensKey } from './naming'

describe('screenIdToComponentName', () => {
  it('converts simple id', () => {
    expect(screenIdToComponentName('home')).toBe('Home')
  })

  it('converts kebab-case id', () => {
    expect(screenIdToComponentName('user-profile')).toBe('UserProfile')
  })
})

describe('screenIdToScreensKey', () => {
  it('matches component name', () => {
    expect(screenIdToScreensKey('login')).toBe('Login')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/plugin/naming.test.ts`
Expected: FAIL — module `./naming` not found

- [ ] **Step 3: Implement naming.ts**

```ts
/**
 * Naming rules (POC):
 * - screen id `home` → component `Home`, Screens key `Home`
 * - screen id `user-profile` → `UserProfile` (split on `-`, PascalCase segments)
 */
export function screenIdToComponentName(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function screenIdToScreensKey(id: string): string {
  return screenIdToComponentName(id)
}
```

- [ ] **Step 4: Create types.ts**

```ts
export type ExtractedScreen = {
  id: string
  title: string
  jsx: string
  order: number
}

export type CodegenErrorCode = 'DUPLICATE_SCREEN_ID' | 'MISSING_SCREEN_ID' | 'PARSE_ERROR'

export class CodegenError extends Error {
  constructor(
    public readonly code: CodegenErrorCode,
    message: string,
    public readonly screenId?: string,
  ) {
    super(message)
    this.name = 'CodegenError'
  }
}

export type CodegenResult =
  | { ok: true; screens: ExtractedScreen[] }
  | { ok: false; error: CodegenError }
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/plugin/naming.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/plugin/types.ts src/plugin/naming.ts src/plugin/naming.test.ts
git commit -m "feat: add screen id naming utilities and codegen types"
```

---

### Task 3: Screen extraction

**Files:**
- Create: `src/plugin/extract-screens.ts`
- Create: `src/plugin/extract-screens.test.ts`

- [ ] **Step 1: Write failing extraction test**

```ts
import { describe, expect, it } from 'vitest'
import { extractScreens } from './extract-screens'
import { CodegenError } from './types'

const SAMPLE = `
<Screen id="home" title="Home">
  <Text>Welcome back</Text>
  <Link goto={Screens.Login}>Login</Link>
</Screen>

<Screen id="login" title="Login">
  <Text>Sign in</Text>
</Screen>
`

describe('extractScreens', () => {
  it('extracts screens in document order', () => {
    const result = extractScreens(SAMPLE)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.screens).toHaveLength(2)
    expect(result.screens[0].id).toBe('home')
    expect(result.screens[1].id).toBe('login')
    expect(result.screens[0].jsx).toContain('<Text>Welcome back</Text>')
  })

  it('rejects duplicate screen ids', () => {
    const dup = `
<Screen id="home" title="A">...</Screen>
<Screen id="home" title="B">...</Screen>
`
    const result = extractScreens(dup)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBeInstanceOf(CodegenError)
    expect(result.error.code).toBe('DUPLICATE_SCREEN_ID')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/plugin/extract-screens.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement extract-screens.ts**

```ts
/// <reference types="remark-mdx" />

import { remark } from 'remark'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import {
  CodegenError,
  type CodegenResult,
  type ExtractedScreen,
} from './types'

const processor = remark().use(remarkMdx)

function getStringAttr(node: MdxJsxFlowElement, name: string): string | undefined {
  const attr = node.attributes.find(
    (a) => a.type === 'mdxJsxAttribute' && a.name === name,
  )
  if (!attr || attr.value === null || attr.value === undefined) return undefined
  if (typeof attr.value === 'string') return attr.value
  if (attr.value.type === 'mdxJsxAttributeValueExpression') {
    return undefined
  }
  return undefined
}

function stringifyScreenNode(node: MdxJsxFlowElement): string {
  const chunk = processor.stringify({
    type: 'root',
    children: [node],
  } as Root)
  return chunk.trim()
}

export function extractScreens(source: string): CodegenResult {
  let tree: Root
  try {
    tree = processor.parse(source) as Root
  } catch (err) {
    return {
      ok: false,
      error: new CodegenError(
        'PARSE_ERROR',
        err instanceof Error ? err.message : 'Failed to parse MDX',
      ),
    }
  }

  const screens: ExtractedScreen[] = []
  const seenIds = new Map<string, number>()

  visit(tree, 'mdxJsxFlowElement', (node) => {
    if (node.name !== 'Screen') return

    const id = getStringAttr(node, 'id')
    const title = getStringAttr(node, 'title') ?? ''

    if (!id) {
      throw new CodegenError('MISSING_SCREEN_ID', 'Screen node missing id attribute')
    }

    if (seenIds.has(id)) {
      throw new CodegenError(
        'DUPLICATE_SCREEN_ID',
        `Duplicate screen id "${id}"`,
        id,
      )
    }
    seenIds.set(id, screens.length)

    screens.push({
      id,
      title,
      jsx: stringifyScreenNode(node),
      order: screens.length,
    })
  })

  return { ok: true, screens }
}
```

Wrap `extractScreens` body in try/catch for `CodegenError` throws from visit callback:

```ts
export function extractScreens(source: string): CodegenResult {
  try {
    // ... parse and visit ...
    return { ok: true, screens }
  } catch (err) {
    if (err instanceof CodegenError) {
      return { ok: false, error: err }
    }
    return {
      ok: false,
      error: new CodegenError(
        'PARSE_ERROR',
        err instanceof Error ? err.message : 'Unknown error',
      ),
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/plugin/extract-screens.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugin/extract-screens.ts src/plugin/extract-screens.test.ts
git commit -m "feat: extract Screen nodes from wireframe MDX via remark"
```

---

### Task 4: File generators

**Files:**
- Create: `src/plugin/generate.ts`
- Create: `src/plugin/generate.test.ts`

- [ ] **Step 1: Write failing generate test**

```ts
import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateWireframeFiles } from './generate'
import type { ExtractedScreen } from './types'

const screens: ExtractedScreen[] = [
  { id: 'home', title: 'Home', jsx: '<Screen id="home" title="Home"><Text>Hi</Text></Screen>', order: 0 },
  { id: 'login', title: 'Login', jsx: '<Screen id="login" title="Login"><Text>In</Text></Screen>', order: 1 },
]

describe('generateWireframeFiles', () => {
  it('writes three generated files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wfx-'))
    await generateWireframeFiles(screens, dir)

    const map = await readFile(join(dir, 'screens-map.generated.ts'), 'utf8')
    const routes = await readFile(join(dir, 'routes.generated.tsx'), 'utf8')
    const components = await readFile(join(dir, 'screens.generated.tsx'), 'utf8')

    expect(map).toContain("Home: 'home'")
    expect(map).toContain("Login: 'login'")
    expect(routes).toContain("path: '/home'")
    expect(routes).toContain('component: Home')
    expect(components).toContain('export function Home()')
    expect(components).toContain('<Text>Hi</Text>')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/plugin/generate.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement generate.ts**

```ts
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { screenIdToComponentName, screenIdToScreensKey } from './naming'
import type { ExtractedScreen } from './types'

const HEADER = '// AUTO-GENERATED — do not edit\n\n'

export async function generateWireframeFiles(
  screens: ExtractedScreen[],
  outDir: string,
): Promise<void> {
  await mkdir(outDir, { recursive: true })

  const mapEntries = screens
    .map((s) => `  ${screenIdToScreensKey(s.id)}: '${s.id}',`)
    .join('\n')

  const mapContent = `${HEADER}export const Screens = {\n${mapEntries}\n} as const\n\nexport type ScreenId = (typeof Screens)[keyof typeof Screens]\n`

  const componentNames = screens.map((s) => screenIdToComponentName(s.id))
  const componentExports = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `export function ${name}() {\n  return (\n    ${s.jsx}\n  )\n}`
    })
    .join('\n\n')

  const screensContent = `${HEADER}import { Screen, Text, Link } from '../components/wireframe'\nimport { Screens } from './screens-map.generated'\n\n${componentExports}\n`

  const routeImports = componentNames.join(', ')
  const routeEntries = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `  {\n    id: '${s.id}',\n    path: '/${s.id}',\n    component: ${name},\n  }`
    })
    .join(',\n')

  const routesContent = `${HEADER}import { ${routeImports} } from './screens.generated'\n\nexport const routes = [\n${routeEntries},\n] as const\n`

  await writeFile(join(outDir, 'screens-map.generated.ts'), mapContent, 'utf8')
  await writeFile(join(outDir, 'screens.generated.tsx'), screensContent, 'utf8')
  await writeFile(join(outDir, 'routes.generated.tsx'), routesContent, 'utf8')
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generate.ts src/plugin/generate.test.ts
git commit -m "feat: generate screens, routes, and Screens map from extracted AST"
```

---

### Task 5: Orchestrator entry point

**Files:**
- Create: `src/plugin/codegen.ts`

- [ ] **Step 1: Implement codegen orchestrator**

```ts
import { extractScreens } from './extract-screens'
import { generateWireframeFiles } from './generate'
import type { CodegenError, ExtractedScreen } from './types'

export type RunCodegenResult =
  | { ok: true; screens: ExtractedScreen[] }
  | { ok: false; error: CodegenError }

export async function runCodegen(
  source: string,
  outDir: string,
): Promise<RunCodegenResult> {
  const extracted = extractScreens(source)
  if (!extracted.ok) {
    return extracted
  }
  await generateWireframeFiles(extracted.screens, outDir)
  return extracted
}
```

- [ ] **Step 2: Run all tests**

Run: `npm test && npm run build && npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/plugin/codegen.ts
git commit -m "feat: add codegen orchestrator for wireframe MDX"
```

---

### Task 6: Phase 2 verification

- [ ] **Step 1: Manual codegen smoke test**

Create a one-off script or run in vitest:

```ts
import { readFile } from 'node:fs/promises'
import { runCodegen } from './src/plugin/codegen'

const source = await readFile('src/content/wireframe.mdx', 'utf8').catch(() =>
  readFile('docs/superpowers/plans/fixtures/sample-wireframe.mdx', 'utf8'),
)
await runCodegen(source, '/tmp/wfx-generated')
```

If `wireframe.mdx` does not exist yet, use inline SAMPLE from extract-screens test.

- [ ] **Step 2: Confirm Phase 2 DoD**

Check every item in [overview § Phase 2 DoD](./2026-06-26-poc-overview.md#phase-2-codegen-core).

Proceed to [Phase 3](./2026-06-26-poc-phase-3-vite-plugin.md).

---

## Self-review

| POC requirement | Task |
|-----------------|------|
| remark + remark-mdx parse | Task 3 |
| unist-util-visit Screen nodes | Task 3 |
| remark-stringify per screen | Task 3 |
| Duplicate ID hard error | Task 3 |
| screens.generated.tsx | Task 4 |
| routes.generated.tsx | Task 4 |
| screens-map.generated.ts | Task 4 |
| PascalCase naming | Task 2 |
