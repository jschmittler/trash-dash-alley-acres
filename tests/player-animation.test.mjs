import assert from "node:assert/strict";
import test from "node:test";
import {
  PLAYER_ANIMATIONS,
  animationFrame,
  isTailSwipeActive,
  selectPlayerAnimation,
} from "../app/player-animation.mjs";

const base = {
  form: "small",
  defeated: false,
  hurt: false,
  shrinking: false,
  victorious: false,
  attacking: false,
  gliding: false,
  grounded: true,
  landing: false,
  skidding: false,
  vx: 0,
  vy: 0,
};

test("priority chooses committed states before locomotion", () => {
  assert.equal(selectPlayerAnimation({ ...base, vx: 320 }), "small_run");
  assert.equal(selectPlayerAnimation({ ...base, vx: 320, hurt: true }), "small_hurt");
  assert.equal(selectPlayerAnimation({ ...base, defeated: true, hurt: true }), "small_defeat");
});

test("power hierarchy gates large-only actions", () => {
  assert.equal(selectPlayerAnimation({ ...base, attacking: true }), "small_idle");
  assert.equal(selectPlayerAnimation({ ...base, form: "large", attacking: true }), "large_tail_swipe");
  assert.equal(selectPlayerAnimation({ ...base, form: "large", grounded: false, gliding: true }), "large_glide");
});

test("air, landing, skid, and victory states follow priority", () => {
  assert.equal(selectPlayerAnimation({ ...base, grounded: false, vy: -20 }), "small_jump");
  assert.equal(selectPlayerAnimation({ ...base, grounded: false, vy: 20 }), "small_fall");
  assert.equal(selectPlayerAnimation({ ...base, landing: true }), "small_land");
  assert.equal(selectPlayerAnimation({ ...base, skidding: true }), "small_skid");
  assert.equal(selectPlayerAnimation({ ...base, victorious: true }), "small_victory");
});

test("tail swipe owns five frames and two active frames", () => {
  assert.equal(PLAYER_ANIMATIONS.large_tail_swipe.frames, 5);
  assert.deepEqual([0, 1, 2, 3, 4].map(isTailSwipeActive), [false, true, true, false, false]);
});

test("one-shot animations clamp and loops wrap", () => {
  assert.equal(animationFrame(PLAYER_ANIMATIONS.large_tail_swipe, 99), 4);
  const walk = PLAYER_ANIMATIONS.small_walk;
  assert.equal(animationFrame(walk, 99), Math.floor(99 * walk.fps) % walk.frames);
});

