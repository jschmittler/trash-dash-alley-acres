import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PLAYER_ANIMATIONS } from "../app/player-animation.mjs";

const CELL = 192;

test("canonical hero atlas matches manifest dimensions and transparent margins", async () => {
  const file = fileURLToPath(new URL("../public/assets/generated/player-hero-motion.png", import.meta.url));
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  assert.equal(info.width, CELL * 6);
  assert.equal(info.height, CELL * 22);

  for (const [state, animation] of Object.entries(PLAYER_ANIMATIONS)) {
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
      assert.ok(right >= left && bottom >= top, `${state}:${column} is empty`);
      assert.ok(left > 0 && top > 0 && right < CELL - 1 && bottom < CELL - 1, `${state}:${column} clips a cell edge`);
      assert.equal(bottom, animation.baseline - 1, `${state}:${column} feet drift from the shared baseline`);
    }
  }
});

test("hero contact sheet is generated for visual review", async () => {
  const file = fileURLToPath(new URL("../public/assets/generated/player-hero-contact-sheet.png", import.meta.url));
  const metadata = await sharp(file).metadata();
  assert.ok(metadata.width >= CELL * 6);
  assert.ok(metadata.height >= CELL * 22);
});
