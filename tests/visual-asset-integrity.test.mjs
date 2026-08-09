import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

import {
  DUMPSTER_CELL,
  DUMPSTER_DRAW_HEIGHT,
  DUMPSTER_DRAW_WIDTH,
  dumpsterDrawRect,
} from "../app/dumpster-render.mjs";
import { IMPLEMENTED_VISUAL_INVENTORY } from "../app/visual-inventory.mjs";
import { SCALE_POLICIES, validateAspectRatio, validateVisibleAnchor } from "../app/visual-contract.mjs";

const publicAssetUrl = (source) => new URL(`../public/${source}`, import.meta.url);
const EXEMPT_ASPECT_POLICIES = new Set([
  SCALE_POLICIES.NINE_SLICE_OR_TILE,
  SCALE_POLICIES.VIEWPORT_COVER,
]);

const renderedGeometryFor = (record) => {
  const { w, h } = record.renderedSize ?? {};
  return Number.isFinite(w) && Number.isFinite(h)
    ? { w, h }
    : { w: record.contract.visualBounds.w, h: record.contract.visualBounds.h };
};
const sourceRectanglesFor = (record) => Object.values(record.sourceRects ?? {})
  .flatMap((value) => Array.isArray(value) ? value : [value]);

const visibleBoundsForCell = ({ data, info }, { x, y, w, h }) => {
  let left = w;
  let top = h;
  let right = -1;
  let bottom = -1;
  for (let row = 0; row < h; row += 1) {
    for (let column = 0; column < w; column += 1) {
      const offset = ((y + row) * info.width + x + column) * info.channels;
      if (data[offset + 3] === 0) continue;
      left = Math.min(left, column);
      top = Math.min(top, row);
      right = Math.max(right, column);
      bottom = Math.max(bottom, row);
    }
  }
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
};

test("every inventoried asset reference exists and declared native dimensions match shipped bytes", async () => {
  const assets = new Map();
  for (const record of IMPLEMENTED_VISUAL_INVENTORY) {
    if (!record.assetSource) continue;
    assets.set(record.assetSource, record.nativeSize);
  }
  for (const [source, nativeSize] of assets) {
    await access(publicAssetUrl(source));
    if (!nativeSize?.w || !nativeSize?.h) continue;
    const metadata = await sharp(fileURLToPath(publicAssetUrl(source))).metadata();
    assert.equal(metadata.width, nativeSize.w, `${source} width`);
    assert.equal(metadata.height, nativeSize.h, `${source} height`);
  }
});

test("all explicit sprite rectangles fit inside their declared atlas", () => {
  for (const record of IMPLEMENTED_VISUAL_INVENTORY) {
    const atlasWidth = record.nativeSize?.w;
    const atlasHeight = record.nativeSize?.h;
    if (!atlasWidth || !atlasHeight || !record.animations) continue;
    for (const [state, animation] of Object.entries(record.animations)) {
      if (!Array.isArray(animation.frames)) continue;
      for (const [x, y, w, h] of animation.frames) {
        assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0, `${record.id}:${state} positive frame`);
        assert.ok(x + w <= atlasWidth && y + h <= atlasHeight, `${record.id}:${state} frame fits atlas`);
      }
    }
  }
});

test("dumpster source cells reach their runtime destination through uniform axes", async () => {
  const atlas = await sharp(fileURLToPath(publicAssetUrl("assets/generated/dumpster-holy-atlas.png")))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(atlas.info.width, DUMPSTER_CELL * 4);
  assert.equal(atlas.info.height, DUMPSTER_CELL * 2);
  const sourceRect = { x: 0, y: 0, w: DUMPSTER_CELL, h: DUMPSTER_CELL };
  const sourceVisible = visibleBoundsForCell(atlas, sourceRect);
  assert.ok(sourceVisible.w > 0 && sourceVisible.h > 0, "sealed dumpster source crop has visible pixels");
  const runtimeDestination = dumpsterDrawRect(4200, 300, 468);
  assert.deepEqual(validateAspectRatio({
    source: sourceVisible,
    destination: {
      w: sourceVisible.w * runtimeDestination.width / sourceRect.w,
      h: sourceVisible.h * runtimeDestination.height / sourceRect.h,
    },
  }), []);
  assert.deepEqual(
    { w: runtimeDestination.width, h: runtimeDestination.height },
    { w: DUMPSTER_DRAW_WIDTH, h: DUMPSTER_DRAW_HEIGHT },
  );
});

