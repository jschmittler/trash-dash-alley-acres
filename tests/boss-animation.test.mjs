import assert from "node:assert/strict";
import test from "node:test";

import {
  BOSS_ANIMATIONS,
  BOSS_SEQUENCE_DURATIONS,
  bossAnimationFrame,
  isBossChargeActive,
  selectBossAnimation,
} from "../app/boss-animation.mjs";
import { brutusAnimation, brutusAnimationFrame, createBrutusState } from "../app/brutus-boss.mjs";
import {
  LEVEL_TWO_ENEMY_ANIMATIONS,
  levelTwoEnemyAnimation,
} from "../app/level-two-enemies.mjs";
import {
  IMPLEMENTED_VISUAL_INVENTORY,
  MEASURED_RUNTIME_DISTORTION_FRAMES,
} from "../app/visual-inventory.mjs";
import { expandedCompositionFootprint } from "../app/visual-contract.mjs";
import {
  LEVEL_ONE_ENEMY_ANIMATIONS,
  levelOneEnemyAnimationFrame,
} from "../app/level-one-enemy-animation.mjs";
import { readFile } from "node:fs/promises";

const base = { defeated: false, hit: false, raging: false, action: "idle", vx: 0 };

test("committed boss states own priority", () => {
  assert.equal(selectBossAnimation({ ...base, defeated: true, hit: true }), "defeat");
  assert.equal(selectBossAnimation({ ...base, hit: true, raging: true }), "hit");
  assert.equal(selectBossAnimation({ ...base, raging: true, action: "charge" }), "rage");
});

test("boss action and locomotion states are explicit", () => {
  for (const action of ["windup", "charge", "recover"]) {
    assert.equal(selectBossAnimation({ ...base, action }), action);
  }
  assert.equal(selectBossAnimation({ ...base, vx: 30 }), "walk");
  assert.equal(selectBossAnimation(base), "idle");
});

test("boss frame timing clamps one-shots and loops locomotion", () => {
  assert.equal(bossAnimationFrame(BOSS_ANIMATIONS.hit, 99), 3);
  assert.equal(bossAnimationFrame(BOSS_ANIMATIONS.walk, 1), 2);
  assert.deepEqual([0, 1, 2, 3].map(isBossChargeActive), [false, true, true, false]);
  assert.deepEqual(BOSS_SEQUENCE_DURATIONS, { windup: 0.52, charge: 0.56, recover: 0.48, hit: 0.5, rage: 0.72, defeat: 0.9 });
});

test("shipped enemy and boss states have bounded table-driven atlas contracts", () => {
  const inventory = new Map(IMPLEMENTED_VISUAL_INVENTORY.map((record) => [record.id, record]));
  const stateContracts = [
    ...["snake", "pigeon", "wasp", "mosquito", "possum", "spider", "fox"].map((kind) => ({
      label: `level-one/${kind}/move`, animation: inventory.get(kind)?.animations.move,
      source: inventory.get(kind)?.sourceRects.move, columns: 4, frame: bossAnimationFrame,
    })),
    ...[
      ["squirrel", "idle"], ["squirrel", "throw-anticipation"], ["squirrel", "throw-release"],
      ["squirrel", "throw-follow-through"], ["squirrel", "throw-recover"], ["squirrel", "hit"], ["squirrel", "defeated"],
      ["terrier", "sleep"], ["terrier", "wake"], ["terrier", "charge"], ["terrier", "impact"],
      ["terrier", "recover"], ["terrier", "hit"], ["terrier", "defeated"], ["skunk", "patrol"], ["skunk", "telegraph"],
      ["skunk", "spray"], ["skunk", "recover"], ["skunk", "hit"], ["skunk", "defeated"], ["moth", "orbit"],
      ["moth", "telegraph"], ["moth", "dive"], ["moth", "climb"], ["moth", "hit"], ["moth", "defeated"],
    ].map(([kind, state]) => ({
      label: `level-two/${kind}/${state}`, animation: levelTwoEnemyAnimation(kind, state), source: null,
      columns: 4, frame: (animation, elapsed) => {
        const raw = Math.floor(Math.max(0, elapsed) * animation.fps);
        return animation.loop ? raw % animation.frames : Math.min(animation.frames - 1, raw);
      },
    })),
    ...Object.entries(BOSS_ANIMATIONS).map(([state, animation]) => ({
      label: `trash-heap-tyrant/${state}`, animation, source: null, columns: 6, frame: bossAnimationFrame,
    })),
    ...[
      "intro", "sniff", "bark", "charge", "stunned-open", "hit", "recover",
      "defeat-slide", "defeat-shake", "defeat-exit", "crash",
    ].map((mode) => ({
      label: `brutus/${mode}`, animation: brutusAnimation({
        ...createBrutusState(), mode: mode === "crash" ? "stunned-open" : mode,
        visualState: mode === "crash" ? "crash" : null, visualTimer: mode === "crash" ? 1 : 0,
      }), source: null,
      columns: 4, frame: brutusAnimationFrame,
    })),
  ];

  for (const { label, animation, source, columns, frame } of stateContracts) {
    assert.ok(animation, `${label} must select an animation`);
    assert.ok(Number.isInteger(animation.row) && animation.row >= 0, `${label} atlas row`);
    assert.ok(Number.isInteger(animation.frames) && animation.frames > 0, `${label} frame count`);
    assert.ok(animation.fps > 0, `${label} local fps`);
    assert.equal(typeof animation.loop, "boolean", `${label} loop policy`);
    assert.ok((animation.startFrame ?? 0) + animation.frames <= columns, `${label} frame bounds`);
    if (source) assert.equal(source.length, animation.frames, `${label} source frame coverage`);
    if (!animation.loop) assert.equal(frame(animation, 99), animation.frames - 1, `${label} must clamp`);
  }

  assert.equal(LEVEL_TWO_ENEMY_ANIMATIONS.squirrel.release.startFrame, 1, "release has one authored event frame");
});

