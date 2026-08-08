import assert from "node:assert/strict";
import test from "node:test";

import { createEnemyPatrol } from "../app/enemy-surface.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";

const surfaces = [
  { x: 0, y: 468, w: 1380 },
  { x: 1490, y: 468, w: 980 },
  { x: 2590, y: 468, w: 1020 },
  { x: 3730, y: 468, w: 1010 },
  { x: 620, y: 366, w: 220 },
];

test("keeps a platform enemy inside its supporting surface", () => {
  assert.deepEqual(
    createEnemyPatrol({ x: 640, width: 46, surfaceY: 366, patrolRadius: 105, grounded: true }, surfaces),
    { spawnX: 640, minX: 620, maxX: 745, surfaceY: 366 },
  );
});

test("pulls an edge spawn fully onto the ground before patrolling", () => {
  assert.deepEqual(
    createEnemyPatrol({ x: 2440, width: 52, surfaceY: 468, patrolRadius: 105, grounded: true }, surfaces),
    { spawnX: 2418, minX: 2335, maxX: 2418, surfaceY: 468 },
  );
});

test("snaps an unsupported ground spawn to the nearest matching segment", () => {
  assert.deepEqual(
    createEnemyPatrol({ x: 3690, width: 52, surfaceY: 468, patrolRadius: 105, grounded: true }, surfaces),
    { spawnX: 3730, minX: 3730, maxX: 3795, surfaceY: 468 },
  );
});

test("leaves flying patrols independent from solid surfaces", () => {
  assert.deepEqual(
    createEnemyPatrol({ x: 820, width: 50, surfaceY: 310, patrolRadius: 105, grounded: false }, surfaces),
    { spawnX: 820, minX: 715, maxX: 925, surfaceY: 310 },
  );
});

test("clips a requested patrol range to the supporting ground segment", () => {
  assert.deepEqual(
    createEnemyPatrol({
      x: 2570,
      width: 58,
      surfaceY: 468,
      patrolRadius: 105,
      patrolBounds: [2450, 2750],
      grounded: true,
    }, surfaces),
    { spawnX: 2590, minX: 2590, maxX: 2750, surfaceY: 468 },
  );
});

test("resolves actual Level 2 grounded enemies against their authored surfaces", () => {
  const widths = { squirrel: 50, terrier: 64, skunk: 58 };
  const expected = {
    squirrel: { spawnX: 800, minX: 720, maxX: 930, surfaceY: 332 },
    terrier: { spawnX: 1580, minX: 1420, maxX: 2480, surfaceY: 468 },
    skunk: { spawnX: 2920, minX: 2800, maxX: 3100, surfaceY: 468 },
  };

  for (const kind of Object.keys(widths)) {
    const spawn = LEVEL_TWO.encounters
      .flatMap(({ enemies }) => enemies)
      .find((enemy) => enemy.kind === kind);
    assert.deepEqual(
      createEnemyPatrol({
        x: spawn.x,
        width: widths[kind],
        surfaceY: 468,
        surfaceId: spawn.surfaceId,
        patrolRadius: 105,
        patrolBounds: spawn.patrol,
        grounded: true,
      }, LEVEL_TWO.surfaces),
      expected[kind],
    );
  }
});

test("keeps an authored Level 2 flight baseline independent from terrain", () => {
  const moth = LEVEL_TWO.encounters
    .flatMap(({ enemies }) => enemies)
    .find(({ kind }) => kind === "moth");

  assert.deepEqual(
    createEnemyPatrol({
      x: moth.x,
      width: 50,
      surfaceY: moth.flightY,
      surfaceId: moth.surfaceId,
      patrolRadius: 105,
      patrolBounds: moth.patrol,
      grounded: false,
    }, LEVEL_TWO.surfaces),
    { spawnX: 4020, minX: 3960, maxX: 4160, surfaceY: 220 },
  );
});
