# Level 2: Suburban After Dark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, locally playable Suburban After Dark level with five parallax chapters, environment-driven enemy encounters, carried progression, optional exploration routes, and the Brutus boss sequence.

**Architecture:** Introduce one browser-independent campaign level contract and registry, then migrate the Canvas runtime from direct `LEVEL_ONE` references to an active level definition. Level 2 owns declarative zones, surfaces, encounters, routes, rewards, checkpoints, background metadata, and boss metadata; focused modules own new enemy and boss state machines. The existing draw/update loop remains the integration shell, while pure modules carry logic that can be verified with Node tests.

**Tech Stack:** React 19, TypeScript 5.9, HTML Canvas 2D, JavaScript ES modules, Node built-in test runner, Sharp 0.34, generated PNG atlases, existing Vinext/Vite local browser build.

## Global Constraints

- Level 2 is mixed platforming and exploration with a 7–9 minute first-clear target.
- The selected character, powered size, Taco Power, and glider carry from Level 1 into Level 2.
- Standard enemies are Bin-Lid Squirrel, Trash-Day Terrier, Sprinkler Skunk, and Porch-Light Moth; Brutus the Bin-Hound is the only boss.
- No more than two ordinary encounter groups may be visible at once, and only one may demand immediate reaction.
- Every grounded or platform-bound enemy references a stable `surfaceId`; flying enemies reference an explicit flight band.
- Large enemies own dedicated encounter space and cannot cross surface edges or gaps.
- Every chapter has a primary route and at least one optional route or secret.
- The cul-de-sac runway contains no ordinary enemies, and the arena remains locked until Brutus's defeat sequence completes.
- All five backgrounds use semantic far, middle, and close plates with four monotonic boundary transitions.
- Level 1 remains the default campaign entry and all existing tests must continue to pass.
- All work remains local until the user separately requests publishing.

---

## File map

### Pure campaign and level data

- Create `app/campaign-level.mjs` — level contract validation, registry, selection, zone lookup, and lighting lookup.
- Create `app/campaign.mjs` — composition root that registers concrete campaign definitions without circular imports.
- Create `app/level-two.mjs` — immutable Level 2 zones, surfaces, encounters, rewards, routes, checkpoints, background metadata, boss, and exit.
- Modify `app/level-one.mjs` — add contract fields required by the registry while preserving existing named exports.
- Create `app/level-runtime.mjs` — pure adapters from level data to spawn requests and carried campaign state.

### Gameplay behavior

- Create `app/level-two-enemies.mjs` — pure squirrel, lid, terrier, skunk, sprinkler, and moth state transitions.
- Create `app/brutus-boss.mjs` — pure three-phase boss transition and arena-hazard rules.
- Modify `app/enemy-surface.mjs` — resolve explicit `surfaceId` before legacy nearest-surface fallback.
- Modify `app/trash-dash-game.tsx` — select the active level, build runtime geometry, integrate the new behaviors, and expose local test routes.

### Art and processing

- Create `concepts/level-two/README.md` — source asset contract, prompts, frame maps, baselines, and review notes.
- Create `concepts/level-two/build-backgrounds.mjs` — chroma-key cleanup, exact size export, and middle-plane baseline normalization.
- Create `concepts/level-two/build-atlases.mjs` — normalize enemy and Brutus frame cells into runtime atlases.
- Create 15 background plates under `public/assets/backgrounds/level2-<chapter>-<plane>.png`.
- Create `public/assets/generated/level2-enemy-motion.png` and `public/assets/generated/brutus-motion.png`.

### Tests

- Create `tests/campaign-level.test.mjs`.
- Create `tests/level-two-definition.test.mjs`.
- Create `tests/level-two-routes.test.mjs`.
- Create `tests/level-two-runtime.test.mjs`.
- Create `tests/level-two-backgrounds.test.mjs`.
- Create `tests/level-two-enemies.test.mjs`.
- Create `tests/brutus-boss.test.mjs`.
- Create `tests/level-two-fixture.test.mjs`.
- Modify `tests/rendered-html.test.mjs`, `tests/enemy-surface.test.mjs`, `tests/mobile-experience.test.mjs`, and `package.json`.

---

### Task 1: Add the reusable campaign level contract and registry

