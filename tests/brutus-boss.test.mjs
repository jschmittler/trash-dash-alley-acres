import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BRUTUS_ANIMATIONS,
  brutusArenaHazards,
  createBrutusState,
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
  assert.equal(updateBrutus(state, { dt: 1.5 }).arenaUnlocked, true);
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

test("each damage reaction completes before advancing to the next phase", () => {
  const open = { ...createBrutusState(), mode: "stunned-open", timer: 0.5 };
  const hit = updateBrutus(open, { dt: 0, playerAttackHit: true });
  assert.equal(hit.mode, "hit");
  assert.equal(hit.phase, 2);
  assert.equal(updateBrutus(hit, { dt: 0.1 }).mode, "hit");
  assert.equal(updateBrutus(hit, { dt: 1 }).mode, "recover");
});

test("phase three exposes exactly one alternating sprinkler stream", () => {
  const left = { ...createBrutusState(), hp: 1, phase: 3, sprinklerSide: "left", sprinklerTimer: 0.01 };
  const leftHazards = brutusArenaHazards(left).filter(({ kind }) => kind === "sprinkler");
  assert.deepEqual(leftHazards.map(({ side }) => side), ["left"]);
  const right = updateBrutus(left, { dt: 0.02 });
  assert.equal(right.sprinklerSide, "right");
  assert.deepEqual(
    brutusArenaHazards(right).filter(({ kind }) => kind === "sprinkler").map(({ side }) => side),
    ["right"],
  );
});

test("the Brutus atlas manifest includes every active and defeat beat", () => {
  assert.deepEqual(Object.keys(BRUTUS_ANIMATIONS), [
    "idle", "sniff", "bark", "charge", "crash", "stunned-open", "hit", "recover",
    "defeat-slide", "defeat-shake", "defeat-exit",
  ]);
  assert.equal(BRUTUS_ANIMATIONS.charge.frames, 4);
  assert.equal(BRUTUS_ANIMATIONS.hit.frames, 3);
});

test("Level 2 authors the hydrant, alternating sprinklers, and hostile-free release boundary", () => {
  assert.equal(LEVEL_TWO.boss.surfaceId, "cul-de-sac");
  assert.equal(LEVEL_TWO.boss.hydrant.id, "brutus-hydrant");
  assert.deepEqual(LEVEL_TWO.boss.sprinklers.map(({ side }) => side), ["left", "right"]);
  assert.equal(LEVEL_TWO.boss.postBossStartX, LEVEL_TWO.boss.arenaEndX);
  assert.equal(
    LEVEL_TWO.encounters.some(({ enemies, spawnX }) => enemies.length > 0 && spawnX >= LEVEL_TWO.boss.runwayStartX),
    false,
  );
});

test("strict Brutus and Level 2 victory test routes preserve lazy boss loading", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(source, /bossTest === "brutus"/);
  assert.match(source, /victoryTest === "level2"/);
  assert.match(source, /nextWorld\.player\.x = bossTest === "brutus" \? 5650 : 5690/);
  assert.match(source, /nextWorld\.enemies = \[\]/);
  const eagerStart = source.indexOf("void Promise.all([", source.indexOf("useEffect(() =>"));
  const eagerEnd = source.indexOf("]).then(([", eagerStart);
  assert.doesNotMatch(source.slice(eagerStart, eagerEnd), /brutus-motion\.png/);
});
