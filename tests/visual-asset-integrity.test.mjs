import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

import { IMPLEMENTED_VISUAL_INVENTORY } from "../app/visual-inventory.mjs";
import { SCALE_POLICIES, validateAspectRatio, validateVisibleAnchor } from "../app/visual-contract.mjs";

const publicAssetUrl = (source) => new URL(`../public/${source}`, import.meta.url);
const EXEMPT_ASPECT_POLICIES = new Set([
  SCALE_POLICIES.NINE_SLICE_OR_TILE,
  SCALE_POLICIES.VIEWPORT_COVER,
]);

const sourceGeometryFor = (record) => record.visibleSourceSize ?? record.contract.nativePixelSize;
const renderedGeometryFor = (record) => {
  const { w, h } = record.renderedSize ?? {};
  return Number.isFinite(w) && Number.isFinite(h)
    ? { w, h }
    : { w: record.contract.visualBounds.w, h: record.contract.visualBounds.h };
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

test("complete visual inventory preserves declared fixed aspects and ground contact anchors", () => {
  const errors = [];
  for (const record of IMPLEMENTED_VISUAL_INVENTORY) {
    const { scalePolicy } = record.contract;
    assert.equal(scalePolicy.preserveAspectRatio, true, `${record.id}: declared aspect policy`);
    if (!EXEMPT_ASPECT_POLICIES.has(scalePolicy.kind)) {
      const source = sourceGeometryFor(record);
      if (record.assetSource) {
        assert.ok(source, `${record.id}: declares visible or native source geometry`);
      }
      if (source) {
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

test("renderer keeps pixel smoothing disabled and exposes only a development visual-contract overlay", async () => {
  const source = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.match(source, /context\.imageSmoothingEnabled = false/);
  assert.match(source, /import\.meta\.env\.DEV[\s\S]+debugVisuals/);
  assert.match(source, /RENDER_LAYERS/);
  assert.match(source, /player:\$\{player\.animationName\} frame:\$\{playerFrameIndex\}/);
});