**Files:**
- Create: `app/campaign-level.mjs`
- Create: `app/campaign.mjs`
- Modify: `app/level-one.mjs`
- Create: `tests/campaign-level.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `LEVEL_ONE` data.
- Produces: `registerCampaignLevels(definitions)`, `campaignLevelById(id)`, `campaignZoneAt(level, x)`, `campaignLightingAt(level, x)`, and `validateCampaignLevel(level)`.
- Produces: the shared level fields `title`, `worldWidth`, `surfaces`, `backgroundSets`, and `exit` on `LEVEL_ONE` without removing current exports.
- Produces: `CAMPAIGN_LEVELS` from `app/campaign.mjs` as the only runtime composition root.

- [ ] **Step 1: Write the failing registry and contract tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  campaignLevelById,
  campaignLightingAt,
  campaignZoneAt,
  registerCampaignLevels,
  validateCampaignLevel,
} from "../app/campaign-level.mjs";
import { LEVEL_ONE } from "../app/level-one.mjs";

test("campaign registry returns registered immutable definitions", () => {
  registerCampaignLevels([LEVEL_ONE]);
  assert.equal(campaignLevelById("level-1"), LEVEL_ONE);
  assert.equal(Object.isFrozen(campaignLevelById("level-1")), true);
});

test("campaign contract reports missing cross-references", () => {
  const broken = { ...LEVEL_ONE, encounters: [{ id: "bad", zoneId: "missing", enemies: [] }] };
  assert.deepEqual(validateCampaignLevel(broken), ["encounter bad references unknown zone missing"]);
});

test("generic zone and lighting lookup preserve Level 1 boundaries", () => {
  assert.equal(campaignZoneAt(LEVEL_ONE, 1150).id, "creek-and-ruined-mill");
  assert.equal(campaignLightingAt(LEVEL_ONE, 5200).lighting, "moonlit");
});
```

- [ ] **Step 2: Run the test to verify the registry module is missing**

Run: `node --test tests/campaign-level.test.mjs`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `app/campaign-level.mjs`.

- [ ] **Step 3: Implement the registry and validators**

```js
const levels = new Map();

export function registerCampaignLevels(definitions) {
  levels.clear();
  for (const definition of definitions) levels.set(definition.id, definition);
  return levels;
}

export const campaignLevelById = (id) => levels.get(id) ?? levels.get("level-1") ?? null;

export function campaignZoneAt(level, x) {
  const coordinate = Number.isFinite(x) ? x : 0;
  return level.zones.find(({ startX, endX }) => coordinate >= startX && coordinate < endX)
    ?? (coordinate < level.zones[0].startX ? level.zones[0] : level.zones.at(-1));
}

export function campaignLightingAt(level, x) {
  const zone = campaignZoneAt(level, x);
  const span = Math.max(1, zone.endX - zone.startX);
  return {
    lighting: zone.lighting,
    progress: Math.max(0, Math.min(1, (x - zone.startX) / span)),
  };
}

export function validateCampaignLevel(level) {
  const errors = [];
  const zoneIds = new Set(level.zones.map(({ id }) => id));
  for (const encounter of level.encounters) {
    if (!zoneIds.has(encounter.zoneId)) {
      errors.push(`encounter ${encounter.id} references unknown zone ${encounter.zoneId}`);
    }
  }
  return errors;
}
```

Create the composition root with:

```js
import { registerCampaignLevels } from "./campaign-level.mjs";
import { LEVEL_ONE } from "./level-one.mjs";

export const CAMPAIGN_LEVELS = registerCampaignLevels([LEVEL_ONE]);
```

- [ ] **Step 4: Extend Level 1 with compatibility fields**

Add `title: "Woodlands to City Limits"`, `worldWidth: 6600`, a stable `surfaces` list derived from the current platform constants, `backgroundSets` matching the five existing Level 1 plates, and `exit: { nextLevelId: "level-2", x: 6520 }`. Keep `levelOneZoneAt` and `levelOneLightingAt` as wrappers around the generic helpers so existing imports remain valid.

- [ ] **Step 5: Add the focused test to the package test command and verify**

Run: `node --test tests/campaign-level.test.mjs tests/level-one-definition.test.mjs tests/level-one-fixture.test.mjs`  
Expected: all tests PASS.

- [ ] **Step 6: Commit the contract milestone**

```bash
git add app/campaign-level.mjs app/campaign.mjs app/level-one.mjs tests/campaign-level.test.mjs package.json
git commit -m "feat: add campaign level registry"
```

---

### Task 2: Define Level 2 zones, surfaces, encounters, routes, and rewards

