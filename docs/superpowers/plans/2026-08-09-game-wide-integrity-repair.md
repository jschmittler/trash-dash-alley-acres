# Trash Dash Game-Wide Integrity Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-audit and repair every reproducible Level 1 and Level 2 visual, rendering, animation, placement, collision, responsive, and presentation defect at its systemic root cause, while confirming the existing music integration without rescoring.

**Architecture:** Work through evidence-gated passes. Each pass captures the running-game result, records a stable `VIS-###` issue only when a defect is reproduced, adds a deterministic failing regression for the measured root cause, repairs the shared contract or source asset, and closes the issue only after focused tests and final runtime inspection. The existing visual contract, inventory, animation manifests, support geometry, and browser test routes remain the central interfaces.

**Tech Stack:** React 19, TypeScript, HTML5 Canvas, JavaScript ES modules, Node test runner, Sharp-based deterministic asset builders, Vinext/Vite, ESLint, in-app Browser automation, GitHub Pages build.

## Global Constraints

- Read `AGENTS.md`, `.skills/README.md`, and all seven canonical `.skills/*/SKILL.md` files before implementation.
- Rendering / Asset Integrity is mandatory for every visual change; Visual QA is the final gate.
- Preserve source artwork when it satisfies the source-art contract; rebuilding is allowed when source evidence fails the contract.
- Never use independent X/Y scaling, unexplained offsets, z-order concealment, collision disguises, or redraws to mask pipeline defects.
- Desktop remains the primary experience; every repair must preserve responsive and mobile-landscape behavior.
- Audio work is confirmation-only: no composition, replacement, or rescore.
- Preserve the existing dirty worktree and commit only files belonging to the current task.
- Do not mark an issue fixed without both deterministic automated evidence and observation in the running game after the final change.
- Use `docs/visual-audit.md` as the canonical issue ledger; the external Desktop `audit.md` is historical input, not the current tracker.

---

### Task 1: Capture a Fresh Runtime Baseline and Open Only Reproduced Issues

**Files:**
- Modify: `app/visual-inventory.mjs:295-305`
- Modify: `tests/visual-inventory.test.mjs:29`
- Modify: `docs/visual-audit.md`
- Create: `docs/superpowers/reports/2026-08-09-game-wide-integrity-baseline.md`
- Create as evidence requires: `docs/superpowers/reports/2026-08-09-game-wide-integrity/before/*.png`

**Interfaces:**
- Consumes: `VISUAL_QA_ROUTES`, direct route query handling in `app/trash-dash-game.tsx`, `docs/visual-audit.md` issue format.
- Produces: complete route catalog; reproducible `VIS-###` records; baseline screenshots and browser-console evidence used by Tasks 2–10.

- [ ] **Step 1: Extend the route-coverage test before changing the catalog**

Add explicit required IDs to `tests/visual-inventory.test.mjs`:

```js
const REQUIRED_GAME_WIDE_ROUTES = [
  "l1-start", "l1-creek", "l1-highway", "l1-industrial", "l1-park", "l1-boss", "l1-victory",
  "l2-backyard", "l2-street", "l2-obstacle", "l2-drainage", "l2-runway", "l2-main-street",
  "l2-squirrel", "l2-terrier", "l2-skunk", "l2-moth", "l2-interaction", "l2-boss", "l2-victory",
];

test("visual QA catalog covers every Level 1 and Level 2 integrity checkpoint", () => {
  assert.deepEqual(
    REQUIRED_GAME_WIDE_ROUTES.filter((id) => !VISUAL_QA_ROUTES.some((route) => route.id === id)),
    [],
  );
});
```

- [ ] **Step 2: Run the focused test and observe the missing-route failure**

Run: `node --test tests/visual-inventory.test.mjs`

Expected: FAIL listing route IDs absent from the current abbreviated catalog.

- [ ] **Step 3: Add exact immutable route entries**

Extend `VISUAL_QA_ROUTES` with one entry per required ID using the approved query routes. Preserve distinct `levelId`, `checkpoint`, `bossId`, and `viewport` metadata. Use `mobile-landscape` only for the dedicated responsive samples; keep gameplay diagnosis routes desktop-first.

