# Trash Dash Enemy Sprite and Roster Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every non-boss enemy with the approved Trashpunk Distillation character art, implement complete state-specific animation and attacks, migrate the two five-enemy rosters, rebalance encounters, and verify the result through uninterrupted gameplay.

**Architecture:** Preserve the ten approved presentation sheets as immutable reference masters, create reviewed pixel-art production sources, and compile them through one deterministic 192px-cell builder into level-specific body and effect atlases. Strict presentation profiles own cells, scale, anchors, timing, active frames, and attachments; pure Level 1 and Level 2 behavior modules own decisions and state transitions; level definitions own roster and encounter placement; the Canvas runtime loads only the active level and consumes those contracts without visual fallbacks.

**Tech Stack:** TypeScript/React HTML5 Canvas runtime, ECMAScript modules, Sharp deterministic image processing, Node test runner, Vinext, built-in image generation, canonical Trash Dash visual skills, and in-app browser Visual QA.

## Global Constraints

- Apply the canonical project skills in this order: Sprite / Art Asset, Rendering / Asset Integrity, Animation / Motion Sprites, Environment Placement / Z-Order, Overlap Prevention / Spatial QA, then Visual QA.
- The approved 1536x1024 sheets are immutable visual references and must be copied byte-for-byte into the project before derivative work.
- Runtime animation cells are transparent `192x192` PNG cells with integer source rectangles and nearest-neighbor sampling.
- Every fixed-aspect body and effect uses one uniform X/Y scale; state-specific runtime scale correction is forbidden.
- Ground actors use a stable bottom-center foot anchor; flying actors use a stable body-center anchor and an authored flight band.
- Every reachable state owns appropriate cells, local timing, loop/one-shot behavior, completion behavior, and attack or release timing. Unknown states throw.
- Character bodies, projectiles, and effects use separate cells when their timing, bounds, origin, or layer differs.
- Level 1 roster is exactly `spider`, `pigeon`, `mosquito`, `opossum`, `snake`.
- Level 2 roster is exactly `squirrel`, `dog`, `skunk`, `moth`, `bee`.
- Remove Fox from active assets and runtime ownership. Bee is absent from Level 1 and present in Level 2. `dog` replaces the ordinary-enemy `terrier` ID without altering Brutus.
- Existing bosses, players, controls, progression, checkpoints, audio, HUD, camera, scoring, and responsive 16:9 presentation remain unchanged except for compatibility wiring required by the new ordinary enemies.
- Preserve unrelated user changes in the dirty worktree. Stage and commit only task-owned files or isolated hunks.
- The running game is final visual truth. Static tests and fixtures cannot upgrade an unavailable gameplay observation to PASS.
- Final readiness is `YES - VERIFIED` only after source/atlas checks and uninterrupted Level 1 plus Level 2 gameplay. Otherwise return `NO - MISSING:` followed by a comma-separated list of the exact missing states, assets, or observations.
- Task 3 additionally uses the built-in imagegen and pixel-art skills for the approved-master-to-production-art adaptation; the canonical project skills remain authoritative for acceptance.

## File and responsibility map

- `concepts/enemies/approved/`: immutable project copies of the ten supplied 1536x1024 reference sheets.
- `concepts/enemies/production/`: ten reviewed transparent pixel-art production sheets named `spider-source.png`, `pigeon-source.png`, `mosquito-source.png`, `opossum-source.png`, `snake-source.png`, `squirrel-source.png`, `dog-source.png`, `skunk-source.png`, `moth-source.png`, and `bee-source.png`.
- `concepts/enemies/enemy-source-manifest.mjs`: approved-master provenance, canonical IDs, movement class, required state families, and production source paths.
- `concepts/enemies/enemy-frame-manifest.mjs`: explicit frame rectangles, canonical facing, anchor, attachment sockets, event frames, and atlas destinations.
- `concepts/enemies/audit-enemy-sources.mjs`: deterministic metadata, alpha, crop, silhouette, state-coverage, and provenance audit.
- `concepts/enemies/build-enemy-atlases.mjs`: sole builder for the four ordinary-enemy runtime atlases and review contact sheets.
- `concepts/enemies/enemy-source-audit.json` and `enemy-coverage.json`: machine-readable source and completeness evidence.
- `public/assets/generated/level1-enemy-motion.png`: Level 1 body atlas.
- `public/assets/generated/level1-enemy-effects.png`: Level 1 effects/projectiles atlas.
- `public/assets/generated/level2-enemy-motion.png`: Level 2 body atlas, replacing the current ordinary-enemy atlas without changing Brutus.
- `public/assets/generated/level2-enemy-effects.png`: Level 2 effects/projectiles atlas.
- `app/enemy-presentation.mjs`: immutable profiles, strict state lookup, frame/event selection, draw rectangles, and attachment transforms.
- `app/level-one-enemies.mjs`: Level 1 perception, movement, tells, attacks, hit, recovery, and defeat transitions.
- `app/level-two-enemies.mjs`: Squirrel, Dog, Skunk, Moth, and Bee behavior and state ownership.
- `app/enemy-projectiles.mjs`: acorn and other detached projectile/effect lifecycles.
- `app/level-one.mjs` and `app/level-two.mjs`: exact rosters, authored encounter groups, supports, patrols, and flight bands.
- `app/trash-dash-game.tsx`: thin loader, update adapter, collision/event application, effect draw order, and strict Canvas rendering.
- `app/visual-inventory.mjs`: authoritative source/destination/anchor/footprint records and QA routes.

