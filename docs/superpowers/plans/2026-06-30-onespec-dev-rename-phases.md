# OneSpec Dev Rename — Phased Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename npm packages from `@storyboard/*` to `@onespec-dev/*`, rebrand the CLI for publish, and optionally align on-disk conventions and docs — in **independent phases** you can ship between releases.

**Architecture:** Six phases with explicit gates. **Phases 1–2** are mechanical scope + CLI renames (safe to do immediately on `p2-npm-package`). **Phase 3** is publish hardening (required before `npm publish`, not a rename). **Phases 4–6** are optional follow-ups you can defer without blocking 0.1.0.

**Tech Stack:** npm workspaces, TypeScript 6, existing `packages/{spec,shell,cli}` layout from [`2026-06-30-p2-npm-package.md`](2026-06-30-p2-npm-package.md).

**Base branch:** `p2-npm-package` (14 commits, pushed `e9babf1..c0a5e6a`).

## Locked decisions (2026-06-30)

| Item | Value |
|------|--------|
| npm org / scope | `@onespec-dev` |
| Package names | `@onespec-dev/spec`, `@onespec-dev/shell`, `@onespec-dev/cli` |
| CLI bin name | `onespec` (not `onespec-dev`) |
| Published install | `npx @onespec-dev/cli@0.1.0` |
| Domain (docs only until site exists) | `https://onespec.dev` |
| Consumer spec directory (Phase 4) | **`onespec/`** — deferred; Phase 1–3 keep `storyboard/` |

## Global Constraints

- **Gate:** Run `npm run build` + `npm run check` + `npm test` after every phase before claiming done.
- **Gate:** Run package tests: `npm test -w @onespec-dev/spec -w @onespec-dev/shell -w @onespec-dev/cli` when packages change.
- Do not hand-edit `src/generated/`; run codegen via `npm run codegen`.
- Min diff — rename only what the phase owns; no unrelated refactors.
- Biome excludes `src/generated/`, `*.mdx`, `packages/*/dist/`.
- Subagents: **composer-2.5 only** (never composer-2.5-fast) per `AGENTS.md`.
- Phases are **sequential within a phase** but **phases 4–6 do not block phases 1–3**.

## Phase map

```
Phase 1  npm scope (@storyboard → @onespec-dev)     ← execute now (pre-publish)
Phase 2  CLI bin + command surface (storyboard → onespec)  ← execute now
Phase 3  Publish hardening (dist exports, tarball)   ← execute before npm publish
Phase 4  Consumer directory (storyboard/ → onespec/) ← later (breaking)
Phase 5  Internal API / file renames                 ← later (0.x OK)
Phase 6  Product brand docs + onespec.dev            ← later (marketing)
```

---

## Phase 1: npm scope rename

**Outcome:** All workspace packages resolve as `@onespec-dev/*`. CLI bin and user-facing strings unchanged (`storyboard` command still works until Phase 2).

**Files (modify):**

| File | Change |
|------|--------|
| `packages/spec/package.json` | `"name": "@onespec-dev/spec"` |
| `packages/shell/package.json` | `"name": "@onespec-dev/shell"`; deps `@onespec-dev/*` if any |
| `packages/cli/package.json` | `"name": "@onespec-dev/cli"`; deps → `@onespec-dev/spec`, `@onespec-dev/shell` |
| `package.json` | `"@storyboard/shell": "workspace:*"` → `"@onespec-dev/shell": "workspace:*"`; `build:packages -w` flags |
| `package-lock.json` | Regenerate via `npm install` |
| `packages/spec/vitest.config.ts` | alias `@onespec-dev/shell/...` |
| `vitest.config.ts` | workspace package paths if present |
| `tsconfig.json`, `tsconfig.app.json` | paths referencing `@storyboard/*` |
| All `import ... from '@storyboard/...'` | → `@onespec-dev/...` (~35 source files; exclude `node_modules/`, `dist/`) |

**Import grep (run before edit):**

```bash
rg '@storyboard' --glob '!node_modules/**' --glob '!**/dist/**' -l
```

