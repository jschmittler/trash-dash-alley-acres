# Trash Dash V2 Failed Visual Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the nine reproduced visual failures in the shipped Level 2 experience and prove the fixes through a normal uninterrupted campaign playthrough.

**Architecture:** Keep authored art, deterministic atlas builders, semantic animation/state data, world placement, and Canvas rendering as separate contracts. Replace or normalize source assets in deterministic builders; keep runtime draw sizes uniform and anchor-derived; remove deleted sprinkler behavior from every data, render, collision, audio, and boss-state path. Extend the canonical visual inventory and skill rules so future assets cannot reintroduce state-dependent scale, dirty alpha, duplicate arena props, or unsupported placement.

**Tech Stack:** TypeScript/React Canvas runtime, ECMAScript modules, Sharp-based deterministic atlas builders, Node test runner, Vinext, in-app browser QA.

## Global Constraints

- The running game is the final visual truth; static contracts and contact sheets cannot substitute for runtime playtesting.
- Fixed-aspect sprites must use uniform X/Y scale. State-dependent character scale is prohibited.
- Every animated state uses a consistent canvas, canonical visible-size envelope, stable semantic anchor, and explicit loop/one-shot timing.
- Alpha-edge inspection is mandatory for generated and cleaned assets; intentional glow must remain separate from accidental matte/fringe pixels.
- Static boss-arena props must have explicit identity and duplicate lifecycle tests covering entry, death, retry, checkpoint recovery, phase changes, defeat, exit, and re-entry.
- Removed sprinklers leave no sprite, effect, emitter, collision, hazard, audio, placement, configuration, or dead runtime branch.
- Do not replace bitmap game art with Canvas/vector placeholders.
- Do not call the remediation complete unless every acceptance item passes; otherwise report `INCOMPLETE` with exact remaining failures.
- Preserve unrelated user changes in the dirty worktree and commit only scoped hunks.

---

### Task 1: Canonical V2 visual contracts and complete sprinkler removal

**Files:**
- Modify: `.skills/rendering-asset-integrity/SKILL.md`
- Modify: `.skills/sprite-art/SKILL.md`
- Modify: `.skills/animation/SKILL.md`
- Modify: `.skills/environment-placement/SKILL.md`
- Modify: `.skills/overlap-prevention/SKILL.md`
- Modify: `.skills/visual-qa/SKILL.md`
- Modify: `app/level-two-props.mjs`
- Modify: `app/level-two.mjs`
- Modify: `app/brutus-boss.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/visual-inventory.mjs`
- Modify: `scripts/build-level-two-props.mjs`
- Modify: `tests/level-two-props.test.mjs`
- Modify: `tests/level-two-definition.test.mjs`
- Modify: `tests/brutus-boss.test.mjs`
- Modify: `tests/visual-inventory.test.mjs`
- Create: `tests/v2-visual-remediation.test.mjs`

**Interfaces:**
- Produces: canonical assertions for uniform scale, animation-state scale invariance, alpha-edge cleanliness, canonical prop dimensions, and single-instance arena props.
- Produces: Level 2 and Brutus runtime with no sprinkler feature or residual hitbox/effect/audio/configuration branch.

- [ ] **Step 1: Write RED source/runtime tests**

  Assert the runtime, Level 2 definition, Brutus hazard output, prop manifest, visual inventory, and builder contain no sprinkler entity/state/frame/helper/branch or audio reference. Assert boss entry/retry/re-entry resolves exactly one hydrant identity. Add mutation-sensitive rules that reject nonuniform fixed-aspect destinations and per-state character scale.

- [ ] **Step 2: Run focused tests and capture the expected failures**

  Run: `node --test tests/v2-visual-remediation.test.mjs tests/level-two-props.test.mjs tests/level-two-definition.test.mjs tests/brutus-boss.test.mjs tests/visual-inventory.test.mjs`

- [ ] **Step 3: Remove sprinklers systemically**

  Remove atlas rows/build inputs, data placements, environment kinds, render/collision/effect loops, player/lid pushes, Brutus sprinkler phases, audio hooks, and obsolete helpers. Replace phase behavior with existing non-sprinkler boss actions without changing unrelated movement.

- [ ] **Step 4: Strengthen canonical project skills and contracts**

  Amend existing skills rather than creating redundant ones. Record runtime-first verification, transition QA, alpha-boundary audits, canonical dimensions, duplicate-prop lifecycle checks, and the prohibition on state-dependent scale.

- [ ] **Step 5: Run focused tests and commit**

  Expected: the focused matrix passes and repository search finds no shipped sprinkler runtime/configuration path.

---

### Task 2: Replace and clean Level 2 environmental art

