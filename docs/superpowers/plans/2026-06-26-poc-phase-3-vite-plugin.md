# Phase 3: Vite Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate codegen into the Vite dev pipeline so `npm run dev` watches `wireframe.mdx`, regenerates `src/generated/` on startup and save, and triggers HMR.

**Architecture:** `wireframePlugin` calls `runCodegen` from Phase 2 in `buildStart` and on MDX `handleHotUpdate`. Generated files are written to disk under `src/generated/`. Plugin state exposes last error for the shell (Phase 4). `tsconfig.node.json` includes `src/plugin/` for Vite config imports.

**Tech Stack:** Vite 8 plugin API, Node `fs`, Phase 2 codegen modules

**Prerequisite:** [Phase 2](./2026-06-26-poc-phase-2-codegen-core.md) complete.

**Definition of Done:** See [overview § Phase 3](./2026-06-26-poc-overview.md#phase-3-vite-plugin).

---

## File structure (this phase)

| File | Responsibility |
|------|----------------|
| `src/plugin/wireframe-plugin.ts` | Vite plugin: watch, codegen, HMR, error state |
| `src/plugin/paths.ts` | Resolved paths for MDX input and generated output |
| `vite.config.ts` | Register wireframe plugin |
| `tsconfig.node.json` | Include plugin sources |
| `.gitignore` | Ignore `src/generated/` |

---

### Task 1: Path constants

**Files:**
- Create: `src/plugin/paths.ts`

- [ ] **Step 1: Implement paths module**

```ts
import { resolve } from 'node:path'

export const WIREFRAME_MDX = 'src/content/wireframe.mdx'
export const GENERATED_DIR = 'src/generated'

export function resolveWireframePath(root: string): string {
  return resolve(root, WIREFRAME_MDX)
}

export function resolveGeneratedDir(root: string): string {
  return resolve(root, GENERATED_DIR)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/plugin/paths.ts
git commit -m "chore: add wireframe path constants for vite plugin"
```

---

### Task 2: Wireframe Vite plugin

**Files:**
- Create: `src/plugin/wireframe-plugin.ts`

- [ ] **Step 1: Implement plugin**

```ts
import { readFile } from 'node:fs/promises'
import type { Plugin, ViteDevServer } from 'vite'
import { runCodegen } from './codegen'
import type { CodegenError } from './types'
import { resolveGeneratedDir, resolveWireframePath, WIREFRAME_MDX } from './paths'

export type WireframePluginState = {
  lastError: CodegenError | null
}

export function wireframePlugin(): Plugin {
  let root = process.cwd()
  let devServer: ViteDevServer | undefined
  const state: WireframePluginState = { lastError: null }

  async function regenerate(): Promise<boolean> {
    const mdxPath = resolveWireframePath(root)
    const outDir = resolveGeneratedDir(root)

    let source: string
    try {
      source = await readFile(mdxPath, 'utf8')
    } catch {
      state.lastError = null
      console.warn(`[wireframe] No wireframe MDX at ${WIREFRAME_MDX} — skipping codegen`)
      return false
    }

    const result = await runCodegen(source, outDir)
    if (!result.ok) {
      state.lastError = result.error
      console.error(`[wireframe] Codegen failed: ${result.error.message}`)
      return false
    }

    state.lastError = null
    console.log(`[wireframe] Generated ${result.screens.length} screen(s)`)
    return true
  }

  return {
    name: 'wireframe-codegen',
    enforce: 'pre',

    configureServer(server) {
      devServer = server
    },

    configResolved(config) {
      root = config.root
    },

    async buildStart() {
      await regenerate()
    },

    async handleHotUpdate({ file, server }) {
      if (!file.endsWith('.mdx') || !file.includes('/content/')) {
        return
      }
      const ok = await regenerate()
      if (!ok) return

      const generatedDir = resolveGeneratedDir(root)
      const modules = [
        ...server.moduleGraph.getModulesByFile(`${generatedDir}/screens.generated.tsx`) ?? [],
        ...server.moduleGraph.getModulesByFile(`${generatedDir}/routes.generated.tsx`) ?? [],
        ...server.moduleGraph.getModulesByFile(`${generatedDir}/screens-map.generated.ts`) ?? [],
      ]
      for (const mod of modules) {
        server.moduleGraph.invalidateModule(mod)
      }
      server.ws.send({ type: 'full-reload' })
      return []
    },

    // Expose state for shell error banner (Phase 4)
    wireframeState: state,
  } as Plugin & { wireframeState: WireframePluginState }
}
```

Note: `wireframeState` on plugin instance is accessed from shell via `import.meta.hot` or a shared module. Simpler POC approach — export a singleton:

Create `src/plugin/plugin-state.ts`:

```ts
import type { CodegenError } from './types'

export const wireframePluginState = {
  lastError: null as CodegenError | null,
}
```

Update `regenerate()` to set `wireframePluginState.lastError` instead of local `state`.

- [ ] **Step 2: Verify plugin compiles**

Run: `npm run build`
Expected: May fail if `App.tsx` imports missing generated files — expected until Phase 4/5. Verify plugin file itself has no TS errors via `npx tsc -p tsconfig.node.json --noEmit` after updating tsconfig.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/wireframe-plugin.ts src/plugin/plugin-state.ts
git commit -m "feat: add Vite wireframe codegen plugin"
```

---

### Task 3: Vite config integration

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.node.json`

- [ ] **Step 1: Update tsconfig.node.json include**

Ensure `"include": ["vite.config.ts", "src/plugin/**/*.ts"]` (no `.tsx` in plugin for this phase).

- [ ] **Step 2: Register plugin in vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { wireframePlugin } from './src/plugin/wireframe-plugin'

export default defineConfig({
  plugins: [
    wireframePlugin(),
    { enforce: 'pre', ...mdx() },
    react({
      include: /\.(jsx|js|mdx|md|tsx|ts)$/,
    }),
    tailwindcss(),
  ],
})
```

Plugin runs **before** MDX rollup so generated `Screens` exists when MDX compiles.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts tsconfig.node.json
git commit -m "chore: register wireframe codegen plugin in Vite config"
```

---

### Task 4: Gitignore and stub wireframe MDX

**Files:**
- Modify: `.gitignore`
- Create: `src/content/wireframe.mdx` (minimal stub for plugin testing)

- [ ] **Step 1: Gitignore generated output**

Add to `.gitignore`:

```
src/generated/
```

- [ ] **Step 2: Create minimal wireframe.mdx for dev testing**

```mdx
<Screen id="home" title="Home">
  <Text>Welcome back</Text>
  <Link goto="login">Login</Link>
</Screen>

<Screen id="login" title="Login">
  <Text>Sign in to continue</Text>
  <Link goto="home">Back</Link>
</Screen>
```

Use string literals for `goto` until generated `Screens` exists on first run; Phase 5 upgrades to `Screens.*`.

- [ ] **Step 3: Commit**

```bash
git add .gitignore src/content/wireframe.mdx
git commit -m "chore: gitignore generated output and add stub wireframe.mdx"
```

---

### Task 5: Verify dev watcher

**Files:** None (verification)

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Terminal shows `[wireframe] Generated 2 screen(s)`
Expected: `src/generated/screens.generated.tsx`, `routes.generated.tsx`, `screens-map.generated.ts` exist locally (not committed)

- [ ] **Step 2: Test HMR on MDX edit**

Add a third screen to `wireframe.mdx`:

```mdx
<Screen id="signup" title="Sign up">
  <Text>Create your account</Text>
  <Link goto="home">Back</Link>
</Screen>
```

Save file.
Expected: Terminal shows regenerated 3 screens; browser reloads without manual restart.

- [ ] **Step 3: Test duplicate ID error**

Change two screens to `id="home"`.
Save file.
Expected: Terminal error `[wireframe] Codegen failed: Duplicate screen id "home"`; previous generated files not overwritten with bad data.

Revert duplicate before continuing.

- [ ] **Step 4: Commit verification notes only if code changed**

---

### Task 6: Build-time codegen

**Files:**
- Modify: `src/plugin/wireframe-plugin.ts` (confirm `buildStart` runs on production build)

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Plugin runs in `buildStart`, generates files, TypeScript build succeeds.

If `App.tsx` still imports `welcome.mdx` and not generated routes, build may fail until Phase 4 — document as expected blocker.

- [ ] **Step 2: Confirm Phase 3 DoD**

Check every item in [overview § Phase 3 DoD](./2026-06-26-poc-overview.md#phase-3-vite-plugin).

Proceed to [Phase 4](./2026-06-26-poc-phase-4-dev-shell.md).

---

## Self-review

| POC requirement | Task |
|-----------------|------|
| Watcher inside Vite pipeline | Task 2–3 |
| Startup + save regeneration | Task 2, 5 |
| HMR for generated files | Task 2 |
| src/generated/ gitignored | Task 4 |
| Duplicate ID terminal error | Task 5 |