### Task 1.1: Rename package.json names and workspace deps

- [ ] **Step 1: Update the three package manifests**

`packages/spec/package.json`:

```json
{
  "name": "@onespec-dev/spec",
  "version": "0.1.0"
}
```

`packages/shell/package.json`:

```json
{
  "name": "@onespec-dev/shell",
  "version": "0.1.0"
}
```

`packages/cli/package.json`:

```json
{
  "name": "@onespec-dev/cli",
  "dependencies": {
    "@onespec-dev/spec": "0.1.0",
    "@onespec-dev/shell": "0.1.0"
  }
}
```

- [ ] **Step 2: Update root package.json workspace refs**

```json
"dependencies": {
  "@onespec-dev/shell": "workspace:*"
},
"scripts": {
  "build:packages": "npm run build -w @onespec-dev/shell && npm run build -w @onespec-dev/spec -w @onespec-dev/cli"
}
```

- [ ] **Step 3: Regenerate lockfile**

Run: `npm install`
Expected: `node_modules/@onespec-dev/{spec,shell,cli}` symlinks exist

- [ ] **Step 4: Commit**

```bash
git add packages/*/package.json package.json package-lock.json
git commit -m "chore: rename npm scope to @onespec-dev"
```

### Task 1.2: Bulk-replace import paths

**Interfaces:**
- Consumes: Task 1.1 package names
- Produces: zero `@storyboard/` imports in source (except historical docs/plans until Phase 6)

- [ ] **Step 1: Replace imports in packages/**

Run:

```bash
rg -l '@storyboard/' packages --glob '!**/dist/**' | xargs sed -i '' 's/@storyboard\//@onespec-dev\//g'
```

(macOS `sed -i ''`; on Linux use `sed -i` without `''`)

- [ ] **Step 2: Replace imports in root src/** and config**

Files known to import `@storyboard/shell`:

- `src/MdxApp.tsx`
- `src/App.tsx`
- `src/adapters/*.ts`
- `src/playground/*.tsx`
- `src/mdx-playground/*.tsx`
- `src/mdx-components.ts`
- `src/lib/navigate-app.ts`
- `vite.config.ts`
- `vitest.config.ts`
- `tsconfig.json`, `tsconfig.app.json`

Also update `packages/spec/src/load.ts`:

```ts
import { buildJsonDocument } from '@onespec-dev/shell/json/build-json-document'
```

Update `packages/cli/src/resolve-project.ts`:

```ts
import { resolveStoryboardDir } from '@onespec-dev/shell/detect-mode'
```

Update `packages/cli/src/storyboard-shell-vite.d.ts` module declarations to `@onespec-dev/shell/vite`.

Update `packages/shell/src/plugin/generate.ts` emitted import:

```ts
// from '@storyboard/shell/...' → '@onespec-dev/shell/...'
```

- [ ] **Step 3: Regenerate MDX codegen**

Run: `npm run codegen`
Expected: `src/generated/**/screens.generated.tsx` imports `@onespec-dev/shell/...`

- [ ] **Step 4: Verify**

Run: `npm run build && npm run check && npm test`
Run: `npm test -w @onespec-dev/spec -w @onespec-dev/shell -w @onespec-dev/cli`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: update imports to @onespec-dev scope"
```

### Task 1.3: Update active docs (minimal)

**Files:**
- Modify: `docs/CONTEXT.md`, `docs/ROADMAP.md`, `packages/cli/README.md`

- [ ] **Step 1: Replace `@storyboard/` → `@onespec-dev/` in those three files only**

Do **not** rewrite product narrative yet (Phase 6).

- [ ] **Step 2: Commit**

```bash
git add docs/CONTEXT.md docs/ROADMAP.md packages/cli/README.md
git commit -m "docs: update package names to @onespec-dev"
```

**Phase 1 done when:** `rg '@storyboard' --glob '!node_modules/**' --glob '!docs/superpowers/**' --glob '!.superpowers/**'` returns only intentional historical references (ideally zero in `packages/` and `src/`).

---

