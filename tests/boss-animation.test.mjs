import assert from "node:assert/strict";
import test from "node:test";

import {
  BOSS_ANIMATIONS,
  BOSS_SEQUENCE_DURATIONS,
  bossAnimationFrame,
  isBossChargeActive,
  selectBossAnimation,
} from "../app/boss-animation.mjs";

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
