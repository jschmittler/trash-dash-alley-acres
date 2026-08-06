import assert from "node:assert/strict";
import test from "node:test";
import {
  getPlayableCharacter,
  PLAYABLE_CHARACTERS,
  selectCharacterAnimation,
} from "../app/playable-character.mjs";

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

test("registry exposes raccoon and Jimothy with complete profile metadata", () => {
  assert.deepEqual(Object.keys(PLAYABLE_CHARACTERS).sort(), ["jimothy", "raccoon"]);
  for (const profile of Object.values(PLAYABLE_CHARACTERS)) {
    assert.ok(profile.atlasSrc.endsWith("-hero-motion.png"));
    assert.ok(profile.selectionPortraitSrc.endsWith("-selection-portrait.png"));
    assert.ok(profile.small.width < profile.large.width);
    assert.ok(profile.small.height < profile.large.height);
    assert.ok(profile.small.hitbox.w > 0 && profile.large.hitbox.h > 0);
    assert.ok(profile.attackFrames.includes(1));
    assert.ok(profile.animations.small_idle);
    assert.ok(profile.animations.large_victory);
  }
});

test("unknown character ids safely fall back to the raccoon", () => {
  assert.equal(getPlayableCharacter("missing").id, "raccoon");
  assert.equal(getPlayableCharacter().id, "raccoon");
});

test("profile-aware routing covers movement, action, power and lifecycle states", () => {
  assert.equal(selectCharacterAnimation("jimothy", { ...base, vx: 320 }), "small_run");
  assert.equal(selectCharacterAnimation("jimothy", { ...base, grounded: false, vy: -30 }), "small_jump");
  assert.equal(selectCharacterAnimation("jimothy", { ...base, form: "large", attacking: true }), "large_tail_swipe");
  assert.equal(selectCharacterAnimation("jimothy", { ...base, form: "large", grounded: false, gliding: true }), "large_glide");
  assert.equal(selectCharacterAnimation("jimothy", { ...base, form: "large", hurt: true }), "large_hurt");
  assert.equal(selectCharacterAnimation("jimothy", { ...base, form: "large", shrinking: true }), "large_shrink");
  assert.equal(selectCharacterAnimation("jimothy", { ...base, victorious: true }), "small_victory");
  assert.equal(selectCharacterAnimation("jimothy", { ...base, defeated: true }), "small_defeat");
});
