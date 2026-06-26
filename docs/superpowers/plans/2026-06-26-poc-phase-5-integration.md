# Phase 5: Integration & Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalize the POC example wireframe, remove scaffold artifacts, ensure CI build/lint pass, and verify all acceptance criteria from `docs/POC.md`.

**Architecture:** No new subsystems — polish, cleanup, and end-to-end validation. `wireframe.mdx` becomes the canonical POC spec. `welcome.mdx` and `MdxButton` are removed. Build pipeline runs codegen before TypeScript check.

**Tech Stack:** Full stack from Phases 1–4

**Prerequisite:** [Phase 4](./2026-06-26-poc-phase-4-dev-shell.md) complete.

**Definition of Done:** See [overview § Phase 5](./2026-06-26-poc-overview.md#phase-5-integration--acceptance) and all 8 POC acceptance criteria below.

---

## File structure (this phase)

| File | Action |
|------|--------|
| `src/content/wireframe.mdx` | Finalize 3-screen POC example |
| `src/content/welcome.mdx` | Delete |
| `src/components/MdxButton.tsx` | Delete |
| `src/mdx-components.ts` | Remove MdxButton |
| `package.json` | Ensure `build` runs codegen (via Vite plugin in `buildStart`) |
| `README.md` | Optional: one-line pointer to `docs/POC.md` (only if user asks) |

---

### Task 1: Finalize wireframe.mdx

**Files:**
- Modify: `src/content/wireframe.mdx`

- [ ] **Step 1: Replace with POC canonical example**

```mdx
import { Screens } from '../generated/screens-map.generated'

<Screen id="home" title="Home">
  <Text>Welcome back</Text>
  <Link goto={Screens.Login}>Login</Link>
  <Link goto={Screens.Signup}>Create account</Link>
</Screen>

<Screen id="login" title="Login">
  <Text>Sign in to continue</Text>
  <Link goto={Screens.Home}>Back</Link>
</Screen>

<Screen id="signup" title="Sign up">
  <Text>Create your account</Text>
  <Link goto={Screens.Home}>Back</Link>
</Screen>
```

- [ ] **Step 2: Start dev and confirm codegen**

Run: `npm run dev`
Expected: 3 screens generated; `Screens.Home`, `Screens.Login`, `Screens.Signup` in `screens-map.generated.ts`

- [ ] **Step 3: Commit**

```bash
git add src/content/wireframe.mdx
git commit -m "feat: add canonical three-screen POC wireframe"
```

---

### Task 2: Remove scaffold artifacts

**Files:**
- Delete: `src/content/welcome.mdx`
- Delete: `src/components/MdxButton.tsx`
- Modify: `src/mdx-components.ts`

- [ ] **Step 1: Remove MdxButton from registry**

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

- [ ] **Step 2: Delete obsolete files**

```bash
rm src/content/welcome.mdx src/components/MdxButton.tsx
```

- [ ] **Step 3: Verify no remaining references**

Run: `rg -l "MdxButton|welcome\\.mdx" src/`
Expected: No matches

- [ ] **Step 4: Commit**

```bash
git add -A src/content/welcome.mdx src/components/MdxButton.tsx src/mdx-components.ts
git commit -m "chore: remove Vite scaffold demo in favor of wireframe POC"
```

---

### Task 3: Build and lint CI gate

**Files:**
- Verify: `vite.config.ts`, `package.json`

- [ ] **Step 1: Clean build from fresh clone simulation**

```bash
rm -rf src/generated dist
npm run build
```

Expected:
- Vite `buildStart` creates `src/generated/`
- `tsc -b` succeeds
- `vite build` succeeds

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Run unit tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: ensure production build runs wireframe codegen"
```

---

### Task 4: Dynamic screen addition test (acceptance #7)

**Files:**
- Modify: `src/content/wireframe.mdx` (temporary test)

- [ ] **Step 1: Add fourth screen without shell changes**

Append to `wireframe.mdx`:

```mdx
<Screen id="about" title="About">
  <Text>About this app</Text>
  <Link goto={Screens.Home}>Home</Link>
</Screen>
```

- [ ] **Step 2: Save and verify codegen**

Expected after save + HMR:
- `screens.generated.tsx` exports `About`
- `routes.generated.tsx` includes `path: '/about'`
- `screens-map.generated.ts` includes `About: 'about'`
- Prototype navigates to `/about` without editing `Shell.tsx` or `App.tsx`

- [ ] **Step 3: Revert or keep About screen**

POC example uses 3 screens; keeping About is fine as demo. If reverting, remove the block and commit 3-screen version.

- [ ] **Step 4: Commit**

```bash
git add src/content/wireframe.mdx
git commit -m "test: verify dynamic screen registration via MDX only"
```

---

### Task 5: Duplicate ID acceptance test (acceptance #3)

**Files:**
- Modify: `src/content/wireframe.mdx` (temporary)

- [ ] **Step 1: Introduce duplicate**

Change signup screen to `id="login"` temporarily.

- [ ] **Step 2: Save and verify**

Expected:
- Terminal: `[wireframe] Codegen failed: Duplicate screen id "login"`
- Shell: `CodegenErrorBanner` visible
- Previous valid generated files remain (not silently corrupted)

- [ ] **Step 3: Revert duplicate**

Restore `id="signup"`.

- [ ] **Step 4: No commit for temporary test** (or document in commit message if kept as test fixture — prefer revert)

---

### Task 6: Full acceptance checklist

**Files:** None — manual verification

- [ ] **Criterion 1:** `npm run dev` — single command, no extra steps; watcher starts

- [ ] **Criterion 2:** Edit `wireframe.mdx` text → one save → HMR updates Preview and regenerated files

- [ ] **Criterion 3:** Duplicate IDs → clear error, no silent overwrite (Task 5)

- [ ] **Criterion 4:** `Screens.Login` resolves in MDX compile and in `screens-map.generated.ts`

- [ ] **Criterion 5:** MDX Preview — all screens visible; Link clicks scroll to `#login`, `#signup`, etc.

- [ ] **Criterion 6:** Prototype — `/home`, `/login`, `/signup` each show one screen; Links navigate correctly

- [ ] **Criterion 7:** New `<Screen id="about">` → `About`, `/about`, `Screens.About` with zero shell edits (Task 4)

- [ ] **Criterion 8:** `npm run build && npm run lint && npm test` all pass

Record results in commit message or PR test plan when opening PR.

---

### Task 7: Phase 5 sign-off

- [ ] **Step 1: Final verification commands**

```bash
rm -rf src/generated dist
npm run build
npm run lint
npm test
```

Expected: All exit 0

- [ ] **Step 2: Confirm Phase 5 and full POC DoD**

All items in [overview § Phase 5](./2026-06-26-poc-overview.md#phase-5-integration--acceptance) and [§ Full POC acceptance criteria](./2026-06-26-poc-overview.md#full-poc-acceptance-criteria-phase-5-gate).

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: POC complete — MDX wireframe codegen and dual-view shell"
```

---

## Post-POC (out of scope — do not implement now)

| Item | Document |
|------|----------|
| Graph View | `docs/FUTURE.md` |
| Broken `goto` validation | `docs/FUTURE.md` |
| Additional primitives (`Button`, `Input`, …) | `docs/VISION.md` |

---

## Self-review

| POC acceptance # | Task |
|------------------|------|
| 1 | Task 6 |
| 2 | Task 6 |
| 3 | Task 5 |
| 4 | Task 1, 6 |
| 5 | Task 6 |
| 6 | Task 6 |
| 7 | Task 4 |
| 8 | Task 3, 6 |

All 8 criteria mapped. No placeholders.
