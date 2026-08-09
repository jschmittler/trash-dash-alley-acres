import assert from "node:assert/strict";
import test from "node:test";

import {
  PLAYER_HURT_DURATION,
  advanceHurtTimer,
  beginPlayerHurt,
  nextEnemyIntent,
  presentPitDefeat,
  resolvePitFall,
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

test("ordinary large damage queues shrink without applying it", () => {
  assert.deepEqual(beginPlayerHurt({
    large: true,
    lives: 3,
    invulnerable: 0,
    hurtTimer: 0,
    direction: -1,
  }), {
    timer: PLAYER_HURT_DURATION,
    outcome: "shrink",
    vx: -190,
    vy: -280,
  });
});

test("small damage queues respawn or game over", () => {
  assert.equal(beginPlayerHurt({
    large: false,
    lives: 3,
    invulnerable: 0,
    hurtTimer: 0,
    direction: 1,
  }).outcome, "respawn");
  assert.equal(beginPlayerHurt({
    large: false,
    lives: 1,
    invulnerable: 0,
    hurtTimer: 0,
    direction: 1,
  }).outcome, "gameover");
});

test("hurt and invulnerability block repeat damage", () => {
  assert.equal(beginPlayerHurt({
    large: false,
    lives: 3,
    invulnerable: 0,
    hurtTimer: 0.2,
    direction: 1,
  }), null);
  assert.equal(beginPlayerHurt({
    large: false,
    lives: 3,
    invulnerable: 0.2,
    hurtTimer: 0,
    direction: 1,
  }), null);
});

test("hurt resolves only after its timer completes", () => {
  assert.deepEqual(advanceHurtTimer(0.05, 0.1), { timer: 0, complete: true });
  assert.equal(advanceHurtTimer(PLAYER_HURT_DURATION, 0.1).complete, false);
});

test("pit fall consumes exactly one paw immediately", () => {
  assert.deepEqual(resolvePitFall(3), { lives: 2, outcome: "respawn" });
  assert.deepEqual(resolvePitFall(1), { lives: 0, outcome: "gameover" });
  assert.deepEqual(resolvePitFall(0), { lives: 0, outcome: "gameover" });
});

test("terminal pit fall preserves instant death but commits small_defeat before gameover", () => {
  assert.deepEqual(presentPitDefeat({
    pit: resolvePitFall(1),
    defeatAnimation: { frames: 4, fps: 6 },
  }), {
    lives: 0,
    outcome: "gameover",
    animationName: "small_defeat",
    duration: 4 / 6,
  });
});

test("non-terminal pit fall does not queue a defeat presentation", () => {
  assert.deepEqual(presentPitDefeat({
    pit: resolvePitFall(3),
    defeatAnimation: { frames: 4, fps: 6 },
  }), {
    lives: 2,
    outcome: "respawn",
    animationName: null,
    duration: 0,
  });
});
