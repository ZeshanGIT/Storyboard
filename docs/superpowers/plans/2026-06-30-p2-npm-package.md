# P2 npm Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `storyboard@0.1.0` so any repo can run `npx storyboard init` and `npx storyboard dev | validate | req show | impact | trace`.

**Architecture:** npm workspaces monorepo with three packages: `@storyboard/spec` (P1 engine), `@storyboard/shell` (extracted Vite plugin + React Shell + wireframe primitives), and `storyboard` CLI (thin commander wrapper). The OSS root app becomes a workspace consumer. `storyboard dev` detects **embedded** mode (`src/content/*.mdx` present) vs **json** mode (`storyboard/spec.json` only) and starts a programmatic Vite server with the correct document loader. Init scaffolds either embedded MDX + product-spec trio or cloud JSON-only stub.

**Tech Stack:** npm workspaces, TypeScript 6, Vite 8, React 19, Commander 14, tsx (dev), Vitest, existing `buildMdxDocument` / `buildJsonDocument` pipelines.

## Global Constraints

- **Gate:** Do not start P2 until P1 items 2–7 land per [`ROADMAP.md`](../../ROADMAP.md) and [`PRODUCT-SPEC.md`](../../PRODUCT-SPEC.md) — types, loader, validate, tuple parser, sample JSON trio, Vitest, CLI stubs in `src/product-spec/`
- Publish **`0.1.0`** — explicit unstable; **no production codegen** (P5)
- Init modes: **embedded** (`my-app/storyboard/` + optional `src/content/*.mdx`) · **cloud stub** (`todo-poc/app/` + `storyboard/` JSON-only + `DESIGN.md` + `ARCHITECTURE.md`)
- MDX path stays in OSS; cloud POC is JSON-only
- Open npm name: ship bin as `storyboard`; package name `@storyboard/cli` if `storyboard` is taken on npm (check at publish time)
- Run `npm run build` + `npm run check` + `npm test` before claiming done
- Do not hand-edit `src/generated/`; plugin tests stay in Vitest
- Min diff in shell behavior — extraction must not change URL semantics (`/mdx/{docSlug}/{view}/...`)
- Biome excludes `src/generated/`, `*.mdx`, `packages/*/dist/`

**Prerequisite plan:** [`2026-06-30-p1-product-spec-engine.md`](2026-06-30-p1-product-spec-engine.md) — implement P1 in `src/product-spec/` first, then execute this plan.

**Locked (2026-06-30):** [`PRODUCT-SPEC.md`](../../PRODUCT-SPEC.md) accepted; three-file JSON model; P2 scope per ROADMAP (JSON `dev` for 0.1.0 cloud path, full `@storyboard/shell` extraction, MDX stays in OSS).

---

## File structure

| Path | Responsibility |
|------|----------------|
| `package.json` (root) | `"workspaces": ["packages/*"]`; scripts delegate to workspace packages |
| `packages/spec/package.json` | `@storyboard/spec` — types, load, validate, req indexing |
| `packages/spec/src/index.ts` | Public API re-exports |
| `packages/spec/src/types.ts` | `StructuralReqId`, `BehavioralReqId`, `ReqPath`, `Binding`, `ProductSpec` |
| `packages/spec/src/load.ts` | `loadProductSpec(dir)` — read + merge three JSON files |
| `packages/spec/src/validate.ts` | `validateProductSpec(spec)` — cross-ref checks from PRODUCT-SPEC §validate |
| `packages/spec/src/req-show.ts` | `showReq(spec, id)` |
| `packages/spec/src/impact.ts` | `impact(spec, target)` |
| `packages/spec/src/trace.ts` | `traceReq(spec, target, opts)` — ripgrep over impl root |
| `packages/spec/src/__tests__/` | Vitest (migrated from `src/product-spec/`) |
| `packages/shell/package.json` | `@storyboard/shell` — peer deps react, react-dom, vite |
| `packages/shell/src/index.ts` | `defineStoryboardConfig`, `createStoryboardDevServer`, `Shell` |
| `packages/shell/src/vite/storyboard-config.ts` | `defineStoryboardConfig(options)` factory |
| `packages/shell/src/vite/detect-mode.ts` | `detectStoryboardMode(root)` → `'mdx' \| 'json'` |
| `packages/shell/src/vite/json-content-loader.ts` | Load `storyboard/spec.json` at build time via `?raw` or fs read plugin |
| `packages/shell/src/plugin/` | Moved from `src/plugin/` (wireframe plugin, codegen) |
| `packages/shell/src/shell/` | Moved from `src/shell/` |
| `packages/shell/src/runtime/` | Moved from `src/runtime/` |
| `packages/shell/src/components/wireframe/` | Moved from `src/components/wireframe/` |
| `packages/shell/src/json/` | Moved from `src/json/` |
| `packages/shell/src/types/` | `wireframe-document.ts`, `navigation.ts` |
| `packages/shell/src/lib/` | `app-url.ts`, `app-routes.ts`, `app-base-path.ts` |
| `packages/shell/template/` | Consumer Vite entry scaffold (`index.html`, `main.tsx`, `StoryboardApp.tsx`) |
| `packages/cli/package.json` | `storyboard` bin → `dist/bin/storyboard.js` |
| `packages/cli/src/cli.ts` | Commander program |
| `packages/cli/src/commands/init.ts` | `storyboard init [--template cloud]` |
| `packages/cli/src/commands/dev.ts` | `storyboard dev [--port 5173]` |
| `packages/cli/src/commands/validate.ts` | `storyboard validate` |
| `packages/cli/src/commands/req.ts` | `req show` subcommand |
| `packages/cli/src/commands/impact.ts` | `impact` subcommand |
| `packages/cli/src/commands/trace.ts` | `trace` subcommand |
| `packages/cli/src/templates/embedded/` | Init scaffold files |
| `packages/cli/src/templates/cloud/` | Cloud stub scaffold files |
| `packages/cli/src/__tests__/init.test.ts` | Init output snapshot tests |
| Root `src/` | Imports from `@storyboard/shell`; thin `MdxApp` / `PlaygroundApp` wrappers remain |

