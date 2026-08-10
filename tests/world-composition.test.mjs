import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { LEVEL_ONE } from "../app/level-one.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import {
  completeCompositionItemsForLevel,
  compositionItemsForLevel,
  rollingCompositionWindows,
  validateLevelComposition,
  validateRollingWorldComposition,
} from "../app/world-scenery.mjs";

test("authored Level 1 and Level 2 scenery preserve platform exclusion and negative space", () => {
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    const items = compositionItemsForLevel(level);
    assert.ok(items.length > 0, `${level.id} composition inventory is empty`);
    assert.deepEqual(validateLevelComposition(level), [], level.id);
  }
});

test("composition validation rejects repeated hero props inside one viewport", () => {
  const invalidLevel = {
    ...LEVEL_TWO,
    scenery: [
      { id: "a", x: 100, prop: "tree", surfaceId: "backyard-lawn", groundY: 468 },
      { id: "b", x: 300, prop: "tree", surfaceId: "backyard-lawn", groundY: 468 },
      { id: "c", x: 500, prop: "tree", surfaceId: "backyard-lawn", groundY: 468 },
    ],
  };
  assert.ok(validateLevelComposition(invalidLevel).some((error) => error.includes("hero prop density")));
});

test("Level 1 campsite crate platforms remain distinct instead of overlapping", () => {
  const crates = LEVEL_ONE.surfaces
    .filter(({ id }) => id.startsWith("crate-campsite-"))
    .sort((left, right) => left.x - right.x);
  assert.equal(crates.length, 2);
  assert.ok(crates[0].x + crates[0].w <= crates[1].x, "campsite crates overlap");
});

test("rolling 960px viewports never expose more than two ordinary encounter groups", () => {
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    const items = completeCompositionItemsForLevel(level);
    assert.ok(items.some(({ kind }) => kind === "scenery"), `${level.id} has no scenery footprints`);
    assert.ok(items.some(({ kind }) => kind === "pickup"), `${level.id} has no pickup hover footprints`);
    assert.ok(items.some(({ kind }) => kind === "encounter"), `${level.id} has no encounter motion footprints`);
    for (const window of rollingCompositionWindows(level, 960, 120)) {
      assert.ok(window.encounterIds.length <= 2,
        `${level.id} viewport ${window.x}-${window.x + 960} contains ${window.encounterIds.join(", ")}`);
      assert.deepEqual(
        window.encounterIds,
        window.items.filter(({ kind, compositionBounds }) => (
          kind === "encounter"
          && compositionBounds.x + compositionBounds.w / 2 >= window.x
          && compositionBounds.x + compositionBounds.w / 2 < window.x + 960
        )).map(({ id }) => id),
        `${level.id} viewport ${window.x}-${window.x + 960} must count complete motion-envelope centers`,
      );
    }
    assert.deepEqual(validateRollingWorldComposition(level, 960, 120), [], level.id);
  }
});

test("rolling encounter pacing follows the complete motion envelope instead of stale spawn metadata", () => {
  const shifted = structuredClone(LEVEL_ONE);
  const group = shifted.encounters.find(({ id }) => id === "woodland-clearing-snake");
  const originalSpawnX = group.spawnX;
  group.enemies[0].patrol = [1000, 1100];
  assert.equal(group.spawnX, originalSpawnX);
  assert.ok(!rollingCompositionWindows(shifted, 960, 120)[0].encounterIds.includes(group.id));
});

test("rolling validation rejects off-world pickups, broken routes, and missing landing targets", () => {
  const offWorldPickup = structuredClone(LEVEL_ONE);
  offWorldPickup.rewards.find(({ id }) => id === "starter-trash-trail").x = 999999;
  assert.ok(validateRollingWorldComposition(offWorldPickup).some((error) => error.includes("starter-trash-trail")));

  const offWorldRoute = structuredClone(LEVEL_TWO);
  const route = offWorldRoute.routeChoices.find(({ id }) => id === "backyard-porch-route");
  route.startX = 999999;
  route.endX = 1000200;
  assert.ok(validateRollingWorldComposition(offWorldRoute).some((error) => error.includes("backyard-porch-route")));

  const missingLanding = structuredClone(LEVEL_TWO);
  missingLanding.surfaces = missingLanding.surfaces.filter(({ id }) => !["backyard-lawn", "backyard-porch"].includes(id));
  assert.ok(validateRollingWorldComposition(missingLanding).some((error) => error.includes("landing target")));
});

test("full motion footprints isolate large encounters and preserve foreground readability", () => {
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    assert.deepEqual(validateRollingWorldComposition(level), [], level.id);
  }
  const crowded = structuredClone(LEVEL_TWO);
  crowded.encounters.find(({ id }) => id === "street-squirrel-repeat").enemies[0].patrol = [2450, 2576];
  assert.ok(validateRollingWorldComposition(crowded).some((error) => error.includes("large encounter footprint")));

  const source = readFileSync(fileURLToPath(new URL("../app/trash-dash-game.tsx", import.meta.url)), "utf8");
  const sceneryDraw = source.indexOf("for (const item of sceneryForLevel(world.levelId))");
  const pickupDraw = source.indexOf("for (const pickup of world.pickups)", sceneryDraw);
  const enemyDraw = source.indexOf("for (const enemy of world.enemies)", pickupDraw);
  assert.ok(sceneryDraw >= 0 && pickupDraw > sceneryDraw && enemyDraw > pickupDraw,
    "world scenery must render behind pickups and actors instead of occluding gameplay");
});

test("boss runways remain clear of every ordinary patrol's expanded visual envelope", () => {
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    const runwayStart = level.boss.runwayStartX;
    for (const group of level.encounters.filter(({ enemies }) => enemies.length > 0)) {
      for (const enemy of group.enemies) {
        const patrolEnd = Math.max(...enemy.patrol);
        const visualHalfWidth = enemy.kind === "terrier" ? 41 : enemy.kind === "snake" ? 32 : 40;
        assert.ok(patrolEnd + visualHalfWidth <= runwayStart,
          `${level.id}/${group.id}/${enemy.kind} reaches ${patrolEnd + visualHalfWidth} into runway ${runwayStart}`);
      }
    }
  }
});
