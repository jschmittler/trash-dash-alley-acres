import assert from "node:assert/strict";
import test from "node:test";

import { createEnemyPatrol } from "../app/enemy-surface.mjs";

const surfaces = [
  { x: 0, y: 468, w: 1380 },
  { x: 1490, y: 468, w: 980 },
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
    { spawnX: 2418, minX: 2313, maxX: 2418, surfaceY: 468 },
  );
});

test("snaps an unsupported ground spawn to the nearest matching segment", () => {
  assert.deepEqual(
    createEnemyPatrol({ x: 3690, width: 52, surfaceY: 468, patrolRadius: 105, grounded: true }, surfaces),
    { spawnX: 3730, minX: 3730, maxX: 3835, surfaceY: 468 },
  );
});

test("leaves flying patrols independent from solid surfaces", () => {
  assert.deepEqual(
    createEnemyPatrol({ x: 820, width: 50, surfaceY: 310, patrolRadius: 105, grounded: false }, surfaces),
    { spawnX: 820, minX: 715, maxX: 925, surfaceY: 310 },
  );
});
