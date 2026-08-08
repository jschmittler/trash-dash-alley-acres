import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { BRUTUS_ANIMATIONS } from "../app/brutus-boss.mjs";

const atlasPath = fileURLToPath(new URL("../public/assets/generated/brutus-motion.png", import.meta.url));

test("Brutus atlas uses fixed 256x192 cells and hard limited-color pixels", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1024);
  assert.equal(info.height, 2112);
  const colors = new Set();
  const alphas = new Set();
  for (let offset = 0; offset < data.length; offset += 4) {
    colors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]},${data[offset + 3]}`);
    alphas.add(data[offset + 3]);
  }
  assert.deepEqual([...alphas].sort((a, b) => a - b), [0, 255]);
  assert.ok(colors.size <= 32, `expected at most 32 RGBA colors, found ${colors.size}`);
});

test("every required Brutus frame is populated, clear of cell edges, and baseline locked", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, animation] of Object.entries(BRUTUS_ANIMATIONS)) {
    for (let frame = 0; frame < animation.frames; frame += 1) {
      let left = 256;
      let top = 192;
      let right = -1;
      let bottom = -1;
      let opaque = 0;
      for (let y = 0; y < 192; y += 1) {
        for (let x = 0; x < 256; x += 1) {
          const atlasX = frame * 256 + x;
          const atlasY = animation.row * 192 + y;
          if (data[(atlasY * info.width + atlasX) * 4 + 3] === 0) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
          opaque += 1;
        }
      }
      assert.ok(opaque > 1000, `${name} frame ${frame} is populated`);
      assert.ok(left >= 4 && top >= 4 && right <= 251 && bottom <= 187, `${name} frame ${frame} clears its cell`);
      assert.equal(bottom, 175, `${name} frame ${frame} keeps the authored foot/pool baseline`);
    }
  }
});
