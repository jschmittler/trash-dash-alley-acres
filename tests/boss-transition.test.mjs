import assert from "node:assert/strict";
import test from "node:test";

import {
  BOSS_TRANSITION_DURATION,
  advanceBossTransition,
  createBossTransition,
} from "../app/boss-transition.mjs";

test("boss transition eases from the current camera into the arena", () => {
  const start = createBossTransition(5000);
  const first = advanceBossTransition(start, 0.15, 5640);
  const finish = advanceBossTransition(first.transition, BOSS_TRANSITION_DURATION, 5640);

  assert.ok(first.cameraX > 5000 && first.cameraX < 5640);
  assert.equal(finish.cameraX, 5640);
  assert.equal(finish.complete, true);
});

test("boss transition never advances backwards in time", () => {
  const start = createBossTransition(5000);
  const result = advanceBossTransition(start, -1, 5640);
  assert.equal(result.transition.elapsed, 0);
  assert.equal(result.cameraX, 5000);
});
