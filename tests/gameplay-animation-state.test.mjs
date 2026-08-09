import assert from "node:assert/strict";
import test from "node:test";

import {
  PIT_FALL_DEPTH,
  PLAYER_HURT_DURATION,
  advanceEndSequence,
  advanceHurtTimer,
  beginPitFallTransition,
  beginPlayerHurt,
  nextEnemyIntent,
  presentPitDefeat,
  resolvePitFall,
} from "../app/gameplay-animation-state.mjs";
import { animationFrame } from "../app/player-animation.mjs";
import { getPlayableCharacter, selectCharacterAnimation } from "../app/playable-character.mjs";

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

test("actual pit threshold carries Jimothy through defeat's final frame before gameover", () => {
  const viewportHeight = 540;
  const jimothy = getPlayableCharacter("jimothy");
  const transition = beginPitFallTransition({
    playerY: viewportHeight + PIT_FALL_DEPTH + 1,
    viewportHeight,
    lives: 1,
    defeatAnimation: jimothy.animations.small_defeat,
  });

  assert.deepEqual(transition, {
    lives: 0,
    outcome: "gameover",
    respawn: false,
    checkpoint: "preserve",
    animationName: "small_defeat",
    duration: 4 / 6,
    player: {
      large: false,
      hurtTimer: 0,
      pendingDamage: null,
      attackTimer: 0,
      glider: 0,
      shrinkTimer: 0,
      endSequence: "gameover",
      endTimer: 4 / 6,
      animationName: "small_defeat",
      animationElapsed: 0,
      vx: 0,
      vy: 0,
      grounded: true,
    },
  });
  assert.equal(selectCharacterAnimation(jimothy, {
    form: "small", defeated: transition.player.endSequence === "gameover", grounded: true, vx: 0,
  }), "small_defeat");

  const held = advanceEndSequence({
    sequence: transition.player.endSequence,
    timer: transition.duration,
    dt: transition.duration - 1 / 120,
  });
  assert.equal(held.completedScreen, null);
  assert.equal(held.sequence, "gameover");
  assert.equal(animationFrame(jimothy.animations.small_defeat, transition.duration - held.timer), 3);
  assert.deepEqual(advanceEndSequence({ sequence: held.sequence, timer: held.timer, dt: held.timer }), {
    sequence: null,
    timer: 0,
    completedScreen: "gameover",
  });
});

test("a non-terminal threshold crossing respawns and never queues defeat", () => {
  const transition = beginPitFallTransition({
    playerY: 661,
    viewportHeight: 540,
    lives: 3,
    defeatAnimation: getPlayableCharacter("raccoon").animations.small_defeat,
  });
  assert.deepEqual(transition, {
    lives: 2,
    outcome: "respawn",
    respawn: true,
    checkpoint: "preserve",
    animationName: null,
    duration: 0,
    player: {
      large: false,
      hurtTimer: 0,
      pendingDamage: null,
      attackTimer: 0,
      glider: 0,
      shrinkTimer: 0,
      endSequence: null,
      endTimer: 0,
      animationName: null,
      animationElapsed: 0,
      vx: 0,
      vy: 0,
      grounded: true,
    },
  });
  assert.equal(beginPitFallTransition({
    playerY: 660,
    viewportHeight: 540,
    lives: 1,
    defeatAnimation: getPlayableCharacter("raccoon").animations.small_defeat,
  }), null);
});
