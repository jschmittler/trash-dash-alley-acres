import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const gameSource = await readFile(
  fileURLToPath(new URL("../app/trash-dash-game.tsx", import.meta.url)),
  "utf8",
);

function namedFrame(name) {
  const match = gameSource.match(
    new RegExp(`${name}:\\s*\\[(\\d+),\\s*(\\d+),\\s*(\\d+),\\s*(\\d+)\\]`),
  );
  assert.ok(match, `missing ${name} frame`);
  return match.slice(1).map(Number);
}

function countLargeComponents(alpha, width, height) {
  const seen = new Uint8Array(width * height);
  let largeComponents = 0;

  for (let start = 0; start < seen.length; start += 1) {
    if (seen[start] || alpha[start] === 0) continue;
    const stack = [start];
    seen[start] = 1;
    let size = 0;

    while (stack.length) {
      const pixel = stack.pop();
      size += 1;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      const neighbors = [
        x > 0 ? pixel - 1 : -1,
        x + 1 < width ? pixel + 1 : -1,
        y > 0 ? pixel - width : -1,
        y + 1 < height ? pixel + width : -1,
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || seen[neighbor] || alpha[neighbor] === 0) continue;
        seen[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    if (size >= 500) largeComponents += 1;
  }

  return largeComponents;
}

test("hit reaction frames contain one complete sprite without clipped borders", async () => {
  const atlas = fileURLToPath(new URL("../public/assets/raccoon-sprites.png", import.meta.url));

  for (const name of ["smallHurt", "largeHurt", "bossHit"]) {
    const [left, top, width, height] = namedFrame(name);
    const { data, info } = await sharp(atlas)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alpha = new Uint8Array(info.width * info.height);

    for (let pixel = 0; pixel < alpha.length; pixel += 1) {
      alpha[pixel] = data[pixel * 4 + 3];
    }

    assert.equal(countLargeComponents(alpha, info.width, info.height), 1, `${name} crosses sprite boundaries`);
    for (let x = 0; x < info.width; x += 1) {
      assert.equal(alpha[x], 0, `${name} clips its top border`);
      assert.equal(alpha[(info.height - 1) * info.width + x], 0, `${name} clips its bottom border`);
    }
    for (let y = 0; y < info.height; y += 1) {
      assert.equal(alpha[y * info.width], 0, `${name} clips its left border`);
      assert.equal(alpha[y * info.width + info.width - 1], 0, `${name} clips its right border`);
    }
  }
});

test("the active tail swipe uses isolated canonical atlas cells", async () => {
  assert.doesNotMatch(gameSource, /sprites\.largeAttack\[1\]/);
  assert.match(gameSource, /player-hero-motion\.png/);
  assert.match(gameSource, /isTailSwipeActive\(playerFrameIndex\)/);

  const { data, info } = await sharp(
    fileURLToPath(new URL("../public/assets/generated/player-hero-motion.png", import.meta.url)),
  ).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cell = 192;
  const row = 16;
  for (let frame = 0; frame < 5; frame += 1) {
    let opaque = 0;
    for (let y = row * cell; y < (row + 1) * cell; y += 1) {
      for (let x = frame * cell; x < (frame + 1) * cell; x += 1) {
        if (data[(y * info.width + x) * 4 + 3] > 0) opaque += 1;
      }
    }
    assert.ok(opaque > 500, `tail swipe frame ${frame} is populated`);
  }
});
