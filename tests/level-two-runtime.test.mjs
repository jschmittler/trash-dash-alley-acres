import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCarriedProgress,
  carryPlayerProgress,
  createLevelRuntime,
  nextCampaignStart,
} from "../app/level-runtime.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";

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

test("active level runtime delegates declarative spawns and separates hazards", () => {
  const level = {
    encounters: [{ enemies: [{ kind: "squirrel", x: 40 }] }],
    rewards: [
      { kind: "trash", x: 60 },
      { kind: "checkpoint", x: 80 },
    ],
    surfaces: [
      { id: "lawn", hazard: false },
      { id: "pool", hazard: true },
    ],
    checkpoints: [{ id: "street" }],
    boss: { id: "brutus" },
  };

  const runtime = createLevelRuntime(level, {
    makeEnemy: (spawn) => ({ ...spawn, runtime: true }),
    makePickup: (reward, index) => ({ ...reward, index }),
  });

  assert.deepEqual(runtime.enemies, [{ kind: "squirrel", x: 40, runtime: true }]);
  assert.deepEqual(runtime.pickups, [{ kind: "trash", x: 60, index: 0 }]);
  assert.deepEqual(runtime.surfaces, [{ id: "lawn", hazard: false }]);
  assert.deepEqual(runtime.hazards, [{ id: "pool", hazard: true }]);
  assert.equal(runtime.checkpoints, level.checkpoints);
  assert.equal(runtime.boss, level.boss);
});

test("Level 2 runtime passes authored enemy metadata with active supports", () => {
  const inspectedKinds = new Set(["squirrel", "terrier", "skunk", "moth"]);
  const runtime = createLevelRuntime(LEVEL_TWO, {
    makeEnemy: (spawn, supports) => ({
      kind: spawn.kind,
      movement: spawn.movement,
      surfaceId: spawn.surfaceId,
      flightBand: spawn.flightBand,
      baseline: spawn.movement === "flying"
        ? spawn.flightY
        : supports.find(({ id }) => id === spawn.surfaceId)?.y,
    }),
    makePickup: (reward) => reward,
  });
  const enemies = runtime.enemies.filter(({ kind }) => inspectedKinds.has(kind));

  assert.deepEqual(enemies.find(({ kind }) => kind === "squirrel"), {
    kind: "squirrel",
    movement: "platform",
    surfaceId: "backyard-fence",
    flightBand: undefined,
    baseline: 332,
  });
  assert.deepEqual(enemies.find(({ kind }) => kind === "terrier"), {
    kind: "terrier",
    movement: "grounded",
    surfaceId: "street-ground",
    flightBand: undefined,
    baseline: 468,
  });
  assert.deepEqual(enemies.find(({ kind }) => kind === "skunk"), {
    kind: "skunk",
    movement: "grounded",
    surfaceId: "obstacle-lawn",
    flightBand: undefined,
    baseline: 468,
  });
  assert.deepEqual(enemies.find(({ kind }) => kind === "moth"), {
    kind: "moth",
    movement: "flying",
    surfaceId: undefined,
    flightBand: "porch-light-orbit",
    baseline: 220,
  });
});
