import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BRUTUS_ANIMATIONS,
  brutusTopHitRegion,
  brutusArenaHazards,
  createBrutusState,
  isBrutusTopHit,
  moveBrutusInArena,
  updateBrutus,
} from "../app/brutus-boss.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";

test("Brutus exposes one hit only after a hydrant crash", () => {
  const state = createBrutusState();
  const crashed = updateBrutus({ ...state, mode: "charge" }, { dt: 0.1, hydrantHit: true });
  assert.equal(crashed.mode, "stunned-open");
  const hit = updateBrutus(crashed, { dt: 0.1, playerAttackHit: true });
  assert.equal(hit.hp, 2);
  assert.equal(hit.mode, "hit");
});

test("phase two owns at most one rolling can", () => {
  const state = { ...createBrutusState(), hp: 2, phase: 2, rollingCanId: "can-1" };
  assert.equal(brutusArenaHazards(state).filter(({ kind }) => kind === "rolling-can").length, 1);
});

test("defeat unlocks only after the full animation", () => {
  const state = { ...createBrutusState(), hp: 0, mode: "defeat", timer: 0.2 };
  assert.equal(updateBrutus(state, { dt: 0.1 }).arenaUnlocked, false);
  const exiting = updateBrutus(state, { dt: 1.5 });
  assert.equal(exiting.mode, "defeat-exit");
  assert.equal(exiting.arenaUnlocked, false);
  assert.equal(updateBrutus(exiting, { dt: 10 }).arenaUnlocked, false);
  assert.equal(updateBrutus(exiting, { dt: 0, exitComplete: true }).arenaUnlocked, true);
  assert.deepEqual(brutusArenaHazards(state), []);
});

test("ordinary collisions and attacks against closed armor cannot damage Brutus", () => {
  const charging = { ...createBrutusState(), mode: "charge", timer: 0.8 };
  const wallCrash = updateBrutus(charging, { dt: 0.1, obstacleHit: true, playerAttackHit: true });
  assert.equal(wallCrash.mode, "charge");
  assert.equal(wallCrash.hp, 3);
  const closedHit = updateBrutus({ ...charging, mode: "recover" }, { dt: 0.1, playerAttackHit: true });
  assert.equal(closedHit.hp, 3);
});

test("Brutus stomp requires a downward crossing of the narrow authored top band", () => {
  const boss = { x: 6100, y: 372, w: 96, h: 96 };
  const state = createBrutusState();
  const region = brutusTopHitRegion(boss, state, 0);
  assert.ok(region.y < boss.y - 30, `idle rendered top stayed at collider y=${region.y}`);
  assert.deepEqual({ x: region.x, w: region.w, h: region.h }, { x: 6118, w: 60, h: 14 });

  // This crossing finishes above the 96x96 physics collider. It proves the
  // rendered head/back is reachable without broadening the whole draw rect.
  const visibleTopCrossing = { x: 6130, y: region.y - 50, w: 38, h: 58, vy: 220 };
  assert.ok(visibleTopCrossing.y + visibleTopCrossing.h < boss.y);
  assert.equal(isBrutusTopHit(visibleTopCrossing, boss, region.y - 2, state, 0), true);
  assert.equal(isBrutusTopHit({ ...visibleTopCrossing, vy: -20 }, boss, region.y - 2, state, 0), false);
  assert.equal(isBrutusTopHit({ ...visibleTopCrossing, y: region.y + 20 }, boss, region.y + 18, state, 0), false);
  assert.equal(isBrutusTopHit({ ...visibleTopCrossing, x: 6090, w: 20 }, boss, region.y - 2, state, 0), false);
});

test("runtime resolves Brutus visible-top contact before generic collider rejection", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const topContact = source.indexOf("const brutusStomped");
  const colliderRejection = source.indexOf("if (!intersects(player, enemy)) continue;", topContact);
  assert.ok(topContact >= 0, "missing pre-collider Brutus stomp resolution");
  assert.ok(colliderRejection > topContact, "generic collider still rejects visible-top contact first");
});

test("each damage reaction completes before advancing to the next phase", () => {
  const open = { ...createBrutusState(), mode: "stunned-open", timer: 0.5 };
  const hit = updateBrutus(open, { dt: 0, playerAttackHit: true });
  assert.equal(hit.mode, "hit");
  assert.equal(hit.phase, 2);
  assert.equal(updateBrutus(hit, { dt: 0.1 }).mode, "hit");
  assert.equal(updateBrutus(hit, { dt: 1 }).mode, "recover");
});

test("phase three uses its existing faster charge without an auxiliary arena hazard", () => {
  const state = { ...createBrutusState(), hp: 1, phase: 3, mode: "charge" };
  assert.deepEqual(brutusArenaHazards(state), []);
  const moved = moveBrutusInArena(
    { x: 6250, w: 96, facing: -1 },
    state,
    { dt: 0.1, boss: LEVEL_TWO.boss },
  );
  assert.equal(moved.x, 6208);
});

