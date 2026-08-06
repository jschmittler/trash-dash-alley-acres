import assert from "node:assert/strict";
import test from "node:test";

import { LEVEL_ONE } from "../app/level-one.mjs";

test("Level 1 fixture contains the complete campaign progression", () => {
  assert.equal(LEVEL_ONE.id, "level-1");

  // Five visual chapters, in forward contiguous order.
  assert.equal(LEVEL_ONE.zones.length, 5);
  assert.deepEqual(LEVEL_ONE.zones.map(({ startX, endX }) => [startX, endX]), [
    [0, 1150],
    [1150, 2350],
    [2350, 3550],
    [3550, 4800],
    [4800, 5680],
  ]);

  // Eight standard encounter groups; the boss is represented separately.
  assert.equal(LEVEL_ONE.encounters.length, 8);
  assert.deepEqual(LEVEL_ONE.encounters.map(({ id }) => id), [
    "woodland-clearing-snake",
    "campsite-overlook-birds",
    "creek-entry-air-threats",
    "mill-interior-layers",
    "highway-main-lane-opossum",
    "highway-fox-spike",
    "industrial-rail-yard-layers",
    "park-approach-snake",
  ]);

  // Four alternate routes are explicitly optional and each advertises a reward.
  assert.equal(LEVEL_ONE.routeChoices.length, 4);
  assert.equal(LEVEL_ONE.routeChoices.every(({ optional }) => optional === true), true);
  assert.ok(LEVEL_ONE.routeChoices.every(({ rewardIds }) => rewardIds.length > 0));

  // Three respawn checkpoints, ending at the boss runway.
  assert.equal(LEVEL_ONE.checkpoints.length, 3);
  assert.deepEqual(LEVEL_ONE.checkpoints.map(({ id }) => id), [
    "creek-checkpoint",
    "highway-checkpoint",
    "boss-runway-checkpoint",
  ]);

  // One boss trigger and bounded arena, with no ordinary encounter attached.
  assert.deepEqual(
    {
      id: LEVEL_ONE.boss.id,
      kind: LEVEL_ONE.boss.kind,
      triggerX: LEVEL_ONE.boss.triggerX,
      arenaStartX: LEVEL_ONE.boss.arenaStartX,
      arenaEndX: LEVEL_ONE.boss.arenaEndX,
    },
    {
      id: "trash-heap-tyrant",
      kind: "boss",
      triggerX: 5680,
      arenaStartX: 5640,
      arenaEndX: 6600,
    },
  );
  assert.equal(LEVEL_ONE.encounters.some(({ id }) => id === LEVEL_ONE.boss.id), false);
});
