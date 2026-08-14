import assert from "node:assert/strict";
import test from "node:test";

import { LEVEL_ONE } from "../app/level-one.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import {
  levelBackgroundAssetEntries,
  levelBackgroundBlendAt,
  levelBackgroundPlateContract,
  PARALLAX_SPEEDS,
} from "../app/level-background.mjs";

test("background transition crosses each boundary once without resetting", () => {
  const boundary = LEVEL_ONE.zones[0].endX;
  const samples = [-220, -110, -1, 0, 1, 110, 220].map((offset) => (
    levelBackgroundBlendAt(boundary + offset, LEVEL_ONE.zones).blend
  ));
  assert.deepEqual(samples.map((value) => Number(value.toFixed(3))), [0, 0.156, 0.497, 0.5, 0.503, 0.844, 1]);
  for (let index = 1; index < samples.length; index += 1) {
    assert.ok(samples[index] >= samples[index - 1], `blend reset at sample ${index}`);
  }
});

test("far, middle and close layers have visibly distinct parallax speeds", () => {
  assert.ok(PARALLAX_SPEEDS.far < PARALLAX_SPEEDS.middle);
  assert.ok(PARALLAX_SPEEDS.middle < PARALLAX_SPEEDS.close);
  assert.ok(PARALLAX_SPEEDS.close / PARALLAX_SPEEDS.far > 5);
});

test("background asset entries are scoped to only the selected active level", () => {
  const levelOne = levelBackgroundAssetEntries(LEVEL_ONE);
  const levelTwo = levelBackgroundAssetEntries(LEVEL_TWO);
  assert.equal(levelOne.length, 15);
  assert.equal(levelTwo.length, 15);
  assert.equal(levelOne.every(({ source }) => source.includes("/level1-")), true);
  assert.equal(levelTwo.every(({ source }) => source.includes("/level2-")), true);
  assert.equal(levelOne.some(({ source }) => source.includes("/level2-")), false);
  assert.equal(levelTwo.some(({ source }) => source.includes("/level1-")), false);
});

test("background plate contracts preserve v2 geometry for Levels 1 and 2", () => {
  assert.deepEqual(levelBackgroundPlateContract(LEVEL_ONE), { width: 1320, height: 540, drawY: 0 });
  assert.deepEqual(levelBackgroundPlateContract(LEVEL_TWO), { width: 1320, height: 540, drawY: 0 });
});
