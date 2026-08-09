import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  LEVEL_TWO_PROP_ATLAS,
  LEVEL_TWO_PROP_FRAMES,
  levelTwoPlatformDrawRect,
  levelTwoPropFrame,
} from "../app/level-two-props.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";

const atlasUrl = new URL("../public/assets/generated/level2-props.png", import.meta.url);

test("Level 2 prop atlas exposes every replacement and animated spray", () => {
  assert.deepEqual(LEVEL_TWO_PROP_ATLAS, { cell: 128, columns: 4, rows: 4, baseline: 112 });
  assert.deepEqual(Object.keys(LEVEL_TWO_PROP_FRAMES), [
    "acorn", "charge-obstacle", "boss-platform-left", "boss-platform-right",
    "rolling-can", "sprinkler-idle", "sprinkler-spray", "hydrant",
  ]);
  assert.equal(LEVEL_TWO_PROP_FRAMES.acorn.frames.length, 4);
  assert.equal(LEVEL_TWO_PROP_FRAMES["sprinkler-spray"].frames.length, 4);
  assert.notDeepEqual(levelTwoPropFrame("acorn", 0), levelTwoPropFrame("acorn", 0.2));
  assert.notDeepEqual(levelTwoPropFrame("sprinkler-spray", 0), levelTwoPropFrame("sprinkler-spray", 0.2));
});

test("prop atlas is deterministic hard-alpha pixel art with grounded utility sprites", async () => {
  await access(new URL("../concepts/level-two/source/level2-props-reference.png", import.meta.url));
  await access(new URL("../concepts/level-two/build-prop-atlas.mjs", import.meta.url));
  await access(new URL("../concepts/level-two/level2-props-contact-sheet.png", import.meta.url));
  const { data, info } = await sharp(fileURLToPath(atlasUrl)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height], [512, 512]);

  const alpha = new Set();
  const colors = new Set();
  for (let offset = 0; offset < data.length; offset += 4) {
    alpha.add(data[offset + 3]);
    if (data[offset + 3] === 0) continue;
    colors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]}`);
    const neonKeySpill = data[offset + 1] > 220 && data[offset] < 80 && data[offset + 2] < 180;
    assert.equal(neonKeySpill, false, `key spill at pixel ${offset / 4}`);
  }
  assert.deepEqual([...alpha].sort((left, right) => left - right), [0, 255]);
  assert.ok(colors.size >= 12 && colors.size <= 32, `unexpected palette size ${colors.size}`);

  for (const name of ["charge-obstacle", "boss-platform-left", "boss-platform-right", "rolling-can", "sprinkler-idle", "hydrant"]) {
    const [sourceX, sourceY, width, height] = LEVEL_TWO_PROP_FRAMES[name].frames[0];
    let bottom = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixel = ((sourceY + y) * info.width + sourceX + x) * 4;
        if (data[pixel + 3] > 0) bottom = Math.max(bottom, y);
      }
    }
    assert.equal(bottom, LEVEL_TWO_PROP_ATLAS.baseline, `${name} baseline drift`);
  }
});

test("boss platform opaque tops align with their authored one-way surfaces", async () => {
  const { data, info } = await sharp(fileURLToPath(atlasUrl)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const id of ["brutus-platform-left", "brutus-platform-right"]) {
    const platform = LEVEL_TWO.surfaces.find((surface) => surface.id === id);
    const [sourceX, sourceY, width, height] = LEVEL_TWO_PROP_FRAMES[platform.visual].frames[0];
    let opaqueTop = height;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixel = ((sourceY + y) * info.width + sourceX + x) * 4;
        if (data[pixel + 3] > 0) opaqueTop = Math.min(opaqueTop, y);
      }
    }
    const draw = levelTwoPlatformDrawRect(platform);
    const renderedTop = draw.y + opaqueTop / height * draw.h;
    assert.ok(Math.abs(renderedTop - platform.y) <= 2, `${id} visible top drifts to ${renderedTop}`);
  }
});

test("Level 2 render source has no primitive fallback for the five replaced props", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(source, /levelTwoPropMotionRef/);
  assert.match(source, /assets\/generated\/level2-props\.png/);
  assert.doesNotMatch(source, /context\.ellipse\(x \+ item\.w \/ 2/);
  assert.doesNotMatch(source, /item\.kind === "sprinkler"[\s\S]{0,900}context\.lineTo/);
  assert.doesNotMatch(source, /item\.kind === "charge-obstacle"[\s\S]{0,360}context\.fillRect/);
  assert.doesNotMatch(source, /item\.kind === "hydrant"[\s\S]{0,500}context\.fillRect/);
  assert.doesNotMatch(source, /lid\.ownerId === "brutus-can"[\s\S]{0,500}context\.fillRect/);
});
