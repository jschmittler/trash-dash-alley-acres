# Sprite, Boss Arena, and World Object Quality Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining Level 2 placeholder/ambiguous art and add a reusable, all-level visual-bounds placement contract without changing gameplay balance, physics, camera behavior, progression, UI, music, or sound architecture.

**Architecture:** Keep gameplay collision rectangles authoritative and introduce separate asset-derived visual metrics for rendering, attachment points, and placement audits. A pure `world-placement.mjs` module classifies full visible bounds against solid platform bodies, while deterministic Sharp builders remain the only path from generated source art to shipped hard-alpha atlases. Existing Level 1 and Level 2 declarative data are audited through tests; invalid static scenery is moved to the nearest semantically appropriate legal location.

**Tech Stack:** Next.js/React, TypeScript Canvas runtime, browser-independent ES modules, Node test runner, Sharp, deterministic PNG atlases.

## Global Constraints

- Treat `skills/game-asset-library/game-art-contract.md` as the shared visual contract.
- Preserve the existing pixel density, palette character, dark-outline convention, lighting direction, hard alpha, and nearest-neighbor rendering.
- Separate visual effect bounds from damage/collision bounds.
- Do not change player movement, jump physics, boss/enemy health or damage, progression, camera behavior, checkpoints, score, UI, music, sound architecture, or unrelated sprites/layouts.
- Default freestanding placement is no intersection with a solid platform body.
- Validate full visible sprite bounds, not only object origins or collision rectangles.
- Preserve the existing dirty worktree and do not commit or publish in this pass.

---

### Task 1: Reusable visual-bounds placement contract and all-level audit

**Files:**
- Create: `app/world-placement.mjs`
- Create: `tests/world-placement.test.mjs`
- Modify: `app/trash-dash-game.tsx`
- Test: `tests/level-one-fixture.test.mjs`
- Test: `tests/level-two-fixture.test.mjs`

**Interfaces:**
- Produces `WORLD_PLACEMENT_PADDING`, `PLACEMENT_TYPES`, `rectIntersectionArea`, `classifyWorldObjectPlacement`, `isValidWorldObjectPlacement`, and `nearestValidWorldObjectPlacement`.
- Consumes world-space visual bounds, platform occupied rectangles, placement type, optional supporting surface id, and optional candidate bounds.
- Produces immutable audit results with `valid`, `classification`, `intersections`, and `support` fields.

- [ ] **Step 1: Write failing pure geometry tests**

Cover ON_SURFACE, BESIDE, BELOW, ABOVE_WITH_CLEARANCE, EXPLICITLY_PLATFORM_ATTACHED, default rejection, padding, visible-bounds versus origin, nearest-candidate resolution, and safe skip when no candidate is legal.

```js
const platform = { id: "ledge", x: 100, y: 200, w: 120, h: 40 };
assert.equal(classifyWorldObjectPlacement(
  { id: "bin", bounds: { x: 132, y: 150, w: 48, h: 50 }, placementType: "ON_SURFACE", surfaceId: "ledge" },
  [platform],
).valid, true);
assert.equal(isValidWorldObjectPlacement(
  { id: "bin", bounds: { x: 132, y: 170, w: 48, h: 50 } },
  [platform],
), false);
```

- [ ] **Step 2: Run the focused tests and capture RED**

Run: `node --test tests/world-placement.test.mjs tests/level-one-fixture.test.mjs tests/level-two-fixture.test.mjs`

Expected: fail because `app/world-placement.mjs` and level-wide visual audit declarations do not exist.

- [ ] **Step 3: Implement pure placement math**

Use centralized horizontal/vertical padding, strict positive-area rectangle intersection, explicit surface contact tolerance, and no implicit intersection exceptions. `nearestValidWorldObjectPlacement` evaluates supplied candidates, ranks legal candidates by squared anchor distance, and returns `null` when none are legal.

- [ ] **Step 4: Make scenery data level-specific and move only proven invalid objects**

