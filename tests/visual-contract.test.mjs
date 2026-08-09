import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPOSITION_GAPS,
  PLACEMENT_SIZE_CLASSES,
  RENDER_LAYERS,
  SCALE_POLICIES,
  VIEWPORT_BEHAVIORS,
  createVisualContract,
  deterministicValidPlacement,
  expandedCompositionFootprint,
  motionEnvelope,
  validateCompositionDensity,
  validateAnimationManifest,
  validateAspectRatio,
  validateVisibleAnchor,
  validateVisualContract,
} from "../app/visual-contract.mjs";

const rect = (x, y, w, h) => ({ x, y, w, h });

test("semantic render layers are centralized and strictly back-to-front", () => {
  assert.deepEqual(Object.values(RENDER_LAYERS).map(({ order }) => order), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(Object.keys(RENDER_LAYERS), [
    "FAR_BACKGROUND", "BACKGROUND_SCENERY", "REAR_ENVIRONMENT", "TERRAIN",
    "GROUND_DECOR", "GAMEPLAY", "GAMEPLAY_EFFECTS", "FOREGROUND", "HUD",
  ]);
});

test("fixed-aspect rendering rejects independently distorted destination axes", () => {
  assert.deepEqual(validateAspectRatio({ source: { w: 48, h: 64 }, destination: { w: 96, h: 96 } }), [
    "source aspect 0.75 does not match destination aspect 1.00",
  ]);
  assert.deepEqual(validateAspectRatio({ source: { w: 48, h: 64 }, destination: { w: 72, h: 112 } }), [
    "source aspect 0.75 does not match destination aspect 0.64",
  ]);
  assert.deepEqual(validateAspectRatio({ source: { w: 48, h: 64 }, destination: { w: 72, h: 96 } }), []);
});

test("ground anchors must lie on the visible contact edge", () => {
  assert.deepEqual(validateVisibleAnchor({
    visibleBounds: { x: -24, y: -64, w: 48, h: 64 },
    groundAnchor: { x: 0, y: 0 },
  }), []);
  assert.ok(validateVisibleAnchor({
    visibleBounds: { x: -24, y: -64, w: 48, h: 60 },
    groundAnchor: { x: 0, y: 0 },
  }).length > 0);
});

test("every placeable contract owns the complete bounds and policy vocabulary", () => {
  const contract = createVisualContract({
    id: "grounded-test",
    category: "enemy",
    visualBounds: rect(-20, -50, 40, 50),
    collisionBounds: rect(-12, -42, 24, 42),
    placementFootprint: rect(-30, -54, 60, 54),
    groundAnchor: { x: 0, y: 0 },
    renderLayer: "GAMEPLAY",
    allowedZones: ["walkable-surface"],
    forbiddenZones: ["solid-interior"],
    minimumClearance: { left: 8, right: 8, top: 4, bottom: 0 },
    scalePolicy: { kind: SCALE_POLICIES.CANONICAL_WORLD_SIZE, min: 0.8, max: 1.2, preserveAspectRatio: true },
    viewportBehavior: VIEWPORT_BEHAVIORS.WORLD_SPACE_CULL,
    compositionPadding: { left: 8, right: 8, top: 4, bottom: 0 },
    placementCategory: PLACEMENT_SIZE_CLASSES.MEDIUM,
    nativePixelSize: { w: 64, h: 64 },
    referenceWorldHeight: 50,
    preferredScale: 1,
    effectOrigin: null,
  });
  assert.deepEqual(validateVisualContract(contract), []);
  for (const field of [
    "visualBounds", "collisionBounds", "placementFootprint", "groundAnchor", "renderLayer",
    "allowedZones", "forbiddenZones", "minimumClearance", "scalePolicy", "viewportBehavior",
    "compositionPadding", "placementCategory", "nativePixelSize", "referenceWorldHeight", "preferredScale", "effectOrigin",
  ]) assert.ok(Object.hasOwn(contract, field), field);
});

test("motion envelopes reserve the largest frame and action excursion", () => {
  assert.deepEqual(motionEnvelope([
    rect(-20, -50, 40, 50),
    rect(-42, -62, 84, 62),
    rect(10, -30, 36, 30),
  ]), rect(-42, -62, 88, 62));
});

test("deterministic placement rejects forbidden geometry and never accepts an invalid retry", () => {
  const candidates = [rect(40, 0, 20, 20), rect(100, 0, 20, 20), rect(70, 0, 20, 20)];
  const forbidden = [rect(35, -5, 35, 30)];
  const first = deterministicValidPlacement(candidates, {
    anchor: { x: 60, y: 10 }, forbiddenZones: forbidden, allowedRegion: rect(0, -10, 140, 50), clearance: 2,
  });
  const second = deterministicValidPlacement(candidates.toReversed(), {
    anchor: { x: 60, y: 10 }, forbiddenZones: forbidden, allowedRegion: rect(0, -10, 140, 50), clearance: 2,
  });
  assert.deepEqual(first, rect(100, 0, 20, 20));
  assert.deepEqual(second, first);
  assert.equal(deterministicValidPlacement([rect(40, 0, 20, 20)], {
    anchor: { x: 0, y: 0 }, forbiddenZones: forbidden, allowedRegion: rect(0, -10, 140, 50), clearance: 2,
  }), null);
});

test("animation validation rejects missing, invalid, and unreachable frames", () => {
  assert.deepEqual(validateAnimationManifest({
    idle: { row: 0, frames: 2, fps: 3, loop: true },
    attack: { row: 1, frames: 3, fps: 9, loop: false },
  }, { requiredStates: ["idle", "attack"], atlas: { columns: 3, rows: 2 } }), []);
  const errors = validateAnimationManifest({
    idle: { row: 4, frames: 0, fps: 0, loop: true },
  }, { requiredStates: ["idle", "attack"], atlas: { columns: 3, rows: 2 } });
  assert.ok(errors.some((error) => error.includes("attack")));
  assert.ok(errors.some((error) => error.includes("frames")));
  assert.ok(errors.some((error) => error.includes("row")));
});

test("composition footprints expand physical bounds by category-aware padding", () => {
  assert.deepEqual(Object.keys(PLACEMENT_SIZE_CLASSES), ["SMALL", "MEDIUM", "LARGE", "HERO", "INTERACTIVE", "BOSS_ARENA"]);
  assert.ok(COMPOSITION_GAPS.hero > COMPOSITION_GAPS.large);
  assert.ok(COMPOSITION_GAPS.large > COMPOSITION_GAPS.medium);
  assert.deepEqual(expandedCompositionFootprint({
    placementFootprint: rect(10, 20, 30, 40),
    compositionPadding: { left: 8, right: 12, top: 4, bottom: 2 },
  }), rect(2, 16, 50, 46));
});

test("rolling viewport density preserves negative space for large and hero props", () => {
  const heroProps = [100, 280, 460, 640].map((x, index) => ({
    id: `hero-${index}`,
    placementCategory: PLACEMENT_SIZE_CLASSES.HERO,
    bounds: rect(x, 300, 100, 160),
  }));
  const errors = validateCompositionDensity(heroProps, { x: 0, y: 0, w: 960, h: 540 });
  assert.ok(errors.some((error) => error.includes("hero prop density")));
  assert.deepEqual(validateCompositionDensity(heroProps.slice(0, 2), { x: 0, y: 0, w: 960, h: 540 }), []);
});
