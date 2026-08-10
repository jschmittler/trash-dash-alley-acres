import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PLAYER_ATLAS,
  PLAYER_ANIMATIONS,
  PLAYER_FORM_STATES,
  animationFrame,
  isTailSwipeActive,
  playerAnimationDrawRect,
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

test("every canonical player profile uses one runtime destination size per form", () => {
  for (const profile of Object.values(PLAYABLE_CHARACTERS)) {
    for (const [form, canonicalSize] of [["small", 84], ["large", 110]]) {
      for (const state of PLAYER_FORM_STATES[form]) {
        const animation = profile.animations[`${form}_${state}`];
        assert.deepEqual(
          [animation.drawWidth, animation.drawHeight],
          [canonicalSize, canonicalSize],
          `${profile.id}:${form}_${state}`,
        );
      }
    }
  }
});

test("pre-victory and victory use the same bottom-center destination and collision contract", () => {
  const actor = { x: 320, y: 180, w: 38, h: 58 };
  for (const [form, canonicalSize] of [["small", 84], ["large", 110]]) {
    const profile = PLAYABLE_CHARACTERS.jimothy;
    const idle = profile.animations[`${form}_idle`];
    const victory = profile.animations[`${form}_victory`];
    const idleRect = playerAnimationDrawRect(actor, idle);
    const victoryRect = playerAnimationDrawRect(actor, victory);

    assert.deepEqual(victoryRect, idleRect, `${form} victory destination must not apply a runtime scale exception`);
    assert.deepEqual([victoryRect.w, victoryRect.h], [canonicalSize, canonicalSize]);
    assert.deepEqual(victoryRect.anchor, {
      x: actor.x + actor.w / 2,
      y: actor.y + actor.h,
      kind: "BOTTOM_CENTER",
    });
    assert.deepEqual(profile[form].hitbox, form === "small"
      ? { x: 4, y: 3, w: 24, h: 43 }
      : { x: 4, y: 4, w: 30, h: 54 }, `${form} collision must remain state-independent`);
  }
});

test("the runtime player renderer has no victory scale exception", async () => {
  const runtimeSource = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(runtimeSource, /playerAnimationDrawRect\(player, playerAnimation\)/);
  assert.match(runtimeSource, /playerDrawRect\.w,\s*playerDrawRect\.h,/);
  assert.match(runtimeSource, /get\("victoryTransitionTest"\) === "jimothy"/);
  assert.doesNotMatch(
    runtimeSource,
    /victor(?:y|ious)[^\n]*(?:drawWidth|drawHeight|drawW|drawH|scale|multiplier)/i,
    "victory must never acquire a renderer-side scale multiplier or destination override",
  );
});
