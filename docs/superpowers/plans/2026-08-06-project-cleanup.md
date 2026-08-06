# Project Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce project bloat, establish one canonical asset pipeline, and remove obsolete scaffolding without breaking local or GitHub Pages builds.

**Architecture:** Keep source art and rebuild scripts under `concepts/`; keep runtime-generated atlases only under `public/assets/generated/`. Remove stale runtime fallbacks and update tests/docs to validate the canonical pipeline. Treat ignored build caches as disposable and preserve historical design docs.

**Tech Stack:** Next/Vinext, Vite Pages build, React/TypeScript, Node test runner, Python/Pillow and Sharp asset scripts, GitHub Pages.

## Global Constraints

- Do not delete current runtime assets until references, generators, and tests are migrated.
- Preserve Jimothy concept sources and historical design documents.
- Keep `npm test`, `npm run lint`, `npm run build:pages`, and `npm run test:pages` passing.
- Keep runtime asset paths under `public/assets/` and generated outputs under `public/assets/generated/`.

### Task 1: Remove disposable local artifacts

**Files:** ignored working-tree artifacts only (`dist/`, `dist-pages/`, `.wrangler/`, `.vinext/`, `.DS_Store`, `.impeccable/screenshots/`).

- [x] Confirm no required source files are inside these ignored paths.
- [x] Remove the disposable directories/files and leave `node_modules/` intact for fast local testing.
- [x] Verify `git status --short --ignored` shows only intentionally preserved local state.

### Task 2: Establish asset ownership documentation

**Files:**
- Create: `docs/asset-manifest.md`
- Modify: `README.md`

- [x] Document every runtime asset family, its source-of-truth location, generated output, and consumer.
- [x] Replace the outdated raccoon-only processing instructions with the current atlas build commands.
- [x] Document that generated runtime atlases are not duplicated under concepts.

### Task 3: Migrate the sprite build pipeline

**Files:**
- Modify: `scripts/build-sprite-atlases.py`
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/hit-sprite-frames.test.mjs`

- [x] Remove obsolete standalone processing code and migrate hit/dumpster tests to canonical atlases; retain `raccoon-sprites.png` because the cap pickup and legacy generator still consume it.
- [x] Keep only tests for canonical hero, enemy, boss, decorative, and pickup atlases.
- [x] Run focused atlas tests before deleting any obsolete files.

### Task 4: Archive/remove superseded tracked assets

**Files:** obsolete assets under `public/assets/` and `public/assets/generated/`; add `public/assets/archive/` only if a historical copy is needed.

- [x] Confirm zero runtime, test, script, or documentation references to each candidate.
- [x] Remove the unreferenced midground, recycle-crate, and legacy dumpster runtime outputs; retain legacy source inputs still required by the rebuild script.
- [x] Re-run the complete test suite and asset existence checks.

### Task 5: Review starter scaffolding

**Files:** `db/`, `drizzle/`, `examples/d1/` only if verified unused by build/deploy.

- [x] Confirm the worker, Vinext build, Pages build, and tests do not import or package these directories.
- [x] Remove unused starter database/example files, Drizzle configuration/dependencies, and migration packaging.
- [x] Verify production and Pages builds remain unchanged.

### Task 6: Verify, commit, and publish

**Files:** no additional source changes unless verification finds an issue.

- [x] Run `npm test`, `npm run lint`, `npm run build:pages`, `npm run test:pages`, and `git diff --check`.
- [x] Inspect the final diff and repository status for accidental generated files.
- [ ] Commit the cleanup with an explicit message.
- [ ] Push the current branch and `main`, then verify the public Pages URL serves the canonical assets.