## Phase 2: CLI bin and command surface

**Outcome:** Users run `onespec validate`, `npm run onespec -- init`. Published bin is `onespec`.

**Files:**

| From | To |
|------|-----|
| `packages/cli/src/bin/storyboard.ts` | `packages/cli/src/bin/onespec.ts` |
| `packages/cli/package.json` `"bin"` | `"onespec": "./dist/bin/onespec.js"` |
| Root `package.json` script `"storyboard"` | `"onespec"` |
| `packages/cli/src/cli.ts` `.name('storyboard')` | `.name('onespec')` |
| CLI output strings | `onespec validate: ok` |

### Task 2.1: Rename bin entrypoint

- [ ] **Step 1: Move bin file**

```bash
git mv packages/cli/src/bin/storyboard.ts packages/cli/src/bin/onespec.ts
```

Content stays:

```ts
#!/usr/bin/env node
import { buildCli } from '../cli.js'

buildCli().parse()
```

- [ ] **Step 2: Update packages/cli/package.json**

```json
"bin": {
  "onespec": "./dist/bin/onespec.js"
}
```

- [ ] **Step 3: Update root package.json**

```json
"scripts": {
  "onespec": "tsx packages/cli/src/bin/onespec.ts"
}
```

Remove the old `"storyboard"` script key.

- [ ] **Step 4: Update AGENTS.md Commands block**

Replace:

```bash
npm run storyboard  # validate | req show | impact | trace
```

With:

```bash
npm run onespec  # init | dev | validate | req show | impact | trace
```

- [ ] **Step 5: Build and smoke**

Run: `npm run build -w @onespec-dev/cli`
Run: `npm run onespec -- --help`
Expected: shows `onespec` as program name

- [ ] **Step 6: Commit**

```bash
git add packages/cli packages/cli/package.json package.json AGENTS.md
git commit -m "feat(cli): rename bin to onespec"
```

### Task 2.2: Update CLI user-facing strings

