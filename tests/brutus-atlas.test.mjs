import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { BRUTUS_ANIMATIONS } from "../app/brutus-boss.mjs";

const atlasPath = fileURLToPath(new URL("../public/assets/generated/brutus-motion.png", import.meta.url));

const frameComponents = (data, info, row, frame) => {
  const seen = new Uint8Array(256 * 192);
  const components = [];
  for (let y = 0; y < 192; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const start = y * 256 + x;
      const atlasOffset = ((row * 192 + y) * info.width + frame * 256 + x) * 4;
      if (seen[start] || data[atlasOffset + 3] === 0) continue;
      const stack = [start];
      seen[start] = 1;
      let area = 0;
      let left = 256;
      let top = 192;
      let right = -1;
      let bottom = -1;
      let red = 0;
      let green = 0;
      let blue = 0;
      while (stack.length) {
        const point = stack.pop();
        const px = point % 256;
        const py = (point - px) / 256;
        const offset = ((row * 192 + py) * info.width + frame * 256 + px) * 4;
        area += 1;
        left = Math.min(left, px);
        top = Math.min(top, py);
        right = Math.max(right, px);
        bottom = Math.max(bottom, py);
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = px + dx;
            const ny = py + dy;
            const next = ny * 256 + nx;
            if (nx < 0 || nx >= 256 || ny < 0 || ny >= 192 || seen[next]) continue;
            if (data[((row * 192 + ny) * info.width + frame * 256 + nx) * 4 + 3] === 0) continue;
            seen[next] = 1;
            stack.push(next);
          }
        }
      }
      components.push({
        area,
        left,
        top,
        right,
        bottom,
        width: right - left + 1,
        height: bottom - top + 1,
        red: red / area,
        green: green / area,
        blue: blue / area,
      });
    }
  }
  return components.sort((left, right) => right.area - left.area);
};

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

test("active and pool frames contain one coherent silhouette; only shake may detach water droplets", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, animation] of Object.entries(BRUTUS_ANIMATIONS)) {
    for (let frame = 0; frame < animation.frames; frame += 1) {
      const components = frameComponents(data, info, animation.row, frame);
      if (name === "defeat-shake") {
        assert.ok(components.length >= 1);
        for (const droplet of components.slice(1)) {
          assert.ok(droplet.blue > droplet.red && droplet.green > droplet.red, `${name} ${frame} detached pixels are water`);
        }
      } else {
        assert.equal(components.length, 1, `${name} ${frame} has no detached artifact clusters`);
      }
    }
  }
});

test("non-defeat Brutus silhouettes stay within bounded anchor scale and armor registration", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const silhouettes = Object.entries(BRUTUS_ANIMATIONS)
    .filter(([name]) => !name.startsWith("defeat-"))
    .flatMap(([, animation]) => Array.from({ length: animation.frames }, (_, frame) => (
      frameComponents(data, info, animation.row, frame)[0]
    )));
  const widths = silhouettes.map(({ width }) => width);
  const heights = silhouettes.map(({ height }) => height);
  const centers = silhouettes.map(({ left, right }) => (left + right) / 2);
  assert.ok(Math.max(...widths) / Math.min(...widths) <= 1.25, "body/bin width stays anchor-scaled");
  assert.ok(Math.max(...heights) / Math.min(...heights) <= 1.6, "body/bin height stays anchor-scaled");
  assert.ok(Math.max(...centers) - Math.min(...centers) <= 8, "bin/body center registration stays stable");
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