- [ ] **Step 4: Run the route and inventory tests**

Run: `node --test tests/visual-inventory.test.mjs tests/visual-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Capture the running-game baseline**

Start or reuse the local server. At 1440×900, enter the game and inspect every catalog route after character confirmation. Capture the before frame only when a defect is visible. Repeat the designated responsive routes at 844×390. Record browser warning/error logs after the route sweep.

- [ ] **Step 6: Recheck the historical audit items explicitly**

Inspect sprinkler body/water ownership, lamp-post aspect and baseline, Level 1 opening crates, Level 1 boss, Brutus, and representative enemy pause/hit/recovery states. If an item passes, add fresh evidence without reopening it. If it fails, reopen or create a `VIS-###` record with route, state, expected result, observed result, and screenshot.

- [ ] **Step 7: Write the baseline report and issue ledger**

The report must list every visited URL, viewport, character, state/interaction exercised, console result, screenshot path, opened issue, and unverified condition. Do not write `PASS` for a route that remained behind the title or character-select overlay.

- [ ] **Step 8: Commit the baseline separately**

```bash
git add app/visual-inventory.mjs tests/visual-inventory.test.mjs docs/visual-audit.md docs/superpowers/reports/2026-08-09-game-wide-integrity-baseline.md docs/superpowers/reports/2026-08-09-game-wide-integrity/before
git commit -m "test: capture game-wide visual baseline"
```

---

### Task 2: Strengthen Shared Render, Alpha, Atlas, and Anchor Contracts

**Files:**
- Modify: `app/visual-contract.mjs`
- Modify: `app/visual-inventory.mjs`
- Modify: `tests/visual-contract.test.mjs`
- Modify: `tests/visual-asset-integrity.test.mjs`
- Modify only for reproduced defects: `app/trash-dash-game.tsx:2218-2242`
- Modify only for source defects: affected deterministic builder under `scripts/` or `concepts/`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: `createVisualContract`, inventory `nativePixelSize`, `visualBounds`, `referenceWorldHeight`, `scalePolicy`, atlas metadata, and `drawSprite` destination geometry.
- Produces: `validateAspectRatio`, `validateVisibleAnchor`, and contract failures that identify distorted or padding-driven rendering before runtime.

- [ ] **Step 1: Add failing fixed-aspect and anchor tests**

Add to `tests/visual-contract.test.mjs`:

```js
test("fixed-aspect rendering rejects independently distorted destination axes", () => {
  assert.deepEqual(validateAspectRatio({ source: { w: 48, h: 64 }, destination: { w: 96, h: 96 } }), [
    "source aspect 0.75 does not match destination aspect 1.00",
  ]);
  assert.deepEqual(validateAspectRatio({ source: { w: 48, h: 64 }, destination: { w: 72, h: 96 } }), []);
});

test("ground anchors must lie on the visible contact edge", () => {
  assert.deepEqual(validateVisibleAnchor({ visibleBounds: { x: -24, y: -64, w: 48, h: 64 }, groundAnchor: { x: 0, y: 0 } }), []);
  assert.ok(validateVisibleAnchor({ visibleBounds: { x: -24, y: -64, w: 48, h: 60 }, groundAnchor: { x: 0, y: 0 } }).length > 0);
});
```

- [ ] **Step 2: Run the focused tests and observe missing-export failures**

Run: `node --test tests/visual-contract.test.mjs tests/visual-asset-integrity.test.mjs`

Expected: FAIL because the new validators do not exist.

- [ ] **Step 3: Implement measured validators without changing runtime art**

Export pure validators from `app/visual-contract.mjs`. Use a numeric aspect tolerance of `0.01`; require fixed-aspect destination/source ratios to agree; require a bottom-center ground anchor to meet the visible bottom within the shared placement tolerance. Return stable diagnostic strings rather than booleans.

- [ ] **Step 4: Apply validators to the complete inventory**

Extend `tests/visual-asset-integrity.test.mjs` to derive source aspect from declared visible/native frame bounds and destination aspect from rendered bounds. Explicitly exclude `NINE_SLICE_OR_TILE` and `VIEWPORT_COVER` records from fixed-aspect comparison while still validating their declared policy.

