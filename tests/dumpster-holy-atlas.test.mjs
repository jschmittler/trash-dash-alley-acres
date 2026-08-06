import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const CELL = 192;
const atlasPath = fileURLToPath(new URL("../public/assets/generated/dumpster-holy-atlas.png", import.meta.url));

async function readAtlas() {
  return sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function bounds(data, width, row, column) {
  let left = CELL;
  let top = CELL;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < CELL; y += 1) {
    for (let x = 0; x < CELL; x += 1) {
      const offset = ((row * CELL + y) * width + column * CELL + x) * 4;
      if (data[offset + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return { left, top, right, bottom };
}

test("holy dumpster atlas is a grounded 4x2 RGBA sheet", async () => {
  const { data, info } = await readAtlas();
  assert.equal(info.width, CELL * 4);
  assert.equal(info.height, CELL * 2);

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const frame = bounds(data, info.width, row, column);
      assert.ok(frame.right >= frame.left && frame.bottom >= frame.top, `empty frame ${row}:${column}`);
      assert.ok(frame.left > 0 && frame.right < CELL - 1, `horizontal clipping ${row}:${column}`);
      assert.ok(frame.top > 0 && frame.bottom < CELL, `vertical clipping ${row}:${column}`);
      assert.equal(frame.bottom + 1, 184, `unstable ground baseline ${row}:${column}`);
    }
  }
});

test("sealed and holy rows share the same body footprint", async () => {
  const { data, info } = await readAtlas();
  const sealed = Array.from({ length: 4 }, (_, column) => bounds(data, info.width, 0, column));
  const holy = Array.from({ length: 4 }, (_, column) => bounds(data, info.width, 1, column));

  // Aura pixels may widen the silhouette by a few pixels, but the dumpster
  // body itself must stay centered and grounded in every animation frame.
  for (let column = 0; column < 4; column += 1) {
    assert.ok(Math.abs((sealed[column].left + sealed[column].right) - (holy[column].left + holy[column].right)) <= 10);
    assert.equal(sealed[column].bottom, holy[column].bottom);
  }
});

test("holy reveal effects never extend below the sealed contact line", async () => {
  const { data, info } = await readAtlas();
  for (let column = 0; column < 4; column += 1) {
    const sealed = bounds(data, info.width, 0, column);
    const holy = bounds(data, info.width, 1, column);
    assert.ok(holy.bottom <= sealed.bottom, `holy effect extends below ground in frame ${column}`);
  }
});
