import assert from "node:assert/strict";
import test from "node:test";

import { LEVEL_TWO } from "../app/level-two.mjs";

test("Level 2 fixture contains the complete structural blockout", () => {
  assert.equal(LEVEL_TWO.zones.length, 5);
  assert.equal(LEVEL_TWO.encounters.length, 8);
  assert.equal(LEVEL_TWO.routeChoices.length, 6);
  assert.equal(LEVEL_TWO.checkpoints.length, 4);

  const runwayMarker = LEVEL_TWO.encounters.find(({ id }) => id === "boss-runway");
  assert.ok(runwayMarker);
  assert.deepEqual(runwayMarker.enemies, []);

  assert.deepEqual(
    LEVEL_TWO.routeChoices.map(({ id }) => id),
    [
      "backyard-porch-route",
      "parked-car-route",
      "treehouse-route",
      "poolside-secret",
      "culvert-bypass",
      "utility-line-mastery",
    ],
  );

  assert.deepEqual(
    { id: LEVEL_TWO.boss.id, kind: LEVEL_TWO.boss.kind },
    { id: "brutus-bin-hound", kind: "brutus" },
  );
  assert.deepEqual(LEVEL_TWO.exit, { nextLevelId: "level-3", x: 7120 });
});

test("every grounded or platform-bound Level 2 spawn uses a valid support", () => {
  const supports = new Map(
    LEVEL_TWO.surfaces
      .filter(({ hazard }) => !hazard)
      .map((surface) => [surface.id, surface]),
  );

  for (const encounter of LEVEL_TWO.encounters) {
    for (const enemy of encounter.enemies) {
      if (enemy.movement === "flying") continue;
      assert.ok(
        supports.has(enemy.surfaceId),
        `${encounter.id}/${enemy.kind} needs a non-hazard surface`,
      );
    }
  }
});

test("the boss runway contains no ordinary encounter", () => {
  const ordinaryEncounters = LEVEL_TWO.encounters.filter(({ enemies }) => enemies.length > 0);
  assert.equal(
    ordinaryEncounters.some(({ spawnX }) => spawnX >= LEVEL_TWO.boss.runwayStartX),
    false,
  );
});