- [ ] **Step 5: Repair only reproduced systemic failures**

If multiple records fail, correct shared frame metadata, visible bounds, uniform scale derivation, atlas extraction, or `drawSprite`. If the source itself contains clipped art, key spill, or incompatible perspective, rebuild it through its deterministic builder and regenerate its contact sheet. Do not change arbitrary instance width and height independently.

- [ ] **Step 6: Run focused tests and inspect shared consumers**

Run: `node --test tests/visual-contract.test.mjs tests/visual-asset-integrity.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/level-two-props.test.mjs tests/boss-atlas.test.mjs tests/brutus-atlas.test.mjs`

Expected: PASS.

- [ ] **Step 7: Verify repaired assets in the running game and update issues**

Revisit every route using the changed renderer, atlas, or asset family. Capture after evidence at normal play scale and zoomed scale. Record actual source, visible, and render dimensions in `docs/visual-audit.md`.

- [ ] **Step 8: Commit the shared rendering repair**

Stage only the validator, affected runtime/builder/assets, focused tests, and audit evidence. Commit message: `fix: enforce visual render integrity`.

---

### Task 3: Verify and Repair Trashy and Jimothy State Geometry

**Files:**
- Modify: `app/player-animation.mjs`
- Modify: `app/playable-character.mjs`
- Modify only for reproduced render defects: `app/trash-dash-game.tsx:2758-2791`
- Modify only for source defects: player/Jimothy builders and files under `concepts/` and `public/assets/generated/`
- Modify: `tests/player-animation.test.mjs`
- Modify: `tests/player-hero-atlas.test.mjs`
- Modify: `tests/jimothy-player-atlas.test.mjs`
- Modify: `tests/character-gameplay.test.mjs`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: `PLAYABLE_CHARACTERS`, each profile's `animations`, `PLAYER_FORM_STATES`, `animationFrame`, and bottom-center runtime draw convention.
- Produces: complete reachable-state coverage and stable per-character frame registration for all supported forms.

- [ ] **Step 1: Add a failing shared player-state contract test**

```js
for (const profile of Object.values(PLAYABLE_CHARACTERS)) {
  test(`${profile.id} owns every reachable state with stable dimensions`, () => {
    for (const form of ["small", "large"]) {
      for (const state of PLAYER_FORM_STATES[form]) {
        const animation = profile.animations[`${form}_${state}`];
        assert.ok(animation, `${profile.id} missing ${form}_${state}`);
        assert.equal(animation.drawWidth > 0 && animation.drawHeight > 0, true);
        assert.equal(Number.isFinite(animation.offsetY), true);
      }
    }
  });
}
```

Extend it with atlas-cell bounds, reachable one-shot completion, and maximum-envelope containment assertions using existing manifest fields.

- [ ] **Step 2: Run focused player tests and record every failure**

Run: `node --test tests/player-animation.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/character-gameplay.test.mjs`

Expected: FAIL only where the fresh audit found missing or unstable data; if fully green, do not manufacture a runtime change.

- [ ] **Step 3: Repair shared state selection and registration**

Correct manifest rows, frame counts, local timing, `offsetY`, draw dimensions, and priority in `player-animation.mjs` or character profiles. Keep the feet anchor stable; do not re-center each frame independently. Rebuild source/runtime sheets only when contact-sheet evidence shows clipped, incomplete, or inconsistent frames.

- [ ] **Step 4: Exercise both characters in the running game**

For Trashy and Jimothy, observe idle, walk, run, turn/skid, ascent, apex, descent, land, glide, tail swipe, hurt, transformation/shrink, checkpoint recovery, pit defeat, and victory. Test both facings and repeated transitions. Capture frame sequences for every reopened issue.

- [ ] **Step 5: Run player regressions and update the audit**

Run the four focused suites again. Record intentionally omitted mechanics separately from failures.

- [ ] **Step 6: Commit the player integrity pass**

Commit only player code/assets/tests/evidence with message `fix: normalize playable character states`.

---

