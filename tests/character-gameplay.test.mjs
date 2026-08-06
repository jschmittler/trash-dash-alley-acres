import test from "node:test";
import assert from "node:assert/strict";
import { getPlayableCharacter, PLAYABLE_CHARACTERS, selectCharacterAnimation } from "../app/playable-character.mjs";
import { JIMOTHY_ANIMATIONS } from "../concepts/jimothy/jimothy-animation.mjs";
import { beginPlayerHurt, resolvePitFall } from "../app/gameplay-animation-state.mjs";

test("selected Jimothy profile survives gameplay state resolution", () => {
  const selected = getPlayableCharacter("jimothy");
  assert.equal(selected.id, "jimothy");
  assert.equal(selected.small.width, 32);
  assert.equal(selected.large.width, 38);
  assert.equal(selected.atlasSrc, "assets/generated/jimothy-hero-motion.png");
  assert.equal(PLAYABLE_CHARACTERS[selected.id], selected);
});

test("Jimothy resolves full-parity movement, glide, attack, hurt, and victory states", () => {
  const jimothy = getPlayableCharacter("jimothy");
  const cases = [
    [{ form: "small", grounded: true, vx: 0 }, "small_idle"],
    [{ form: "small", grounded: true, vx: 280 }, "small_run"],
    [{ form: "large", grounded: false, gliding: true, vy: 60, vx: 80 }, "large_glide"],
    [{ form: "large", grounded: true, attacking: true, vx: 0 }, "large_tail_swipe"],
    [{ form: "large", grounded: true, hurt: true }, "large_hurt"],
    [{ form: "large", grounded: true, victorious: true }, "large_victory"],
  ];
  for (const [input, expected] of cases) assert.equal(selectCharacterAnimation(jimothy, input), expected);
  assert.deepEqual(jimothy.attackFrames, [1, 2]);
  assert.equal(JIMOTHY_ANIMATIONS.large_glide.frames, 4);
});

test("Jimothy damage lifecycle supports shrink, respawn, and pit game over", () => {
  assert.equal(beginPlayerHurt({ large: true, lives: 3, invulnerable: 0, hurtTimer: 0, direction: -1 }).outcome, "shrink");
  assert.equal(beginPlayerHurt({ large: false, lives: 3, invulnerable: 0, hurtTimer: 0, direction: 1 }).outcome, "respawn");
  assert.equal(resolvePitFall(3).outcome, "respawn");
  assert.equal(resolvePitFall(1).outcome, "gameover");
});
