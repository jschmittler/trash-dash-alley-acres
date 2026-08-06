# Level 1 World Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current hard-coded first level into a testable, data-driven Woodlands to City Limits level while preserving the existing movement, combat, art, and boss systems.

**Architecture:** Add a pure `level-one.mjs` definition containing zones, encounters, rewards, checkpoints, route metadata, and the boss trigger. The Canvas component consumes that definition to create its runtime arrays; rendering remains responsible for visuals while the data module remains browser-independent and testable. Existing physics and animation modules stay unchanged unless a focused integration seam is required.

**Tech Stack:** React/TypeScript Canvas game, JavaScript data module, Node built-in test runner, existing generated PNG atlases and audio.

## Global Constraints

- Level 1 remains a mixed platforming and exploration level with a 6–8 minute first-clear target.
- Level 1 uses only snake, bird, bee, mosquito, opossum, spider, fox, and Trash Heap Tyrant.
- No more than two ordinary enemy groups are visible at once.
- Optional routes must never be required to finish the level.
- The boss runway contains no ordinary enemies or collectibles.
- Falling into a pit or water consumes one paw immediately and respawns at the latest checkpoint.
- Do not add new controls or replace the current movement physics during this pass.

---

### Task 1: Define the level data contract

**Files:**
- Create: `app/level-one.mjs`
- Create: `tests/level-one-definition.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `LEVEL_ONE`, an immutable object with `zones`, `encounters`, `rewards`, `checkpoints`, `routeChoices`, and `boss`.
- Produces `LEVEL_ONE_ENEMY_KINDS`, the exact allowed standard-enemy list.
- Produces `levelOneZoneAt(x)` and `levelOneEncounterData()` helpers.

- [x] Write tests asserting the five contiguous zone bands: `0–1150`, `1150–2350`, `2350–3550`, `3550–4800`, and `4800–5680`.
- [x] Write tests asserting the exact enemy roster and encounter order from the approved spec.
- [x] Write tests asserting taco, cap, checkpoint, and optional-route metadata.
- [x] Implement frozen data objects with no browser or React imports.
- [x] Add the new test file to the `npm test` command and run it.
- [x] Commit `feat: add level one world definition`.

### Task 2: Replace hard-coded enemy and pickup setup

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/enemy-surface.test.mjs`
- Modify: `tests/pickup-layout.test.mjs`

**Interfaces:**
- Consumes `LEVEL_ONE.encounters` and `LEVEL_ONE.rewards` from Task 1.
- Produces runtime `initialEnemies()` and `initialPickups()` from declarative data while retaining existing `makeEnemy`, `makeSurfacePickup`, and surface calculations.

- [x] Add a failing assertion that runtime setup is generated from `LEVEL_ONE` and does not contain an unlisted standard enemy.
- [x] Implement adapters that convert encounter entries to existing enemy objects and reward entries to existing pickup objects.
- [x] Preserve the current boss object and `BOSS_ARENA_TRIGGER_X` behavior while sourcing its position from the level definition.
- [x] Keep the current cap/taco/pickup art and baseline calculations unchanged.
- [x] Run focused level, enemy-surface, pickup-layout, and rendered-shell tests.
- [x] Commit `feat: source level one spawns from world data`.

### Task 3: Add zone-aware visual progression

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/globals.css`
- Modify: `tests/level-one-definition.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes `LEVEL_ONE.zones` and the existing forest/city background assets.
- Produces `levelOneZoneAt(cameraX)` rendering metadata and a lightweight tint/lighting treatment for late-afternoon, sunset, dusk, night, and moonlit bands.

- [x] Add tests for the zone-to-lighting mapping at each boundary and for stable results outside the world range.
- [x] Implement a pure lookup in `level-one.mjs` and use it from the draw loop.
- [x] Render the existing forest/city parallax layers with gradual color overlays rather than swapping abruptly at zone boundaries.
- [x] Keep the sky filling the viewport and ensure the overlay never covers the ground contact line.
- [x] Run the browser shell test and inspect a local screenshot across the highway and industrial transition.
- [x] Commit `feat: add level one visual progression`.

### Task 4: Implement route and checkpoint metadata

**Files:**
- Modify: `app/level-one.mjs`
- Modify: `app/trash-dash-game.tsx`
- Create: `tests/level-one-routes.test.mjs`

**Interfaces:**
- Consumes `routeChoices` and `checkpoints` from `LEVEL_ONE`.
- Produces route-aware checkpoint placement and stable respawn positions without changing player physics.

- [x] Test that campsite, mill, highway culvert, and industrial container routes are optional and have valid reward or bypass metadata.
- [x] Test checkpoint order and respawn positions: creek, highway, park/boss runway.
- [x] Replace scattered checkpoint constants with the level definition values.
- [x] Add route landmark labels only where the existing HUD/tutorial callouts already support them; do not add new menu UI.
- [x] Run route, pit-fall, and gameplay-animation tests.
- [x] Commit `feat: add level one routes and checkpoints`.

### Task 5: Smooth the park-to-boss transition

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/boss-transition.mjs`
- Modify: `app/boss-arena.mjs`
- Modify: `tests/boss-transition.test.mjs`
- Modify: `tests/boss-arena.test.mjs`

**Interfaces:**
- Consumes the Level 1 boss trigger, runway checkpoint, and arena bounds.
- Produces a monotonic camera ease, enemy cleanup, arena lock, and boss introduction with no ordinary enemies on screen.

- [x] Add tests for the full runway transition: no backward time, no ordinary enemies after activation, and bounded player/boss positions.
- [x] Tune transition duration and easing so the camera reaches the arena without a visible snap.
- [x] Ensure the player can’t reverse into the completed level once the runway lock begins.
- [x] Preserve boss music crossfade, sealed dumpster state, and victory transition behavior.
- [x] Run boss transition, arena, victory, and gameplay tests.
- [x] Commit `fix: smooth level one boss runway`.

### Task 6: Add focused local test fixtures and browser verification

**Files:**
- Create: `tests/level-one-fixture.test.mjs`
- Modify: `package.json`
- Modify: `docs/superpowers/specs/2026-08-06-level-one-design.md`

- [x] Add a fixture test that validates the complete level definition: five zones, eight standard encounter groups, four optional routes, three checkpoints, and one boss.
- [x] Add deterministic local verification hooks `?levelTest=creek`, `?levelTest=highway`, and `?bossTest=1` so each progression beat can be opened directly in the browser.
- [x] Run `npm test`, `npm run lint`, `npm run build:pages`, `npm run test:pages`, and `git diff --check`.
- [x] Start the local preview and verify the opening woodland, creek route, highway spike, industrial release, and boss runway visually.
- [x] Record any visual adjustments in the Level 1 spec and commit `test: verify level one progression`.

### Task 7: Publish the first level-data pass

**Files:** no additional source changes unless verification requires them.

- [ ] Inspect the final diff for accidental generated assets or concept-source changes.
- [ ] Commit any final documentation-only adjustments.
- [ ] Push the feature branch and `main`.
- [ ] Verify the published Pages URL loads the new build and canonical assets.