### Task 4: Verify and Repair Enemy and Boss Animation Geometry

**Files:**
- Modify: `app/level-two-enemies.mjs`
- Modify: `app/boss-animation.mjs`
- Modify: `app/brutus-boss.mjs`
- Modify only for reproduced dispatch defects: `app/trash-dash-game.tsx:2662-2754`
- Modify affected source builders/atlases/contact sheets only when source evidence fails
- Modify: `tests/level-two-enemies.test.mjs`
- Modify: `tests/boss-animation.test.mjs`
- Modify: `tests/boss-atlas.test.mjs`
- Modify: `tests/brutus-boss.test.mjs`
- Modify: `tests/brutus-atlas.test.mjs`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: `LEVEL_TWO_ENEMY_ANIMATIONS`, `enemyAnimationFrame`, `BOSS_ANIMATIONS`, `BRUTUS_ANIMATIONS`, `brutusDrawRect`, visible-top metadata, behavior states, and local state timers.
- Produces: explicit reachable tells, actions, impacts, recovery, hit, vulnerability, phase, defeat, and exit presentation with stable anchors.

- [ ] **Step 1: Add failing state-to-frame coverage assertions for every actor**

Create a table-driven test that requires each declared gameplay state to map to a real atlas row, positive frame count, local FPS/duration, explicit loop/one-shot behavior, and complete frame bounds. Assert committed reactions clamp rather than modulo-loop.

- [ ] **Step 2: Run the focused enemy/boss matrix**

Run: `node --test tests/level-two-enemies.test.mjs tests/boss-animation.test.mjs tests/boss-atlas.test.mjs tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs`

Expected: use failures plus Task 1 runtime evidence to identify real gaps; make no speculative animation edits when the matrix and runtime sequence agree.

- [ ] **Step 3: Repair state machines before rebuilding art**

Fix unreachable states, fallback rows, global-clock playback, stale facing, premature transitions, repeated events, and mismatched visible-top/weak-point geometry in pure modules first. Only rebuild atlas frames when the correct source row is incomplete, clipped, contaminated, or cannot express the state.

- [ ] **Step 4: Verify every Level 2 encounter route**

Use `encounterTest=squirrel|terrier|skunk|moth|interaction`. Observe both facings, all tells/actions/recoveries, projectile release, reflection, obstacle impact, hit, vulnerable, defeat, emitter attachment, flight-band return, and repeated state entry.

- [ ] **Step 5: Verify both boss state sequences**

Exercise Trash Heap Tyrant and Brutus through all phases, attacks, hit/weak-point responses, recovery, defeat, and exit. Confirm visible top-contact regions match gameplay and no frame changes scale or baseline.

- [ ] **Step 6: Run regressions, update audit evidence, and commit**

Run the focused matrix plus `tests/gameplay-animation-state.test.mjs` and `tests/hit-sprite-frames.test.mjs`. Commit message: `fix: harden enemy and boss presentation`.

---

### Task 5: Verify and Repair World Placement, Supports, Collision, and Composition

**Files:**
- Modify: `app/world-placement.mjs`
- Modify: `app/world-scenery.mjs`
- Modify: `app/level-one.mjs`
- Modify: `app/level-two.mjs`
- Modify: `app/boss-arena.mjs`
- Modify only for reproduced draw-order defects: `app/trash-dash-game.tsx:2330-2640`
- Modify: `tests/world-placement.test.mjs`
- Modify: `tests/world-composition.test.mjs`
- Modify: `tests/visual-spawn-envelope.test.mjs`
- Modify: `tests/enemy-surface.test.mjs`
- Modify: `tests/boss-arena.test.mjs`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: placeable visual contracts, named supports and flight bands, `resolveWorldPlacement`, composition padding/density, level platforms, scenery, pickups, environment, encounters, and boss metadata.
- Produces: legal deterministic placement, full-envelope support clamping, collision/visual agreement, readable composition, and safe boss arenas.

- [ ] **Step 1: Add a failing full-envelope relationship assertion for each current object**

Extend `tests/world-placement.test.mjs` so every scenery, pickup hover envelope, grounded patrol extreme, flight-band extreme, effect envelope, and boss prop declares one semantic relationship and clears incompatible platform bodies.

