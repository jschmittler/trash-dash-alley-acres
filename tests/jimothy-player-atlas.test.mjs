import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { JIMOTHY_ANIMATIONS, JIMOTHY_ANIMATION_BASELINES } from "../concepts/jimothy/jimothy-animation.mjs";

const CELL = 192;
const atlasPath = fileURLToPath(new URL("../public/assets/generated/jimothy-hero-motion.png", import.meta.url));

test("Jimothy production atlas has the six-column, 22-row contract", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, CELL * 6);
  assert.equal(info.height, CELL * 22);

  for (const [name, animation] of Object.entries(JIMOTHY_ANIMATIONS)) {
    assert.equal(typeof JIMOTHY_ANIMATION_BASELINES[name], "number", `${name} missing baseline metadata`);
    assert.equal(
      animation.offsetY,
      Math.round(animation.drawHeight - (animation.baseline * animation.drawHeight) / CELL),
      `${name} baseline compensation drifted`,
    );
    for (let column = 0; column < animation.frames; column += 1) {
      let left = CELL;
      let top = CELL;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < CELL; y += 1) {
        for (let x = 0; x < CELL; x += 1) {
          const pixel = ((animation.row * CELL + y) * info.width + column * CELL + x) * 4;
          if (data[pixel + 3] === 0) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      assert.ok(right >= left && bottom >= top, `${name}:${column} is empty`);
      assert.ok(left > 0 && top > 0 && right < CELL - 1 && bottom < CELL - 1, `${name}:${column} clips a cell edge`);
      assert.equal(bottom, animation.baseline - 1, `${name}:${column} feet drift from the shared baseline`);
    }
  }
});

test("Jimothy selection preview is a transparent single frame", async () => {
  const metadata = await sharp(fileURLToPath(new URL("../public/assets/generated/jimothy-selection.png", import.meta.url))).metadata();
  assert.equal(metadata.width, CELL);
  assert.equal(metadata.height, CELL);
  assert.equal(metadata.channels, 4);
});

test("Jimothy contact sheet is available for visual review", async () => {
  const metadata = await sharp(fileURLToPath(new URL("../public/assets/generated/jimothy-hero-contact-sheet.png", import.meta.url))).metadata();
  assert.ok(metadata.width >= CELL * 6);
  assert.ok(metadata.height >= CELL * 22);
});