---

### Task 1: Canonical source archive and ingestion audit

**Files:**
- Create: `concepts/enemies/README.md`
- Create: `concepts/enemies/approved/bee.png`
- Create: `concepts/enemies/approved/dog.png`
- Create: `concepts/enemies/approved/mosquito.png`
- Create: `concepts/enemies/approved/moth.png`
- Create: `concepts/enemies/approved/opossum.png`
- Create: `concepts/enemies/approved/pigeon.png`
- Create: `concepts/enemies/approved/skunk.png`
- Create: `concepts/enemies/approved/snake.png`
- Create: `concepts/enemies/approved/spider.png`
- Create: `concepts/enemies/approved/squirrel.png`
- Create: `concepts/enemies/enemy-source-manifest.mjs`
- Create: `concepts/enemies/audit-enemy-sources.mjs`
- Create: `concepts/enemies/enemy-source-audit.json`
- Create: `tests/enemy-source-audit.test.mjs`
- Modify: `package.json`
- Modify: `docs/asset-manifest.md`

**Interfaces:**
- Produces: `ENEMY_SOURCE_MANIFEST`, a deeply frozen ten-record array.
- Produces: `auditEnemySources(): Promise<EnemySourceAudit[]>` and deterministic `enemy-source-audit.json`.
- Produces: `npm run audit:enemy-sources`.

- [ ] **Step 1: Copy the ten approved masters without changing their bytes**

  Copy the supplied files to the canonical spellings above. Record each original filename and absolute import origin in `concepts/enemies/README.md`. Prove every project copy has the same SHA-256 as its supplied master before proceeding.

  ```bash
  mkdir -p concepts/enemies/approved
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/spider.png' concepts/enemies/approved/spider.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/pegeon.png' concepts/enemies/approved/pigeon.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/mosquito.png' concepts/enemies/approved/mosquito.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/opposum.png' concepts/enemies/approved/opossum.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/snake.png' concepts/enemies/approved/snake.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/squirrel.png' concepts/enemies/approved/squirrel.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/dog.png' concepts/enemies/approved/dog.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/skunk.png' concepts/enemies/approved/skunk.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/moth.png' concepts/enemies/approved/moth.png
  cp '/Users/jamesschmittler/Library/Mobile Documents/com~apple~CloudDocs/Documents/New Sprites/bee.png' concepts/enemies/approved/bee.png
  ```

- [ ] **Step 2: Write the failing manifest and audit tests**

  Add concrete assertions:

  ```js
  const EXPECTED = Object.freeze({
    spider: { levelId: "level-1", movement: "grounded", suppliedName: "spider.png" },
    pigeon: { levelId: "level-1", movement: "grounded", suppliedName: "pegeon.png" },
    mosquito: { levelId: "level-1", movement: "flying", suppliedName: "mosquito.png" },
    opossum: { levelId: "level-1", movement: "grounded", suppliedName: "opposum.png" },
    snake: { levelId: "level-1", movement: "grounded", suppliedName: "snake.png" },
    squirrel: { levelId: "level-2", movement: "platform", suppliedName: "squirrel.png" },
    dog: { levelId: "level-2", movement: "grounded", suppliedName: "dog.png" },
    skunk: { levelId: "level-2", movement: "grounded", suppliedName: "skunk.png" },
    moth: { levelId: "level-2", movement: "flying", suppliedName: "moth.png" },
    bee: { levelId: "level-2", movement: "flying", suppliedName: "bee.png" },
  });
  assert.deepEqual(Object.fromEntries(ENEMY_SOURCE_MANIFEST.map((entry) => [entry.id, {
    levelId: entry.levelId, movement: entry.movement, suppliedName: entry.suppliedName,
  }])), EXPECTED);
  assert.ok(audits.every(({ width, height }) => width === 1536 && height === 1024));
  assert.ok(audits.every(({ directRuntimeReady }) => directRuntimeReady === false));
  ```

- [ ] **Step 3: Run RED**

  Run: `node --test tests/enemy-source-audit.test.mjs`

  Expected: FAIL because the manifest and audit module do not exist.

- [ ] **Step 4: Implement the immutable source manifest and mechanical audit**

  Each manifest record declares `id`, `levelId`, `movement`, `approvedPath`, `suppliedName`, `canonicalFacing: "right"`, `cellSize: 192`, `requiredStates`, and `effectFamilies`. The audit uses Sharp to record width, height, channels, alpha presence, edge colors, presentation labels/background status, and the reason each master requires derivative production art. It writes stable key order and rejects missing files, changed dimensions, or duplicate IDs.

- [ ] **Step 5: Run GREEN and document ownership**

  Run: `npm run audit:enemy-sources && node --test tests/enemy-source-audit.test.mjs`

  Expected: PASS with ten records, ten preserved hashes, and ten `directRuntimeReady: false` classifications.

- [ ] **Step 6: Commit**

  ```bash
  git add concepts/enemies/approved concepts/enemies/README.md concepts/enemies/enemy-source-manifest.mjs concepts/enemies/audit-enemy-sources.mjs concepts/enemies/enemy-source-audit.json tests/enemy-source-audit.test.mjs package.json docs/asset-manifest.md
  git commit -m "chore: archive approved enemy source sheets"
  ```