**Files:**
- Create: `app/level-two.mjs`
- Create: `tests/level-two-definition.test.mjs`
- Create: `tests/level-two-routes.test.mjs`
- Modify: `app/campaign-level.mjs`
- Modify: `app/campaign.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: campaign contract from Task 1.
- Produces: immutable `LEVEL_TWO`, `LEVEL_TWO_ENEMY_KINDS`, `levelTwoZoneAt(x)`, and `levelTwoEncounterData()`.
- Produces: stable `surfaceId` values referenced by every grounded enemy and reward.

- [ ] **Step 1: Write failing Level 2 structure tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { LEVEL_TWO, LEVEL_TWO_ENEMY_KINDS } from "../app/level-two.mjs";
import { validateCampaignLevel } from "../app/campaign-level.mjs";

test("Level 2 has five contiguous suburban chapters", () => {
  assert.deepEqual(LEVEL_TWO.zones.map(({ startX, endX }) => [startX, endX]), [
    [0, 1250], [1250, 2700], [2700, 4200], [4200, 5550], [5550, 7200],
  ]);
  assert.deepEqual(LEVEL_TWO.zones.map(({ id }) => id), [
    "moonlit-backyard", "garbage-night-street", "backyard-obstacle-course",
    "drainage-ditch", "suburban-main-street",
  ]);
});

test("Level 2 uses the approved enemy roster and valid references", () => {
  assert.deepEqual(LEVEL_TWO_ENEMY_KINDS, ["squirrel", "terrier", "skunk", "moth"]);
  assert.deepEqual(validateCampaignLevel(LEVEL_TWO), []);
  const surfaceIds = new Set(LEVEL_TWO.surfaces.map(({ id }) => id));
  for (const encounter of LEVEL_TWO.encounters) {
    for (const enemy of encounter.enemies) {
      if (enemy.movement !== "flying") assert.ok(surfaceIds.has(enemy.surfaceId));
      if (enemy.movement === "flying") assert.equal(Number.isFinite(enemy.flightY), true);
    }
  }
});
```

- [ ] **Step 2: Write failing route and population tests**

```js
test("all optional routes point to known rewards and encounters", () => {
  const rewards = new Set(LEVEL_TWO.rewards.map(({ id }) => id));
  const encounters = new Set(LEVEL_TWO.encounters.map(({ id }) => id));
  for (const route of LEVEL_TWO.routeChoices) {
    for (const id of route.rewardIds) assert.ok(rewards.has(id));
    for (const id of route.bypassEncounterIds ?? []) assert.ok(encounters.has(id));
  }
});

test("large encounters own at least 900 pixels before another large encounter", () => {
  const large = LEVEL_TWO.encounters.filter(({ sizeClass }) => sizeClass === "large");
  for (let index = 1; index < large.length; index += 1) {
    assert.ok(large[index].spawnX - large[index - 1].recoveryEndX >= 0);
  }
});
```

- [ ] **Step 3: Run the focused tests to verify Level 2 is missing**

Run: `node --test tests/level-two-definition.test.mjs tests/level-two-routes.test.mjs`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `app/level-two.mjs`.

- [ ] **Step 4: Implement the immutable Level 2 definition**

Use exact chapter bands `0–1250`, `1250–2700`, `2700–4200`, `4200–5550`, and `5550–7200`. Define named ground and platform surfaces for the lawn, porch, fence, street, parked cars, treehouse, trampoline landings, culvert, utility route, runway, cul-de-sac, and victory street. Encode encounters E1–E8, routes R1–R6, four checkpoints, and Brutus metadata from the approved specification.

The boss metadata must use:

```js
boss: {
  id: "brutus-bin-hound",
  kind: "brutus",
  runwayStartX: 5300,
  triggerX: 5750,
  arenaStartX: 5700,
  arenaEndX: 6550,
  checkpointId: "boss-runway-checkpoint",
},
exit: { nextLevelId: "level-3", x: 7120 },
```

- [ ] **Step 5: Register both campaign definitions**

Update the composition root, not either data module, to avoid circular imports:

```js
import { registerCampaignLevels } from "./campaign-level.mjs";
import { LEVEL_ONE } from "./level-one.mjs";
import { LEVEL_TWO } from "./level-two.mjs";

export const CAMPAIGN_LEVELS = registerCampaignLevels([LEVEL_ONE, LEVEL_TWO]);
```

- [ ] **Step 6: Run definition, route, and Level 1 regression tests**

Run: `node --test tests/campaign-level.test.mjs tests/level-one-definition.test.mjs tests/level-two-definition.test.mjs tests/level-two-routes.test.mjs`  
Expected: all tests PASS.

- [ ] **Step 7: Commit the data milestone**

```bash
git add app/campaign-level.mjs app/campaign.mjs app/level-two.mjs tests/level-two-definition.test.mjs tests/level-two-routes.test.mjs package.json
git commit -m "feat: define suburban after dark level"
```

---

### Task 3: Build active-level runtime adapters and carried progression

