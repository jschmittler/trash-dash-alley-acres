import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { DECORATIVE_PROPS, platformStrips } from "../concepts/decorative/decorative-manifest.mjs";

const CELL = 256;
const atlasPath = fileURLToPath(new URL("../public/assets/generated/decorative-atlas.png", import.meta.url));

async function readPng(path) {
  return sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function bounds(data, width, row, column) {
  let left = CELL, top = CELL, right = -1, bottom = -1;
  for (let y = 0; y < CELL; y += 1) for (let x = 0; x < CELL; x += 1) {
    const offset = ((row * CELL + y) * width + column * CELL + x) * 4;
    if (data[offset + 3] === 0) continue;
    left = Math.min(left, x); top = Math.min(top, y);
    right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  return { left, top, right, bottom };
}

test("decorative atlas is a grounded 3x2 RGBA sheet", async () => {
  const { data, info } = await readPng(atlasPath);
  assert.equal(info.width, CELL * 3);
  assert.equal(info.height, CELL * 2);
  for (let row = 0; row < 2; row += 1) for (let column = 0; column < 3; column += 1) {
    const frame = bounds(data, info.width, row, column);
    assert.ok(frame.right >= frame.left && frame.bottom >= frame.top, `empty frame ${row}:${column}`);
    assert.ok(frame.left > 0 && frame.right < CELL - 1, `horizontal clipping ${row}:${column}`);
    assert.ok(frame.top > 0 && frame.bottom < CELL - 1, `vertical clipping ${row}:${column}`);
  }
});

test("every prop has explicit stable baseline and visible dimensions", async () => {
  const { data, info } = await readPng(atlasPath);
  for (const [name, meta] of Object.entries(DECORATIVE_PROPS)) {
    assert.equal(meta.frame.width, CELL);
    assert.ok(meta.sourceWidth > 0 && meta.sourceHeight > 0, `${name} dimensions`);
    assert.ok(meta.baseline > 0 && meta.baseline < CELL, `${name} baseline`);
    const frame = bounds(data, info.width, meta.frame.row, meta.frame.column);
    assert.equal(frame.bottom + 1, meta.baseline, `${name} baseline mismatch`);
    assert.ok(meta.shadowOffset >= 0 && meta.shadowOffset < 32, `${name} shadow offset`);
  }
});

test("branch and metal strips expose contiguous scalable segments", async () => {
  for (const [name, strip] of Object.entries(platformStrips)) {
    assert.ok(strip.height > 0);
    assert.equal(strip.left.x, 0);
    assert.equal(strip.left.x + strip.left.width, strip.middle.x);
    assert.equal(strip.middle.x + strip.middle.width, strip.right.x);
    assert.ok(strip.left.width > 0 && strip.middle.width > 0 && strip.right.width > 0, `${name} segment widths`);
    const path = fileURLToPath(new URL(`../public/assets/generated/${name}-platform-strip.png`, import.meta.url));
    const { info } = await readPng(path);
    assert.equal(info.height, strip.height);
    assert.equal(info.width, strip.right.x + strip.right.width);
  }
});
