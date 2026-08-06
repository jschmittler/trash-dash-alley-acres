import test from "node:test";
import assert from "node:assert/strict";

import {
  LEVEL_TWO,
  LEVEL_TWO_ENEMY_KINDS,
  levelTwoEncounterData,
  levelTwoZoneAt,
} from "../app/level-two.mjs";
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

test("Level 2 preserves its complete encounter teaching sequence and immutable data", () => {
  assert.deepEqual(levelTwoEncounterData().map(({ id }) => id), [
    "backyard-squirrel-tutorial",
    "street-terrier-tutorial",
    "street-squirrel-repeat",
    "obstacle-skunk-tutorial",
    "obstacle-interaction-test",
    "porch-light-moth-introduction",
    "drainage-mastery",
    "boss-runway",
  ]);
  assert.equal(levelTwoZoneAt(1250).id, "garbage-night-street");
  assert.equal(levelTwoZoneAt(99999).id, "suburban-main-street");
  assert.equal(Object.isFrozen(LEVEL_TWO), true);
  assert.equal(Object.isFrozen(LEVEL_TWO.encounters[0].enemies[0]), true);
});
