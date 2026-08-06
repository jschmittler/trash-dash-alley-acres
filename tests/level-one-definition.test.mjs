import assert from "node:assert/strict";
import test from "node:test";

import {
  LEVEL_ONE,
  LEVEL_ONE_ENEMY_KINDS,
  levelOneEncounterData,
  levelOneLightingAt,
  levelOneZoneAt,
} from "../app/level-one.mjs";

test("level one has five contiguous approved zone bands", () => {
  assert.deepEqual(LEVEL_ONE.zones.map(({ startX, endX }) => [startX, endX]), [
    [0, 1150],
    [1150, 2350],
    [2350, 3550],
    [3550, 4800],
    [4800, 5680],
  ]);
  for (let index = 1; index < LEVEL_ONE.zones.length; index += 1) {
    assert.equal(LEVEL_ONE.zones[index - 1].endX, LEVEL_ONE.zones[index].startX);
  }
});

test("zone lookup is stable at boundaries and outside the world", () => {
  assert.equal(levelOneZoneAt(-100).id, "deep-woodland");
  assert.equal(levelOneZoneAt(0).id, "deep-woodland");
  assert.equal(levelOneZoneAt(1150).id, "creek-and-ruined-mill");
  assert.equal(levelOneZoneAt(2350).id, "forest-edge-highway");
  assert.equal(levelOneZoneAt(3550).id, "industrial-city-fringe");
  assert.equal(levelOneZoneAt(4800).id, "urban-park-transition");
  assert.equal(levelOneZoneAt(99999).id, "urban-park-transition");
});

test("lighting progression follows each visual chapter", () => {
  assert.equal(levelOneLightingAt(0).lighting, "late-afternoon");
  assert.equal(levelOneLightingAt(1300).lighting, "sunset");
  assert.equal(levelOneLightingAt(2500).lighting, "dusk");
  assert.equal(levelOneLightingAt(4000).lighting, "night");
  assert.equal(levelOneLightingAt(5200).lighting, "moonlit");
  assert.ok(levelOneLightingAt(1800).progress > 0);
  assert.ok(levelOneLightingAt(1800).progress < 1);
});

test("level one uses the exact approved standard enemy roster and encounter order", () => {
  assert.deepEqual(LEVEL_ONE_ENEMY_KINDS, ["snake", "pigeon", "wasp", "mosquito", "possum", "spider", "fox"]);
  assert.deepEqual(levelOneEncounterData().map((encounter) => encounter.id), [
    "woodland-clearing-snake",
    "campsite-overlook-birds",
    "creek-entry-air-threats",
    "mill-interior-layers",
    "highway-main-lane-opossum",
    "highway-fox-spike",
    "industrial-rail-yard-layers",
    "park-approach-snake",
  ]);
  const allKinds = levelOneEncounterData().flatMap(({ enemies }) => enemies.map(({ kind }) => kind));
  assert.ok(allKinds.every((kind) => LEVEL_ONE_ENEMY_KINDS.includes(kind)));
});

test("rewards, checkpoints, routes, and boss metadata match the approved layout", () => {
  assert.deepEqual(LEVEL_ONE.rewards.filter(({ kind }) => kind === "taco").map(({ id }) => id), [
    "campsite-first-taco",
    "highway-taco",
    "park-final-taco",
  ]);
  assert.equal(LEVEL_ONE.rewards.find(({ kind }) => kind === "cap").id, "mill-glider-cap");
  assert.deepEqual(LEVEL_ONE.checkpoints.map(({ id }) => id), [
    "creek-checkpoint",
    "highway-checkpoint",
    "boss-runway-checkpoint",
  ]);
  assert.deepEqual(LEVEL_ONE.routeChoices.map(({ id }) => id), [
    "campsite-upper-route",
    "mill-glider-route",
    "highway-culvert-route",
    "industrial-container-route",
  ]);
  assert.equal(LEVEL_ONE.routeChoices.every(({ optional }) => optional), true);
  assert.deepEqual(
    { triggerX: LEVEL_ONE.boss.triggerX, arenaStartX: LEVEL_ONE.boss.arenaStartX, arenaEndX: LEVEL_ONE.boss.arenaEndX },
    { triggerX: 5680, arenaStartX: 5640, arenaEndX: 6600 },
  );
});

test("level one definition is deeply immutable", () => {
  assert.equal(Object.isFrozen(LEVEL_ONE), true);
  assert.equal(Object.isFrozen(LEVEL_ONE.zones), true);
  assert.equal(Object.isFrozen(LEVEL_ONE.encounters[0].enemies[0]), true);
  assert.equal(Object.isFrozen(LEVEL_ONE_ENEMY_KINDS), true);
});

test("Level 1 enemy placement references stable surfaces and flight bands", () => {
  const surfaceIds = LEVEL_ONE.surfaces.map(({ id }) => id);
  const flightBandIds = LEVEL_ONE.flightBands.map(({ id }) => id);
  const flyingKinds = new Set(["pigeon", "wasp", "mosquito"]);
  const enemies = levelOneEncounterData().flatMap(({ enemies: spawns }) => spawns);

  assert.equal(new Set(surfaceIds).size, surfaceIds.length);
  assert.equal(new Set(flightBandIds).size, flightBandIds.length);
  for (const enemy of enemies) {
    if (flyingKinds.has(enemy.kind)) {
      assert.equal(typeof enemy.flightBand, "string");
      assert.ok(flightBandIds.includes(enemy.flightBand));
    } else {
      assert.equal(typeof enemy.surfaceId, "string");
      assert.ok(surfaceIds.includes(enemy.surfaceId));
    }
  }
  assert.ok(surfaceIds.includes(LEVEL_ONE.boss.surfaceId));
});
