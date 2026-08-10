import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  chargeObstacleDrawRect,
  LEVEL_TWO_PROP_ATLAS,
  LEVEL_TWO_PROP_FRAMES,
  HYDRANT_RENDER_METRICS,
  LAMP_POST_RENDER_METRICS,
  SPRINKLER_RENDER_METRICS,
  hydrantDrawRect,
  hydrantNozzleOrigin,
  hydrantVisualState,
  hydrantWaterDrawRect,
  levelTwoPlatformDrawRect,
  levelTwoPropFrame,
  lampEmitterOrigin,
  lampPostDrawRect,
  sprinklerBodyDrawRect,
  sprinklerEmitterOrigin,
  sprinklerVisualState,
  sprinklerWaterDrawRect,
} from "../app/level-two-props.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";

const atlasUrl = new URL("../public/assets/generated/level2-props.png", import.meta.url);

test("Level 2 prop atlas exposes every replacement and animated spray", () => {
  assert.deepEqual(LEVEL_TWO_PROP_ATLAS, { cell: 128, columns: 4, rows: 7, baseline: 112 });
  assert.deepEqual(Object.keys(LEVEL_TWO_PROP_FRAMES), [
    "acorn", "charge-obstacle", "boss-platform-left", "boss-platform-right",
    "rolling-can", "sprinkler-idle", "sprinkler-start", "sprinkler-spray", "sprinkler-stop", "hydrant-idle",
    "hydrant-build", "hydrant-spray", "hydrant-recover", "hydrant-water-burst",
    "hydrant-water-full", "hydrant-water-taper",
  ]);
  assert.equal(LEVEL_TWO_PROP_FRAMES.acorn.frames.length, 4);
  assert.equal(LEVEL_TWO_PROP_FRAMES["sprinkler-spray"].frames.length, 6);
  assert.notDeepEqual(levelTwoPropFrame("acorn", 0), levelTwoPropFrame("acorn", 0.2));
  assert.notDeepEqual(levelTwoPropFrame("sprinkler-spray", 0), levelTwoPropFrame("sprinkler-spray", 0.2));
});

