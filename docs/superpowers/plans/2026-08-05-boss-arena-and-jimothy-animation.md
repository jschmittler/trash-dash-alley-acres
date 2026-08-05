# Boss Arena and Jimothy Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a normalized animated final boss, a locked and musically distinct boss arena, and a production-ready but private Jimothy animation package.

**Architecture:** Pure manifest/state modules decide animation and arena behavior; deterministic Pillow builders own sprite isolation and baselines; the canvas runtime consumes those decisions without raw crop exceptions. Music switching stays behind the existing controller interface.

**Tech Stack:** React 19, TypeScript, Canvas 2D, JavaScript modules, Node test runner, Pillow, Sharp, HTML Audio.

## Global Constraints

- Preserve existing boss and Jimothy visual identities.
- Use nearest-neighbor scaling and transparent fixed-size cells.
- Keep Jimothy outside `public/` and completely absent from runtime code.
- Keep pits immediately lethal and preserve the hero power hierarchy.
- Add no new runtime dependency.

---

### Task 1: Pure boss animation and arena state

**Files:**
- Create: `app/boss-animation.mjs`
- Create: `app/boss-arena.mjs`
- Create: `tests/boss-animation.test.mjs`
- Create: `tests/boss-arena.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `BOSS_ANIMATIONS`, `selectBossAnimation(input)`, `bossAnimationFrame(animation, elapsed)`, `isBossChargeActive(frame)`, `activateBossArena(world)`, `clampArenaPlayerX(x, width)`, and `bossArenaCameraX()`.

- [ ] Write tests for state priority, one-shot clamping, charge-active frames, arena cleanup, and arena bounds.
- [ ] Run the focused tests and verify missing-module failures.
- [ ] Implement the two pure modules with explicit constants and no DOM dependencies.
- [ ] Run the focused tests and commit the passing task.

### Task 2: Canonical boss and Jimothy atlases

**Files:**
- Modify: `scripts/build-sprite-atlases.py`
- Create: `public/assets/generated/boss-motion.png`
- Create: `public/assets/generated/boss-contact-sheet.png`
- Modify: `concepts/jimothy/build-atlas.py`
- Create: `concepts/jimothy/jimothy-animation.mjs`
- Create: `concepts/jimothy/jimothy-animation-contact-sheet.png`
- Create: `tests/boss-atlas.test.mjs`
- Create: `tests/jimothy-atlas.test.mjs`

**Interfaces:**
- Consumes: 256×256 boss manifest rows and 192×192 Jimothy rows.
- Produces: deterministic normalized atlases with complete poses, transparent margins, and shared baselines.

- [ ] Add failing dimension, population, transparent-border, deterministic-build, and runtime-isolation tests.
- [ ] Generate missing boss windup/charge/recover/rage/defeat poses from the existing boss as identity reference.
- [ ] Extend both Pillow builders to isolate connected artwork, place poses on baselines, and generate labeled contact sheets.
- [ ] Visually inspect both sheets, rerun builders twice, compare bytes, and commit.

### Task 3: Boss music switching

**Files:**
- Create: `public/assets/audio/trash-heap-tyrant-loop.mp3`
- Modify: `app/music-controller.mjs`
- Modify: `tests/music-controller.test.mjs`

**Interfaces:**
- Produces: `switchGameMusic(current, source, options)` with fade-safe mute and volume behavior.

- [ ] Add a failing unit test for source switching, volume ramp, mute preservation, and disposal.
- [ ] Generate the approved 60-second instrumental boss loop and save it in the workspace.
- [ ] Implement the controller helper and pass unit tests.
- [ ] Commit the music task.

### Task 4: Runtime boss integration and arena lock

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/pages-build.test.mjs`

**Interfaces:**
- Consumes: boss manifest/selector, arena helpers, canonical boss atlas, and music switcher.
- Produces: runway, one-way arena entry, camera/player/boss clamps, no ordinary arena enemies, explicit boss sequences, and boss music transition.

- [ ] Add failing integration assertions for the new assets, helpers, arena state, and removal of raw boss rendering.
- [ ] Move the final ordinary enemies before x=5480 and leave x=5480–5680 empty.
- [ ] Activate the arena at x=5680, remove non-boss enemies, clamp camera/player/boss, and switch music.
- [ ] Replace boss rendering and combat with the canonical selector, active charge frames, hit/rage/defeat sequences, and delayed victory unlock.
- [ ] Pass focused integration and production artifact tests, then commit.

### Task 5: Verification and local handoff

**Files:**
- Modify only files required by issues discovered during playtesting.

**Interfaces:**
- Produces: a local browser build ready for user testing while Jimothy remains private.

- [ ] Run `npm test`, `npm run lint`, `npm run build:pages`, `npm run test:pages`, and `git diff --check`.
- [ ] Start the local server on port 3002 and verify asset loading plus a clean browser console.
- [ ] Play the golden path: enter the runway, trigger the arena, verify ordinary enemies disappear, attempt retreat, observe camera lock, complete three boss hits, and confirm music/animation transitions.
- [ ] Probe repeated attacks, damage during boss recovery, pause/resume during boss music, restart from the arena, and pit death before entry.
- [ ] Leave the local preview running and report any interaction that still needs the user's hands-on confirmation.
