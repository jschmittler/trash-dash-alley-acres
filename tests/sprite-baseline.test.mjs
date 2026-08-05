import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const CELL = 192;
const GROUND_ROWS = [4, 5, 6, 7, 8, 10, 11];

test("generated ground enemies share the eight-pixel foot baseline", async () => {
  const { data, info } = await sharp(
    fileURLToPath(new URL("../public/assets/generated/enemy-variety-motion.png", import.meta.url)),
  ).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  assert.equal(info.width, CELL * 4);
  assert.equal(info.height, CELL * 12);

  for (const row of GROUND_ROWS) {
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

      assert.ok(right >= left && bottom >= top, `empty frame ${row}:${column}`);
      assert.equal(bottom + 1, CELL - 8, `bad baseline ${row}:${column}`);
      assert.ok(left > 0 && top > 0 && right < CELL - 1, `clipped frame ${row}:${column}`);
    }
  }
});
