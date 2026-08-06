import assert from "node:assert/strict";
import test from "node:test";

import {
  DUMPSTER_DRAW_HEIGHT,
  DUMPSTER_DRAW_WIDTH,
  dumpsterDrawRect,
  dumpsterFrameIndex,
} from "../app/dumpster-render.mjs";

test("dumpster rests on the ground with an explicit non-square footprint", () => {
  const rect = dumpsterDrawRect(4200, 300, 468);
  assert.equal(rect.x, 3900);
  assert.equal(rect.y + rect.height, 468);
  assert.equal(rect.width, DUMPSTER_DRAW_WIDTH);
  assert.equal(rect.height, DUMPSTER_DRAW_HEIGHT);
  assert.notEqual(rect.width, rect.height);
});

test("dumpster idle stays static and stink animation is restrained", () => {
  assert.equal(dumpsterFrameIndex(999), 0);
  assert.equal(dumpsterFrameIndex(0.49, true), 0);
  assert.equal(dumpsterFrameIndex(0.51, true), 1);
  assert.equal(dumpsterFrameIndex(1.99, true), 3);
  assert.equal(dumpsterFrameIndex(2.01, true), 0);
});