---

### Task 2: Deterministic enemy-art compiler and strict asset contracts

**Files:**
- Create: `concepts/enemies/enemy-frame-manifest.mjs`
- Create: `concepts/enemies/build-enemy-atlases.mjs`
- Create: `concepts/enemies/lib/alpha-bounds.mjs`
- Create: `concepts/enemies/lib/normalize-frame.mjs`
- Create: `concepts/enemies/fixtures/body-frame.png`
- Create: `concepts/enemies/fixtures/effect-frame.png`
- Create: `tests/enemy-atlas-builder.test.mjs`
- Modify: `package.json`
- Modify: `docs/asset-manifest.md`

**Interfaces:**
- Produces: `BODY_CELL_SIZE = 192`, `GROUND_BASELINE = 176`, and `ENEMY_FRAME_MANIFEST`.
- Produces: `normalizeFrame({ input, sourceRect, anchor, scale, paletteSize, cellSize }): Promise<Buffer>`.
- Produces: `buildEnemyAtlases({ manifest, outputRoot }): Promise<BuildReport>`.
- Produces: `npm run build:enemy-art`.

- [ ] **Step 1: Write RED compiler-contract tests against synthetic fixtures**

  Require the builder to reject empty crops, source rectangles outside the image, duplicate `(levelId, atlas, row, state, frame)` ownership, nonuniform scale, unintended alpha on a cell edge, missing required states, invalid active/release frames, and effect frames containing the body fixture. Require a valid grounded frame to place its declared foot point at row 176 and a valid flyer to preserve its declared body center. Reject duplicate frame bytes unless an explicit held-pose record owns the reuse, and reject any atlas exceeding `768x12288` pixels or 48 MiB decoded RGBA.

  ```js
  await assert.rejects(() => buildEnemyAtlases({ manifest: badScale, outputRoot }), /uniform scale/i);
  await assert.rejects(() => buildEnemyAtlases({ manifest: duplicateOwner, outputRoot }), /duplicate atlas owner/i);
  assert.deepEqual(await opaqueBottomRows(validGroundCell), [176]);
  assert.deepEqual(await measuredBodyCenter(validFlightCell), { x: 96, y: 96 });
  ```

- [ ] **Step 2: Run RED**

  Run: `node --test tests/enemy-atlas-builder.test.mjs`

  Expected: FAIL because the builder interfaces do not exist.

- [ ] **Step 3: Implement the frame manifest schema**

  Define body entries with `enemyId`, `levelId`, `state`, `sourcePath`, `sourceRect`, `frameIndex`, `fps`, `loop`, `anchor`, `visibleBounds`, `uniformScale`, `eventFrames`, and `attachments`. Define effects with `effectId`, `ownerId`, `origin`, `facingPolicy`, `layer`, `duration`, and `collisionBounds`. Validate the schema before processing any image.

- [ ] **Step 4: Implement deterministic normalization and atlas emission**

  Use integer extraction, hard-alpha cleanup for bodies, separately permitted soft alpha for glow/gas/web effects, nearest-neighbor resize, shared per-enemy scale, stable semantic alignment, and indexed PNG output. Emit Level 1 body/effect atlases, Level 2 body/effect atlases, contact sheets, and `enemy-coverage.json`. Sort all entries by level, enemy roster order, state order, then frame index. Fail the build when dimensions or decoded memory exceed the limits above.

- [ ] **Step 5: Prove determinism and run GREEN**

  Run the builder twice into two temporary directories and compare SHA-256 for every PNG and JSON. Then run:

  `node --test tests/enemy-atlas-builder.test.mjs`

  Expected: PASS with byte-identical outputs.

- [ ] **Step 6: Commit**

  ```bash
  git add concepts/enemies/enemy-frame-manifest.mjs concepts/enemies/build-enemy-atlases.mjs concepts/enemies/lib concepts/enemies/fixtures tests/enemy-atlas-builder.test.mjs package.json docs/asset-manifest.md
  git commit -m "feat: add deterministic enemy art compiler"
  ```

---

### Task 3: Complete ten-character production-art gate

**Files:**
- Create: `concepts/enemies/production/spider-source.png`
- Create: `concepts/enemies/production/pigeon-source.png`
- Create: `concepts/enemies/production/mosquito-source.png`
- Create: `concepts/enemies/production/opossum-source.png`
- Create: `concepts/enemies/production/snake-source.png`
- Create: `concepts/enemies/production/squirrel-source.png`
- Create: `concepts/enemies/production/dog-source.png`
- Create: `concepts/enemies/production/skunk-source.png`
- Create: `concepts/enemies/production/moth-source.png`
- Create: `concepts/enemies/production/bee-source.png`
- Create: `concepts/enemies/enemy-anchor-lineup.png`
- Create: `concepts/enemies/enemy-production-contact-sheet.png`
- Create: `concepts/enemies/level1-enemy-motion-contact-sheet.png`
- Create: `concepts/enemies/level1-enemy-effects-contact-sheet.png`
- Modify: `concepts/enemies/enemy-frame-manifest.mjs`
- Create: `concepts/enemies/enemy-coverage.json`
- Create: `public/assets/generated/level1-enemy-motion.png`
- Create: `public/assets/generated/level1-enemy-effects.png`
- Modify: `public/assets/generated/level2-enemy-motion.png`
- Create: `public/assets/generated/level2-enemy-effects.png`
- Create: `tests/enemy-production-art.test.mjs`