**Files:**
- Create: `app/level-runtime.mjs`
- Create: `tests/level-two-runtime.test.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `CampaignLevelDefinition`, player profile, and optional carried campaign state.
- Produces: `createLevelRuntime(level, adapters)`, `carryPlayerProgress(world)`, `applyCarriedProgress(player, carried)`, and `nextCampaignStart(world)`.
- Produces: active `levelId` and `campaignProgress` fields on `World`.

- [ ] **Step 1: Write failing runtime tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCarriedProgress,
  carryPlayerProgress,
  nextCampaignStart,
} from "../app/level-runtime.mjs";

test("campaign transition carries character and all approved power state", () => {
  const carried = carryPlayerProgress({
    selectedCharacterId: "jimothy",
    player: { large: true, glider: 9 },
    trash: 14,
    score: 4200,
    lives: 2,
  });
  assert.deepEqual(carried, {
    selectedCharacterId: "jimothy", large: true, glider: 9,
    trash: 14, score: 4200, lives: 2,
  });
  const player = { large: false, glider: 0 };
  applyCarriedProgress(player, carried);
  assert.equal(player.large, true);
  assert.equal(player.glider, 9);
});

test("Level 1 victory resolves Level 2 with carried progression", () => {
  const transition = nextCampaignStart({
    level: { exit: { nextLevelId: "level-2" } },
    selectedCharacterId: "raccoon",
    player: { large: true, glider: 7 }, trash: 8, score: 900, lives: 3,
  });
  assert.equal(transition.levelId, "level-2");
  assert.equal(transition.carried.large, true);
  assert.equal(transition.carried.glider, 7);
});
```

- [ ] **Step 2: Run the test to verify the adapter module is missing**

Run: `node --test tests/level-two-runtime.test.mjs`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement pure carried-state helpers**

```js
export const carryPlayerProgress = (world) => ({
  selectedCharacterId: world.selectedCharacterId,
  large: world.player.large,
  glider: world.player.glider,
  trash: world.trash,
  score: world.score,
  lives: world.lives,
});

export function applyCarriedProgress(player, carried) {
  player.large = Boolean(carried?.large);
  player.glider = Math.max(0, carried?.glider ?? 0);
  return player;
}

export function nextCampaignStart(world) {
  const levelId = world.level.exit?.nextLevelId ?? null;
  return levelId ? { levelId, carried: carryPlayerProgress(world) } : null;
}
```

Add the runtime adapter with injected constructors so the pure module does not import Canvas code:

```js
export function createLevelRuntime(level, { makeEnemy, makePickup }) {
  return {
    enemies: level.encounters.flatMap(({ enemies }) => enemies.map((spawn) => makeEnemy(spawn))),
    pickups: level.rewards
      .filter(({ kind }) => kind !== "checkpoint")
      .map((reward, index) => makePickup(reward, index)),
    surfaces: level.surfaces.filter(({ hazard }) => !hazard),
    hazards: level.surfaces.filter(({ hazard }) => hazard),
    checkpoints: level.checkpoints,
    boss: level.boss,
  };
}
```

- [ ] **Step 4: Replace direct Level 1 runtime construction with active-level adapters**

Change `makeWorld(selectedCharacterId, levelId = "level-1", carried = null)` to resolve the active definition, build enemies and pickups from that definition, set `worldWidth`, checkpoints, and boss bounds from it, then apply carried state. Replace direct `LEVEL_ONE` reads in spawn, checkpoint, zone, lighting, and boss setup with `world.level` or a stable `activeLevelRef`.

When the Level 1 victory sequence completes, make the victory screen's primary action `CONTINUE` because `LEVEL_ONE.exit.nextLevelId` exists. That action calls `nextCampaignStart`, constructs the Level 2 world with the carried state, and begins Level 2. Preserve the existing replay action as a secondary choice. Level 2 keeps the ordinary replay action until Level 3 exists.

- [ ] **Step 5: Add a development-only Level 2 launch route**

Support `?level=2` and `?levelTest=level2-start`. The test route starts at Level 2 x=125 with `large=true`, `glider=14`, five trash, and the selected character unchanged. Production campaign flow still begins at Level 1.

Any `levelTest` key listed in Task 4 must force `levelId = "level-2"` before `makeWorld` runs; it must not create a Level 1 world and then replace only the player's coordinates.

- [ ] **Step 6: Verify the runtime seam and existing game shell**

Run: `node --test tests/level-two-runtime.test.mjs tests/rendered-html.test.mjs tests/level-one-fixture.test.mjs`  
Expected: all tests PASS and rendered source no longer builds runtime arrays directly from `LEVEL_ONE`.

- [ ] **Step 7: Commit the active-level milestone**

```bash
git add app/level-runtime.mjs app/trash-dash-game.tsx tests/level-two-runtime.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: add active campaign level runtime"
```

---