- [ ] **Step 2: Add a failing rolling-viewport composition test**

Sweep 960-pixel viewports across both worlds in 120-pixel increments. For each window, validate expanded footprints, repeated hero props, required route clearances, landing targets, large-enemy isolation, and ordinary-group count.

- [ ] **Step 3: Run placement/composition tests and classify failures**

Run: `node --test tests/world-placement.test.mjs tests/world-composition.test.mjs tests/visual-spawn-envelope.test.mjs tests/enemy-surface.test.mjs tests/boss-arena.test.mjs`

Expected: failures correspond to measured runtime placement defects. Correct test metadata if stale before changing valid world geometry.

- [ ] **Step 4: Repair shared placement and support resolution**

Correct visible/motion footprints, support IDs, candidate rejection, edge clamping, collision surfaces, and semantic layers centrally. Change authored coordinates only after the shared contract is correct. Safely omit an item when no legal candidate exists.

- [ ] **Step 5: Recheck full-speed rolling views**

Traverse both levels rather than relying only on direct routes. Inspect grounding, platform exclusion, z-order, route communication, enemy density, pickup reachability, effect attachment, transition boundaries, and foreground occlusion.

- [ ] **Step 6: Run regressions, update audit evidence, and commit**

Commit message: `fix: enforce world placement and composition`.

---

### Task 6: Complete the Level 1 and Trash Heap Tyrant Acceptance Pass

**Files:**
- Modify only for reproduced issues: `app/level-one.mjs`, `app/boss-arena.mjs`, `app/boss-animation.mjs`, `app/trash-dash-game.tsx`
- Modify affected Level 1 asset builders/assets/contact sheets only when source evidence fails
- Modify: `tests/level-one-definition.test.mjs`
- Modify: `tests/level-one-routes.test.mjs`
- Modify: `tests/level-one-backgrounds.test.mjs`
- Modify: `tests/boss-arena.test.mjs`
- Modify: `tests/boss-transition.test.mjs`
- Modify: `tests/victory-phase.test.mjs`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: Tasks 2–5 contracts and Level 1 route/boss metadata.
- Produces: a closed Level 1 issue set and a complete desktop normal-traversal playthrough.

- [ ] **Step 1: Run the Level 1 regression matrix before edits**

Run: `node --test tests/level-one-definition.test.mjs tests/level-one-routes.test.mjs tests/level-one-backgrounds.test.mjs tests/boss-arena.test.mjs tests/boss-transition.test.mjs tests/victory-phase.test.mjs`

- [ ] **Step 2: Walk Level 1 normally as Trashy**

Start at the title, select Trashy, traverse every chapter and one optional route, collect trash and a taco, use glide and attack, take damage, trigger a checkpoint, fall in a pit, enter the boss runway, defeat the boss, and reach victory. Record issue IDs for every mismatch.

- [ ] **Step 3: Repeat character-sensitive paths as Jimothy**

Verify character selection, baseline, jump/glide reach, attack, damage, checkpoint, boss top-contact, and victory presentation. Do not require a second exhaustive scenery sweep when the scene is unchanged.

- [ ] **Step 4: Repair only Level 1 issues with red regressions**

For each issue, add the narrowest deterministic failing test to the suite governing its root cause, apply the systemic repair, and revisit all Level 1 consumers of the changed helper or asset.

- [ ] **Step 5: Verify boss runway, lock, phases, defeat, and release**

Confirm smooth camera entry, enemy purge, retreat prevention, readable lanes, reachable weak point, hit reaction, defeat completion, reward reveal, and explicit YOU WIN presentation.

- [ ] **Step 6: Close verified Level 1 issues and commit**

Commit message: `fix: complete level one integrity pass`.

---

### Task 7: Complete the Level 2 and Brutus Acceptance Pass