**Interfaces:**
- Consumes: Task 1 approved masters and Task 2 compiler.
- Produces: complete reviewed art and exact frame records for all ten enemies.

- [ ] **Step 1: Write RED completeness tests**

  Require `enemy-coverage.json` to contain exactly ten enemies, every required state/effect from `ENEMY_SOURCE_MANIFEST`, at least one unique nonempty frame per state, no cross-state body-frame hash reuse unless the manifest explicitly marks a correct held pose, no clipped cell, correct baseline/body center, and no body pixels in effect-only cells.

- [ ] **Step 2: Generate one production anchor for each enemy using the approved master as reference**

  Use the built-in image generation tool with this locked shared direction:

  > Side-on, right-facing late-16-bit pixel-art game enemy for Trash Dash; preserve the supplied character's exact animal, silhouette, expression, signature scavenged equipment, palette identity, and anatomy; hard dark blue-gray pixel contour; three-to-four-value material ramps; crisp pixel clusters; no antialiasing, smooth gradient, text, scenery, border, shadow plate, duplicate body, or cropped extremity; complete silhouette centered within a transparent 192x192 production cell; feet aligned to a shared bottom-center baseline for grounded characters or body centered for flyers.

  Add the character-specific identity paragraph from the approved design spec to each request. Inspect native pixels and assemble all ten anchors in `enemy-anchor-lineup.png`. Pause for one all-ten user approval gate; revise rejected anchors without integrating partial cast art.

- [ ] **Step 3: Produce the complete state and effect sources from approved anchors**

  Use each approved anchor plus its reference master to create the exact required state families. Keep body scale invariant across states. Create separate sources for Spider web/venom, Pigeon feathers/impact, Mosquito dash/proboscis effects, Opossum swipe/debris, Snake venom/impact, Squirrel acorn travel/crack/debris, Dog dust/bite impact, Skunk fumes/gas, Moth lantern/glow, and Bee dash/venom. Do not embed labels or reusable environmental scenery.

- [ ] **Step 4: Record explicit frame rectangles and event sockets**

  Populate `ENEMY_FRAME_MANIFEST` only after inspecting each generated source at native size. Record every crop rectangle, foot/body anchor, active/release frame, and attachment socket. Run the compiler; fix source art or manifest data when a frame fails rather than adding a runtime scale/offset exception.

- [ ] **Step 5: Run the complete art gate and review all ten together**

  Run:

  `npm run build:enemy-art && node --test tests/enemy-source-audit.test.mjs tests/enemy-atlas-builder.test.mjs tests/enemy-production-art.test.mjs`

  Inspect all four runtime atlases and all contact sheets at native scale and 400%. Obtain one user approval for the complete ten-character production roster.

- [ ] **Step 6: Prove deterministic rebuilds and commit**

  Rebuild twice and compare hashes for the four atlases, contact sheets, and coverage JSON.

  ```bash
  git add concepts/enemies/production concepts/enemies/*.png concepts/enemies/enemy-frame-manifest.mjs concepts/enemies/enemy-coverage.json public/assets/generated/level1-enemy-motion.png public/assets/generated/level1-enemy-effects.png public/assets/generated/level2-enemy-motion.png public/assets/generated/level2-enemy-effects.png tests/enemy-production-art.test.mjs
  git commit -m "feat: build redesigned enemy sprite roster"
  ```

---

### Task 4: Strict shared presentation profiles and Canvas renderer

**Files:**
- Create: `app/enemy-presentation.mjs`
- Modify: `app/visual-inventory.mjs`
- Modify: `app/trash-dash-game.tsx`
- Create: `tests/enemy-presentation.test.mjs`
- Modify: `tests/visual-inventory.test.mjs`
- Modify: `tests/visual-asset-integrity.test.mjs`

**Interfaces:**
- Produces: `enemyPresentation(levelId, kind, state): EnemyAnimationState`.
- Produces: `enemyAnimationFrame(animation, elapsed): number`.
- Produces: `enemyDrawRect(enemy, profile, renderX = enemy.x): { x, y, w, h }`.
- Produces: `enemyAttachmentPoint(enemy, profile, attachmentId): { x, y }`.
- Produces: `crossedEnemyEvent(animation, eventName, previousElapsed, nextElapsed): boolean`.
- Produces: `LEVEL_ONE_ENEMY_PROFILES` and `LEVEL_TWO_ENEMY_PROFILES`.

- [ ] **Step 1: Write RED profile and renderer-source tests**

  Assert exact profile keys, strict unknown-state errors, uniform per-enemy destination scale, stable anchors across every state and facing, valid event frames, real attachment sockets, and lazy active-level asset loading. Source-scan `trash-dash-game.tsx` to reject the old `enemyMotion`, `varietyEnemyMotion`, per-kind draw sizes, `levelOneEnemyAnimations`, and generic frame fallback.

  ```js
  assert.throws(() => enemyPresentation("level-1", "spider", "missing"), RangeError);
  assert.equal(profile.renderWidth / 192, profile.renderHeight / 192);
  assert.deepEqual(enemyDrawRect(leftFacing, profile), enemyDrawRect(rightFacing, profile));
  ```

- [ ] **Step 2: Run RED**

  Run: `node --test tests/enemy-presentation.test.mjs tests/visual-inventory.test.mjs tests/visual-asset-integrity.test.mjs`