### `@storyboard/spec` public API (P1 → P2 contract)

```ts
// packages/spec/src/index.ts
export type {
  StructuralReqId,
  BehavioralReqId,
  ReqPath,
  Binding,
  ProductSpec,
  ValidationIssue,
  ValidationResult,
} from './types'

export { loadProductSpec } from './load'
export { validateProductSpec } from './validate'
export { showReq } from './req-show'
export { impact } from './impact'
export { traceReq } from './trace'
```

```ts
// packages/spec/src/load.ts
export async function loadProductSpec(
  storyboardDir: string,
): Promise<ProductSpec>

// packages/spec/src/validate.ts
export function validateProductSpec(spec: ProductSpec): ValidationResult

// packages/spec/src/types.ts
export type ValidationResult = {
  ok: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}
```

---

### Task 1: npm workspaces scaffold

**Files:**
- Modify: `package.json`
- Create: `packages/spec/package.json`
- Create: `packages/shell/package.json`
- Create: `packages/cli/package.json`
- Create: `packages/spec/tsconfig.json`
- Create: `packages/shell/tsconfig.json`
- Create: `packages/cli/tsconfig.json`
- Create: `tsconfig.base.json` (root, shared compiler options)

**Interfaces:**
- Produces: workspace layout; empty packages build with `tsc`

- [ ] **Step 1: Add root workspaces**

In root `package.json`, add:

```json
"workspaces": ["packages/*"],
"scripts": {
  "build:packages": "npm run build -w @storyboard/spec -w @storyboard/shell -w storyboard",
  "build": "npm run build:packages && npm run codegen && tsc -b && vite build"
}
```

Keep existing scripts; prepend package build.

- [ ] **Step 2: Create `packages/spec/package.json`**

```json
{
  "name": "@storyboard/spec",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vitest": "^3.2.6"
  }
}
```

- [ ] **Step 3: Create `packages/shell/package.json`**

```json
{
  "name": "@storyboard/shell",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./vite": {
      "types": "./dist/vite/storyboard-config.d.ts",
      "import": "./dist/vite/storyboard-config.js"
    }
  },
  "files": ["dist", "template"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^8.0.0"
  },
  "dependencies": {
    "@dagrejs/dagre": "^3.0.0",
    "@mdx-js/react": "^3.1.1",
    "@mdx-js/rollup": "^3.1.1",
    "@xyflow/react": "^12.11.1",
    "remark": "^15.0.1",
    "remark-frontmatter": "^5.0.0",
    "remark-mdx": "^3.1.1",
    "unist-util-visit": "^5.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "typescript": "~6.0.2",
    "vite": "^8.1.0",
    "vitest": "^3.2.6"
  }
}
```

- [ ] **Step 4: Create `packages/cli/package.json`**

```json
{
  "name": "storyboard",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "storyboard": "./dist/bin/storyboard.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@storyboard/spec": "0.1.0",
    "@storyboard/shell": "0.1.0",
    "commander": "^14.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.13.2",
    "typescript": "~6.0.2",
    "vitest": "^3.2.6"
  }
}
```

- [ ] **Step 5: Create minimal `packages/spec/src/index.ts`**

```ts
export type { ProductSpec } from './types'
export type { ValidationResult } from './types'

export async function loadProductSpec(_storyboardDir: string): Promise<ProductSpec> {
  throw new Error('P1 not migrated yet')
}

export function validateProductSpec(_spec: ProductSpec): ValidationResult {
  return { ok: true, errors: [], warnings: [] }
}
```

```ts
// packages/spec/src/types.ts
export type ProductSpec = {
  storyboardDir: string
  spec: unknown
  requirements: unknown
  bindings: unknown
}

export type ValidationResult = {
  ok: boolean
  errors: { code: string; message: string }[]
  warnings: { code: string; message: string }[]
}
```

- [ ] **Step 6: Install and verify workspace links**

Run: `npm install`
Run: `npm run build -w @storyboard/spec`
Expected: `packages/spec/dist/index.js` exists

- [ ] **Step 7: Commit**

```bash
git add package.json packages/ tsconfig.base.json
git commit -m "chore: scaffold npm workspaces for P2 packages"
```

---

### Task 2: Migrate P1 engine to `@storyboard/spec`