**Files:**
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/cli/src/commands/validate.ts`
- Modify: `packages/cli/src/commands/*.ts` (description strings only)
- Modify: `packages/cli/README.md`
- Test: `packages/cli/src/commands/validate.test.ts` (if asserts output text)

- [ ] **Step 1: Commander program name**

```ts
const program = new Command()
  .name('onespec')
  .description('OneSpec wireframe + product spec tooling')
  .version('0.1.0')
```

- [ ] **Step 2: Success message in validate**

```ts
console.log('onespec validate: ok')
```

- [ ] **Step 3: Update README install examples**

```bash
npx @onespec-dev/cli@0.1.0 init
npx @onespec-dev/cli@0.1.0 validate
npx @onespec-dev/cli@0.1.0 dev
```

- [ ] **Step 4: Run tests**

Run: `npm test -w @onespec-dev/cli`

- [ ] **Step 5: Commit**

```bash
git add packages/cli AGENTS.md
git commit -m "feat(cli): rebrand command output to onespec"
```

**Phase 2 done when:** `npm run onespec -- validate` works from a dir with `storyboard/spec.json`; `--help` shows `onespec`.

---

## Phase 3: Publish hardening

**Outcome:** `npm publish --dry-run` succeeds for all three packages; tarballs contain usable `dist/` + templates.

**Depends on:** Phases 1–2 complete.

**Not a rename** — fixes gaps from P2 final branch review. Execute before human `npm publish`.

### Task 3.1: Shell dist exports

**Files:**
- Modify: `packages/shell/package.json` — point `main`/`exports` at `./dist/*`
- Modify: `packages/shell/tsconfig.build.json` — include full runtime (`shell/`, `runtime/`, `components/`, `vite/`)
- Modify: `packages/shell/src/index.ts` — ensure all public API compiles to dist

- [ ] **Step 1: Expand tsconfig.build.json include**

```json
"include": [
  "src/json/**/*",
  "src/plugin/**/*",
  "src/types/**/*",
  "src/vite/**/*",
  "src/shell/**/*",
  "src/runtime/**/*",
  "src/components/**/*",
  "src/lib/app-url.ts",
  "src/lib/app-routes.ts",
  "src/lib/app-base-path.ts"
]
```

Keep `@/*` paths alias to `../../src/*` for shadcn until Phase 5 vendoring.

- [ ] **Step 2: Retarget package.json exports**

```json
"main": "./dist/index.js",
"types": "./dist/index.d.ts",
"exports": {
  ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
  "./vite": { "types": "./dist/vite/index.d.ts", "import": "./dist/vite/index.js" },
  "./detect-mode": { "types": "./dist/vite/detect-mode.d.ts", "import": "./dist/vite/detect-mode.js" },
  "./json/build-json-document": { "types": "./dist/json/build-json-document.d.ts", "import": "./dist/json/build-json-document.js" }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build -w @onespec-dev/shell`
Expected: `dist/shell/Shell.js`, `dist/vite/create-dev-server.js` exist

- [ ] **Step 4: Commit**

```bash
git add packages/shell
git commit -m "fix(shell): compile full public API to dist for publish"
```

### Task 3.2: CLI vitest aliases + template copy fix

**Files:**
- Modify: `packages/cli/vitest.config.ts` — add `@onespec-dev/spec`, `@onespec-dev/shell` aliases
- Modify: `packages/cli/package.json` build script

- [ ] **Step 1: Fix template copy (avoid nested templates/templates)**

```json
"build": "tsc -p tsconfig.json && rm -rf dist/templates && cp -r src/templates dist/templates"
```

- [ ] **Step 2: Add vitest resolve aliases** (mirror `packages/spec/vitest.config.ts` pattern)

- [ ] **Step 3: Run CLI tests**

Run: `npm test -w @onespec-dev/cli`
Expected: all pass (validate + init + req)

- [ ] **Step 4: Commit**

```bash
git add packages/cli
git commit -m "fix(cli): vitest aliases and template dist copy"
```

### Task 3.3: Dry-run publish gate

- [ ] **Step 1: Add homepage to each package.json**

```json
"homepage": "https://onespec.dev"
```

- [ ] **Step 2: gitignore tsbuildinfo**

Add to root `.gitignore`:

```
*.tsbuildinfo
```

Remove tracked `packages/shell/tsconfig.tsbuildinfo` if present.

- [ ] **Step 3: Dry-run all packages**

```bash
npm publish -w @onespec-dev/shell --dry-run
npm publish -w @onespec-dev/spec --dry-run
npm publish -w @onespec-dev/cli --dry-run
```

Expected: file lists include `dist/` + `template/` (shell), no `src/` in tarball

- [ ] **Step 4: Full verification**

Run: `npm run build && npm run check && npm test`

- [ ] **Step 5: Update ROADMAP P2 → ✓ (publish-ready)**

- [ ] **Step 6: Commit**

```bash
git add .gitignore packages/*/package.json docs/ROADMAP.md
git commit -m "chore: publish prep for @onespec-dev 0.1.0"
```

**Phase 3 done when:** all three dry-runs pass; human can run `npm publish -w ... --access public`.

**Human gate (not automated):**

```bash
npm publish -w @onespec-dev/shell --access public
npm publish -w @onespec-dev/spec --access public
npm publish -w @onespec-dev/cli --access public
```

Publish order: **shell → spec → cli**.

---

## Phase 4: Consumer directory rename (`storyboard/` → `onespec/`)

**Outcome:** Init scaffolds `onespec/spec.json`; CLI resolves `onespec/` instead of `storyboard/`.

**Breaking:** Yes — any repo using `storyboard/` must rename the folder.

**Execute when:** You accept breaking the on-disk convention for 0.2.0+.

### Task 4.1: Core resolver rename

**Files:**
- Rename: `packages/shell/src/vite/detect-mode.ts` — `resolveStoryboardDir` → `resolveOnespecDir`, path `'storyboard'` → `'onespec'`
- Rename: `packages/spec/src/cli/resolve-storyboard-dir.ts` → `resolve-onespec-dir.ts`
- Modify: `packages/cli/src/resolve-project.ts`
- Modify: `packages/spec/src/load.ts` (parameter names/docs only; API stays `loadProductSpec(dir)`)

- [ ] **Step 1: Write failing test**

```ts
// packages/shell/src/vite/detect-mode.test.ts
it('resolveOnespecDir returns join(root, "onespec")', () => {
  expect(resolveOnespecDir('/tmp/app')).toBe('/tmp/app/onespec')
})
```

- [ ] **Step 2: Implement**

```ts
export function resolveOnespecDir(root: string): string {
  return join(root, 'onespec')
}
```

Keep `resolveStoryboardDir` as deprecated alias for one release if desired:

```ts
/** @deprecated Use resolveOnespecDir */
export const resolveStoryboardDir = resolveOnespecDir
```

- [ ] **Step 3: Update init templates**

Move:

```bash
git mv packages/cli/src/templates/embedded/storyboard packages/cli/src/templates/embedded/onespec
git mv packages/cli/src/templates/cloud/storyboard packages/cli/src/templates/cloud/onespec
```

Update `init.ts` guard: `existsSync(join(dest, 'onespec', 'spec.json'))`.

- [ ] **Step 4: Update all tests + snapshots**

Run: `npm test -w @onespec-dev/cli -- init -u` (update snapshots)

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: rename consumer spec directory to onespec/"
```