- [ ] **Step 3: Implement immutable profiles and strict frame/event helpers**

  Build profiles directly from the compiled manifest/coverage data. State entries contain `row`, `startFrame`, `frames`, `fps`, `loop`, `interruptible`, `returnState`, `eventFrames`, and `attachments`. Keep collision separate from visible/source bounds. Freeze nested structures and reject duplicate/missing state ownership at module load in development tests.

- [ ] **Step 4: Replace ordinary-enemy loader and draw branches**

  Load `level1-enemy-motion/effects` only for Level 1 and `level2-enemy-motion/effects` only for Level 2. Render every ordinary enemy through `enemyPresentation`, `enemyAnimationFrame`, and `enemyDrawRect`; render effects through their own profile/origin/layer. Preserve boss rendering unchanged.

- [ ] **Step 5: Register authoritative visual inventory records**

  Add source, cell, visible bounds, uniform destination geometry, anchor, collision, placement footprint, atlas family, and QA route for all ten enemies and their detached effects. Remove legacy ordinary-enemy draw families.

- [ ] **Step 6: Run GREEN and commit**

  Run: `node --test tests/enemy-presentation.test.mjs tests/visual-inventory.test.mjs tests/visual-asset-integrity.test.mjs && npm run build`

  ```bash
  git add app/enemy-presentation.mjs app/visual-inventory.mjs app/trash-dash-game.tsx tests/enemy-presentation.test.mjs tests/visual-inventory.test.mjs tests/visual-asset-integrity.test.mjs
  git commit -m "feat: add strict enemy presentation profiles"
  ```

---

### Task 5: Level 1 state machines and character-specific attacks

**Files:**
- Create: `app/level-one-enemies.mjs`
- Modify: `app/level-one-enemy-animation.mjs`
- Create: `app/enemy-projectiles.mjs`
- Modify: `app/trash-dash-game.tsx`
- Create: `tests/level-one-enemies.test.mjs`
- Create: `tests/enemy-projectiles.test.mjs`
- Modify: `tests/hit-sprite-frames.test.mjs`

**Interfaces:**
- Produces: `updateLevelOneEnemy(enemy, context): { enemy, events }`.
- Produces: `beginLevelOneEnemyDamageReaction(enemy): EnemyState`.
- Produces: `spawnEnemyProjectile(event): EnemyProjectile` and `updateEnemyProjectile(projectile, context): EnemyProjectileResult`.
- Consumes: Task 4 presentation events and attachment points.

- [ ] **Step 1: Write table-driven RED lifecycle tests**

  Cover these exact reachable progressions in both facings:

  ```text
  Spider: idle -> walk/run -> web-tell -> web-or-bite -> recover -> walk
  Pigeon: idle -> walk/run -> slam-tell -> peck-or-slam -> recover -> walk
  Mosquito: hover -> slow-flight -> dash -> needle-tell -> thrust -> recover -> hover
  Opossum: idle -> walk/run -> lunge-tell -> swipe-lunge -> recover -> walk
  Snake: coil -> slither -> fast-slither -> strike-tell -> strike -> recover -> slither
  Any living enemy: current -> hit -> recover -> appropriate locomotion
  Any fatal enemy: current -> hit -> defeat -> inactive
  ```

  Assert tells fall within 0.35–0.65 seconds, one-shots clamp at the final frame, elapsed time resets on transition, facing respects the dead zone, event frames fire exactly once, and ground/flying formulas stay distinct.

- [ ] **Step 2: Run RED**

  Run: `node --test tests/level-one-enemies.test.mjs tests/enemy-projectiles.test.mjs tests/hit-sprite-frames.test.mjs`

- [ ] **Step 3: Implement the five pure behavior owners**

  Dispatch by kind inside `updateLevelOneEnemy`. Use state-local timers and profile event frames. Spider emits web or performs bite contact; Pigeon performs grounded peck/slam; Mosquito stays inside its band and executes dash/thrust; Opossum owns a committed swipe/lunge; Snake stays on its support and owns coil/slither/strike. Return explicit `melee-active`, `projectile-release`, and `effect` events rather than applying damage at state entry.

- [ ] **Step 4: Implement detached projectile/effect lifecycles**

  Give web/venom/debris projectiles explicit owner, origin, facing, velocity/trajectory, frame state, active collision interval, impact transition, and terminal state. Use the presentation attachment socket for spawn. Never reuse the Squirrel's old `BinLid` representation for unrelated projectiles.

- [ ] **Step 5: Wire Level 1 runtime updates and damage priority**

  Replace generic patrol-only intent for the five Level 1 roster members with `updateLevelOneEnemy`. Apply behavior events after the state update, use profile active frames for damage, keep hit/defeat priority over locomotion, and retain support/patrol clamping from `enemy-surface.mjs`.

- [ ] **Step 6: Run GREEN, build, and commit**

  Run: `node --test tests/level-one-enemies.test.mjs tests/enemy-projectiles.test.mjs tests/hit-sprite-frames.test.mjs tests/enemy-surface.test.mjs && npm run build`

  ```bash
  git add app/level-one-enemies.mjs app/level-one-enemy-animation.mjs app/enemy-projectiles.mjs app/trash-dash-game.tsx tests/level-one-enemies.test.mjs tests/enemy-projectiles.test.mjs tests/hit-sprite-frames.test.mjs
  git commit -m "feat: implement redesigned level one enemies"
  ```