### Task 4: Render the full Level 2 structural blockout and test routes

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Create: `tests/level-two-fixture.test.mjs`
- Modify: `tests/enemy-surface.test.mjs`
- Modify: `app/enemy-surface.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `LEVEL_TWO.surfaces`, route metadata, checkpoints, active world width, and existing platform renderer.
- Produces: gameplay platforms and hazards derived from stable surface IDs.
- Produces: `?levelTest=backyard|street|obstacle|drainage|runway|main-street`.

- [ ] **Step 1: Write failing surface-ID resolution tests**

```js
test("explicit surfaceId wins over a nearby surface at the same height", () => {
  const surfaces = [
    { id: "left", x: 0, y: 400, w: 200 },
    { id: "right", x: 220, y: 400, w: 200 },
  ];
  const patrol = createEnemyPatrol({
    x: 260, width: 40, surfaceY: 400, surfaceId: "left",
    patrolRadius: 100, grounded: true,
  }, surfaces);
  assert.equal(patrol.surfaceId, "left");
  assert.ok(patrol.spawnX <= 160);
});
```

- [ ] **Step 2: Extend support resolution with stable IDs**

Update `createEnemyPatrol` to accept `surfaceId`. When present, resolve that exact surface and return `{ spawnX, minX, maxX, surfaceY, surfaceId }`. Use the legacy nearest-surface search only when `surfaceId` is absent so Level 1 remains compatible.

- [ ] **Step 3: Write the complete fixture test**

Assert five zones, eight encounter groups including the empty runway marker, six routes, four checkpoints, one boss, one exit, and a valid surface for every platform-bound or grounded spawn. Also assert no ordinary encounter begins at or after `boss.runwayStartX`.

- [ ] **Step 4: Build platforms from active level surfaces**

Add a pure mapping from Level 2 surface records to existing `Platform` records. Use `kind: "ground" | "branch" | "metal" | "crate"` only as renderer choices; collision dimensions come from the surface definition. Water/pool/ditch records are hazards and must not enter the support-surface list.

- [ ] **Step 5: Add chapter test-route positions**

```ts
const levelTwoTestStarts: Record<string, [number, number]> = {
  backyard: [180, 0],
  street: [1380, 1020],
  obstacle: [2840, 2480],
  drainage: [4350, 3990],
  runway: [5400, 5040],
  "main-street": [6660, 6240],
};
```

Clamp each player start to its named surface and set the camera independently. Do not duplicate background or transition setup in these routes.

- [ ] **Step 6: Run structural and collision tests**

Run: `node --test tests/enemy-surface.test.mjs tests/level-two-fixture.test.mjs tests/level-two-definition.test.mjs`  
Expected: all tests PASS.

- [ ] **Step 7: Start the local game and inspect the geometry-only path**

Run: `npm run dev`  
Open: `http://localhost:3003/?levelTest=backyard&build=level2-blockout-1`  
Verify all primary routes, culvert route, upper utility route, runway, and main-street exit are traversable without glider use on the required path.

- [ ] **Step 8: Commit the blockout milestone**

```bash
git add app/enemy-surface.mjs app/trash-dash-game.tsx tests/enemy-surface.test.mjs tests/level-two-fixture.test.mjs package.json
git commit -m "feat: add level two structural blockout"
```

---

### Task 5: Create and integrate the five semantic parallax sets