### Task 4.2: PRODUCT-SPEC.md schema path

**Files:**
- Modify: `docs/PRODUCT-SPEC.md` — all `storyboard/` path examples → `onespec/`
- Modify: `docs/JSON-COMPONENTS.md`, `AGENTS.md` if they reference `storyboard/`

- [ ] **Step 1: Replace path convention in PRODUCT-SPEC**

Every:

```
storyboard/spec.json
storyboard/requirements.json
storyboard/bindings.json
```

→ `onespec/...`

- [ ] **Step 2: Bump plan/roadmap note** — 0.2.0 breaking change

- [ ] **Step 3: Commit**

```bash
git add docs/PRODUCT-SPEC.md docs/JSON-COMPONENTS.md
git commit -m "docs: rename spec directory convention to onespec/"
```

**Phase 4 done when:** `onespec init` creates `onespec/spec.json`; `onespec validate` passes.

---

## Phase 5: Internal API and file renames

**Outcome:** Code reads `OneSpec` / `onespec` instead of `Storyboard` in internal identifiers. **No user-facing behavior change** beyond Phase 2/4.

**Execute when:** You want codebase consistency; safe in 0.x.

| From | To |
|------|-----|
| `storyboard-config.ts` | `onespec-config.ts` |
| `defineStoryboardConfig` | `defineOnespecConfig` |
| `createStoryboardDevServer` | `createOnespecDevServer` |
| `StoryboardApp.tsx` | `OnespecApp.tsx` |
| `@storyboard-app` alias | `@onespec-app` |
| `@storyboard/template` | `@onespec/template` |
| `STORYBOARD_ROOT` env | `ONESPEC_ROOT` |
| `storyboard-shell-vite.d.ts` | `onespec-shell-vite.d.ts` |
| `packages/cli/src/bin/onespec.ts` | (already done Phase 2) |

### Task 5.1: Vite config module rename

- [ ] **Step 1: git mv files**

```bash
git mv packages/shell/src/vite/storyboard-config.ts packages/shell/src/vite/onespec-config.ts
git mv packages/shell/src/vite/storyboard-config.test.ts packages/shell/src/vite/onespec-config.test.ts
git mv packages/shell/template/StoryboardApp.tsx packages/shell/template/OnespecApp.tsx
```

- [ ] **Step 2: Rename exports in onespec-config.ts**

```ts
export type OnespecConfigOptions = { root: string; port?: number; onespecDir?: string }
export function defineOnespecConfig(options: OnespecConfigOptions): UserConfig
```

- [ ] **Step 3: Update create-dev-server.ts, vite/index.ts, shell index re-exports**

- [ ] **Step 4: Update env define**