test("VIS-006 state destinations preserve their source-cell aspect ratio", () => {
  assert.deepEqual(
    MEASURED_RUNTIME_DISTORTION_FRAMES.filter(({ issue }) => issue === "VIS-006"),
    [],
    "enemy and boss state destinations must not remain on the distortion allowlist",
  );
});

test("Level 2 semantic recovery and return states select their own compatible rows", () => {
  const expected = [
    ["terrier", "recover", "recover", 9, 0, 4, false],
    ["skunk", "recover", "recover", 13, 3, 1, false],
    ["moth", "climb", "climb", 16, 0, 4, true],
  ];
  for (const [kind, state, key, row, startFrame, frames, loop] of expected) {
    const animation = levelTwoEnemyAnimation(kind, state);
    assert.equal(animation, LEVEL_TWO_ENEMY_ANIMATIONS[kind][key], `${kind}/${state} semantic key`);
    assert.deepEqual(
      { row: animation.row, startFrame: animation.startFrame, frames: animation.frames, loop: animation.loop },
      { row, startFrame, frames, loop },
      `${kind}/${state} exact source selection`,
    );
  }
  assert.throws(() => levelTwoEnemyAnimation("skunk", "unknown"), /unknown.*state/i);
});

test("Level 1 enemy rendering uses declared local animation FPS rather than phase speed", async () => {
  assert.equal(LEVEL_ONE_ENEMY_ANIMATIONS.fox.move.fps, 7);
  assert.equal(levelOneEnemyAnimationFrame("fox", "move", 1 / 7 - 0.001, 3), 3);
  assert.equal(levelOneEnemyAnimationFrame("fox", "move", 1 / 7 + 0.001, 3), 0);
  assert.equal(levelOneEnemyAnimationFrame("fox", "move", 1 / 7 + 0.001, 0), 1);
  const runtime = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(runtime, /levelOneEnemyAnimationFrame\(enemy\.kind, "move", enemy\.stateElapsed, enemy\.animationOffset\)/);
  assert.match(runtime, /enemy\.stateElapsed \+= dt/);
});

test("Trash Heap Tyrant physical footprint equals its destination while composition retains arena reserve", () => {
  const tyrant = IMPLEMENTED_VISUAL_INVENTORY.find(({ id }) => id === "trash-heap-tyrant");
  assert.ok(tyrant);
  const destinations = Object.values(tyrant.runtimeDestinations).flat();
  const maximum = {
    w: Math.max(...destinations.map(({ w }) => w)),
    h: Math.max(...destinations.map(({ h }) => h)),
  };
  assert.deepEqual({ w: tyrant.contract.visualBounds.w, h: tyrant.contract.visualBounds.h }, maximum);
  assert.deepEqual(tyrant.contract.placementFootprint, tyrant.contract.visualBounds);
  assert.deepEqual({ w: tyrant.contract.collisionBounds.w, h: tyrant.contract.collisionBounds.h }, { w: 96, h: 96 });
  assert.deepEqual(expandedCompositionFootprint(tyrant.contract), {
    x: -147, y: -182, w: 294, h: 182,
  });
});