test("complete visual inventory preserves declared fixed aspects and ground contact anchors", () => {
  const errors = [];
  for (const record of IMPLEMENTED_VISUAL_INVENTORY) {
    const { scalePolicy } = record.contract;
    assert.equal(scalePolicy.preserveAspectRatio, true, `${record.id}: declared aspect policy`);
    if (!EXEMPT_ASPECT_POLICIES.has(scalePolicy.kind)) {
      for (const source of sourceRectanglesFor(record)) {
        if (record.runtimeOwner) continue;
        errors.push(...validateAspectRatio({ source, destination: renderedGeometryFor(record) })
          .map((error) => `${record.id}: ${error}`));
      }
    }
    if (record.anchorPolicy === "GROUND_CONTACT") {
      errors.push(...validateVisibleAnchor({
        visibleBounds: record.contract.visualBounds,
        groundAnchor: record.contract.groundAnchor,
      }).map((error) => `${record.id}: ${error}`));
    }
  }
  assert.deepEqual(errors, []);
});

test("overlapping legacy prop renderer defects remain explicit until their owner repairs the runtime", () => {
  const errors = IMPLEMENTED_VISUAL_INVENTORY
    .filter(({ runtimeOwner }) => runtimeOwner === "level-two-prop-render")
    .flatMap((record) => sourceRectanglesFor(record).flatMap((source) => (
      validateAspectRatio({ source, destination: renderedGeometryFor(record) }).map((error) => `${record.id}: ${error}`)
    )));
  assert.deepEqual(errors, [
    "charge-obstacle: source aspect 1.00 does not match destination aspect 0.75",
    "sprinkler-water: source aspect 1.00 does not match destination aspect 1.25",
    "hydrant-body: source aspect 1.00 does not match destination aspect 0.67",
  ]);
});

test("canonical inventory does not require optional future prop or render-metric exports", async () => {
  const source = await readFile(new URL("../app/visual-inventory.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /LEVEL_TWO_LAMP_POST_ASSET/);
  assert.doesNotMatch(source, /LEVEL_TWO_ENEMY_RENDER/);
  assert.match(source, /LEVEL_TWO_ENEMY_DRAW_GEOMETRY/);
});

test("authoritative inventory source rectangles have opaque source pixels and frozen runtime geometry", async () => {
  for (const record of IMPLEMENTED_VISUAL_INVENTORY) {
    const sourceRects = sourceRectanglesFor(record);
    if (sourceRects.length === 0) continue;
    const atlas = await sharp(fileURLToPath(publicAssetUrl(record.assetSource)))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (const sourceRect of sourceRects) {
      assert.ok(sourceRect.x >= 0 && sourceRect.y >= 0 && sourceRect.x + sourceRect.w <= atlas.info.width && sourceRect.y + sourceRect.h <= atlas.info.height, `${record.id}: source rect fits atlas`);
      const visible = visibleBoundsForCell(atlas, sourceRect);
      assert.ok(visible.w > 0 && visible.h > 0, `${record.id}: source rect has visible alpha`);
    }
    assert.equal(Object.isFrozen(record.sourceRects), true, `${record.id}: source rects frozen`);
    assert.equal(Object.isFrozen(record.renderedSize), true, `${record.id}: rendered geometry frozen`);
  }
  const dumpster = IMPLEMENTED_VISUAL_INVENTORY.find(({ id }) => id === "victory-dumpster");
  assert.ok(dumpster, "victory dumpster is inventoried");
  assert.throws(() => {
    dumpster.renderedSize.w = 1;
  }, TypeError);
  assert.throws(() => {
    dumpster.sourceRects.sealed.w = 1;
  }, TypeError);
  assert.deepEqual(dumpster.renderedSize, { w: DUMPSTER_DRAW_WIDTH, h: DUMPSTER_DRAW_HEIGHT });
});

test("renderer keeps pixel smoothing disabled and exposes only a development visual-contract overlay", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(source, /context\.imageSmoothingEnabled = false/);
  assert.match(source, /import\.meta\.env\.DEV[\s\S]+debugVisuals/);
  assert.match(source, /RENDER_LAYERS/);
  assert.match(source, /player:\$\{player\.animationName\} frame:\$\{playerFrameIndex\}/);
});