**Files:**
- Create: `concepts/level-two/source/level2-residential-trash-can-source.png`
- Modify: `concepts/level-two/source/level2-props-reference.png`
- Modify: `concepts/level-two/source/level2-lamp-post-source.png`
- Modify: `concepts/level-two/build-prop-atlas.mjs`
- Modify: `scripts/build-level-two-props.mjs`
- Modify: `app/level-two-props.mjs`
- Modify: `app/level-two.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/visual-inventory.mjs`
- Modify: `public/assets/generated/level2-props.png`
- Modify: `public/assets/generated/level2-lamp-post.png`
- Modify: `concepts/level-two/level2-props-contact-sheet.png`
- Modify: `concepts/level-two/level2-lamp-post-contact-sheet.png`
- Modify: `tests/level-two-props.test.mjs`
- Modify: `tests/visual-asset-integrity.test.mjs`

**Interfaces:**
- Consumes: Task 1's reduced prop manifest and canonical scale/alpha rules.
- Produces: readable loose-acorn pile, classic galvanized residential trash can, cleaned lamp/moth attachment art, and Level 1-language boss crates.

- [ ] **Step 1: Write RED asset and runtime-destination tests**

  Require three or more individually readable acorn silhouettes with transparent separation; a residential round-can silhouette with lid/trash and no utility cabinet geometry; clean lamp alpha boundaries with glow preserved in the intended effect region; and boss crate visuals sourced from the canonical Level 1 decorative crate family at uniform scale.

- [ ] **Step 2: Build source art deliberately**

  Recompose the existing authored acorn cells into a grounded loose pile. Generate only the missing classic residential can on a removable chroma key, process it to hard pixel alpha, and save the finalized source in the workspace. Clean the existing lamp/moth alpha pixel-by-pixel or with a bounded deterministic despill mask; do not blur intentional glow.

- [ ] **Step 3: Rebuild atlases deterministically**

  Normalize visible baselines, quantize with nearest-neighbor sampling, enforce transparent margins, rebuild contact sheets, and prove two consecutive build hashes match.

- [ ] **Step 4: Integrate canonical Level 1 crate artwork for the boss platforms**

  Reuse the existing decorative crate renderer/source or a deterministic Level 2 palette derivative. Preserve one-way platform collision top and reachable geometry without stretching the art.

- [ ] **Step 5: Inspect source, atlas, contact sheet, and runtime fixture; then commit**

  Verify at native and gameplay scale that each prop is readable, grounded, non-overlapping, and free of matte pixels.

---

### Task 3: Normalize the terrier run, sit, hit, and recovery lifecycle

**Files:**
- Modify: `concepts/level-two/source/terrier-motion-source.png`
- Modify: `concepts/level-two/build-atlases.mjs`
- Modify: `concepts/level-two/level2-enemy-motion-contact-sheet.png`
- Modify: `public/assets/generated/level2-enemy-motion.png`
- Modify: `app/level-two-enemies.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/visual-inventory.mjs`
- Modify: `tests/level-two-enemies.test.mjs`
- Modify: `tests/boss-animation.test.mjs`
- Create: `tests/terrier-animation-integrity.test.mjs`

**Interfaces:**
- Produces: explicit `sleep/sit -> wake -> run/charge -> impact/hit -> recover -> run` state ownership with normalized art geometry.

- [ ] **Step 1: Write RED state, frame, anchor, and transition tests**

  Require every reachable terrier state to own valid cells, local timing, stable bottom-center foot anchor, uniform destination size, clamped one-shots, and actual ordered runtime transitions. Add tests that fail if run/sit/hit visible widths or baselines cause the size/position pops reproduced in the supplied movie.

- [ ] **Step 2: Normalize the terrier source and atlas**

  Reframe run, sit/sleep, impact/hit, and recover art into the shared 192px cells using a common foot baseline and canonical body envelope. Preserve pose identity; do not scale individual runtime states to hide source inconsistency.

- [ ] **Step 3: Repair the state machine and renderer dispatch**

  Ensure hit/impact plays once to completion, recover does not borrow hit cells, sitting transitions through wake before locomotion, and returning to run does not change draw geometry.

- [ ] **Step 4: Run deterministic builds, focused tests, and a repeated transition fixture; then commit**

  Exercise at least three full sit→run→hit→recover cycles and both facings.

---

### Task 4: Repair the Brutus arena and post-boss composition

**Files:**
- Modify: `app/level-two.mjs`
- Modify: `app/brutus-boss.mjs`
- Modify: `app/boss-arena.mjs`
- Modify: `app/dumpster-render.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/world-placement.mjs`
- Modify: `tests/brutus-boss.test.mjs`
- Modify: `tests/boss-arena.test.mjs`
- Modify: `tests/dumpster-render-state.test.mjs`
- Modify: `tests/world-placement.test.mjs`
- Create: `tests/level-two-boss-lifecycle.test.mjs`

