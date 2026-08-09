import assert from "node:assert/strict";
import test from "node:test";
import {
  PLAYER_ATLAS,
  PLAYER_ANIMATIONS,
  PLAYER_FORM_STATES,
  animationFrame,
  isTailSwipeActive,
  selectPlayerAnimation,
} from "../app/player-animation.mjs";
import { PLAYABLE_CHARACTERS } from "../app/playable-character.mjs";

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

test("every reachable player state has an in-bounds atlas row, local completion, and a feet-registered envelope", () => {
  for (const profile of Object.values(PLAYABLE_CHARACTERS)) {
    const bounds = [];
    for (const form of ["small", "large"]) {
      for (const state of PLAYER_FORM_STATES[form]) {
        const name = `${form}_${state}`;
        const animation = profile.animations[name];
        assert.ok(animation, `${profile.id} missing ${name}`);
        assert.ok(animation.frames > 0 && animation.frames <= PLAYER_ATLAS.columns, `${profile.id}:${name} frame count`);
        assert.ok(animation.row >= 0 && animation.row < PLAYER_ATLAS.rows, `${profile.id}:${name} atlas row`);
        assert.ok(animation.drawWidth > 0 && animation.drawHeight > 0, `${profile.id}:${name} draw dimensions`);
        assert.ok(Number.isFinite(animation.offsetY), `${profile.id}:${name} vertical offset`);
        assert.ok(Number.isFinite(animation.baseline), `${profile.id}:${name} source baseline`);
        assert.equal(animationFrame(animation, 999), animation.loop
          ? Math.floor(999 * animation.fps) % animation.frames
          : animation.frames - 1, `${profile.id}:${name} local completion`);
        bounds.push({
          x: -animation.drawWidth / 2,
          y: -animation.drawHeight + animation.offsetY,
          w: animation.drawWidth,
          h: animation.drawHeight - animation.offsetY,
        });
      }
    }
    const envelope = profile.animationEnvelope;
    assert.ok(envelope, `${profile.id} missing maximum animation envelope`);
    for (const bound of bounds) {
      assert.ok(bound.x >= envelope.x && bound.y >= envelope.y, `${profile.id} envelope start`);
      assert.ok(bound.x + bound.w <= envelope.x + envelope.w && bound.y + bound.h <= envelope.y + envelope.h, `${profile.id} envelope end`);
    }
    assert.deepEqual(profile.facing, { authored: "right", flipAnchor: "destination-center" }, `${profile.id} facing anchor`);
  }
});
