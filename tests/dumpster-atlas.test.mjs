import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const CELL = 192;
const atlasPath = fileURLToPath(new URL("../public/assets/generated/dumpster-animation-atlas.png", import.meta.url));

test("runtime dumpster atlas uses the approved source sheets with stable footprints", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, CELL * 4);
  assert.equal(info.height, CELL * 2);

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      let left = CELL;
      let top = CELL;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < CELL; y += 1) {
        for (let x = 0; x < CELL; x += 1) {
          const pixel = ((row * CELL + y) * info.width + column * CELL + x) * 4;
          if (data[pixel + 3] === 0) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      assert.ok(right >= left && bottom >= top, `empty dumpster frame ${row}:${column}`);
      assert.ok(left > 0 && top > 0 && right < CELL - 1, `clipped dumpster frame ${row}:${column}`);
      assert.equal(bottom + 1, 184, `unstable dumpster baseline ${row}:${column}`);
    }
  }
});
