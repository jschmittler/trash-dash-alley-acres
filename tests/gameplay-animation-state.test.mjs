import assert from "node:assert/strict";
import test from "node:test";

import {
  bossAnimationState,
  bossFrameIndex,
  nextEnemyIntent,
} from "../app/gameplay-animation-state.mjs";

test("possum preserves facing inside the chase dead zone", () => {
  assert.deepEqual(nextEnemyIntent({
    kind: "possum",
    enemyX: 100,
    originX: 100,
    playerX: 110,
    vx: -105,
    facing: -1,
  }), { vx: -105, facing: -1 });
});

test("possum faces a target outside the dead zone", () => {
  assert.deepEqual(nextEnemyIntent({
    kind: "possum",
    enemyX: 100,
    originX: 100,
    playerX: 140,
    vx: -105,
    facing: -1,
  }), { vx: 105, facing: 1 });
});

test("zero velocity preserves explicit facing", () => {
  assert.deepEqual(nextEnemyIntent({
    kind: "slime",
    enemyX: 100,
    originX: 100,
    playerX: 500,
    vx: 0,
    facing: -1,
  }), { vx: 0, facing: -1 });
});

test("boss walk ping-pongs and hit cooldown owns its state", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(bossFrameIndex), [0, 1, 2, 3, 2, 1]);
  assert.equal(bossAnimationState(0.4), "hit");
  assert.equal(bossAnimationState(0), "walking");
});
