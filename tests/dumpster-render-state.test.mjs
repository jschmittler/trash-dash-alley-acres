import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

import {
  DUMPSTER_CELL,
  DUMPSTER_DRAW_HEIGHT,
  DUMPSTER_DRAW_WIDTH,
  DUMPSTER_REVEAL_DURATION,
  DUMPSTER_SOURCE_VISIBLE_BOUNDS,
  DUMPSTER_STATES,
  DUMPSTER_UNIFORM_SCALE,
  dumpsterCollisionRect,
  dumpsterDrawRect,
  dumpsterFrame,
  dumpsterFrameIndex,
  dumpsterPlacementFootprint,
  dumpsterRevealProgress,
  shouldRenderDumpsterGoal,
  selectDumpsterState,
} from "../app/dumpster-render.mjs";

test("dumpster state selection maps boss defeat to the holy row", () => {
  assert.equal(selectDumpsterState(false), "sealed");
  assert.equal(selectDumpsterState(true), "holy");
  assert.deepEqual(DUMPSTER_STATES.sealed, { row: 0, loop: false });
  assert.deepEqual(DUMPSTER_STATES.holy, { row: 1, loop: true });
});

test("Level 2 keeps the victory dumpster out of the active Brutus arena", () => {
  assert.equal(shouldRenderDumpsterGoal("level-1", false), true);
  assert.equal(shouldRenderDumpsterGoal("level-2", false), false);
  assert.equal(shouldRenderDumpsterGoal("level-2", true), true);
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

test("one visible-alpha-grounded destination rect is shared by both visual states", () => {
  const rect = dumpsterDrawRect(4200, 300, 468);
  const visible = dumpsterPlacementFootprint(4200, 468);
  assert.equal(visible.x, 4200);
  assert.equal(visible.y + visible.h, 468);
  assert.equal(rect.width, DUMPSTER_DRAW_WIDTH);
  assert.equal(rect.height, DUMPSTER_DRAW_HEIGHT);
  assert.equal(DUMPSTER_DRAW_WIDTH / 192, DUMPSTER_UNIFORM_SCALE);
  assert.equal(DUMPSTER_DRAW_HEIGHT / 192, DUMPSTER_UNIFORM_SCALE);
  assert.equal(visible.w, DUMPSTER_SOURCE_VISIBLE_BOUNDS.w * DUMPSTER_UNIFORM_SCALE);
  assert.equal(visible.h, DUMPSTER_SOURCE_VISIBLE_BOUNDS.h * DUMPSTER_UNIFORM_SCALE);
  assert.deepEqual(dumpsterCollisionRect(4200, 468), visible);
});

test("holy reveal progress is eased, clamped, and monotonic", () => {
  assert.equal(dumpsterRevealProgress(-1), 0);
  assert.equal(dumpsterRevealProgress(0), 0);
  assert.ok(dumpsterRevealProgress(DUMPSTER_REVEAL_DURATION * 0.5) > 0.4);
  assert.equal(dumpsterRevealProgress(DUMPSTER_REVEAL_DURATION), 1);
  assert.equal(dumpsterRevealProgress(99), 1);
});

test("canonical visible bounds contain every sealed body and holy glow pixel", async () => {
  const { data, info } = await sharp(fileURLToPath(new URL(
    "../public/assets/generated/dumpster-holy-atlas.png",
    import.meta.url,
  ))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const union = { left: DUMPSTER_CELL, top: DUMPSTER_CELL, right: -1, bottom: -1 };
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      for (let y = 0; y < DUMPSTER_CELL; y += 1) {
        for (let x = 0; x < DUMPSTER_CELL; x += 1) {
          const alpha = data[((row * DUMPSTER_CELL + y) * info.width + column * DUMPSTER_CELL + x) * info.channels + 3];
          if (alpha === 0) continue;
          union.left = Math.min(union.left, x);
          union.top = Math.min(union.top, y);
          union.right = Math.max(union.right, x);
          union.bottom = Math.max(union.bottom, y);
        }
      }
    }
  }
  assert.deepEqual(DUMPSTER_SOURCE_VISIBLE_BOUNDS, {
    x: union.left,
    y: union.top,
    w: union.right - union.left + 1,
    h: union.bottom - union.top + 1,
  });
});