**Files:**
- Create: `concepts/level-two/README.md`
- Create: `concepts/level-two/build-backgrounds.mjs`
- Create: `tests/level-two-backgrounds.test.mjs`
- Create: `public/assets/backgrounds/level2-backyard-far.png`
- Create: `public/assets/backgrounds/level2-backyard-middle.png`
- Create: `public/assets/backgrounds/level2-backyard-close.png`
- Create: `public/assets/backgrounds/level2-street-far.png`
- Create: `public/assets/backgrounds/level2-street-middle.png`
- Create: `public/assets/backgrounds/level2-street-close.png`
- Create: `public/assets/backgrounds/level2-obstacle-far.png`
- Create: `public/assets/backgrounds/level2-obstacle-middle.png`
- Create: `public/assets/backgrounds/level2-obstacle-close.png`
- Create: `public/assets/backgrounds/level2-drainage-far.png`
- Create: `public/assets/backgrounds/level2-drainage-middle.png`
- Create: `public/assets/backgrounds/level2-drainage-close.png`
- Create: `public/assets/backgrounds/level2-main-street-far.png`
- Create: `public/assets/backgrounds/level2-main-street-middle.png`
- Create: `public/assets/backgrounds/level2-main-street-close.png`
- Modify: `app/trash-dash-game.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: five supplied Level 2 concept images and `docs/guides/parallax-backgrounds.md`.
- Produces: five 2048×716 far/middle/close sets and `LEVEL_TWO.backgroundSets` asset paths.
- Produces: opaque far plates, object-shaped-alpha middle/close plates, and a shared middle contact row.

- [ ] **Step 1: Write the failing image-contract tests**

For all 15 files, use Sharp metadata and raw pixel inspection to assert width 2048, height 716, opaque far alpha, mixed transparent/visible alpha in middle and close, and no row-wide uniform alpha masks. Reuse the component-baseline checks from `tests/level-one-backgrounds.test.mjs` with a Level 2 baseline declared in `concepts/level-two/README.md`.

- [ ] **Step 2: Run the test to verify the plates are absent**

Run: `node --test tests/level-two-backgrounds.test.mjs`  
Expected: FAIL because `level2-backyard-far.png` does not exist.

- [ ] **Step 3: Generate semantic source plates chapter by chapter**

Use the pixel-art/image generation workflow with this invariant prompt suffix for every plate:

```text
Strict side-on 2D platform-game background, polished 16-bit pixel art,
orthographic-feeling view, hard pixel clusters, three-to-four-value shading,
no gradients, no blur, no text, no characters, no enemies, no pickups.
Every recognizable object belongs completely to this plate and is not split
across depth planes. Output a wide 2048×716 composition.
```

Far prompts include only sky, moon/clouds, distant roofs, treelines, hills, or skyline and must be opaque. Middle prompts use complete semantic landmarks from the approved table on a flat `#FF00FF` key, all grounded on one contact line. Close prompts use sparse edge framing and low vegetation on the same key while keeping the gameplay center open.

- [ ] **Step 4: Process and install runtime plates**

Implement `build-backgrounds.mjs` with Sharp: remove key-color spill by color distance, normalize substantial middle components to the declared contact row, preserve small airborne details, resize only with nearest-neighbor, and export exact runtime paths. Do not vertically normalize the close plate as one component strip.

- [ ] **Step 5: Integrate active-level background metadata**

Load background assets from `activeLevel.backgroundSets`, then call `levelBackgroundBlendAt(stageCenterX, activeLevel.zones)`. Keep `PARALLAX_SPEEDS` at far `0.018`, middle `0.055`, close `0.13`. The cul-de-sac uses the main-street set and does not trigger a second transition.

- [ ] **Step 6: Run asset, transition, and build tests**

Run: `node --test tests/level-two-backgrounds.test.mjs tests/level-background.test.mjs tests/level-one-backgrounds.test.mjs`  
Expected: all tests PASS.

- [ ] **Step 7: Perform the five-chapter motion scan**

Open each chapter route with `&build=level2-parallax-1`. Walk and run one viewport, reverse direction, stop inside every blend range, and inspect tall objects until they leave the screen. Reject floating middle objects, split landmarks, visible key fringes, repeated fades, or close objects hiding landing targets.

- [ ] **Step 8: Commit the parallax milestone**

```bash
git add concepts/level-two public/assets/backgrounds/level2-*.png app/trash-dash-game.tsx tests/level-two-backgrounds.test.mjs package.json
git commit -m "feat: add level two parallax environments"
```

---

### Task 6: Implement Level 2 environmental enemy interactions

**Files:**
- Create: `app/level-two-enemies.mjs`
- Create: `tests/level-two-enemies.test.mjs`
- Create: `concepts/level-two/build-atlases.mjs`
- Create: `public/assets/generated/level2-enemy-motion.png`
- Modify: `app/trash-dash-game.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: active encounters, explicit support surfaces/flight bands, player attack state, and environment collision records.
- Produces: `updateSquirrel`, `updateBinLid`, `updateTerrier`, `updateSkunk`, `updateSprinkler`, and `updateMoth` pure transitions.
- Produces: atlas frame metadata with one stable grounded baseline per enemy.

- [ ] **Step 1: Write failing behavior-state tests**

```js
test("tail swipe reflects a squirrel lid once", () => {
  const lid = { vx: -140, reflected: false, ownerId: "s1" };
  assert.deepEqual(updateBinLid(lid, { tailSwipeHit: true }), {
    vx: 190, reflected: true, ownerId: "s1",
  });
});

test("terrier stops at its surface edge and enters stunned recovery", () => {
  const next = updateTerrier({ state: "charge", x: 590, vx: 420 }, {
    dt: 0.1, patrolMinX: 200, patrolMaxX: 600, obstacleHit: true,
  });
  assert.equal(next.x, 600);
  assert.equal(next.state, "stunned");
});