test("the Brutus atlas manifest includes every active and defeat beat", () => {
  assert.deepEqual(Object.keys(BRUTUS_ANIMATIONS), [
    "idle", "sniff", "bark", "charge", "crash", "stunned-open", "hit", "recover",
    "defeat-slide", "defeat-shake", "defeat-exit",
  ]);
  assert.equal(BRUTUS_ANIMATIONS.charge.frames, 4);
  assert.equal(BRUTUS_ANIMATIONS.hit.frames, 3);
});

test("Level 2 authors one hydrant and a hostile-free release boundary", () => {
  assert.equal(LEVEL_TWO.boss.surfaceId, "cul-de-sac");
  assert.equal(LEVEL_TWO.boss.hydrant.id, "brutus-hydrant");
  assert.equal(Object.hasOwn(LEVEL_TWO.boss, "sprinklers"), false);
  assert.equal(LEVEL_TWO.boss.postBossStartX, LEVEL_TWO.boss.arenaEndX);
  assert.deepEqual(LEVEL_TWO.boss.victoryDumpster, {
    x: 7000,
    surfaceId: "victory-street",
    placementType: "ON_SURFACE",
  });
  const lockedCameraRight = LEVEL_TWO.boss.arenaStartX + 960;
  const renderLeftAtExit = LEVEL_TWO.boss.defeatExitX + 96 / 2 - 220 / 2;
  assert.ok(renderLeftAtExit > lockedCameraRight);
  assert.equal(
    LEVEL_TWO.encounters.some(({ enemies, spawnX }) => enemies.length > 0 && spawnX >= LEVEL_TWO.boss.runwayStartX),
    false,
  );
});

test("strict Brutus and Level 2 victory test routes preserve lazy boss loading", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(source, /victoryTest === "level2"/);
  assert.match(source, /const bossRoute = selectBossTestRoute\(bossTest\)/);
  assert.match(source, /nextWorld\.player\.x = bossRoute\.playerX/);
  assert.match(source, /nextWorld\.enemies = \[\]/);
  const eagerStart = source.indexOf("void Promise.all([", source.indexOf("useEffect(() =>"));
  const eagerEnd = source.indexOf("]).then(([", eagerStart);
  assert.doesNotMatch(source.slice(eagerStart, eagerEnd), /brutus-motion\.png/);
  assert.match(source, /finishBrutusDefeat[\s\S]{0,500}world\.dumpsterRevealStartedAt = world\.elapsed/);
});

test("recovery leaves the hydrant boundary before faster phase charges can reconnect", () => {
  const contactX = LEVEL_TWO.boss.hydrant.x + LEVEL_TWO.boss.hydrant.w;
  const recovered = moveBrutusInArena(
    { x: contactX, w: 96, facing: -1 },
    { ...createBrutusState(), hp: 2, phase: 2, mode: "recover" },
    { dt: 0.5, boss: LEVEL_TWO.boss },
  );
  assert.equal(recovered.x, LEVEL_TWO.boss.recoveryX);

  const firstChargeStep = moveBrutusInArena(
    { x: recovered.x, w: 96, facing: -1 },
    { ...createBrutusState(), hp: 2, phase: 2, mode: "charge" },
    { dt: 0.1, boss: LEVEL_TWO.boss },
  );
  assert.equal(firstChargeStep.hydrantHit, false);
  assert.ok(firstChargeStep.x < recovered.x);

  const elapsedToHydrant = (phase) => {
    let actor = { x: phase === 1 ? LEVEL_TWO.boss.spawnX : LEVEL_TWO.boss.recoveryX, w: 96, facing: -1 };
    let elapsed = 0;
    while (elapsed < 2) {
      const moved = moveBrutusInArena(actor, { ...createBrutusState(), phase, mode: "charge" }, {
        dt: 0.1, boss: LEVEL_TWO.boss,
      });
      elapsed = Number((elapsed + 0.1).toFixed(1));
      actor = { ...actor, ...moved };
      if (moved.hydrantHit) return elapsed;
    }
    throw new Error(`phase ${phase} never reached the hydrant`);
  };
  assert.deepEqual([1, 2, 3].map(elapsedToHydrant), [1.1, 1, 0.9]);
});

test("defeat exit clears the locked viewport before the arena unlocks", () => {
  let state = { ...createBrutusState(), hp: 0, phase: 3, mode: "defeat-exit", timer: 0 };
  let actor = { x: 5852, w: 96, facing: -1 };
  for (let step = 0; step < 100 && actor.x < LEVEL_TWO.boss.defeatExitX; step += 1) {
    const moved = moveBrutusInArena(actor, state, { dt: 0.1, boss: LEVEL_TWO.boss });
    actor = { ...actor, ...moved };
    state = updateBrutus(state, { dt: 0.1, exitComplete: moved.exitComplete });
    if (actor.x < LEVEL_TWO.boss.defeatExitX) {
      assert.equal(state.mode, "defeat-exit");
      assert.equal(state.arenaUnlocked, false);
    }
  }
  assert.equal(actor.x, LEVEL_TWO.boss.defeatExitX);
  assert.notEqual(actor.x, 6068);
  assert.equal(state.mode, "complete");
  assert.equal(state.arenaUnlocked, true);
});
