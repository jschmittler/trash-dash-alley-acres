# Trash Dash Skill System Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish `.skills/` as the single self-contained, machine-validated Trash Dash skill system and then apply it to the current visual audit.

**Architecture:** Seven canonical skill directories own all active instructions. Detailed reusable material moves into canonical `references/` files, while the former `skills/game-asset-library/` tree and `.summer/pixel-anchor.md` become explicit historical pointers with no active frontmatter. A Node validator resolves the registry and every Markdown skill link, rejects non-self-contained instructions and undeclared active skill files, and is part of `npm test`.

**Tech Stack:** Markdown, Node.js ES modules, Node test runner, Vinext/React Canvas runtime, in-app browser.

## Global Constraints

- Inventory and classify existing material before modifying it.
- Preserve richer Trash Dash-specific guidance; merge rather than replace it with generic summaries.
- `.skills/` is the only canonical project skill location.
- All canonical skill references are repository-relative and resolvable.
- Rendering / Asset Integrity is mandatory for every visual task.
- Visual QA is mandatory after meaningful visual work and requires the running game.
- Do not mask rendering defects with arbitrary width/height, X/Y scale, offset, crop, or layer patches.
- Preserve unrelated dirty-worktree changes; do not commit or publish.

---

### Task 1: Encode the canonical topology and validator contract