test("moth returns to its authored light after a dive", () => {
  const next = updateMoth({ state: "climb", x: 800, y: 250 }, {
    dt: 1, lightX: 800, flightY: 180,
  });
  assert.equal(next.state, "orbit");
  assert.equal(next.y, 180);
});
```

- [ ] **Step 2: Implement explicit state machines**

Use these state sets:

```js
export const SQUIRREL_STATES = ["idle", "telegraph", "throw", "recover", "defeated"];
export const TERRIER_STATES = ["sleep", "wake", "charge", "stunned", "recover", "defeated"];
export const SKUNK_STATES = ["patrol", "telegraph", "spray", "recover", "defeated"];
export const MOTH_STATES = ["orbit", "telegraph", "dive", "climb", "defeated"];
```

Every attack tell lasts 0.35–0.65 seconds. Terrier charge is committed until obstacle or patrol edge. Sprinkler push affects reflected lids and lightweight rolling objects. Moth orbit remains centered on its authored light and flight band.

- [ ] **Step 3: Generate and normalize the compact enemy atlas**

Create four-frame locomotion loops plus required telegraph, attack, hit, and defeat frames using the project's 192×192 pixel anchor. Normalize squirrel, terrier, and skunk opaque feet to one row per character. Preserve moth wing clearance and use a stable body center for flight frames. Document the frame map in `concepts/level-two/README.md`.

- [ ] **Step 4: Integrate behaviors without weakening generic patrol rules**

Dispatch by `enemy.kind` from the active update loop. Keep support-surface bounds authoritative; special states may temporarily change velocity but not collision size or surface ownership. Render facing from committed horizontal motion with a dead zone.

- [ ] **Step 5: Add direct encounter test routes**

Support `?encounterTest=squirrel|terrier|skunk|moth|interaction`. Each route opens one authored encounter with the correct nearby environment and no unrelated active group.

- [ ] **Step 6: Run behavior, grounding, animation, and Level 1 regression tests**

Run: `node --test tests/level-two-enemies.test.mjs tests/enemy-surface.test.mjs tests/gameplay-animation-state.test.mjs tests/sprite-baseline.test.mjs`  
Expected: all tests PASS.

- [ ] **Step 7: Playtest each teaching step locally**

Verify the safe show distance, solo test, repeat, combination, and drainage mastery encounter. Confirm lids remain the same visual item after spawning, enemies face movement direction, no body floats or sinks across frames, and large enemies retain a full screen of owned space.

- [ ] **Step 8: Commit the enemy milestone**

```bash
git add app/level-two-enemies.mjs app/trash-dash-game.tsx concepts/level-two public/assets/generated/level2-enemy-motion.png tests/level-two-enemies.test.mjs package.json
git commit -m "feat: add suburban enemy interactions"
```

---

### Task 7: Implement the Brutus arena and post-boss release

**Files:**
- Create: `app/brutus-boss.mjs`
- Create: `tests/brutus-boss.test.mjs`
- Create: `public/assets/generated/brutus-motion.png`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/boss-transition.mjs`
- Modify: `app/boss-arena.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `LEVEL_TWO.boss`, existing arena transition helpers, player hit data, hydrant contacts, sprinkler timing, and garbage-can hazards.
- Produces: `createBrutusState()`, `updateBrutus(state, input)`, and `brutusArenaHazards(state)`.
- Produces: deterministic entry, three hit phases, complete hit reaction, defeat sequence, unlock, and main-street continuation.

- [ ] **Step 1: Write failing three-phase boss tests**

```js
test("Brutus exposes one hit only after a hydrant crash", () => {
  const state = createBrutusState();
  const crashed = updateBrutus({ ...state, mode: "charge" }, { dt: 0.1, hydrantHit: true });
  assert.equal(crashed.mode, "stunned-open");
  const hit = updateBrutus(crashed, { dt: 0.1, playerAttackHit: true });
  assert.equal(hit.hp, 2);
  assert.equal(hit.mode, "hit");
});

test("phase two owns at most one rolling can", () => {
  const state = { ...createBrutusState(), hp: 2, phase: 2, rollingCanId: "can-1" };
  assert.equal(brutusArenaHazards(state).filter(({ kind }) => kind === "rolling-can").length, 1);
});

