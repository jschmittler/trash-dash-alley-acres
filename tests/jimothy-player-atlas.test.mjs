import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  JIMOTHY_ANIMATIONS,
  JIMOTHY_ANIMATION_BASELINES,
  JIMOTHY_SOURCE_STATE_IDENTITY,
} from "../concepts/jimothy/jimothy-animation.mjs";

const CELL = 192;
const atlasPath = fileURLToPath(new URL("../public/assets/generated/jimothy-hero-motion.png", import.meta.url));

const visibleBoundsForFrame = async (state, frame = 0) => {
  const animation = JIMOTHY_ANIMATIONS[state];
  const { data, info } = await sharp(atlasPath)
    .ensureAlpha()
    .extract({ left: frame * CELL, top: animation.row * CELL, width: CELL, height: CELL })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = CELL;
  let top = CELL;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1, bottom };
};

test("Jimothy production atlas has the six-column, 22-row contract", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, CELL * 6);
  assert.equal(info.height, CELL * 22);

  for (const [name, animation] of Object.entries(JIMOTHY_ANIMATIONS)) {
    assert.equal(typeof JIMOTHY_ANIMATION_BASELINES[name], "number", `${name} missing baseline metadata`);
    assert.equal(
      animation.offsetY,
      Math.round(animation.drawHeight - (animation.baseline * animation.drawHeight) / CELL),
      `${name} baseline compensation drifted`,
    );
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
      assert.ok(right >= left && bottom >= top, `${name}:${column} is empty`);
      assert.ok(left > 0 && top > 0 && right < CELL - 1 && bottom < CELL - 1, `${name}:${column} clips a cell edge`);
      assert.equal(bottom, animation.baseline - 1, `${name}:${column} feet drift from the shared baseline`);
    }
  }
});

test("Jimothy selection preview is a transparent single frame", async () => {
  const metadata = await sharp(fileURLToPath(new URL("../public/assets/generated/jimothy-selection.png", import.meta.url))).metadata();
  assert.equal(metadata.width, CELL);
  assert.equal(metadata.height, CELL);
  assert.equal(metadata.channels, 4);
});

test("Jimothy contact sheet is available for visual review", async () => {
  const metadata = await sharp(fileURLToPath(new URL("../public/assets/generated/jimothy-hero-contact-sheet.png", import.meta.url))).metadata();
  assert.ok(metadata.width >= CELL * 6);
  assert.ok(metadata.height >= CELL * 22);
});

test("Jimothy victory source is a canonical four-cell bottom-center strip", async () => {
  const sourcePath = fileURLToPath(new URL("../concepts/jimothy/source/jimothy-victory-source.png", import.meta.url));
  const metadata = await sharp(sourcePath).metadata();
  assert.deepEqual([metadata.width, metadata.height, metadata.channels], [CELL * 4, CELL, 4]);
});

test("Jimothy victory retains the idle body scale and shared visible baseline", async () => {
  const idle = await visibleBoundsForFrame("small_idle", 0);
  const victory = await Promise.all(Array.from({ length: 4 }, (_, frame) => visibleBoundsForFrame("small_victory", frame)));

  assert.equal(idle.w, 140, "approved side-profile idle width is the canonical Jimothy body scale");
  assert.equal(victory[0].w, idle.w, "victory must retain the pre-victory side-profile scale");
  for (const [frame, bounds] of victory.entries()) {
    assert.equal(bounds.bottom, JIMOTHY_ANIMATIONS.small_victory.baseline - 1, `victory:${frame} baseline`);
    assert.ok(bounds.w <= 140, `victory:${frame} exceeds the canonical body width`);
    assert.ok(bounds.h <= 144, `victory:${frame} exceeds the authored victory motion envelope`);
    assert.ok(Math.abs(bounds.x + bounds.w / 2 - CELL / 2) <= 1, `victory:${frame} bottom-center anchor drift`);
  }

  for (const form of ["small", "large"]) {
    const idleAnimation = JIMOTHY_ANIMATIONS[`${form}_idle`];
    const victoryAnimation = JIMOTHY_ANIMATIONS[`${form}_victory`];
    assert.deepEqual(
      [victoryAnimation.drawWidth, victoryAnimation.drawHeight, victoryAnimation.baseline, victoryAnimation.offsetY],
      [idleAnimation.drawWidth, idleAnimation.drawHeight, idleAnimation.baseline, idleAnimation.offsetY],
      `${form} destination, baseline, and anchor compensation must remain canonical`,
    );
    const worldScale = victoryAnimation.drawWidth / CELL;
    assert.equal(victory[0].w * worldScale, idle.w * worldScale, `${form} visible side-profile world width`);
    assert.equal(
      (victory[0].bottom + 1) * worldScale,
      (idle.bottom + 1) * worldScale,
      `${form} measured alpha baseline in the destination`,
    );
  }
});