**Files:**
- Modify: `scripts/validate-skills.mjs`
- Create: `tests/skill-system.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: repository root, `.skills/README.md`, `AGENTS.md`, canonical Markdown links.
- Produces: a nonzero exit for missing, empty, orphaned, absolute-path, conversational, broken-reference, routing, registry, metadata, or parallel-active-skill defects.

- [ ] Add focused tests that spawn `node scripts/validate-skills.mjs` and assert the canonical repository passes.
- [ ] Add temporary-fixture tests for a missing skill, broken relative link, absolute local path, conversation reference, and active external `SKILL.md`.
- [ ] Run `node --test tests/skill-system.test.mjs` and capture RED against the current weak validator.
- [ ] Implement exported validator helpers plus CLI behavior using `fs`, `path`, and Markdown-link extraction.
- [ ] Require exactly seven canonical skill directories, non-empty `SKILL.md`, valid names/frontmatter markers, matching metadata, complete registry rows, and exact AGENTS routing phrases.
- [ ] Include `tests/skill-system.test.mjs` in the normal test command and run focused GREEN.

### Task 2: Merge rich visual guidance into the canonical skills

**Files:**
- Modify: `.skills/sprite-art/SKILL.md`
- Create: `.skills/sprite-art/references/source-art-contract.md`
- Modify: `.skills/rendering-asset-integrity/SKILL.md`
- Create: `.skills/rendering-asset-integrity/references/runtime-visual-contract.md`
- Modify: `.skills/animation/SKILL.md`
- Create: `.skills/animation/references/entity-state-coverage.md`
- Modify: `.skills/environment-placement/SKILL.md`
- Create: `.skills/environment-placement/references/level-arena-placement.md`
- Modify: `.skills/overlap-prevention/SKILL.md`
- Create: `.skills/overlap-prevention/references/composition-and-encounters.md`
- Modify: `.skills/visual-qa/SKILL.md`

**Interfaces:**
- Consumes: `skills/game-asset-library/*.md`, `.summer/pixel-anchor.md`, `docs/guides/*.md`, `docs/visual-audit.md`.
- Produces: self-contained canonical workflows with required applicability links and optional one-level-deep references.

- [ ] Move shared art profile, geometry, asset output, effect, placement-contract, composition, and verification rules into the appropriate canonical references.
- [ ] Expand Sprite Art to require completeness, intended scale, silhouette, alpha preparation, source integrity, sheet completeness, and animation-state asset coverage.
- [ ] Expand Animation to enumerate player, enemy, boss, object, platform, and environmental states including idle, move, anticipation, ascent, apex, descent, land, hit, attack, stomp, bounce, death, and special states when applicable.
- [ ] Expand Placement and Overlap to preserve platform exclusion, semantic layers, boss-arena composition, safe lanes, occupied bounds, clustering, exclusion regions, duplicate prevention, minimum spacing, and deterministic candidate rejection.
- [ ] Expand Visual QA to reference all five visual predecessors and inspect every requested defect class in the running game.
- [ ] Remove every canonical dependency on `skills/game-asset-library/` and confirm all links resolve inside `.skills/` or to explicit project guides.

### Task 3: Make Conductor self-contained

**Files:**
- Modify: `.skills/conductor/SKILL.md`
- Create: `.skills/conductor/references/soundtrack-workflow.md`

**Interfaces:**
- Consumes: `skills/game-asset-library/conductor_SKILL.md`.
- Produces: canonical level scoring, loop, boss variant, art-analysis, continuity, Level 0–4 rescore, manifest, archive, and runtime validation guidance.

- [ ] Preserve the full music brief, soundtrack bible, exploration/boss pair, rescore classification, output/versioning, looping, loudness, and implementation validation rules in the canonical skill/reference.
- [ ] Add the required applicability relationship to `../visual-qa/SKILL.md` without creating a recursive workflow.
- [ ] Remove the link to the former skill library.

### Task 4: Deprecate parallel systems and repair documentation drift

**Files:**
- Create: `skills/README.md`
- Modify: `skills/game-asset-library/*.md`
- Modify: `.summer/pixel-anchor.md`
- Modify: `concepts/jimothy/README.md`
- Modify: `tests/game-asset-library.test.mjs`

**Interfaces:**
- Consumes: canonical skill paths.
- Produces: historical documents that cannot be mistaken for active skills and tests that protect canonical content instead of obsolete copies.

- [ ] Add a deprecation banner to every former `*_SKILL.md`, remove YAML skill frontmatter, and point to `.skills/README.md` plus the relevant canonical skills.
- [ ] Mark `game-art-contract.md` and the old directory as historical snapshots; do not leave them as current routing instructions.
- [ ] Replace `.summer/pixel-anchor.md` duplicate rules with a compatibility pointer to canonical art/rendering/animation skills.
- [ ] Correct Jimothy's stale “do not integrate” statement to match the current playable implementation while preserving source-layout facts.
- [ ] Rewrite the old-library regression tests to assert canonical skill/reference content and deprecation status.

### Task 5: Finalize root routing, registry, and audit report

**Files:**
- Modify: `AGENTS.md`
- Modify: `.skills/README.md`
- Create: `docs/SKILLS_AUDIT.md`

**Interfaces:**
- Consumes: finalized canonical skills and inventory classifications.
- Produces: a fresh-session route from root instructions to registry to every applicable skill.

- [ ] Add the six required pre-implementation steps and exact mandatory routing for visual, source-art, animation, placement, overlap, music, rescore, and Visual QA work.
- [ ] Replace the registry with the required five-column table and dependency diagram, including `CONDUCTOR → VISUAL QA`.
- [ ] Document canonical, merged, created, deprecated, historical, unrelated, cross-reference, validator, workflow, current-audit, and remaining-problem findings in `docs/SKILLS_AUDIT.md`.
- [ ] Run `npm run validate:skills` and manually trace `AGENTS.md → .skills/README.md → every SKILL.md`.

### Task 6: Apply the canonical system to the current visual audit

**Files:**
- Modify: `docs/visual-audit.md`
- Create or modify only if audit evidence establishes a defect: matching implementation, asset, or test files.

**Interfaces:**
- Consumes: all six canonical visual skills, current automated visual contracts, local browser routes, existing audit evidence.
- Produces: an evidence-backed current visual/rendering audit with unresolved issues left open rather than hidden by local patches.

- [ ] Explicitly read and declare Rendering Integrity, Sprite Art, Animation, Environment Placement, Overlap Prevention, and Visual QA.
- [ ] Run skill and visual-contract tests before browser inspection.
- [ ] Inspect representative Level 1 and Level 2 start/middle/end, both boss encounters, animation-state routes, and supported desktop/mobile views in the running game.
- [ ] Compare source/native/visible bounds with runtime rectangles for any suspected distortion, transparency, clipping, anchor, platform, or scale defect.
- [ ] Update `docs/visual-audit.md` with observed status, routes, evidence, root cause, and remaining items. Do not change game code without an evidenced defect.

### Task 7: Complete verification

**Files:**
- Modify only if verification exposes a scoped skill-system defect.

**Interfaces:**
- Consumes: entire normalized working tree.
- Produces: fresh validation evidence and a precise handoff.

- [ ] Run `npm run validate:skills`.
- [ ] Run `node --test tests/skill-system.test.mjs tests/game-asset-library.test.mjs`.
- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build:pages && npm run test:pages`.
- [ ] Run `git diff --check` and inspect the scoped diff without altering unrelated changes.
- [ ] Re-read every canonical SKILL.md and confirm a fresh session needs no conversation history.

## Self-review

- Spec coverage: all fourteen phases map to Tasks 1–7; inventory precedes edits, normalization precedes the visual audit, and substantive fixes are evidence-gated.
- Placeholder scan: no implementation placeholders or deferred generic instructions remain.
- Interface consistency: one canonical skill list is shared by the validator, registry, AGENTS routing, metadata, tests, and audit report.
- Execution: the user requested the task be performed, so this plan proceeds inline without commit or publication.