---

### Task 6: Level 2 Dog/Bee migration and complete specialist attacks

**Files:**
- Modify: `app/level-two-enemies.mjs`
- Modify: `app/enemy-projectiles.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/level-two-enemies.test.mjs`
- Create: `tests/squirrel-projectile.test.mjs`
- Create: `tests/dog-animation-integrity.test.mjs`
- Modify: `tests/hit-sprite-frames.test.mjs`

**Interfaces:**
- Produces: `LEVEL_TWO_ENEMY_STATES` keyed only by `squirrel`, `dog`, `skunk`, `moth`, `bee`.
- Produces: `updateLevelTwoEnemy(enemy, context): { enemy, events }`.
- Produces: `squirrelThrowAttachment(enemy, facing)` from the presentation profile's `throw-hand` socket.
- Consumes: Task 5 projectile runtime and Task 4 profiles.

- [ ] **Step 1: Write RED Level 2 lifecycle tests**

  Require strict state ownership and these progressions:

  ```text
  Squirrel: idle/walk -> detect-aim -> prepare -> wind-up -> release -> follow-through -> recover -> idle/walk
  Dog: idle/sit -> wake -> run/charge -> bite-tell -> lunge or wall-impact -> recover -> run/sit
  Skunk: patrol -> tail-rise -> gas-active -> recover -> patrol
  Moth: hover/orbit -> lantern-tell -> lantern-attack/dash -> return -> hover/orbit
  Bee: hover -> slow-flight -> dash -> stinger-tell -> thrust -> recover -> hover
  ```

  Assert no `terrier` state key remains, Dog hit and obstacle impact remain distinct, Skunk gas effect contains no duplicate body, Moth stays within its full visual band, Bee uses flight states only, and every attack-active/release event fires once.

- [ ] **Step 2: Write RED Squirrel projectile tests**

  Require the release event at the authored hand socket and the sequence `initial -> spin -> fast-travel/trajectory -> impact -> crack -> debris -> inactive`. Assert visual rotation, position, collision, and impact state advance from the same projectile timebase. Assert tail reflection, if retained, changes ownership/direction once without replaying release.

- [ ] **Step 3: Run RED**

  Run: `node --test tests/level-two-enemies.test.mjs tests/squirrel-projectile.test.mjs tests/dog-animation-integrity.test.mjs tests/hit-sprite-frames.test.mjs`

- [ ] **Step 4: Refactor Level 2 behavior around the new five IDs**

  Rename the ordinary Dog state/data path from `terrier` to `dog`; do not touch Brutus. Preserve the repaired impact-facing lifecycle. Expand Squirrel to the complete throw sequence; separate Skunk body from gas; change Moth to the approved lantern language; add Bee hover/dash/stinger behavior with its own flight-band rules.

- [ ] **Step 5: Replace the old bin-lid Squirrel representation**

  Spawn an `EnemyProjectile` with `kind: "acorn"`, owner ID, `throw-hand` origin, facing, trajectory, collision bounds, and presentation state. Render its initial/spin/travel/impact/crack/debris cells from `level2-enemy-effects.png` and remove Squirrel dependence on `levelTwoPropFrame("acorn")`.

- [ ] **Step 6: Wire runtime and run GREEN**

  Run: `node --test tests/level-two-enemies.test.mjs tests/squirrel-projectile.test.mjs tests/dog-animation-integrity.test.mjs tests/hit-sprite-frames.test.mjs tests/enemy-surface.test.mjs && npm run build`

- [ ] **Step 7: Commit**

  ```bash
  git add app/level-two-enemies.mjs app/enemy-projectiles.mjs app/trash-dash-game.tsx tests/level-two-enemies.test.mjs tests/squirrel-projectile.test.mjs tests/dog-animation-integrity.test.mjs tests/hit-sprite-frames.test.mjs
  git commit -m "feat: implement redesigned level two enemies"
  ```

---

### Task 7: Exact roster migration and encounter-layout rebuild

**Files:**
- Modify: `app/level-one.mjs`
- Modify: `app/level-two.mjs`
- Modify: `app/level-runtime.mjs`
- Modify: `app/world-placement.mjs`
- Modify: `tests/level-one-definition.test.mjs`
- Modify: `tests/level-two-definition.test.mjs`
- Modify: `tests/level-one-fixture.test.mjs`
- Modify: `tests/level-two-fixture.test.mjs`
- Modify: `tests/world-placement.test.mjs`
- Modify: `tests/world-composition.test.mjs`
- Modify: `tests/visual-spawn-envelope.test.mjs`

**Interfaces:**
- Produces: exact five-kind rosters and authored show/solo/repeat/combine/mastery/release encounter groups.
- Consumes: full visible/motion/effect envelopes from Task 4 profiles.

- [ ] **Step 1: Write RED roster, order, support, density, and route tests**

  ```js
  assert.deepEqual(LEVEL_ONE_ENEMY_KINDS, ["spider", "pigeon", "mosquito", "opossum", "snake"]);
  assert.deepEqual(LEVEL_TWO_ENEMY_KINDS, ["squirrel", "dog", "skunk", "moth", "bee"]);
  ```

  Require every kind to appear by level end, every ground actor to name a real support, every flyer to name a full-envelope flight band, no more than two groups in a rolling 960px viewport, large Dog/Opossum/Skunk encounters to own isolated space, mandatory landing targets and boss runways to remain clear, and Squirrel/gas/dash lanes to leave a traversable route.