test("prop atlas is deterministic hard-alpha pixel art with grounded utility sprites", async () => {
  await access(new URL("../concepts/level-two/source/level2-props-reference.png", import.meta.url));
  await access(new URL("../concepts/level-two/build-prop-atlas.mjs", import.meta.url));
  await access(new URL("../concepts/level-two/level2-props-contact-sheet.png", import.meta.url));
  const { data, info } = await sharp(fileURLToPath(atlasUrl)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  await access(new URL("../concepts/level-two/source/level2-hydrant-water-source.png", import.meta.url));
  await access(new URL("../concepts/level-two/source/level2-lamp-post-source.png", import.meta.url));
  await access(new URL("../public/assets/generated/level2-lamp-post.png", import.meta.url));
  await access(new URL("../concepts/level-two/level2-lamp-post-contact-sheet.png", import.meta.url));
  assert.deepEqual([info.width, info.height], [512, 896]);

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

  for (const name of ["charge-obstacle", "boss-platform-left", "boss-platform-right", "rolling-can", "sprinkler-idle", "hydrant-idle", "hydrant-build", "hydrant-spray", "hydrant-recover"]) {
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

test("hydrant render metrics share one ground anchor and named nozzle origin", () => {
  assert.deepEqual(HYDRANT_RENDER_METRICS, {
    drawWidth: 96, drawHeight: 96, sourceNozzle: { x: 96, y: 54 }, waterWidth: 144, waterHeight: 144,
  });
  const item = { x: 5810, y: 400, w: 42, h: 68 };
  const draw = hydrantDrawRect(item);
  assert.equal(draw.y + LEVEL_TWO_PROP_ATLAS.baseline / LEVEL_TWO_PROP_ATLAS.cell * draw.h, 468);
  const right = hydrantNozzleOrigin(item, 1);
  const left = hydrantNozzleOrigin(item, -1);
  assert.equal(right.y, left.y);
  assert.equal(right.x + left.x, item.x * 2 + item.w);
  assert.equal(hydrantWaterDrawRect(right, 1).x, right.x - 4);
  assert.equal(hydrantWaterDrawRect(left, -1).x + HYDRANT_RENDER_METRICS.waterWidth, left.x + 4);
});

test("every boss-arena hydrant shares the cul-de-sac floor and canonical scale", () => {
  const hydrants = [LEVEL_TWO.boss.hydrant, ...LEVEL_TWO.boss.sprinklers];
  for (const item of hydrants) {
    const draw = hydrantDrawRect(item);
    const visibleGround = draw.y
      + LEVEL_TWO_PROP_ATLAS.baseline / LEVEL_TWO_PROP_ATLAS.cell * draw.h;
    assert.equal(visibleGround, 468, `${item.id} does not share the arena floor`);
    assert.deepEqual(
      [draw.w, draw.h],
      [HYDRANT_RENDER_METRICS.drawWidth, HYDRANT_RENDER_METRICS.drawHeight],
      `${item.id} was arbitrarily stretched`,
    );
  }
});

test("hydrant attack phases expose startup, sustained spray, taper, and stop artwork", () => {
  assert.deepEqual(hydrantVisualState(false, 0), { body: "hydrant-idle", water: null });
  assert.deepEqual(hydrantVisualState(true, 0.05), { body: "hydrant-build", water: "hydrant-water-burst" });
  assert.deepEqual(hydrantVisualState(true, 0.5), { body: "hydrant-spray", water: "hydrant-water-full" });
  assert.deepEqual(hydrantVisualState(true, 0.94), { body: "hydrant-recover", water: "hydrant-water-taper" });
});

test("hydrant water has broken far edges instead of a rectangular terminal column", async () => {
  const { data, info } = await sharp(fileURLToPath(atlasUrl)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const name of ["hydrant-water-burst", "hydrant-water-full", "hydrant-water-taper"]) {
    for (const [sourceX, sourceY, width, height] of LEVEL_TWO_PROP_FRAMES[name].frames) {
      const rowRights = new Set();
      let opaque = 0;
      let terminal = 0;
      for (let y = 0; y < height; y += 1) {
        let right = -1;
        for (let x = 0; x < width; x += 1) {
          const alpha = data[((sourceY + y) * info.width + sourceX + x) * 4 + 3];
          if (!alpha) continue;
          opaque += 1;
          right = x;
          if (x === width - 1) terminal += 1;
        }
        if (right >= 0) rowRights.add(right);
      }
      assert.ok(opaque > 150, `${name} is empty`);
      assert.ok(rowRights.size >= 5, `${name} has a flat far edge`);
      assert.equal(terminal, 0, `${name} touches the terminal column`);
    }
  }
});

test("sustained hydrant water frames keep a stable full-spray footprint", async () => {
  const { data, info } = await sharp(fileURLToPath(atlasUrl)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const widths = [];
  for (const [sourceX, sourceY, width, height] of LEVEL_TWO_PROP_FRAMES["hydrant-water-full"].frames) {
    let left = width;
    let right = -1;
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
      if (data[((sourceY + y) * info.width + sourceX + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    widths.push(right - left + 1);
  }
  assert.ok(Math.max(...widths) - Math.min(...widths) <= 8, `full spray width jitters: ${widths}`);
});

test("lamp post is a finished grounded sprite with an explicit fixture glow", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const start = source.indexOf('item.kind === "lamp-post"');
  const end = source.indexOf('item.kind === "hydrant"', start);
  const branch = source.slice(start, end);
  assert.match(branch, /lampPostDrawRect/);
  assert.match(branch, /lampEmitterOrigin/);
  assert.match(branch, /levelTwoLampPostRef\.current/);
  assert.match(branch, /createRadialGradient/);
  assert.doesNotMatch(branch, /levelTwoPropFrame\("porch-light"/);
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

test("sprinkler spray cells contain water only, never a second grounded body", async () => {
  const { data, info } = await sharp(fileURLToPath(atlasUrl)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [index, [sourceX, sourceY, width, height]] of LEVEL_TWO_PROP_FRAMES["sprinkler-spray"].frames.entries()) {
    let waterPixels = 0;
    let nonWaterPixels = 0;
    let bottom = -1;
    const waterColors = new Set();
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = ((sourceY + y) * info.width + sourceX + x) * 4;
        if (data[offset + 3] === 0) continue;
        bottom = Math.max(bottom, y);
        const [red, green, blue] = [data[offset], data[offset + 1], data[offset + 2]];
        const water = blue > 85 && green > 65 && blue > red * 1.12 && green > red * 1.03;
        if (water) {
          waterPixels += 1;
          waterColors.add(`${red},${green},${blue}`);
        } else {
          nonWaterPixels += 1;
        }
      }
    }
    assert.ok(waterPixels >= 300, `spray ${index} is not readable water`);
    assert.ok(waterColors.size >= 3, `spray ${index} lost its water value clusters`);
    assert.equal(nonWaterPixels, 0, `spray ${index} still contains head/base colors`);
    assert.ok(bottom <= 96, `spray ${index} still owns a grounded baseline object at ${bottom}`);
  }
});

test("active left and right sprinkler composition owns exactly one idle body", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const start = source.indexOf('if (item.kind === "sprinkler")');
  const end = source.indexOf('item.kind === "charge-obstacle"', start);
  const branch = source.slice(start, end);
  assert.equal(branch.match(/sprinklerBodyDrawRect/g)?.length, 1);
  assert.equal(branch.match(/sprinklerEmitterOrigin/g)?.length, 1);
  assert.equal(branch.match(/sprinklerWaterDrawRect/g)?.length, 1);
  assert.match(branch, /direction < 0/g);

  const atlasPath = fileURLToPath(atlasUrl);
  const bodyFrame = LEVEL_TWO_PROP_FRAMES["sprinkler-idle"].frames[0];
  const sprayFrame = LEVEL_TWO_PROP_FRAMES["sprinkler-spray"].frames[3];
  const sprite = async (frame, width, height, flip) => {
    const [left, top, sourceWidth, sourceHeight] = frame;
    const image = sharp(atlasPath)
      .extract({ left, top, width: sourceWidth, height: sourceHeight })
      .resize(width, height, { kernel: "nearest" });
    return (flip ? image.flop() : image).png().toBuffer();
  };
  for (const direction of [1, -1]) {
    const flip = direction < 0;
    const bodyRect = { left: 76, top: 52, width: 82, height: 82 };
    const sprayRect = { left: direction > 0 ? 109 : 5, top: 28, width: 120, height: 96 };
    const active = await sharp({ create: { width: 256, height: 140, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([
        { input: await sprite(bodyFrame, bodyRect.width, bodyRect.height, flip), left: bodyRect.left, top: bodyRect.top },
        { input: await sprite(sprayFrame, sprayRect.width, sprayRect.height, flip), left: sprayRect.left, top: sprayRect.top },
      ])
      .raw()
      .toBuffer({ resolveWithObject: true });
    let groundedBodyPixels = 0;
    for (let y = 0; y < active.info.height; y += 1) {
      for (let x = 0; x < active.info.width; x += 1) {
        const offset = (y * active.info.width + x) * 4;
        if (active.data[offset + 3] === 0) continue;
        const [red, green, blue] = [active.data[offset], active.data[offset + 1], active.data[offset + 2]];
        const water = blue > 85 && green > 65 && blue > red * 1.12 && green > red * 1.03;
        if (water) continue;
        assert.ok(
          x >= bodyRect.left && x < bodyRect.left + bodyRect.width
            && y >= bodyRect.top && y < bodyRect.top + bodyRect.height,
          `${direction > 0 ? "left" : "right"} spray introduced a second body pixel at ${x},${y}`,
        );
        if (y >= 100) groundedBodyPixels += 1;
      }
    }
    assert.ok(groundedBodyPixels > 100, `${direction > 0 ? "left" : "right"} composition lost its single grounded body`);
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

test("sprinkler exposes a complete body-separated start spray and stop cycle", () => {
  assert.deepEqual(Object.keys(SPRINKLER_RENDER_METRICS), [
    "bodyWidth", "bodyHeight", "sourceNozzle", "waterWidth", "waterHeight",
  ]);
  assert.equal(LEVEL_TWO_PROP_FRAMES["sprinkler-start"].frames.length, 1);
  assert.equal(LEVEL_TWO_PROP_FRAMES["sprinkler-spray"].frames.length, 6);
  assert.equal(LEVEL_TWO_PROP_FRAMES["sprinkler-stop"].frames.length, 1);
  assert.deepEqual(sprinklerVisualState(false, 0), { body: "sprinkler-idle", water: null });
  assert.deepEqual(sprinklerVisualState(true, 0.04), { body: "sprinkler-idle", water: "sprinkler-start" });
  assert.deepEqual(sprinklerVisualState(true, 0.5), { body: "sprinkler-idle", water: "sprinkler-spray" });
  assert.deepEqual(sprinklerVisualState(true, 0.96), { body: "sprinkler-idle", water: "sprinkler-stop" });
});

test("sprinkler and lamp share explicit grounded anchors and effect origins", () => {
  const sprinkler = { x: 3060, y: 444, w: 34, h: 24 };
  const body = sprinklerBodyDrawRect(sprinkler);
  assert.equal(body.y + LEVEL_TWO_PROP_ATLAS.baseline / LEVEL_TWO_PROP_ATLAS.cell * body.h, 468);
  for (const direction of [1, -1]) {
    const origin = sprinklerEmitterOrigin(sprinkler, direction);
    const water = sprinklerWaterDrawRect(origin, direction);
    assert.ok(Math.abs((direction > 0 ? water.x : water.x + water.w) - origin.x) <= 5);
  }

  assert.equal(LAMP_POST_RENDER_METRICS.drawWidth, 96);
  assert.equal(LAMP_POST_RENDER_METRICS.drawHeight, 208);
  const lamp = { x: 3972, y: 260, w: 96, h: 208 };
  const lampDraw = lampPostDrawRect(lamp);
  assert.equal(lampDraw.y + lampDraw.h, 468);
  const light = lampEmitterOrigin(lamp);
  assert.ok(light.x > lampDraw.x && light.x < lampDraw.x + lampDraw.w);
  assert.ok(light.y > lampDraw.y && light.y < lampDraw.y + lampDraw.h * 0.5);
});

test("fixed-aspect Level 2 atlas cells use one uniform runtime scale", () => {
  const obstacle = chargeObstacleDrawRect({ x: 2960, y: 356, w: 72, h: 112 });
  const sprinklerWater = sprinklerWaterDrawRect({ x: 3100, y: 420 }, 1);
  const hydrant = hydrantDrawRect({ x: 5810, y: 400, w: 42, h: 68 });
  const hydrantWater = hydrantWaterDrawRect({ x: 5850, y: 420 }, 1);
  const platforms = ["brutus-platform-left", "brutus-platform-right"].map((id) => (
    levelTwoPlatformDrawRect(LEVEL_TWO.surfaces.find((surface) => surface.id === id))
  ));

  for (const [name, rect] of [
    ["charge obstacle", obstacle],
    ["sprinkler water", sprinklerWater],
    ["hydrant body", hydrant],
    ["hydrant water", hydrantWater],
    ["left Brutus platform", platforms[0]],
    ["right Brutus platform", platforms[1]],
  ]) {
    assert.equal(rect.w, rect.h, `${name} applies unequal X/Y scale to a 128px atlas cell`);
  }
});
