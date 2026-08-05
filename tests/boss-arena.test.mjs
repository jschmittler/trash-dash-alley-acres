import assert from "node:assert/strict";
import test from "node:test";

import {
  BOSS_ARENA_CAMERA_X,
  BOSS_ARENA_LEFT,
  BOSS_ARENA_RIGHT,
  BOSS_ARENA_TRIGGER_X,
  activateBossArena,
  bossArenaCameraX,
  clampArenaBossX,
  clampArenaPlayerX,
} from "../app/boss-arena.mjs";

test("arena activation removes every ordinary enemy and preserves the boss", () => {
  const enemies = [{ kind: "rat", active: true }, { kind: "boss", active: true }, { kind: "crow", active: false }];
  const activated = activateBossArena(enemies);
  assert.equal(activated.arenaActive, true);
  assert.deepEqual(activated.enemies.map((enemy) => enemy.active), [false, true, false]);
  assert.notEqual(activated.enemies, enemies);
});

test("arena constants create a runway and fixed viewport", () => {
  assert.equal(BOSS_ARENA_TRIGGER_X, 5680);
  assert.equal(BOSS_ARENA_LEFT, 5640);
  assert.equal(BOSS_ARENA_RIGHT, 6600);
  assert.equal(BOSS_ARENA_CAMERA_X, 5640);
  assert.equal(bossArenaCameraX(), 5640);
});

test("player and boss remain inside their distinct arena margins", () => {
  assert.equal(clampArenaPlayerX(4000, 32), 5664);
  assert.equal(clampArenaPlayerX(7000, 32), 6544);
  assert.equal(clampArenaBossX(4000, 96), 5740);
  assert.equal(clampArenaBossX(7000, 96), 6468);
});