**Files:**
- Modify only for reproduced issues: `app/level-two.mjs`, `app/level-two-enemies.mjs`, `app/level-two-props.mjs`, `app/brutus-boss.mjs`, `app/boss-arena.mjs`, `app/trash-dash-game.tsx`
- Modify affected Level 2 builders/assets/contact sheets only when source evidence fails
- Modify: `tests/level-two-definition.test.mjs`
- Modify: `tests/level-two-routes.test.mjs`
- Modify: `tests/level-two-runtime.test.mjs`
- Modify: `tests/level-two-backgrounds.test.mjs`
- Modify: `tests/level-two-enemies.test.mjs`
- Modify: `tests/level-two-props.test.mjs`
- Modify: `tests/brutus-boss.test.mjs`
- Modify: `tests/brutus-atlas.test.mjs`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: Tasks 2–5 contracts, Level 2 route catalog, authored enemy behaviors, prop emitters, and Brutus metadata.
- Produces: a closed Level 2 issue set and complete desktop normal-traversal/boss evidence.

- [ ] **Step 1: Run the Level 2 regression matrix before edits**

Run the eight focused suites listed above.

- [ ] **Step 2: Walk Level 2 normally as Trashy**

Traverse all five chapters and at least two optional routes. Exercise squirrel reflection, terrier charge/recovery, skunk spray, moth dive/return, sprinkler push, lamp attachment, pickups, platforms, checkpoints, and transitions.

- [ ] **Step 3: Verify the runway and Brutus encounter**

Confirm the runway clears ordinary enemies, camera lock is smooth, retreat is impossible, both utility platforms are reachable, hydrants and sprinklers share correct ground/emitter origins, top-hit geometry aligns with visible armor, every phase reacts fully, defeat clears danger, and victory appears only after exit.

- [ ] **Step 4: Repeat character-sensitive paths as Jimothy**

Verify support baseline, normal-jump platform reach, attack/reflection, damage, boss stomp, and victory without repeating unchanged background-only routes.

- [ ] **Step 5: Repair only reproduced Level 2 issues with red regressions**

Keep body and effect cells separate; preserve named supports and full motion envelopes; rebuild source frames only when the correct runtime state cannot be produced from valid existing art.

- [ ] **Step 6: Close verified Level 2 issues and commit**

Commit message: `fix: complete level two integrity pass`.

---

### Task 8: Validate Responsive Desktop, Mobile Landscape, Touch, Orientation, and Fullscreen

**Files:**
- Modify only for reproduced issues: `app/mobile-experience.mjs`, `app/trash-dash-game.tsx`, `app/globals.css`
- Modify: `tests/mobile-experience.test.mjs`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `docs/visual-audit.md`

**Interfaces:**
- Consumes: browser capability queries, `readBrowserExperience`, input clearing, touch deck, cabinet/canvas layout, safe-area CSS, and fullscreen/orientation helpers.
- Produces: responsive behavior that preserves desktop priority and remains usable on mobile landscape.

- [ ] **Step 1: Add failing responsive acceptance assertions**

Assert that touch-first landscape renders left/right, dash, action, and jump controls; safe-area environment variables pad HUD and controls; orientation rejection cannot block fullscreen; leaving fullscreen clears held/new input; and Level 1/2 share the same responsive shell.

- [ ] **Step 2: Run responsive tests**

Run: `node --test tests/mobile-experience.test.mjs tests/rendered-html.test.mjs`

- [ ] **Step 3: Inspect responsive runtime views**

Test 1440×900, a smaller desktop viewport, and 844×390 mobile landscape. Inspect title, character select, gameplay, boss, pause, power-up notice, victory, touch controls, and HUD. Enter and exit fullscreen where supported and rotate/rescale where the browser capability permits.

- [ ] **Step 4: Repair shared layout/input behavior only when reproduced**

Prefer safe-area, aspect-ratio cabinet, viewport, and input-state fixes over per-screen positioning. Do not shrink sprites or gameplay geometry to hide a responsive shell defect.

- [ ] **Step 5: Re-run tests, update evidence, and commit**

Commit message: `fix: harden responsive game presentation`.

---

### Task 9: Confirm Existing Music Integration Without Rescoring

**Files:**
- Modify only for reproduced integration defects: `app/music-controller.mjs`, `app/trash-dash-game.tsx`
- Modify: `tests/music-controller.test.mjs`
- Modify: `docs/visual-audit.md`
- Create: `docs/superpowers/reports/2026-08-09-audio-integration-confirmation.md`

