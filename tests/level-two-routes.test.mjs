import test from "node:test";
import assert from "node:assert/strict";

import { LEVEL_TWO } from "../app/level-two.mjs";

test("all optional routes point to known rewards and encounters", () => {
  const rewards = new Set(LEVEL_TWO.rewards.map(({ id }) => id));
  const encounters = new Set(LEVEL_TWO.encounters.map(({ id }) => id));
  for (const route of LEVEL_TWO.routeChoices) {
    for (const id of route.rewardIds) assert.ok(rewards.has(id));
    for (const id of route.bypassEncounterIds ?? []) assert.ok(encounters.has(id));
  }
});

test("large encounters retain recovery space before the next ordinary encounter", () => {
  const encounters = LEVEL_TWO.encounters;
  for (let index = 0; index < encounters.length; index += 1) {
    const encounter = encounters[index];
    if (encounter.sizeClass !== "large") continue;
    const nextOrdinary = encounters.slice(index + 1).find(({ enemies }) => enemies.length > 0);
    if (nextOrdinary) {
      assert.ok(nextOrdinary.spawnX > encounter.recoveryEndX, `${encounter.id} recovery overlaps ${nextOrdinary.id}`);
    }
  }
});

test("Level 2 has six optional routes, four ordered checkpoints, and Brutus metadata", () => {
  assert.equal(LEVEL_TWO.routeChoices.length, 6);
  assert.equal(LEVEL_TWO.routeChoices.every(({ optional }) => optional), true);
  assert.equal(LEVEL_TWO.checkpoints.length, 4);
  assert.ok(LEVEL_TWO.checkpoints.every(({ x, respawnX }) => respawnX < x));
  assert.deepEqual(LEVEL_TWO.boss, {
    id: "brutus-bin-hound",
    kind: "brutus",
    runwayStartX: 5300,
    triggerX: 5750,
    arenaStartX: 5700,
    arenaEndX: 6550,
    surfaceId: "cul-de-sac",
    checkpointId: "boss-runway-checkpoint",
    hydrant: {
      id: "brutus-hydrant", x: 5868, y: 400, w: 42, h: 68,
      placementType: "ON_SURFACE", surfaceId: "cul-de-sac",
    },
    spawnX: 6250,
    recoveryX: 6250,
    defeatExitX: 6740,
    postBossStartX: 6550,
  });
  assert.deepEqual(LEVEL_TWO.exit, { nextLevelId: "level-3", x: 7120 });
});
