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

test("every suburban chapter offers an optional route or authored secret", () => {
  const routeZoneIds = new Set(LEVEL_TWO.routeChoices.map(({ startX }) => levelTwoZoneAt(startX).id));
  const secretZoneIds = new Set(
    LEVEL_TWO.rewards
      .filter(({ optional, secret }) => optional && secret)
      .map(({ zoneId }) => zoneId),
  );

  for (const zone of LEVEL_TWO.zones) {
    assert.ok(routeZoneIds.has(zone.id) || secretZoneIds.has(zone.id), `${zone.id} needs a route or secret`);
  }

  const mainStreetSecret = LEVEL_TWO.rewards.find(({ id }) => id === "main-street-alley-cache");
  assert.deepEqual(mainStreetSecret, {
    id: "main-street-alley-cache",
    kind: "trash",
    x: 6820,
    zoneId: "suburban-main-street",
    surfaceId: "victory-street",
    surfaceY: 468,
    optional: true,
    secret: true,
  });
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

test("Level 2 owns one explicit boss-arena hydrant and no auxiliary emitter placements", () => {
  assert.equal(LEVEL_TWO.boss.hydrant.id, "brutus-hydrant");
  assert.equal(Object.hasOwn(LEVEL_TWO.boss, "sprinklers"), false);
  assert.equal(Object.isFrozen(LEVEL_TWO.boss.hydrant), true);
});
