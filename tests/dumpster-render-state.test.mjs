import assert from "node:assert/strict";
import test from "node:test";

import {
  DUMPSTER_DRAW_HEIGHT,
  DUMPSTER_DRAW_WIDTH,
  DUMPSTER_REVEAL_DURATION,
  DUMPSTER_STATES,
  dumpsterDrawRect,
  dumpsterFrame,
  dumpsterFrameIndex,
  dumpsterRevealProgress,
  selectDumpsterState,
} from "../app/dumpster-render.mjs";

test("dumpster state selection maps boss defeat to the holy row", () => {
  assert.equal(selectDumpsterState(false), "sealed");
  assert.equal(selectDumpsterState(true), "holy");
  assert.deepEqual(DUMPSTER_STATES.sealed, { row: 0, loop: false });
  assert.deepEqual(DUMPSTER_STATES.holy, { row: 1, loop: true });
});

test("sealed dumpster is static while holy effects loop slowly", () => {
  assert.equal(dumpsterFrameIndex(0, "sealed"), 0);
  assert.equal(dumpsterFrameIndex(999, "sealed"), 0);
  assert.equal(dumpsterFrameIndex(0.79, "holy"), 0);
  assert.equal(dumpsterFrameIndex(0.81, "holy"), 1);
  assert.equal(dumpsterFrameIndex(2.41, "holy"), 3);
  assert.equal(dumpsterFrameIndex(3.21, "holy"), 0);
  assert.deepEqual(dumpsterFrame("sealed", 30).source, [0, 0, 192, 192]);
  assert.deepEqual(dumpsterFrame("holy", 1).source, [192, 192, 192, 192]);
});

test("one grounded destination rect is shared by both visual states", () => {
  const rect = dumpsterDrawRect(4200, 300, 468);
  assert.equal(rect.x, 3900);
  assert.equal(rect.y + rect.height, 468);
  assert.equal(rect.width, DUMPSTER_DRAW_WIDTH);
  assert.equal(rect.height, DUMPSTER_DRAW_HEIGHT);
  assert.equal(rect.width, rect.height);
});

test("holy reveal progress is eased, clamped, and monotonic", () => {
  assert.equal(dumpsterRevealProgress(-1), 0);
  assert.equal(dumpsterRevealProgress(0), 0);
  assert.ok(dumpsterRevealProgress(DUMPSTER_REVEAL_DURATION * 0.5) > 0.4);
  assert.equal(dumpsterRevealProgress(DUMPSTER_REVEAL_DURATION), 1);
  assert.equal(dumpsterRevealProgress(99), 1);
});