test("defeat unlocks only after the full animation", () => {
  const state = { ...createBrutusState(), hp: 0, mode: "defeat", timer: 0.2 };
  assert.equal(updateBrutus(state, { dt: 0.1 }).arenaUnlocked, false);
  assert.equal(updateBrutus(state, { dt: 1.5 }).arenaUnlocked, true);
});
```

- [ ] **Step 2: Implement the boss state machine**

Use `intro → sniff → bark → charge → stunned-open → hit → recover` for active phases and `defeat-slide → defeat-shake → defeat-exit → complete` for victory. Phase 2 enables one rolling can. Phase 3 enables alternating sprinklers. Hydrant contact is the only armor-opening event.

- [ ] **Step 3: Build the Brutus atlas**

Create a strict side-on polished 16-bit Brutus with a stable foot baseline and fixed 256×192 runtime cells. Include idle/sniff, bark, four charge frames, crash, open/stunned, three hit frames, recovery, pool slide, shake, and exit. Ensure the bin armor silhouette stays aligned across all non-defeat frames.

- [ ] **Step 4: Integrate the generic arena transition with active boss metadata**

Parameterize arena bounds and trigger values rather than adding Brutus-specific constants to existing helpers. At runway entry, deactivate every ordinary Level 2 encounter. Clamp player and camera through `LEVEL_TWO.boss.arenaStartX..arenaEndX` until `arenaUnlocked` is true.

- [ ] **Step 5: Add boss and victory test routes**

Support `?bossTest=brutus` at x=5650 with carried power state and `?victoryTest=level2` at the start of the post-boss main street. Preserve existing Level 1 boss test semantics.

- [ ] **Step 6: Run all boss and victory tests**

Run: `node --test tests/brutus-boss.test.mjs tests/boss-transition.test.mjs tests/boss-arena.test.mjs tests/victory-phase.test.mjs`  
Expected: all tests PASS.

- [ ] **Step 7: Playtest runway, three phases, and release**

Confirm no ordinary enemy is visible at runway activation, the camera does not jump or transition twice, every Brutus hit reaction plays to completion, arena escape is impossible, and the main-street victory walk is hostile-free.

- [ ] **Step 8: Commit the boss milestone**

```bash
git add app/brutus-boss.mjs app/boss-transition.mjs app/boss-arena.mjs app/trash-dash-game.tsx public/assets/generated/brutus-motion.png tests/brutus-boss.test.mjs package.json
git commit -m "feat: add Brutus boss encounter"
```

---

### Task 8: Complete desktop, mobile, and campaign regression verification

**Files:**
- Modify: `tests/mobile-experience.test.mjs`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `docs/superpowers/specs/2026-08-06-level-two-design.md`
- Modify: `docs/guides/parallax-backgrounds.md` only if Level 2 reveals a new reusable check.
- Modify: `docs/guides/enemy-placement-and-grounding.md` only if Level 2 reveals a new reusable check.

**Interfaces:**
- Consumes: the complete Level 2 local build.
- Produces: a verified local release candidate and a concise record of any design-level adjustments.

- [ ] **Step 1: Add mobile route and control assertions**

Assert `?level=2` uses the existing responsive canvas wrapper, touch controls remain inside safe areas in landscape, no test-route UI leaks into production, and fullscreen/orientation behavior remains unchanged.

- [ ] **Step 2: Run the full automated suite**

Run: `npm test`  
Expected: build completes and every Node test passes.

- [ ] **Step 3: Run static and Pages verification**

Run: `npm run lint`  
Expected: zero errors.

Run: `npm run build:pages && npm run test:pages`  
Expected: Pages build and static-route checks PASS.

Run: `git diff --check`  
Expected: no whitespace errors.

- [ ] **Step 4: Perform the complete desktop playthrough**

Start at `?level=2&build=level2-rc1`. Finish the required route without glider use, then replay optional routes with carried glider. Record first-clear time, verify all checkpoints, inspect every background transition, and defeat Brutus without debug shortcuts.

- [ ] **Step 5: Perform the mobile landscape playthrough**

Test minimum supported landscape viewport and fullscreen landscape. Confirm the sky fills the screen, parallax never reveals empty bands, touch controls remain reachable, landing targets stay visible, and active enemy population stays readable.

- [ ] **Step 6: Re-run focused Level 1 regression routes**

Open woodland, creek, highway, park, and Trash Heap Tyrant test links. Confirm active-level refactoring did not change Level 1 geometry, enemies, transitions, carried state, boss lock, or victory flow.

- [ ] **Step 7: Record only durable discoveries**

If playtesting changes a documented invariant, update the Level 2 spec and the applicable guide with the exact new rule and failure it prevents. Do not add session notes or transient tuning observations to permanent manuals.

- [ ] **Step 8: Commit the verified local release candidate**

```bash
git add tests/mobile-experience.test.mjs tests/rendered-html.test.mjs docs/superpowers/specs/2026-08-06-level-two-design.md
# If and only if they changed during this task:
git add docs/guides/parallax-backgrounds.md docs/guides/enemy-placement-and-grounding.md
git commit -m "test: verify suburban after dark level"
```

Do not push or publish this commit until the user approves the local playtest.