Replace the global scenery list with `sceneryByLevel`. Preserve each prop and move the six proven invalid placements to legal nearby ground pockets; retain the other authored positions. Add explicit `placementType: "ON_SURFACE"`, `surfaceId`, and world-space `groundY` so rendering and auditing consume the same anchors.

- [ ] **Step 5: Add fixture audits for every current campaign level**

Audit Level 1 and Level 2 scenery, grounded enemies, pickups, environment props, boss props, and platform-integrated platform visuals. Use asset render metrics for visible bounds and explicit placement types for porch lamps and boss platform artwork.

- [ ] **Step 6: Run focused tests to GREEN**

Run: `node --test tests/world-placement.test.mjs tests/level-one-fixture.test.mjs tests/level-two-fixture.test.mjs`

Expected: all audited objects are either legal or explicitly platform-attached; no invalid freestanding intersection remains.

---

### Task 2: Deterministic hydrant, water, and porch-light art contract

**Files:**
- Create: `concepts/level-two/source/level2-hydrant-water-source.png`
- Create: `concepts/level-two/source/level2-porch-light-source.png`
- Modify: `scripts/build-level-two-props.mjs`
- Modify: `app/level-two-props.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `concepts/level-two/level2-props-contact-sheet.png`
- Modify: `public/assets/generated/level2-props.png`
- Test: `tests/level-two-props.test.mjs`

**Interfaces:**
- Produces hydrant body states `hydrant-idle`, `hydrant-build`, `hydrant-spray`, `hydrant-recover`; water states `hydrant-water-burst`, `hydrant-water-full`, `hydrant-water-taper`; and `porch-light` frames.
- Produces `hydrantDrawRect`, `hydrantNozzleOrigin`, `hydrantVisualState`, and `hydrantWaterDrawRect` from one bottom-center ground anchor.
- Preserves all existing gameplay collision rectangles and hazard timing.

- [ ] **Step 1: Generate source art from approved game references**

Use the existing hydrant, sprinkler water, Level 2 props, and pixel anchor as style references. Generate strict side-on 16-bit pixel art on removable chroma keys, with consistent frame canvases, one bottom-center anchor, a named nozzle point, irregular water edges, transparent breakup, foam, and droplets. Generate a finished wall-mounted porch lamp separately.

- [ ] **Step 2: Write failing atlas and render-metric tests**

Assert hard alpha, bounded palette, non-empty frames, identical hydrant foot baselines, nozzle continuity across states, transparent margins at every water frame's outer edge, irregular per-row rightmost extents, no filled terminal column, porch-light opacity, and no `fillRect` primitive in the porch-light branch.

- [ ] **Step 3: Run the prop tests and capture RED**

Run: `node --test tests/level-two-props.test.mjs`

Expected: new frames/metrics are missing and the porch light is still a Canvas primitive.

- [ ] **Step 4: Extend the deterministic atlas builder**

Crop generated source cells, remove chroma by color relationship, harden alpha to 0/255, despill edges, normalize hydrant baselines, preserve water-only cells, quantize with nearest-neighbor sampling, and rebuild the contact sheet over a checkerboard.

- [ ] **Step 5: Integrate coherent boss-arena hydrant visuals**

Keep ordinary tutorial sprinklers visually unchanged. Render the two phase-3 boss hazard locations as the new compact hydrant bodies and water phases while retaining their existing logical rectangles, active-side cadence, push behavior, and damage rules. Render the central charge-target hydrant using the same canonical scale and anchor.

- [ ] **Step 6: Replace the moth placeholder**

Render the traced `porch-light` entity as the finished wall-mounted lamp at its authored orbit anchor. Mark it explicitly as platform/architecture-attached for placement validation; do not add collision or alter moth behavior.

- [ ] **Step 7: Run focused prop tests to GREEN and inspect the contact sheet**

Run: `node --test tests/level-two-props.test.mjs tests/brutus-boss.test.mjs tests/level-two-runtime.test.mjs`

Expected: art/attachment tests pass and gameplay-state tests remain unchanged.

---

### Task 3: Explicit squirrel acorn-throw animation and release attachment

**Files:**
- Create: `concepts/level-two/source/squirrel-throw-source.png`
- Modify: `concepts/level-two/build-atlases.mjs`
- Modify: `concepts/level-two/level2-enemy-motion-contact-sheet.png`
- Modify: `public/assets/generated/level2-enemy-motion.png`
- Modify: `app/level-two-enemies.mjs`
- Modify: `app/trash-dash-game.tsx`
- Test: `tests/level-two-enemies.test.mjs`

**Interfaces:**
- Produces explicit squirrel states `idle`, `throw-anticipation`, `throw-release`, `throw-follow-through`, `throw-recover`, and `defeated` while retaining existing locomotion/hit/defeat rows.
- Produces `SQUIRREL_THROW`, `squirrelThrowAttachment`, and a one-shot `spawnAcorn` transition signal.
- Keeps the current projectile speed, reflection, collision, damage, lifetime, and four-frame tumbling art.

- [ ] **Step 1: Generate four disciplined throw keyframes**

Use `squirrel-anchor.png` and the current motion source as identity/style references. Generate anticipation, release, follow-through, and recover keys with readable body weight, arm action, tail counterbalance, and a clearly separated acorn only at release.

- [ ] **Step 2: Write failing state/release tests**

Assert the full ordered state sequence, exactly one projectile spawn at `throw-release`, no spawn during anticipation/follow-through/recover, local one-shot frame clamping, stable ground baseline, left/right paw attachment mirroring, and unchanged projectile velocity magnitude/dimensions.

- [ ] **Step 3: Run focused tests and capture RED**

Run: `node --test tests/level-two-enemies.test.mjs`

Expected: old generic `telegraph → throw → recover` behavior lacks the explicit release contract.

- [ ] **Step 4: Build and audit the replacement squirrel attack row**

Integrate the approved source into the existing normalized 192px atlas pipeline. Keep the primary squirrel silhouette centered and grounded while preserving the detached acorn only in the release frame.

- [ ] **Step 5: Implement explicit state timing and named paw attachment**

Advance through anticipation, release, follow-through, and recover with local timers. Spawn the existing `BinLid` gameplay entity as an acorn exactly once from `squirrelThrowAttachment(enemy, facing)`; keep `ownerId`, reflection behavior, collision size, and `±140` launch velocity unchanged.

- [ ] **Step 6: Run focused enemy tests to GREEN and inspect the contact sheet**

Run: `node --test tests/level-two-enemies.test.mjs tests/level-two-runtime.test.mjs`

Expected: explicit animation/state tests pass without changing encounter balance.

---

### Task 4: Boss arena scale and shared-ground audit

**Files:**
- Modify: `app/level-two-props.mjs`
- Modify: `app/level-two.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/brutus-boss.test.mjs`
- Modify: `tests/level-two-props.test.mjs`
- Modify: `tests/world-placement.test.mjs`

**Interfaces:**
- Consumes canonical player reference dimensions, Brutus render metrics, hydrant metrics, platform metrics, and environment collision records.
- Produces a test-owned arena scale table and shared world floor assertion at `y = 468`.

- [ ] **Step 1: Write failing scale/ground assertions**

Assert central and attack hydrant visible heights remain within the authored player-relative band, all grounded arena visual bounds end at the cul-de-sac surface, boss platforms' opaque tops match their one-way surfaces, and no arbitrary per-instance hydrant scale remains in the Canvas branch.

- [ ] **Step 2: Run boss-focused tests and capture RED**

Run: `node --test tests/brutus-boss.test.mjs tests/level-two-props.test.mjs tests/world-placement.test.mjs`

- [ ] **Step 3: Centralize arena render metrics and anchors**

Replace per-branch numeric sprite offsets with helper-derived draw rectangles. Keep Brutus's approved 220×165 render/collision alignment and the two approved utility-box platforms unchanged unless a measured visual-bounds test proves drift.

- [ ] **Step 4: Run boss tests to GREEN**

Run: `node --test tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs tests/level-two-props.test.mjs tests/world-placement.test.mjs`

Expected: the arena reads at one physical scale and every grounded contact line resolves to the same surface.

---

### Task 5: Reusable skill updates

**Files:**
- Modify: `skills/game-asset-library/game-art-contract.md`
- Modify: `skills/game-asset-library/level_creator_SKILL.md`
- Modify: `skills/game-asset-library/enemy_creator_SKILL.md`
- Modify: `skills/game-asset-library/boss_creator_SKILL.md`
- Modify: `skills/game-asset-library/vfx_creator_SKILL.md`
- Modify: `skills/game-asset-library.zip`
- Create: `tests/game-asset-library.test.mjs`

**Interfaces:**
- Produces reusable world-geometry, scale, attachment, projectile, grounding, and visual-vs-hitbox requirements without duplicating the full shared contract.

- [ ] **Step 1: Write failing skill-library assertions**

Assert the contract names all five placement classifications, full visual bounds, centralized padding, bottom-center anchors, canonical scale, no arbitrary stretching, attachment origins, semantic render layers, and visual/hitbox separation. Assert Level/Enemy/Boss/VFX skills reference the shared contract and contain their task-specific rules.

- [ ] **Step 2: Run the skill test and capture RED**

Run: `node --test tests/game-asset-library.test.mjs`

- [ ] **Step 3: Update the five reusable documents**

Add concise contract sections and cross-references. Record the failure modes discovered in this pass: origin-only validation, global scenery reused across incompatible geometry, placeholder primitives, per-branch scale offsets, detached projectile timing, and effect art forced to collision bounds.

- [ ] **Step 4: Rebuild and audit the portable ZIP**

Recreate `skills/game-asset-library.zip` with exactly the nine canonical Markdown files at the archive root and verify its contents match the directory bytes.

- [ ] **Step 5: Run skill tests to GREEN**

Run: `node --test tests/game-asset-library.test.mjs`

---

### Task 6: Visual playtest, screenshots, and full verification

**Files:**
- Create: `docs/superpowers/reports/2026-08-08-sprite-arena-world-object-quality-pass.md`
- Create: `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/01-hydrant-idle.png`
- Create: `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/02-hydrant-spraying.png`
- Create: `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/03-boss-arena.png`
- Create: `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/04-platform-placement.png`
- Create: `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/05-moth-encounter.png`
- Create: `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/06-squirrel-throw.png`

**Interfaces:**
- Consumes the local preview and strict test routes.
- Produces evidence for all six requested comparison views and a complete root-cause/change report.

- [ ] **Step 1: Run focused automated verification**

Run: `node --test tests/world-placement.test.mjs tests/level-two-props.test.mjs tests/level-two-enemies.test.mjs tests/brutus-boss.test.mjs tests/level-one-fixture.test.mjs tests/level-two-fixture.test.mjs tests/game-asset-library.test.mjs`

- [ ] **Step 2: Run the local preview and six visual routes**

Capture hydrant idle, hydrant spraying, complete boss arena, one corrected platform/object location, moth lamp encounter, and squirrel release frame. Inspect hard edges, pivots, grounding, scale, water termination, sprite bounds, and layer order at desktop and mobile-landscape sizes.

- [ ] **Step 3: Run the full verification matrix**

Run: `npm test`

Run: `npm run lint`

Run: `npm run build:pages && npm run test:pages`

Run: `git diff --check`

- [ ] **Step 4: Write the final evidence report**

Record the requested twelve findings, every generated/repositioned asset, every changed file, exact test outputs, screenshot paths, and any manual item that could not be verified. Do not claim browser validation without captured evidence.

## Self-review

- Spec coverage: all 27 brief sections map to Tasks 1–6; gameplay exclusions are repeated in Global Constraints and protected by existing behavior tests.
- Placeholder scan: no deferred implementation language or unspecified "appropriate" handling remains.
- Type consistency: placement classifications, hydrant helpers, squirrel attachment helpers, atlas state names, and verification paths are defined before consumption.
- Execution decision: the user asked for implementation, so this plan proceeds inline in the current task; no publishing or committing is authorized.