**Files:**
- Move: `src/product-spec/*` → `packages/spec/src/` (after P1 lands)
- Modify: `packages/spec/src/index.ts`
- Test: `packages/spec/src/__tests__/validate.test.ts` (from P1)

**Interfaces:**
- Consumes: P1 implementation in `src/product-spec/` (types, load, validate, req-show, impact, trace, tuple parser tests)
- Produces: full public API listed in File structure section

- [ ] **Step 1: Copy P1 modules into package**

```bash
cp -R src/product-spec/. packages/spec/src/
rm packages/spec/src/index.ts  # replace with re-exports
```

Create `packages/spec/src/index.ts` with the exact exports from File structure §`@storyboard/spec` public API.

- [ ] **Step 2: Write integration test for load + validate**

```ts
// packages/spec/src/__tests__/load-validate.test.ts
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadProductSpec, validateProductSpec } from '../index'

const fixtures = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'todo')

describe('loadProductSpec', () => {
  it('loads todo sample trio', async () => {
    const spec = await loadProductSpec(fixtures)
    const result = validateProductSpec(spec)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
```

Copy P1 sample JSON trio to `packages/spec/src/__tests__/fixtures/todo/`.

- [ ] **Step 3: Run tests**

Run: `npm test -w @storyboard/spec`
Expected: PASS

- [ ] **Step 4: Delete migrated `src/product-spec/`**

```bash
rm -rf src/product-spec
```

Update any root imports (should be none until CLI wires).

- [ ] **Step 5: Commit**

```bash
git add packages/spec src/product-spec
git commit -m "feat(spec): migrate product-spec engine to @storyboard/spec"
```

---

### Task 3: Storyboard mode detection

**Files:**
- Create: `packages/shell/src/vite/detect-mode.ts`
- Test: `packages/shell/src/vite/detect-mode.test.ts`

**Interfaces:**
- Produces: `detectStoryboardMode(root: string): 'mdx' | 'json'`
- Produces: `resolveStoryboardDir(root: string): string` — default `join(root, 'storyboard')`

- [ ] **Step 1: Write failing test**

```ts
// packages/shell/src/vite/detect-mode.test.ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { detectStoryboardMode } from './detect-mode'

describe('detectStoryboardMode', () => {
  it('returns json when only storyboard/spec.json exists', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-json-'))
    mkdirSync(join(root, 'storyboard'), { recursive: true })
    writeFileSync(join(root, 'storyboard', 'spec.json'), '{}')
    expect(detectStoryboardMode(root)).toBe('json')
  })

  it('returns mdx when src/content has mdx files', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-mdx-'))
    mkdirSync(join(root, 'src', 'content'), { recursive: true })
    writeFileSync(join(root, 'src', 'content', 'app.mdx'), '---\ntitle: App\n---\n')
    expect(detectStoryboardMode(root)).toBe('mdx')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @storyboard/shell -- detect-mode`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```ts
// packages/shell/src/vite/detect-mode.ts
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function resolveStoryboardDir(root: string): string {
  return join(root, 'storyboard')
}

export function detectStoryboardMode(root: string): 'mdx' | 'json' {
  const contentDir = join(root, 'src', 'content')
  if (existsSync(contentDir)) {
    const hasMdx = readdirSync(contentDir).some((name) => name.endsWith('.mdx'))
    if (hasMdx) return 'mdx'
  }
  return 'json'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w @storyboard/shell -- detect-mode`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shell/src/vite/detect-mode.ts packages/shell/src/vite/detect-mode.test.ts
git commit -m "feat(shell): detect mdx vs json storyboard mode"
```

---

### Task 4: JSON document loader for consumer repos

**Files:**
- Create: `packages/shell/src/vite/json-content-loader.ts`
- Create: `packages/shell/src/vite/storyboard-json-app.tsx`
- Test: `packages/shell/src/vite/json-content-loader.test.ts`

**Interfaces:**
- Consumes: `buildJsonDocument` from `packages/shell/src/json/build-json-document.ts` (moved in Task 5)
- Consumes: `jsonToWireframeDocumentBundle` from `packages/shell/src/json/to-document-bundle.ts`
- Produces: `loadJsonDocumentBundle(storyboardDir: string): WireframeDocumentBundle`

- [ ] **Step 1: Write failing test**

```ts
// packages/shell/src/vite/json-content-loader.test.ts
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { loadJsonDocumentBundle } from './json-content-loader'

const MIN_SPEC = {
  title: 'Todo',
  screens: [
    {
      id: 'home',
      title: 'Home',
      nodes: [['Text', 'Hello']],
    },
  ],
}