**Interfaces:**
- Consumes: Task 1 single-hydrant contract and Task 2 canonical crate renderer.
- Produces: exactly one stable hydrant across all boss lifecycle paths; separated, uniformly scaled crate/dumpster victory composition.

- [ ] **Step 1: Write RED lifecycle and composition tests**

  Simulate fresh entry, death, retry, checkpoint recovery, every phase, defeat, exit, and re-entry. Assert exactly one hydrant identity at all times. Measure full visible and collision footprints for both boss crates and the sealed/holy dumpster, rejecting overlap, nonuniform scale, or traversal obstruction.

- [ ] **Step 2: Centralize arena static-prop construction**

  Build the single hydrant once from the level definition and keep phase behavior state on that identity. Remove any state-to-environment append path that duplicates it.

- [ ] **Step 3: Separate post-boss props and normalize dumpster draw geometry**

  Derive dumpster dimensions uniformly from its source cell/visible bounds and place the crate outside its full glow/footprint and player path. Preserve defeat gating and holy reveal timing.

- [ ] **Step 4: Run lifecycle tests and repeated browser entries; then commit**

  Perform at least three boss entry/retry cycles plus defeat/exit/re-entry and capture the hydrant count/composition each time.

---

### Task 5: Normalize Jimothy victory without a runtime scale exception

**Files:**
- Modify: `concepts/jimothy/source/jimothy-victory-source.png`
- Modify: `concepts/jimothy/build-atlas.mjs`
- Modify: `concepts/jimothy/jimothy-animation.mjs`
- Modify: `concepts/jimothy/jimothy-animation-contact-sheet.png`
- Modify: `public/assets/generated/jimothy-hero-motion.png`
- Modify: `public/assets/generated/jimothy-hero-contact-sheet.png`
- Modify: `app/player-animation.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/visual-inventory.mjs`
- Modify: `tests/jimothy-player-atlas.test.mjs`
- Modify: `tests/player-animation.test.mjs`

**Interfaces:**
- Produces: small and large Jimothy victory frames sharing the same canonical world scale, baseline, anchor, and collision contract as their gameplay form.

- [ ] **Step 1: Write RED canonical-scale and transition tests**

  Compare pre-victory and victory destination dimensions, measured visible bounds, baseline, and anchor. Reject any character- or state-specific runtime scaling multiplier while leaving collision dimensions unchanged.

- [ ] **Step 2: Normalize the victory source in the atlas builder**

  Crop/reframe each victory pose to the canonical Jimothy envelope and shared baseline. Keep Jimothy's squat rounded body identity; do not shrink him with a renderer exception.

- [ ] **Step 3: Rebuild twice, inspect the transition, and commit**

  Prove deterministic hashes and capture consecutive frames immediately before and during victory at the same camera position.

---

### Task 6: Continuous campaign playthrough, evidence, and release decision

**Files:**
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation.md`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/01-nut-pile.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/02-trash-can.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/03-lamp-moth.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/04-former-sprinkler-area.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/05-dog-run.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/06-dog-sit.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/07-dog-hit.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/08-level-two-crate.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/09-single-hydrant.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/10-postboss-composition.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/11-jimothy-before-victory.png`
- Create: `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/12-jimothy-victory.png`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: all repaired runtime, asset, animation, placement, and lifecycle contracts.
- Produces: honest PASS/INCOMPLETE disposition backed by an uninterrupted campaign playthrough and the twelve required screenshots.

- [ ] **Step 1: Run all automated gates from a clean scoped commit snapshot**

  Run skill validation, focused remediation tests, full `npm test`, lint, production build, Pages build/test, deterministic asset rebuild hashes, and `git diff --check`.

- [ ] **Step 2: Play the normal campaign without direct state shortcuts**

  Start at title, select Jimothy, traverse Level 1 into Level 2, activate checkpoints, encounter the squirrel/nuts, residential can, lamp/moth, former sprinkler area, and terrier; enter Brutus normally, die/retry once, defeat him, walk the post-boss route, and reach victory. Use runtime input and record console warnings/errors throughout.

- [ ] **Step 3: Probe transition and lifecycle edges**

  Repeat the terrier sit/run/hit/recovery sequence three times, enter/retry/re-enter the boss arena, and compare Jimothy immediately before/during victory. Verify the removed sprinkler has no invisible collision or effect.

- [ ] **Step 4: Capture and inspect all twelve required screenshots**

  Record exact route/time/state, viewport, file dimensions, and warning/error log for every capture. Screenshot evidence is supplemental to the played sequence, not a substitute.

- [ ] **Step 5: Write the final report and make an honest release decision**

  Include root cause, files, fix summary for issues 1–9, prevention rules, exact gameplay path, screenshot table, automated evidence, and remaining issues. Use `INCOMPLETE` for any unresolved acceptance item.

