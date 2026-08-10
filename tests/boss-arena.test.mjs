import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  BOSS_ARENA_CAMERA_X,
  BOSS_ARENA_LEFT,
  BOSS_ARENA_RIGHT,
  BOSS_ARENA_TRIGGER_X,
  BOSS_ENTRY_MOTION_LIMITS,
  BOSS_INTRO_DURATION,
  activateBossArena,
  advanceBossArenaEntryX,
  bossArenaCameraX,
  clampArenaBossX,
  clampArenaPlayerX,
  completeBossArena,
  latestSafeBossArenaTriggerX,
  selectBossTestRoute,
  validateBossArenaPlacement,
} from "../app/boss-arena.mjs";
import { LEVEL_ONE } from "../app/level-one.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import { decorativeCollisionRect } from "../app/decorative-render.mjs";
import {
  dumpsterCollisionRect,
  dumpsterPlacementFootprint,
} from "../app/dumpster-render.mjs";
import { rectIntersectionArea } from "../app/world-placement.mjs";

function assertBossCompletionWiring(runtime) {
  const start = runtime.indexOf("const finishBossDefeat =");
  assert.notEqual(start, -1, "runtime must define finishBossDefeat");

  const end = runtime.indexOf("const finishBrutusDefeat =", start);
  assert.notEqual(end, -1, "runtime must delimit the Level 1 completion block");

  const completionBlock = runtime.slice(start, end);
  assert.match(
    completionBlock,
    /const completed = completeBossArena\(\);\s+world\.arenaActive = completed\.arenaActive;\s+world\.bossTransition = completed\.bossTransition;\s+world\.bossDefeated = completed\.bossDefeated;/,
  );
}

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
  assertBossCompletionWiring(runtime);

  for (const assignment of [
    "world.arenaActive = completed.arenaActive;",
    "world.bossTransition = completed.bossTransition;",
    "world.bossDefeated = completed.bossDefeated;",
  ]) {
    const mutant = runtime.replace(assignment, "");
    assert.notEqual(mutant, runtime, `mutation must remove ${assignment}`);
    assert.throws(
      () => assertBossCompletionWiring(mutant),
      assert.AssertionError,
      `completion wiring must reject removal of ${assignment}`,
    );
  }
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
  const brutus = { arenaStartX: 5650, arenaEndX: 6600 };
  assert.equal(clampArenaPlayerX(4000, 38, brutus), 5674);
  assert.equal(clampArenaPlayerX(7000, 38, brutus), 6538);
  assert.equal(clampArenaBossX(4000, 96, brutus), 5750);
  assert.equal(clampArenaBossX(7000, 96, brutus), 6468);
  assert.equal(bossArenaCameraX(brutus), 5650);
});

test("boss test routes preserve canonical Level 1 positions and isolate Brutus", () => {
  assert.deepEqual(selectBossTestRoute("1"), {
    levelId: "level-1", playerX: 5590, checkpointX: 5590, cameraX: 5280, glider: 0,
  });
  assert.deepEqual(selectBossTestRoute("arena"), {
    levelId: "level-1", playerX: 5690, checkpointX: 5590, cameraX: 5280, glider: 0,
  });
  assert.deepEqual(selectBossTestRoute("brutus"), {
    levelId: "level-2", playerX: 5680, checkpointX: 5200, cameraX: 5650, glider: 14, activateArena: true,
  });
  assert.equal(selectBossTestRoute("unknown"), null);
});

test("Brutus worst-step normal entry and direct fixture clear both canonical crate footprints", () => {
  const playerWidth = BOSS_ENTRY_MOTION_LIMITS.maximumPlayerWidth;
  const minimumEntryClearance = BOSS_ENTRY_MOTION_LIMITS.minimumClearance;
  const platforms = LEVEL_TWO.surfaces.filter(({ id }) => id.startsWith("brutus-platform-"));
  const leftPlatform = platforms[0];
  const fixture = selectBossTestRoute("brutus");
  const assertClear = ({ label, x, clearance = 0 }, candidates = platforms) => {
    const overlap = candidates.find((platform) => x < platform.x + platform.w && x + playerWidth > platform.x);
    assert.equal(overlap, undefined, `${label} ${x}..${x + playerWidth} overlaps ${overlap?.id}`);
    assert.ok(leftPlatform.x - (x + playerWidth) >= clearance, `${label} lost its ${clearance}px entry margin`);
  };

  const normalEntry = {
    label: "worst-step normal entry",
    x: advanceBossArenaEntryX(LEVEL_TWO.boss.triggerX),
    clearance: minimumEntryClearance,
  };
  assert.equal(LEVEL_TWO.boss.triggerX, latestSafeBossArenaTriggerX(leftPlatform.x));
  assertClear(normalEntry);
  const triggerMutantEntry = advanceBossArenaEntryX(LEVEL_TWO.boss.triggerX + 1);
  assert.throws(
    () => assertClear({ ...normalEntry, x: triggerMutantEntry }),
    assert.AssertionError,
    "normal entry must reject a one-pixel trigger mutation",
  );

  const fixtureEntry = { label: "direct fixture", x: fixture.playerX };
  assertClear(fixtureEntry);
  const fixturePlacementMutant = [{ ...leftPlatform, x: fixture.playerX + playerWidth - 1 }, platforms[1]];
  assert.throws(
    () => assertClear(fixtureEntry, fixturePlacementMutant),
    assert.AssertionError,
    "direct fixture must reject a one-pixel crate overlap",
  );
});