describe('loadJsonDocumentBundle', () => {
  it('builds bundle from storyboard/spec.json', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-load-'))
    const dir = join(root, 'storyboard')
    mkdirSync(dir)
    writeFileSync(join(dir, 'spec.json'), JSON.stringify(MIN_SPEC))
    const bundle = loadJsonDocumentBundle(dir)
    expect(bundle.slug).toBe('spec')
    expect(bundle.source).toBe('json')
    expect(bundle.routes).toHaveLength(1)
    expect(bundle.routes[0].id).toBe('home')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -w @storyboard/shell -- json-content-loader`
Expected: FAIL

- [ ] **Step 3: Implement loader**

```ts
// packages/shell/src/vite/json-content-loader.ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildJsonDocument } from '../json/build-json-document'
import { jsonToWireframeDocumentBundle } from '../json/to-document-bundle'
import type { WireframeDocumentBundle } from '../types/wireframe-document'

export function loadJsonDocumentBundle(storyboardDir: string): WireframeDocumentBundle {
  const raw = JSON.parse(readFileSync(join(storyboardDir, 'spec.json'), 'utf8')) as Record<
    string,
    unknown
  >
  const built = buildJsonDocument(raw)
  if (!built.ok) {
    const msg = built.errors.map((e) => e.message).join('; ')
    throw new Error(`Invalid storyboard/spec.json: ${msg}`)
  }
  return jsonToWireframeDocumentBundle(built.document, 'spec')
}
```

- [ ] **Step 4: Run test — expect PASS** (after Task 5 moves json modules)

Run: `npm test -w @storyboard/shell -- json-content-loader`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shell/src/vite/json-content-loader.ts packages/shell/src/vite/json-content-loader.test.ts
git commit -m "feat(shell): load wireframe bundle from storyboard/spec.json"
```

---

### Task 5: Extract shell + plugin into `@storyboard/shell`

**Files:**
- Move: `src/plugin/` → `packages/shell/src/plugin/`
- Move: `src/shell/` → `packages/shell/src/shell/`
- Move: `src/runtime/` → `packages/shell/src/runtime/`
- Move: `src/components/wireframe/` → `packages/shell/src/components/wireframe/`
- Move: `src/json/` → `packages/shell/src/json/`
- Move: `src/types/navigation.ts`, `src/types/wireframe-document.ts` → `packages/shell/src/types/`
- Move: `src/lib/app-url.ts`, `src/lib/app-routes.ts`, `src/lib/app-base-path.ts` → `packages/shell/src/lib/`
- Modify: all moved files — replace `@/` imports with relative or `packages/shell` internal aliases
- Create: `packages/shell/src/index.ts`
- Modify: root `src/MdxApp.tsx`, `src/shell/*` imports, `vite.config.ts`, `tsconfig.json`

**Interfaces:**
- Produces: `export { Shell } from './shell/Shell'`
- Produces: `export { wireframePlugin } from './plugin/wireframe-plugin'`
- Produces: `export { mdxVitePlugin } from './plugin/mdx-vite-plugin'`
- Produces: `export type { WireframeDocumentBundle } from './types/wireframe-document'`

- [ ] **Step 1: Configure `packages/shell/tsconfig.json` paths**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "paths": {
      "@shell/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Move directories** (single commit-worthy operation)

```bash
git mv src/plugin packages/shell/src/plugin
git mv src/shell packages/shell/src/shell
git mv src/runtime packages/shell/src/runtime
git mv src/components/wireframe packages/shell/src/components/wireframe
git mv src/json packages/shell/src/json
mkdir -p packages/shell/src/types packages/shell/src/lib
git mv src/types/navigation.ts packages/shell/src/types/
git mv src/types/wireframe-document.ts packages/shell/src/types/
git mv src/lib/app-url.ts packages/shell/src/lib/
git mv src/lib/app-routes.ts packages/shell/src/lib/
git mv src/lib/app-base-path.ts packages/shell/src/lib/
```

- [ ] **Step 3: Bulk-replace imports in moved files**

Replace `@/shell/` → relative or `@shell/shell/`, `@/types/wireframe-document` → `../types/wireframe-document`, etc. Run:

```bash
npm run fix
```

- [ ] **Step 4: Create `packages/shell/src/index.ts`**

```ts
export { Shell } from './shell/Shell'
export type { ShellProps } from './shell/Shell'
export { wireframePlugin } from './plugin/wireframe-plugin'
export { mdxVitePlugin } from './plugin/mdx-vite-plugin'
export type { WireframeDocumentBundle } from './types/wireframe-document'
export { detectStoryboardMode, resolveStoryboardDir } from './vite/detect-mode'
export { loadJsonDocumentBundle } from './vite/json-content-loader'
```

- [ ] **Step 5: Update root app imports**

In `src/MdxApp.tsx`:

```tsx
import { Shell } from '@storyboard/shell'
import { allContentDocumentsToBundles } from '@storyboard/shell/shell/adapters/content-documents'
```

(Adjust export path — prefer re-exporting adapters from package index if cleaner.)

In `vite.config.ts`:

```ts
import { mdxVitePlugin, wireframePlugin } from '@storyboard/shell'
```

- [ ] **Step 6: Verify OSS app still works**

Run: `npm run build && npm run check && npm test`
Expected: PASS (fix any broken import paths)

- [ ] **Step 7: Commit**

```bash
git add packages/shell src vite.config.ts tsconfig.json package.json
git commit -m "feat(shell): extract wireframe shell and plugin to @storyboard/shell"
```

---

### Task 6: `defineStoryboardConfig` + dev server factory

**Files:**
- Create: `packages/shell/src/vite/storyboard-config.ts`
- Create: `packages/shell/src/vite/create-dev-server.ts`
- Create: `packages/shell/template/index.html`
- Create: `packages/shell/template/main.tsx`
- Create: `packages/shell/template/StoryboardApp.tsx`
- Test: `packages/shell/src/vite/storyboard-config.test.ts`

**Interfaces:**
- Consumes: `detectStoryboardMode`, `loadJsonDocumentBundle`, `wireframePlugin`, `mdxVitePlugin`
- Produces: `defineStoryboardConfig(options: StoryboardConfigOptions): UserConfig`
- Produces: `createStoryboardDevServer(options): Promise<ViteDevServer>`

```ts
export type StoryboardConfigOptions = {
  root: string
  port?: number
  storyboardDir?: string
}
```

- [ ] **Step 1: Write failing test for json mode config**

```ts
// packages/shell/src/vite/storyboard-config.test.ts
import { describe, expect, it } from 'vitest'
import { defineStoryboardConfig } from './storyboard-config'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('defineStoryboardConfig', () => {
  it('sets root and plugins for json mode', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-cfg-'))
    mkdirSync(join(root, 'storyboard'), { recursive: true })
    writeFileSync(join(root, 'storyboard', 'spec.json'), '{"title":"T","screens":[]}')
    const config = defineStoryboardConfig({ root })
    expect(config.root).toBe(root)
    expect(config.plugins?.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Implement `defineStoryboardConfig`**

```ts
// packages/shell/src/vite/storyboard-config.ts
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import type { UserConfig } from 'vite'
import { mdxVitePlugin } from '../plugin/mdx-vite-plugin'
import { wireframePlugin } from '../plugin/wireframe-plugin'
import { detectStoryboardMode } from './detect-mode'

export type StoryboardConfigOptions = {
  root: string
  port?: number
  storyboardDir?: string
}

export function defineStoryboardConfig(options: StoryboardConfigOptions): UserConfig {
  const mode = detectStoryboardMode(options.root)
  const templateRoot = path.resolve(import.meta.dirname, '../../template')

  const plugins = [
    ...(mode === 'mdx' ? [wireframePlugin()] : []),
    {
      enforce: 'pre' as const,
      ...mdxVitePlugin({
        providerImportSource: path.resolve(templateRoot, 'mdx-components.ts'),
        remarkPlugins: [remarkFrontmatter],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ]

  return {
    root: options.root,
    plugins,
    server: { port: options.port ?? 5173 },
    resolve: {
      alias: {
        '@storyboard-app': path.join(options.root, '.storyboard', 'StoryboardApp.tsx'),
        '@storyboard/template': templateRoot,
      },
    },
  }
}
```

- [ ] **Step 3: Create template `StoryboardApp.tsx`**

```tsx
// packages/shell/template/StoryboardApp.tsx
import { Shell } from '../src/shell/Shell'
import { loadJsonDocumentBundle } from '../src/vite/json-content-loader'
import { resolveStoryboardDir } from '../src/vite/detect-mode'

const storyboardDir = resolveStoryboardDir(import.meta.env.STORYBOARD_ROOT ?? process.cwd())
const documents = [loadJsonDocumentBundle(storyboardDir)]

export function StoryboardApp() {
  return <Shell documents={documents} appDefaults={{ app: 'mdx' }} />
}
```

(JSON mode default; MDX mode template variant loads generated `contentDocuments` — add `StoryboardMdxApp.tsx` when mode is mdx, or generate `.storyboard/StoryboardApp.tsx` on `init`.)

- [ ] **Step 4: Implement `createStoryboardDevServer`**

```ts
// packages/shell/src/vite/create-dev-server.ts
import { createServer } from 'vite'
import { defineStoryboardConfig, type StoryboardConfigOptions } from './storyboard-config'

export async function createStoryboardDevServer(options: StoryboardConfigOptions) {
  const config = defineStoryboardConfig(options)
  return createServer(config)
}
```

- [ ] **Step 5: Run tests + manual smoke**

Run: `npm test -w @storyboard/shell -- storyboard-config`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/shell/src/vite packages/shell/template
git commit -m "feat(shell): add defineStoryboardConfig and dev server factory"
```

---

### Task 7: CLI scaffold + `validate` command

**Files:**
- Create: `packages/cli/src/cli.ts`
- Create: `packages/cli/src/bin/storyboard.ts`
- Create: `packages/cli/src/commands/validate.ts`
- Create: `packages/cli/src/resolve-project.ts`
- Test: `packages/cli/src/commands/validate.test.ts`

**Interfaces:**
- Consumes: `loadProductSpec`, `validateProductSpec` from `@storyboard/spec`
- Produces: `runValidate(opts: { cwd: string }): Promise<number>` — exit code

- [ ] **Step 1: Write failing validate test**

```ts
// packages/cli/src/commands/validate.test.ts
import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runValidate } from './validate'

it('returns 0 for valid todo fixture', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'sb-val-'))
  const fixture = join(import.meta.dirname, '../../../spec/src/__tests__/fixtures/todo')
  mkdirSync(join(cwd, 'storyboard'), { recursive: true })
  for (const file of ['spec.json', 'requirements.json', 'bindings.json']) {
    writeFileSync(join(cwd, 'storyboard', file), readFixture(fixture, file))
  }
  const code = await runValidate({ cwd })
  expect(code).toBe(0)
})

function readFixture(dir: string, file: string): string {
  return require('node:fs').readFileSync(join(dir, file), 'utf8')
}
```

- [ ] **Step 2: Implement `resolve-project.ts`**

```ts
// packages/cli/src/resolve-project.ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveStoryboardDir } from '@storyboard/shell'

export function resolveProjectPaths(cwd: string) {
  const storyboardDir = resolveStoryboardDir(cwd)
  if (!existsSync(join(storyboardDir, 'spec.json'))) {
    throw new Error(`No storyboard/spec.json found under ${cwd}`)
  }
  return { cwd, storyboardDir }
}
```

- [ ] **Step 3: Implement validate command**

```ts
// packages/cli/src/commands/validate.ts
import { loadProductSpec, validateProductSpec } from '@storyboard/spec'
import { resolveProjectPaths } from '../resolve-project'

export async function runValidate(opts: { cwd: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const result = validateProductSpec(spec)
  for (const issue of result.errors) {
    console.error(`error: ${issue.message}`)
  }
  for (const issue of result.warnings) {
    console.warn(`warn: ${issue.message}`)
  }
  if (result.ok) {
    console.log('storyboard validate: ok')
    return 0
  }
  return 1
}
```

- [ ] **Step 4: Wire commander**

```ts
// packages/cli/src/cli.ts
import { Command } from 'commander'
import { runValidate } from './commands/validate'

export function buildCli(): Command {
  const program = new Command()
    .name('storyboard')
    .description('Storyboard wireframe + product spec tooling')
    .version('0.1.0')

  program
    .command('validate')
    .description('Validate storyboard/ JSON cross-references')
    .action(async () => {
      const code = await runValidate({ cwd: process.cwd() })
      process.exitCode = code
    })

  return program
}
```

```ts
// packages/cli/src/bin/storyboard.ts
#!/usr/bin/env node
import { buildCli } from '../cli.js'

buildCli().parse()
```

- [ ] **Step 5: Run tests**

Run: `npm test -w storyboard -- validate`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/cli
git commit -m "feat(cli): add storyboard validate command"
```

---

### Task 8: `storyboard init` — embedded template

**Files:**
- Create: `packages/cli/src/commands/init.ts`
- Create: `packages/cli/src/templates/embedded/spec.json`
- Create: `packages/cli/src/templates/embedded/requirements.json`
- Create: `packages/cli/src/templates/embedded/bindings.json`
- Create: `packages/cli/src/templates/embedded/src/content/storyboard.mdx`
- Create: `packages/cli/src/templates/embedded/.storyboard/StoryboardApp.tsx` (MDX entry stub)
- Test: `packages/cli/src/commands/init.test.ts`

**Interfaces:**
- Produces: `runInit(opts: { cwd: string; template: 'embedded' | 'cloud' }): Promise<void>`

- [ ] **Step 1: Write failing init test**

```ts
// packages/cli/src/commands/init.test.ts
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { access } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { runInit } from './init'

describe('runInit embedded', () => {
  it('scaffolds storyboard/ and sample mdx', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'sb-init-'))
    await runInit({ cwd, template: 'embedded' })
    await expect(access(join(cwd, 'storyboard', 'spec.json'))).resolves.toBeUndefined()
    await expect(access(join(cwd, 'src', 'content', 'storyboard.mdx'))).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Copy P1 todo sample as embedded JSON trio** (trimmed)

Use P1 `fixtures/todo` content for `templates/embedded/*.json`.

Minimal `storyboard.mdx`:

```mdx
---
title: Storyboard
---

<Screen id="home" title="Home">
  <Text>Hello from Storyboard</Text>
</Screen>
```

- [ ] **Step 3: Implement init**

```ts
// packages/cli/src/commands/init.ts
import { cp, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export type InitTemplate = 'embedded' | 'cloud'

const templatesRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../templates')

export async function runInit(opts: { cwd: string; template: InitTemplate }): Promise<void> {
  const dest = opts.template === 'cloud' ? join(opts.cwd, 'todo-poc') : opts.cwd
  const src = join(templatesRoot, opts.template)

  try {
    await access(join(dest, 'storyboard', 'spec.json'))
    throw new Error('storyboard/ already exists — aborting init')
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
  }

  await mkdir(dest, { recursive: true })
  await cp(src, dest, { recursive: true })
  console.log(`Initialized ${opts.template} storyboard at ${dest}`)
}
```

- [ ] **Step 4: Register in CLI**

```ts
program
  .command('init')
  .option('--template <mode>', 'embedded or cloud', 'embedded')
  .action(async (opts: { template: string }) => {
    const template = opts.template === 'cloud' ? 'cloud' : 'embedded'
    await runInit({ cwd: process.cwd(), template })
  })
```

- [ ] **Step 5: Run tests**

Run: `npm test -w storyboard -- init`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/commands/init.ts packages/cli/src/templates/embedded
git commit -m "feat(cli): add storyboard init --template embedded"
```

---

### Task 9: `storyboard init --template cloud` stub

**Files:**
- Create: `packages/cli/src/templates/cloud/storyboard/` (JSON trio + DESIGN.md + ARCHITECTURE.md)
- Create: `packages/cli/src/templates/cloud/app/README.md` (TanStack Start placeholder — no full stack in P2)
- Modify: `packages/cli/src/commands/init.test.ts`

- [ ] **Step 1: Extend init test for cloud**

```ts
it('scaffolds todo-poc/ with app stub and design docs', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'sb-cloud-'))
  await runInit({ cwd, template: 'cloud' })
  await expect(access(join(cwd, 'todo-poc', 'storyboard', 'spec.json'))).resolves.toBeUndefined()
  await expect(access(join(cwd, 'todo-poc', 'DESIGN.md'))).resolves.toBeUndefined()
  await expect(access(join(cwd, 'todo-poc', 'ARCHITECTURE.md'))).resolves.toBeUndefined()
  await expect(access(join(cwd, 'todo-poc', 'app', 'README.md'))).resolves.toBeUndefined()
})
```

- [ ] **Step 2: Add cloud template files**

`DESIGN.md` — minimal style guide stub (wireframe primitives, no brand colors per AGENTS.md).

`ARCHITECTURE.md` — states TanStack Start + feature folders is P4; P2 is JSON spec + `storyboard dev` only.

`app/README.md`:

```md
# App (TanStack Start)

Placeholder for P4 cloud template. Use `storyboard dev` from `todo-poc/` to preview `storyboard/spec.json`.
```

- [ ] **Step 3: Run tests**

Run: `npm test -w storyboard -- init`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/templates/cloud packages/cli/src/commands/init.test.ts
git commit -m "feat(cli): add cloud init stub template"
```

---

### Task 10: `storyboard dev` command

**Files:**
- Create: `packages/cli/src/commands/dev.ts`
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/shell/template/main.tsx`, `index.html`

**Interfaces:**
- Consumes: `createStoryboardDevServer` from `@storyboard/shell`
- Produces: `runDev(opts: { cwd: string; port?: number }): Promise<number>`

- [ ] **Step 1: Create template entry files**

```html
<!-- packages/shell/template/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Storyboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

```tsx
// packages/shell/template/main.tsx
import { createRoot } from 'react-dom/client'
import { StoryboardApp } from './StoryboardApp'

createRoot(document.getElementById('root')!).render(<StoryboardApp />)
```

- [ ] **Step 2: Implement dev command**

```ts
// packages/cli/src/commands/dev.ts
import { createStoryboardDevServer } from '@storyboard/shell/vite/create-dev-server'
import { resolveProjectPaths } from '../resolve-project'

export async function runDev(opts: { cwd: string; port?: number }): Promise<number> {
  resolveProjectPaths(opts.cwd) // ensure storyboard/spec.json exists
  const server = await createStoryboardDevServer({
    root: opts.cwd,
    port: opts.port ?? 5173,
  })
  await server.listen()
  server.printUrls()
  return 0
}
```

- [ ] **Step 3: Register CLI**

```ts
program
  .command('dev')
  .option('-p, --port <number>', 'dev server port', '5173')
  .action(async (opts: { port: string }) => {
    const code = await runDev({ cwd: process.cwd(), port: Number(opts.port) })
    process.exitCode = code
  })
```

- [ ] **Step 4: Manual smoke in temp project**

```bash
cd $(mktemp -d)
npx --prefix /path/to/repo/packages/cli storyboard init
npx --prefix /path/to/repo/packages/cli storyboard dev
```

Open `http://localhost:5173` — Shell shows Preview with home screen from spec.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/dev.ts packages/shell/template
git commit -m "feat(cli): add storyboard dev command"
```

---

### Task 11: Wire `req show`, `impact`, `trace` CLI commands

**Files:**
- Create: `packages/cli/src/commands/req.ts`
- Create: `packages/cli/src/commands/impact.ts`
- Create: `packages/cli/src/commands/trace.ts`
- Modify: `packages/cli/src/cli.ts`

**Interfaces:**
- Consumes: `showReq`, `impact`, `traceReq` from `@storyboard/spec`
- CLI signatures per PRODUCT-SPEC §CLI:

```bash
storyboard req show BR-PASSWORD-VALIDATE
storyboard impact BR-PASSWORD-VALIDATE
storyboard trace SR-011
```

- [ ] **Step 1: Implement req show**

```ts
// packages/cli/src/commands/req.ts
import { loadProductSpec, showReq } from '@storyboard/spec'
import { resolveProjectPaths } from '../resolve-project'

export async function runReqShow(opts: { cwd: string; id: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const output = showReq(spec, opts.id)
  console.log(output)
  return 0
}
```

- [ ] **Step 2: Implement impact + trace** (same pattern — load spec, call `@storyboard/spec` helper, print JSON or formatted text)

```ts
// packages/cli/src/commands/impact.ts
export async function runImpact(opts: { cwd: string; target: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const result = impact(spec, opts.target)
  console.log(JSON.stringify(result, null, 2))
  return 0
}
```

```ts
// packages/cli/src/commands/trace.ts
export async function runTrace(opts: { cwd: string; target: string }): Promise<number> {
  const { storyboardDir } = resolveProjectPaths(opts.cwd)
  const spec = await loadProductSpec(storyboardDir)
  const implRoot = join(opts.cwd, 'src')
  const result = traceReq(spec, opts.target, { implRoot })
  console.log(JSON.stringify(result, null, 2))
  return 0
}
```

- [ ] **Step 3: Register subcommands**

```ts
const req = program.command('req').description('Requirement lookups')
req
  .command('show <id>')
  .action(async (id: string) => {
    process.exitCode = await runReqShow({ cwd: process.cwd(), id })
  })

program
  .command('impact <target>')
  .action(async (target: string) => {
    process.exitCode = await runImpact({ cwd: process.cwd(), target })
  })

program
  .command('trace <target>')
  .action(async (target: string) => {
    process.exitCode = await runTrace({ cwd: process.cwd(), target })
  })
```

- [ ] **Step 4: Integration test against todo fixture**

Run: `npm test -w storyboard`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands
git commit -m "feat(cli): wire req show, impact, and trace commands"
```

---

### Task 12: Root app dogfoods workspace packages

**Files:**
- Modify: root `package.json` — add `"@storyboard/shell": "workspace:*"`
- Modify: `src/MdxApp.tsx`, `src/playground/PlaygroundApp.tsx`, `vite.config.ts`
- Modify: `docs/CONTEXT.md` — note monorepo packages
- Modify: `docs/ROADMAP.md` — mark P2 items when done

- [ ] **Step 1: Add workspace dependency**

```json
"dependencies": {
  "@storyboard/shell": "workspace:*",
  ...
}
```

- [ ] **Step 2: Ensure playground + MDX paths import from package**

Playground stays in root `src/playground/` (not published in 0.1.0) but imports `Shell`, `buildJsonDocument` from `@storyboard/shell`.

- [ ] **Step 3: Full verification**

Run: `npm run build && npm run check && npm test`
Expected: PASS

- [ ] **Step 4: Update CONTEXT.md** (one paragraph under Tooling)

- [ ] **Step 5: Commit**

```bash
git add package.json src docs/CONTEXT.md
git commit -m "chore: dogfood @storyboard/shell from workspace"
```

---

### Task 13: Publish `0.1.0`

**Files:**
- Create: `packages/cli/README.md` (minimal — install + commands)
- Modify: each `package.json` — `publishConfig`, `repository`, `license`

- [ ] **Step 1: Check npm name availability**

Run: `npm view storyboard name 2>/dev/null || echo available`
If taken: rename CLI package to `@storyboard/cli`, keep bin name `storyboard`.

- [ ] **Step 2: Add prepublish scripts**

In each package:

```json
"scripts": {
  "prepublishOnly": "npm run build"
}
```

- [ ] **Step 3: Build all packages**

Run: `npm run build:packages`
Expected: `packages/*/dist` populated

- [ ] **Step 4: Dry-run publish**

Run: `npm publish -w @storyboard/spec --dry-run`
Run: `npm publish -w @storyboard/shell --dry-run`
Run: `npm publish -w storyboard --dry-run`
Expected: file lists include only `dist` + `template` (shell) — no `src/`

- [ ] **Step 5: Publish** (human gate — requires npm auth)

```bash
npm publish -w @storyboard/spec --access public
npm publish -w @storyboard/shell --access public
npm publish -w storyboard --access public
```

- [ ] **Step 6: Smoke from clean directory**

```bash
cd $(mktemp -d)
npx storyboard@0.1.0 init
npx storyboard@0.1.0 validate
```

- [ ] **Step 7: Update ROADMAP.md P2 status to ✓**

- [ ] **Step 8: Commit docs**

```bash
git add packages/*/README.md docs/ROADMAP.md
git commit -m "docs: P2 npm package publish checklist"
```

---

## Self-review

### Spec coverage

| ROADMAP / PRODUCT-SPEC requirement | Task |
|-----------------------------------|------|
| `@storyboard/spec` types, load, validate | Task 2 |
| `@storyboard/shell` dev server | Tasks 4–6, 10 |
| `storyboard` CLI bin | Tasks 7, 10–11 |
| `npx storyboard init` embedded | Task 8 |
| `npx storyboard init --template cloud` | Task 9 |
| `dev \| validate \| req show \| impact \| trace` | Tasks 7, 10–11 |
| Publish `0.1.0` unstable | Task 13 |
| P1 gate | Global Constraints + Task 2 |
| No production codegen | Global Constraints |
| MDX path in OSS / JSON cloud | Tasks 3, 5–6, 8–9 |

### Placeholder scan

No TBD steps. Task 2 explicitly blocks on P1 landing first.

### Type consistency

- `loadProductSpec(storyboardDir: string)` used consistently in validate, req, impact, trace
- `ValidationResult.ok` drives exit codes
- `detectStoryboardMode` returns `'mdx' | 'json'` throughout vite config

### Gap note

**P1 plan:** [`2026-06-30-p1-product-spec-engine.md`](2026-06-30-p1-product-spec-engine.md)

**MDX consumer entry:** Task 6 template defaults to JSON; embedded init should copy `.storyboard/StoryboardMdxApp.tsx` that imports generated routes — add sub-task during Task 8 if MDX `dev` in consumer repos is required for 0.1.0 (ROADMAP says MDX path stays in OSS — JSON-only `dev` may suffice for 0.1.0 cloud stub; embedded mode can document "use OSS repo pattern" until MDX consumer template is finished).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-30-p2-npm-package.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

**Recommended order:** Finish P1 first (types → loader → validate → CLI stubs in `src/product-spec/`), then Tasks 1–13 here.
