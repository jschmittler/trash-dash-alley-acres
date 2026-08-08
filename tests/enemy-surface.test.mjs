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

test("explicit surfaceId wins over a nearby surface at the same height", () => {
  const authoredSurfaces = [
    { id: "left", x: 0, y: 400, w: 200 },
    { id: "right", x: 220, y: 400, w: 200 },
  ];
  const patrol = createEnemyPatrol({
    x: 260,
    width: 40,
    surfaceY: 400,
    surfaceId: "left",
    patrolRadius: 100,
    grounded: true,
  }, authoredSurfaces);

  assert.equal(patrol.surfaceId, "left");
  assert.ok(patrol.spawnX <= 160);
});

test("rejects a missing explicit surfaceId instead of using an unbounded patrol", () => {
  assert.throws(
    () => createEnemyPatrol({
      x: 260,
      width: 40,
      surfaceY: 400,
      surfaceId: "missing",
      patrolRadius: 100,
      grounded: true,
    }, [{ id: "right", x: 220, y: 400, w: 200 }]),
    /unknown authored surface "missing"/i,
  );
});

test("rejects an explicit support that is narrower than the enemy", () => {
  assert.throws(
    () => createEnemyPatrol({
      x: 0,
      width: 40,
      surfaceY: 400,
      surfaceId: "narrow",
      patrolRadius: 100,
      grounded: true,
    }, [{ id: "narrow", x: 0, y: 400, w: 30 }]),
    /authored surface "narrow" is 30px wide; enemy requires 40px/i,
  );
});

test("resolves actual Level 2 grounded enemies against their authored surfaces", () => {
  const widths = { squirrel: 50, terrier: 64, skunk: 58 };
  const expected = {
    squirrel: { spawnX: 800, minX: 720, maxX: 930, surfaceY: 332, surfaceId: "backyard-fence" },
    terrier: { spawnX: 1580, minX: 1420, maxX: 2480, surfaceY: 468, surfaceId: "street-ground" },
    skunk: { spawnX: 2920, minX: 2800, maxX: 3100, surfaceY: 468, surfaceId: "obstacle-lawn" },
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

test("resolves Brutus against the dedicated Level 2 arena support", () => {
  const support = LEVEL_TWO.surfaces.find(({ id }) => id === LEVEL_TWO.boss.surfaceId);

  assert.deepEqual(
    createEnemyPatrol({
      x: LEVEL_TWO.boss.arenaStartX + 480,
      width: 96,
      surfaceY: support.y,
      surfaceId: LEVEL_TWO.boss.surfaceId,
      patrolRadius: 360,
      grounded: true,
    }, LEVEL_TWO.surfaces),
    {
      spawnX: 6180,
      minX: 5820,
      maxX: 6454,
      surfaceY: 468,
      surfaceId: "cul-de-sac",
    },
  );
});