test("Jimothy reachable state rows own compatible authored source strips", async () => {
  const requiredStates = {
    small_land: ["land", "source/jimothy-land-source.png"],
    large_land: ["land", "source/jimothy-land-source.png"],
    small_defeat: ["defeat", "source/jimothy-defeat-source.png"],
    small_victory: ["victory", "source/jimothy-victory-source.png"],
    large_victory: ["victory", "source/jimothy-victory-source.png"],
    large_glide: ["glide", "source/jimothy-large-glide-source.png"],
  };

  for (const [state, [semanticState, source]] of Object.entries(requiredStates)) {
    assert.deepEqual(
      JIMOTHY_SOURCE_STATE_IDENTITY[state],
      { semanticState, source, frames: 4 },
      `${state} must not borrow an incompatible legacy row`,
    );
    const sourcePath = fileURLToPath(new URL(`../concepts/jimothy/${source}`, import.meta.url));
    const metadata = await sharp(sourcePath).metadata();
    assert.equal(metadata.channels, 4, `${state} source must retain deterministic alpha`);
  }

  assert.notEqual(
    JIMOTHY_SOURCE_STATE_IDENTITY.large_glide.semanticState,
    "jump",
    "glide must never map to the jump source row",
  );
});

test("Jimothy glide keeps the gray bob-tail rider free of Trashy outfit colors", async () => {
  const glidePath = fileURLToPath(new URL("../concepts/jimothy/source/jimothy-large-glide-source.png", import.meta.url));
  const { data, info } = await sharp(glidePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const riderBounds = [];

  for (let frame = 0; frame < 4; frame += 1) {
    const left = Math.floor((frame * info.width) / 4);
    const right = Math.floor(((frame + 1) * info.width) / 4);
    let minX = right;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;
    let orangeOutfitPixels = 0;
    let blueOutfitPixels = 0;

    for (let y = Math.floor(info.height * 0.48); y < info.height; y += 1) {
      for (let x = left; x < right; x += 1) {
        const pixel = (y * info.width + x) * 4;
        if (data[pixel + 3] < 220) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        // The compact belly/leg region excludes canopy and rigging; saturated
        // orange or blue here would be a Trashy-style outfit substitution.
        if (
          y >= Math.floor(info.height * 0.62)
          && y < Math.floor(info.height * 0.8)
          && x >= left + Math.floor((right - left) * 0.32)
          && x < left + Math.floor((right - left) * 0.68)
        ) {
          const red = data[pixel];
          const green = data[pixel + 1];
          const blue = data[pixel + 2];
          if (red > 130 && red > green * 1.35 && red > blue * 1.65) orangeOutfitPixels += 1;
          if (blue > 110 && blue > red * 1.35 && blue > green * 1.15) blueOutfitPixels += 1;
        }
      }
    }

    assert.ok(maxX >= minX && maxY >= minY, `large_glide:${frame} rider is empty`);
    assert.ok(orangeOutfitPixels <= 4, `large_glide:${frame} has orange outfit contamination`);
    assert.equal(blueOutfitPixels, 0, `large_glide:${frame} has blue outfit contamination`);
    riderBounds.push({
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    });
  }

  // Jimothy's source silhouette is compact and rounded; the gliding pose may
  // extend horizontally, but all four frames must retain one coherent body.
  for (const bounds of riderBounds) {
    assert.ok(bounds.width / bounds.height > 1.85 && bounds.width / bounds.height < 2.2);
    assert.ok(bounds.height >= 150 && bounds.height <= 165);
  }
});
