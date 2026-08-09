import assert from "node:assert/strict";
import test from "node:test";

import { LEVEL_TWO } from "../app/level-two.mjs";

const horizontalGap = (left, right) => Math.max(
  left.x - (right.x + right.w),
  right.x - (left.x + left.w),
  0,
);

const precisionPath = (surfaces, startId, finishId, { maxRise, maxGap }) => {
  const supports = surfaces.filter(({ hazard }) => !hazard);
  const start = supports.find(({ id }) => id === startId);
  if (!start) return null;
  const queue = [[start, [start.id]]];
  const visited = new Set([start.id]);

  while (queue.length > 0) {
    const [current, path] = queue.shift();
    if (current.id === finishId) return path;
    for (const candidate of supports) {
      const rise = current.y - candidate.y;
      if (visited.has(candidate.id) || rise > maxRise || horizontalGap(current, candidate) > maxGap) continue;
      visited.add(candidate.id);
      queue.push([candidate, [...path, candidate.id]]);
    }
  }
  return null;
};

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
    { id: LEVEL_TWO.boss.id, kind: LEVEL_TWO.boss.kind, surfaceId: LEVEL_TWO.boss.surfaceId },
    { id: "brutus-bin-hound", kind: "brutus", surfaceId: "cul-de-sac" },
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

test("the upper utility route has a no-glider precision approach", () => {
  const unassistedJumpApex = (615 ** 2) / (2 * 1750);
  assert.deepEqual(
    precisionPath(LEVEL_TWO.surfaces, "culvert-route", "utility-route", {
      maxRise: unassistedJumpApex,
      maxGap: 80,
    }),
    ["culvert-route", "utility-approach", "utility-route"],
  );
});

test("Brutus arena has two authored normal-jump utility platforms with safe separation", () => {
  const [left, right] = ["brutus-platform-left", "brutus-platform-right"].map((id) => (
    LEVEL_TWO.surfaces.find((surface) => surface.id === id)
  ));
  assert.ok(left);
  assert.ok(right);
  assert.deepEqual([left.visual, right.visual], ["boss-platform-left", "boss-platform-right"]);

  const unassistedJumpApex = (615 ** 2) / (2 * 1750);
  const bossTop = LEVEL_TWO.surfaces.find(({ id }) => id === LEVEL_TWO.boss.surfaceId).y - 96;
  for (const platform of [left, right]) {
    assert.ok(468 - platform.y < unassistedJumpApex, `${platform.id} unreachable from ground`);
    assert.ok(platform.y - bossTop < unassistedJumpApex, `${platform.id} cannot reach Brutus top`);
    assert.ok(platform.w >= 72, `${platform.id} landing width is too narrow`);
  }
  assert.ok(horizontalGap(left, right) > 96 + 38, "Brutus could block both platforms at once");
  assert.ok(left.x >= LEVEL_TWO.boss.arenaStartX + 24);
  assert.ok(right.x + right.w <= LEVEL_TWO.boss.arenaEndX - 24);
});