**Interfaces:**
- Consumes: `createGameMusic`, `playGameMusic`, `pauseGameMusic`, `setGameMusicMuted`, `switchGameMusic`, current exploration/boss asset URLs, UI mute/pause state.
- Produces: evidence that current tracks load, loop, switch, pause, mute, resume, and fail safely. Produces no new score.

- [ ] **Step 1: Extend controller tests for track-role transitions**

```js
test("level and boss switches preserve mute state and dispose the previous track", async () => {
  const current = new FakeAudio("level.m4a");
  current.volume = MUSIC_VOLUME;
  const next = await switchGameMusic(current, "boss.m4a", {
    muted: true,
    AudioConstructor: FakeAudio,
    fadeMs: 0,
  });
  assert.equal(current.pauseCount, 1);
  assert.deepEqual(current.removed, ["src"]);
  assert.equal(next.muted, true);
  assert.equal(next.loop, true);
  assert.equal(next.playCount, 1);
});
```

- [ ] **Step 2: Run controller tests and repair only integration failures**

Run: `node --test tests/music-controller.test.mjs`

- [ ] **Step 3: Confirm runtime playback**

After a user gesture, verify exploration music starts; pause/resume and mute retain state; Level 1 boss switches to its intended boss track; leaving/restarting does not stack players; rejected playback leaves gameplay functional. Record whether Level 2 currently has a distinct intended boss track; do not create one in this pass.

- [ ] **Step 4: Document confirmation and commit**

Commit message: `test: confirm game music integration`.

---

### Task 10: Run the Release-Candidate Verification and Close the Audit

**Files:**
- Modify: `docs/visual-audit.md`
- Create: `docs/superpowers/reports/2026-08-09-game-wide-integrity-final.md`
- Create as evidence requires: `docs/superpowers/reports/2026-08-09-game-wide-integrity/after/*.png`
- Modify only if verification reveals a regression: the owning task's files and tests

**Interfaces:**
- Consumes: all repaired contracts, assets, runtime routes, issue records, and test suites.
- Produces: final release-candidate evidence with every issue `PASS`, `INCOMPLETE`, or `CANNOT VERIFY` and no ambiguous status.

- [ ] **Step 1: Run the skill and repository validators**

Run: `npm run validate:skills`

Expected: validates all seven canonical skills and repository-relative references.

- [ ] **Step 2: Run the complete automated suite and production builds**

Run:

```bash
npm test
npm run lint
npm run build:pages
npm run test:pages
git diff --check
```

Expected: tests/builds exit 0; lint has zero errors. Record warnings exactly rather than hiding them.

- [ ] **Step 3: Perform the final desktop playthrough**

Play Level 1 into Level 2 using the normal campaign flow. Use one character for the complete run and the other for the character-sensitive direct-route matrix. Exercise pause/resume, mute, power-up, damage, checkpoint, pit death, optional route, both bosses, defeat, and both victory presentations.

- [ ] **Step 4: Perform responsive and fullscreen regression checks**

Repeat representative start, middle, boss, and victory routes at smaller desktop and mobile-landscape sizes. Verify safe areas, touch controls where touch capability is available, orientation handling, and fullscreen entry/exit.

- [ ] **Step 5: Read browser logs and compare source/runtime evidence**

Capture final warning/error logs. Inspect final contact sheets and before/after frames for every closed issue. A visually unresolved issue reopens even if its tests pass.

- [ ] **Step 6: Close the audit and write the final report**

Record every route, viewport, state, interaction, automated result, screenshot, changed system, rebuilt source, remaining limitation, and confirmation that unrelated dirty-worktree content was preserved.

- [ ] **Step 7: Commit the final evidence**

```bash
git add docs/visual-audit.md docs/superpowers/reports/2026-08-09-game-wide-integrity-final.md docs/superpowers/reports/2026-08-09-game-wide-integrity/after
git commit -m "docs: close game-wide integrity audit"
```

Do not push or publish until the user approves the locally verified release candidate.