```ts
define: { 'import.meta.env.ONESPEC_ROOT': JSON.stringify(options.root) }
```

- [ ] **Step 5: Run tests + commit**

Run: `npm test -w @onespec-dev/shell`
Commit: `refactor(shell): rename storyboard vite config to onespec`

### Task 5.2: Template aliases

- [ ] **Step 1: Update onespec-config aliases**

```ts
{ find: '@onespec-app', replacement: path.join(options.root, '.onespec', 'OnespecApp.tsx') }
{ find: '@onespec/template', replacement: templateRoot }
```

- [ ] **Step 2: Update template/main.tsx imports**

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(shell): rename template aliases to @onespec-*"
```

**Phase 5 done when:** `rg 'Storyboard|storyboard-config|STORYBOARD_ROOT' packages --glob '!**/dist/**'` returns zero (except git history / comments you choose to keep).

---

## Phase 6: Product brand and domain

**Outcome:** Docs say **OneSpec** (onespec.dev); GitHub links updated; MDX content slug optional.

**Execute when:** Marketing/site ready; does not block npm.

### Task 6.1: Core docs rebrand

**Files:**
- Modify: `README.md`, `docs/VISION.md`, `docs/CONTEXT.md`, `docs/ROADMAP.md`
- Modify: `docs/PRODUCT-SPEC.md` intro (product name, not path convention if Phase 4 deferred)

- [ ] **Step 1: Replace product name "Storyboard" → "OneSpec"** in those files (keep repo name `Storyboard` on GitHub until repo rename)

- [ ] **Step 2: Add onespec.dev links**

```markdown
Site: https://onespec.dev
```

- [ ] **Step 3: Commit**

```bash
git commit -m "docs: rebrand product to OneSpec (onespec.dev)"
```

### Task 6.2: Init template copy

**Files:**
- Modify: `packages/cli/src/templates/cloud/DESIGN.md`, `ARCHITECTURE.md`, `app/README.md`

- [ ] **Step 1: Replace "storyboard dev" → "onespec dev" in template prose**

- [ ] **Step 2: Commit**

```bash
git commit -m "docs(templates): update cloud stub copy for OneSpec"
```

### Task 6.3 (optional): MDX document slug

**Breaking for URLs:** `/mdx/storyboard/...` → `/mdx/onespec/...`

Only if you want URL alignment:

- [ ] Rename `src/content/storyboard.mdx` → `onespec.mdx` (or add alias doc)
- [ ] Run codegen; update tests referencing slug `storyboard`

**Defer by default** — MDX slug is unrelated to npm org.

**Phase 6 done when:** README + VISION describe OneSpec; package `homepage` fields point to onespec.dev.

---

## Self-review

### Spec coverage

| Requirement | Phase |
|-------------|-------|
| npm org `@onespec-dev` | 1 |
| CLI bin `onespec` | 2 |
| `npx @onespec-dev/cli` install path | 2, 3 |
| Publish 0.1.0 unstable | 3 (human publish) |
| Consumer `onespec/` directory | 4 (optional) |
| Internal API consistency | 5 (optional) |
| onespec.dev domain in docs | 6 (optional) |
| P2 publish hardening | 3 |

### Placeholder scan

No TBD steps. Phase 4 breaking change and Phase 6 MDX slug called out as explicit decision gates.

### Type consistency

- Phase 1: `@onespec-dev/shell/detect-mode` export path preserved from P2
- Phase 4: `resolveOnespecDir` replaces `resolveStoryboardDir` in CLI; optional deprecated alias documented
- Phase 5: `defineOnespecConfig` / `OnespecConfigOptions` used consistently in create-dev-server

### Recommended execution order

| When | Phases |
|------|--------|
| **Now** (before publish) | 1 → 2 → 3 |
| **0.2.0** | 4 (if breaking dir OK) |
| **Anytime 0.x** | 5, 6 |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-30-onespec-dev-rename-phases.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

**Suggested first dispatch:** Phase 1 Task 1.1 on branch `p2-npm-package` (or a child branch `onespec-dev-rename`).