- [ ] **Step 2: Run RED**

  Run: `node --test tests/level-one-definition.test.mjs tests/level-two-definition.test.mjs tests/world-placement.test.mjs tests/world-composition.test.mjs tests/visual-spawn-envelope.test.mjs`

- [ ] **Step 3: Author the Level 1 teaching progression**

  Replace old groups with: Woodland Snake solo; Creek grounded Pigeon then Mosquito; Highway Spider tutorial then separated Snake/Mosquito; Industrial Opossum solo then Pigeon/Spider on separate elevations; Park familiar mastery; empty boss runway. Preserve all existing route IDs, checkpoints, rewards, and surfaces unless a measured enemy envelope requires a scoped coordinate adjustment.

- [ ] **Step 4: Author the Level 2 specialist progression**

  Use: Backyard Squirrel; Street Dog then separated Squirrel; Obstacle Skunk then separated Skunk/Squirrel; Drainage Moth then Bee; separated late-drainage mastery; empty boss approach and post-boss street. Keep Brutus arena data unchanged.

- [ ] **Step 5: Validate actual full footprints and activation windows**

  Feed each profile's largest body/attack/effect envelope into `resolveEnemyWorldPatrol` and rolling composition checks. Adjust spawn, patrol, activation, or band data—not sprite scale—to fix overlap, clipping, unfair sightlines, or blocked routes.

- [ ] **Step 6: Run GREEN and commit**

  Run: `node --test tests/level-one-definition.test.mjs tests/level-two-definition.test.mjs tests/level-one-fixture.test.mjs tests/level-two-fixture.test.mjs tests/world-placement.test.mjs tests/world-composition.test.mjs tests/visual-spawn-envelope.test.mjs`

  ```bash
  git add app/level-one.mjs app/level-two.mjs app/level-runtime.mjs app/world-placement.mjs tests/level-one-definition.test.mjs tests/level-two-definition.test.mjs tests/level-one-fixture.test.mjs tests/level-two-fixture.test.mjs tests/world-placement.test.mjs tests/world-composition.test.mjs tests/visual-spawn-envelope.test.mjs
  git commit -m "feat: rebalance enemy rosters and encounters"
  ```

---

### Task 8: Remove legacy Fox/Bee/terrier ownership and harden completeness gates

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Delete: `app/level-one-enemy-animation.mjs`
- Modify: `app/visual-inventory.mjs`
- Modify: `scripts/build-sprite-atlases.py`
- Delete: `concepts/level-two/build-atlases.mjs`
- Delete: `concepts/level-two/source/squirrel-anchor.png`
- Delete: `concepts/level-two/source/squirrel-motion-source.png`
- Delete: `concepts/level-two/source/squirrel-throw-source.png`
- Delete: `concepts/level-two/source/terrier-anchor.png`
- Delete: `concepts/level-two/source/terrier-motion-source.png`
- Delete: `concepts/level-two/source/skunk-anchor.png`
- Delete: `concepts/level-two/source/skunk-motion-source.png`
- Delete: `concepts/level-two/source/moth-anchor.png`
- Delete: `concepts/level-two/source/moth-motion-source.png`
- Delete: `public/assets/generated/enemy-variety-motion.png`
- Delete: `public/assets/enemy-motion.png`
- Modify: `docs/asset-manifest.md`
- Modify: `package.json`
- Create: `tests/enemy-roster-migration.test.mjs`
- Modify: `tests/visual-inventory.test.mjs`
- Modify: `tests/visual-asset-integrity.test.mjs`
- Modify: `tests/v2-visual-remediation.test.mjs`

**Interfaces:**
- Produces: repository-wide active-runtime absence of Fox, Level 1 Bee/wasp, ordinary `terrier`, and retired ordinary-enemy atlas ownership.
- Produces: default test command coverage for every new enemy contract.

- [ ] **Step 1: Write RED repository-ownership tests**

  Scan active paths (`app/`, `scripts/`, `concepts/`, `tests/`, `public/assets/generated/`, and `docs/asset-manifest.md`) and reject Fox gameplay IDs/assets/rows, Level 1 Bee/wasp registrations, ordinary `terrier`, old ordinary-enemy atlases, generic motion rows, fallback draw branches, and missing new atlas paths. Permit historical mentions only in files explicitly marked archival and exclude Brutus from the Dog rename rule.

- [ ] **Step 2: Run RED**

  Run: `node --test tests/enemy-roster-migration.test.mjs tests/visual-inventory.test.mjs tests/visual-asset-integrity.test.mjs tests/v2-visual-remediation.test.mjs`

- [ ] **Step 3: Delete obsolete runtime and build ownership**

  Remove Fox rows/IDs/sizes/fixtures, the Level 1 wasp alias, ordinary `terrier` keys, `enemyMotion`/`varietyEnemyMotion`, legacy body atlas generation, unused imports/preloads, and dead tests. Keep unrelated historical source files only when referenced by an archival document and clearly outside runtime/build manifests.

- [ ] **Step 4: Make the default suite enforce the new system**

  Add `audit:enemy-sources` and `build:enemy-art` scripts. Add the new audit, builder, production-art, presentation, Level 1 behavior, Level 2 behavior, projectile, roster, placement, and integrity tests to `npm test`. Keep asset loading lazy by active level.

