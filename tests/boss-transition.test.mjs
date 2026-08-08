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

test("boss camera is monotonic even when retargeted behind the runway", () => {
  const start = createBossTransition(5000);
  const first = advanceBossTransition(start, 0.6, 5640);
  const second = advanceBossTransition(first.transition, 0.2, 4200);
  const finish = advanceBossTransition(second.transition, 2, 4200);

  assert.ok(second.cameraX >= first.cameraX);
  assert.ok(finish.cameraX >= second.cameraX);
  assert.equal(finish.cameraX, 5640);
});

test("transition completion always lands exactly on the forward destination", () => {
  const result = advanceBossTransition(createBossTransition(5000), 99, 5640);
  assert.equal(result.complete, true);
  assert.equal(result.cameraX, 5640);
});

test("transition derives its target from active boss metadata", () => {
  const boss = { triggerX: 5750, arenaStartX: 5700, arenaEndX: 6550 };
  const start = createBossTransition(5300, boss);
  const result = advanceBossTransition(start, BOSS_TRANSITION_DURATION, boss);
  assert.equal(result.cameraX, 5700);
  assert.equal(result.complete, true);
});
