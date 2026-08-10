import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  BOSS_ARENA_CAMERA_X,
  BOSS_ARENA_LEFT,
  BOSS_ARENA_RIGHT,
  BOSS_ARENA_TRIGGER_X,
  BOSS_INTRO_DURATION,
  activateBossArena,
  bossArenaCameraX,
  clampArenaBossX,
  clampArenaPlayerX,
  completeBossArena,
  selectBossTestRoute,
  validateBossArenaPlacement,
} from "../app/boss-arena.mjs";
import { LEVEL_ONE } from "../app/level-one.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";

test("arena activation removes every ordinary enemy and preserves the boss", () => {
  const enemies = [{ kind: "rat", active: true }, { kind: "boss", active: true }, { kind: "crow", active: false }];
  const activated = activateBossArena(enemies);
  assert.equal(activated.arenaActive, true);
  assert.deepEqual(activated.enemies.map((enemy) => enemy.kind), ["boss"]);
  assert.equal(activated.enemies[0].active, true);
  assert.notEqual(activated.enemies, enemies);
});

test("Trash Heap Tyrant defeat releases the arena only after its committed defeat sequence", async () => {
  assert.deepEqual(completeBossArena(), {
    arenaActive: false,
    bossDefeated: true,
    bossTransition: null,
  });

  const runtime = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(runtime, /if \(boss\.actionTimer <= 0\) finishBossDefeat\(world, boss\)/);
  assert.match(runtime, /const completed = completeBossArena\(\);[\s\S]{0,240}world\.arenaActive = completed\.arenaActive;[\s\S]{0,160}world\.bossDefeated = completed\.bossDefeated;/);
});

test("boss intro duration matches the camera runway", () => {
  assert.equal(BOSS_INTRO_DURATION, 1.1);
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

test("active boss metadata controls arena clamping and camera placement", () => {
  const brutus = { arenaStartX: 5700, arenaEndX: 6550 };
  assert.equal(clampArenaPlayerX(4000, 38, brutus), 5724);
  assert.equal(clampArenaPlayerX(7000, 38, brutus), 6488);
  assert.equal(clampArenaBossX(4000, 96, brutus), 5800);
  assert.equal(clampArenaBossX(7000, 96, brutus), 6418);
  assert.equal(bossArenaCameraX(brutus), 5700);
});

test("boss test routes preserve canonical Level 1 positions and isolate Brutus", () => {
  assert.deepEqual(selectBossTestRoute("1"), {
    levelId: "level-1", playerX: 5590, checkpointX: 5590, cameraX: 5280, glider: 0,
  });
  assert.deepEqual(selectBossTestRoute("arena"), {
    levelId: "level-1", playerX: 5690, checkpointX: 5590, cameraX: 5280, glider: 0,
  });
  assert.deepEqual(selectBossTestRoute("brutus"), {
    levelId: "level-2", playerX: 5770, checkpointX: 5200, cameraX: 5700, glider: 14, activateArena: true,
  });
  assert.equal(selectBossTestRoute("unknown"), null);
});

test("both boss arenas provide a quiet runway, grounded props, and reachable symmetric utility platforms", () => {
  assert.deepEqual(validateBossArenaPlacement(LEVEL_ONE), []);
  assert.deepEqual(validateBossArenaPlacement(LEVEL_TWO), []);
});