- [ ] **Step 5: Run GREEN and repository searches**

  Run the focused matrix, then:

  ```bash
  rg -n '\bfox\b|enemy-variety-motion|assets/enemy-motion' app scripts concepts tests public/assets/generated docs/asset-manifest.md
  rg -n '\bwasp\b' app scripts concepts tests public/assets/generated docs/asset-manifest.md
  rg -n '\bterrier\b' app scripts concepts tests public/assets/generated docs/asset-manifest.md
  ```

  Expected: no active matches; any retained archival match is documented by exact file and reason.

- [ ] **Step 6: Commit**

  ```bash
  git add app/trash-dash-game.tsx app/level-one-enemy-animation.mjs app/visual-inventory.mjs scripts/build-sprite-atlases.py concepts/level-two/build-atlases.mjs concepts/level-two/source/squirrel-anchor.png concepts/level-two/source/squirrel-motion-source.png concepts/level-two/source/squirrel-throw-source.png concepts/level-two/source/terrier-anchor.png concepts/level-two/source/terrier-motion-source.png concepts/level-two/source/skunk-anchor.png concepts/level-two/source/skunk-motion-source.png concepts/level-two/source/moth-anchor.png concepts/level-two/source/moth-motion-source.png public/assets/generated/enemy-variety-motion.png public/assets/enemy-motion.png docs/asset-manifest.md package.json tests/enemy-roster-migration.test.mjs tests/visual-inventory.test.mjs tests/visual-asset-integrity.test.mjs tests/v2-visual-remediation.test.mjs
  git commit -m "chore: remove legacy enemy roster ownership"
  ```

---

### Task 9: Native-image review, runtime Visual QA, and final readiness report

**Files:**
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild.md`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/coverage-table.md`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/01-spider-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/02-pigeon-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/03-mosquito-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/04-opossum-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/05-snake-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/06-squirrel-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/07-dog-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/08-skunk-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/09-moth-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/10-bee-combat.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/11-level-one-roster.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/12-level-two-roster.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/13-squirrel-acorn.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/14-dog-impact.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/15-skunk-gas.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/16-flight-bands.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/17-level-one-boss-runway.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/18-level-two-boss-runway.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/19-mobile-level-one.png`
- Create: `docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild/20-mobile-level-two.png`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: all eight implementation tasks.
- Produces: source/atlas/runtime evidence and the exact final `YES - VERIFIED` or `NO - MISSING: ...` decision.

- [ ] **Step 1: Run the clean automated release matrix**

  Run from the exact scoped commit snapshot:

  ```bash
  npm run validate:skills
  npm run audit:enemy-sources
  npm run build:enemy-art
  npm test
  npm run lint
  npm run build:pages
  npm run test:pages
  git diff --check
  ```

  Rebuild enemy art twice and compare hashes for four atlases, all contact sheets, source audit JSON, and coverage JSON.

- [ ] **Step 2: Inspect every native source and output**

  Inspect all ten approved masters, ten production anchor/state families, four atlases, and contact sheets at native scale and 400%. Record actual frame counts, visible bounds, scale, baseline/body center, margins, palette, alpha mode, event frames, and attachments. Reject clipping, matte/fringe, duplicate body layers, mixed pixel density, state scale drift, or incorrect viewpoint.

- [ ] **Step 3: Run direct diagnostic fixtures without treating them as completion proof**

  Add cache-busted routes for each enemy and interaction pair. Exercise every state, transition, facing, projectile/effect, hit, and defeat at desktop and mobile-landscape viewports. Capture consecutive frames around every changed transition with render/collision/anchor debug overlays and empty warning/error logs.

- [ ] **Step 4: Perform the uninterrupted campaign audit**

  Start at title, select a character normally, and play through Levels 1 and 2 without direct-state shortcuts. Observe all ten enemies during idle/hover, ordinary movement, fast movement, attack, hit, recovery/defeat, both facings, effects/projectiles, grounding/flight, collision, layering, and encounter spacing. Observe a real Squirrel acorn lifecycle, real Skunk gas, real Dog charge/bite/impact, and real Spider/Pigeon/Opossum/Snake attacks. Verify Mosquito, Moth, and Bee stay in authored flight bands. Verify quiet boss approaches and unchanged bosses.

- [ ] **Step 5: Write the ten-enemy coverage table and balance report**

  For each enemy record implemented state names, usable frame counts, effects, projectiles, source/atlas result, runtime observations, and COMPLETE/INCOMPLETE. Record Level 1 and Level 2 rosters, Bee migration, Fox removal, major spawn relocations, density changes, breathing spaces, challenge peaks, and every corrected gameplay issue.

- [ ] **Step 6: Issue the honest final decision**

  End the report with exactly one:

  ```text
  YES - VERIFIED
  ```

  or

  ```text
  NO - MISSING: mosquito hit reaction, Bee recovery, uninterrupted Level 2 traversal
  ```

  If browser input cannot sustain the campaign, use `NO - MISSING` and name the unobserved sequences; do not promote fixture evidence.

- [ ] **Step 7: Commit the evidence**

  ```bash
  git add docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild.md docs/superpowers/reports/2026-08-10-enemy-sprite-roster-rebuild docs/visual-audit.md
  git commit -m "docs: report enemy roster rebuild verification"
  ```