test("runtime movement consumes the authored boss-entry speed and time-step bounds", async () => {
  const runtime = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(runtime, /running \? BOSS_ENTRY_MOTION_LIMITS\.maximumRunSpeed : 225/);
  assert.match(runtime, /Math\.min\(BOSS_ENTRY_MOTION_LIMITS\.maximumStepSeconds, Math\.max\(0, elapsed\)\)/);
});

test("both boss arenas provide a quiet runway, grounded props, and reachable symmetric utility platforms", () => {
  assert.deepEqual(validateBossArenaPlacement(LEVEL_ONE), []);
  assert.deepEqual(validateBossArenaPlacement(LEVEL_TWO), []);
  assert.match(
    validateBossArenaPlacement({
      ...LEVEL_TWO,
      boss: { ...LEVEL_TWO.boss, triggerX: 5724 },
    })[0],
    /entry worst step violates utility-platform clearance/,
  );
});

test("post-boss crate, dumpster glow, collision, and traversal footprints remain separated", () => {
  const floor = LEVEL_TWO.surfaces.find(({ id }) => id === "cul-de-sac");
  const crates = LEVEL_TWO.surfaces.filter(({ id }) => id.startsWith("brutus-platform-"));
  assert.deepEqual(crates.map(({ id }) => id), ["brutus-platform-left", "brutus-platform-right"]);
  const dumpster = LEVEL_TWO.boss.victoryDumpster;
  assert.ok(dumpster, "Level 2 must author its post-boss dumpster in world space");

  const crateFootprints = crates.map((crate) => ({
    id: crate.id,
    visual: { x: crate.x, y: crate.y, w: crate.w, h: crate.h },
    collision: decorativeCollisionRect("crate", crate.x, floor.y),
  }));
  const dumpsterVisual = dumpsterPlacementFootprint(dumpster.x, floor.y);
  const dumpsterCollision = dumpsterCollisionRect(dumpster.x, floor.y);
  const playerRoute = {
    x: LEVEL_TWO.boss.postBossStartX,
    y: floor.y - 58,
    w: LEVEL_TWO.exit.x - 220 + 38 - LEVEL_TWO.boss.postBossStartX,
    h: 58,
  };

  for (const crate of crateFootprints) {
    for (const [crateName, crateBounds] of [["visual", crate.visual], ["collision", crate.collision]]) {
      for (const [dumpsterName, dumpsterBounds] of [["glow", dumpsterVisual], ["collision", dumpsterCollision]]) {
        assert.equal(
          rectIntersectionArea(crateBounds, dumpsterBounds),
          0,
          `${crate.id} ${crateName} overlaps dumpster ${dumpsterName}`,
        );
      }
      assert.equal(rectIntersectionArea(crateBounds, playerRoute), 0, `${crate.id} ${crateName} obstructs post-boss traversal`);
    }
  }
  assert.equal(rectIntersectionArea(dumpsterCollision, playerRoute), 0, "dumpster obstructs post-boss traversal");
  assert.ok(dumpsterVisual.x >= LEVEL_TWO.exit.x - 220 + 38 + 16, "dumpster lacks player-route clearance");

  for (const crate of crates) {
    const overlappingCrate = {
      ...LEVEL_TWO,
      boss: {
        ...LEVEL_TWO.boss,
        victoryDumpster: { ...LEVEL_TWO.boss.victoryDumpster, x: crate.x + 12 },
      },
    };
    assert.ok(
      validateBossArenaPlacement(overlappingCrate).some((error) => new RegExp(`${crate.id}.*overlaps victory-dumpster`).test(error)),
      `arena validator must reject a ${crate.id}/dumpster footprint mutation`,
    );
  }

  const forbiddenArena = {
    ...LEVEL_TWO,
    boss: {
      ...LEVEL_TWO.boss,
      victoryDumpster: { ...LEVEL_TWO.boss.victoryDumpster, x: 6200 },
    },
  };
  assert.ok(
    validateBossArenaPlacement(forbiddenArena).some((error) => /victory dumpster.*active boss arena/i.test(error)),
    "arena validator must enforce the active-boss-arena forbidden zone",
  );

  const blockedRoute = {
    ...LEVEL_TWO,
    boss: {
      ...LEVEL_TWO.boss,
      victoryDumpster: { ...LEVEL_TWO.boss.victoryDumpster, x: 6810 },
    },
  };
  assert.ok(
    validateBossArenaPlacement(blockedRoute).some((error) => /victory-dumpster-collision overlaps post-boss-player-route/.test(error)),
    "arena validator must reject traversal obstruction",
  );
});
