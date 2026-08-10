import { DECORATIVE_PROPS } from "../concepts/decorative/decorative-manifest.mjs";
import { BOSS_ANIMATIONS } from "./boss-animation.mjs";
import { BRUTUS_ANIMATIONS, BRUTUS_RENDER_METRICS } from "./brutus-boss.mjs";
import {
  DUMPSTER_CELL,
  DUMPSTER_DRAW_HEIGHT,
  DUMPSTER_DRAW_WIDTH,
  DUMPSTER_SOURCE_VISIBLE_BOUNDS,
  DUMPSTER_STATES,
  DUMPSTER_UNIFORM_SCALE,
} from "./dumpster-render.mjs";
import { LEVEL_ONE_ENEMY_ANIMATIONS } from "./level-one-enemy-animation.mjs";
import { LEVEL_ONE, LEVEL_ONE_ENEMY_KINDS } from "./level-one.mjs";
import { LEVEL_TWO, LEVEL_TWO_ENEMY_KINDS } from "./level-two.mjs";
import {
  LEVEL_TWO_ENEMY_ANIMATIONS,
  LEVEL_TWO_ENEMY_COLLISION,
  LEVEL_TWO_ENEMY_DRAW_GEOMETRY,
} from "./level-two-enemies.mjs";
import {
  LEVEL_TWO_PROP_ASSET,
  LEVEL_TWO_PROP_ATLAS,
  LEVEL_TWO_PROP_FRAMES,
  LAMP_POST_RENDER_METRICS,
  lampPostDrawRect,
  lampPostVisibleDrawRect,
} from "./level-two-props.mjs";
import { PLAYER_FORM_STATES } from "./player-animation.mjs";
import { PLAYABLE_CHARACTERS } from "./playable-character.mjs";
import {
  COMPOSITION_GAPS,
  PLACEMENT_SIZE_CLASSES,
  SCALE_POLICIES,
  VIEWPORT_BEHAVIORS,
  createVisualContract,
  motionEnvelope,
  validateAnimationManifest,
  validateVisualContract,
} from "./visual-contract.mjs";

const rect = (x, y, w, h) => ({ x, y, w, h });
const clearance = (all = 0) => ({ left: all, right: all, top: all, bottom: all });
const repeated = (count, value) => Array.from({ length: count }, () => ({ ...value }));
const cellRects = ({ row = 0, frames = 1, startFrame = 0, cellW, cellH }) => (
  Array.from({ length: frames }, (_, column) => rect((startFrame + column) * cellW, row * cellH, cellW, cellH))
);
const animationSourceRects = (animations, cellW, cellH) => Object.fromEntries(
  Object.entries(animations).map(([state, animation]) => [state, Array.isArray(animation.frames)
    ? animation.frames.map(([x, y, w, h]) => rect(x, y, w, h))
    : cellRects({ ...animation, cellW, cellH })]),
);
const animationDestinations = (animations, fallback) => Object.fromEntries(
  Object.entries(animations).map(([state, animation]) => [state, repeated(animation.frames?.length ?? animation.frames ?? 1, {
    w: animation.drawWidth ?? fallback.w,
    h: animation.drawHeight ?? fallback.h,
  })]),
);

export function validateFixedAspectDestinations(record, tolerance = 0.01) {
  const errors = [];
  for (const [state, rawSources] of Object.entries(record?.sourceRects ?? {})) {
    const sources = Array.isArray(rawSources) ? rawSources : [rawSources];
    const destinations = record?.runtimeDestinations?.[state] ?? [];
    for (let frame = 0; frame < Math.min(sources.length, destinations.length); frame += 1) {
      const source = sources[frame];
      const destination = destinations[frame];
      const scaleX = destination.w / source.w;
      const scaleY = destination.h / source.h;
      if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || Math.abs(scaleX - scaleY) > tolerance) {
        errors.push(`${record.id}/${state}/${frame}: nonuniform fixed-aspect destination ${destination.w}x${destination.h}`);
      }
    }
  }
  return errors;
}

export function validateAnimationStateScale(record, tolerance = 0.01) {
  const states = Object.entries(record?.runtimeDestinations ?? {});
  const canonicalByForm = new Map();
  const errors = [];
  for (const [state, destinations] of states) {
    const form = /^(small|large)_/.exec(state)?.[1] ?? "all";
    const canonical = canonicalByForm.get(form) ?? destinations[0];
    if (!canonical) continue;
    canonicalByForm.set(form, canonical);
    for (let frame = 0; frame < destinations.length; frame += 1) {
      const destination = destinations[frame];
      if (Math.abs(destination.w - canonical.w) > tolerance || Math.abs(destination.h - canonical.h) > tolerance) {
        errors.push(`${record.id}/${state}/${frame}: state-dependent destination scale ${destination.w}x${destination.h}; expected ${canonical.w}x${canonical.h}`);
      }
    }
  }
  return errors;
}
const cloneAndFreeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneAndFreeze));
  if (value && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneAndFreeze(item)])));
  return value;
};
const canonicalScale = (min = 1, max = 1) => ({
  kind: SCALE_POLICIES.CANONICAL_WORLD_SIZE,
  min,
  max,
  preserveAspectRatio: true,
});

const GROUND_CONTACT = "GROUND_CONTACT";
const FREE_ANCHOR = "FREE_ANCHOR";

const placementCategoryFor = (record) => {
  if (record.category === "boss") return PLACEMENT_SIZE_CLASSES.BOSS_ARENA;
  if (record.category === "interactive-prop" || record.category === "hazard") return PLACEMENT_SIZE_CLASSES.INTERACTIVE;
  if (["tree", "bin", "crate"].includes(record.id)) return PLACEMENT_SIZE_CLASSES.HERO;
  if (record.category === "decorative-prop") return PLACEMENT_SIZE_CLASSES.MEDIUM;
  if (record.category === "player" || record.category === "enemy") return PLACEMENT_SIZE_CLASSES.MEDIUM;
  return PLACEMENT_SIZE_CLASSES.SMALL;
};

const nativePixelSizeFor = (record) => {
  if (!record.nativeSize) return null;
  const w = record.nativeSize.cellW ?? record.nativeSize.w;
  const h = record.nativeSize.cellH ?? record.nativeSize.h;
  return Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
};

const referenceWorldHeightFor = (record, geometry) => {
  if (Number.isFinite(record.renderedSize?.h)) return record.renderedSize.h;
  if (Array.isArray(record.renderedSize?.maximum)) return record.renderedSize.maximum[1];
  return Number.isFinite(geometry.visualBounds?.h) && geometry.visualBounds.h > 0 ? geometry.visualBounds.h : null;
};

const makeRecord = (record, geometry) => {
  const placementCategory = geometry.placementCategory ?? placementCategoryFor(record);
  const gap = COMPOSITION_GAPS[placementCategory] ?? 0;
  return Object.freeze({
  ...record,
  nativeSize: cloneAndFreeze(record.nativeSize ?? null),
  renderedSize: cloneAndFreeze(record.renderedSize ?? null),
  sourceRects: cloneAndFreeze(record.sourceRects ?? null),
  runtimeDestinations: cloneAndFreeze(record.runtimeDestinations ?? null),
  runtimeBoundsByFacing: cloneAndFreeze(record.runtimeBoundsByFacing ?? null),
  anchorPolicy: geometry.anchorPolicy ?? FREE_ANCHOR,
  contract: createVisualContract({
    id: record.id,
    category: record.category,
    visualBounds: geometry.visualBounds,
    collisionBounds: geometry.collisionBounds ?? geometry.visualBounds,
    placementFootprint: geometry.placementFootprint ?? motionEnvelope([geometry.visualBounds, geometry.collisionBounds ?? geometry.visualBounds]),
    groundAnchor: geometry.groundAnchor ?? { x: 0, y: 0 },
    renderLayer: geometry.renderLayer,
    allowedZones: geometry.allowedZones,
    forbiddenZones: geometry.forbiddenZones ?? [],
    minimumClearance: geometry.minimumClearance ?? clearance(0),
    scalePolicy: geometry.scalePolicy ?? canonicalScale(),
    viewportBehavior: geometry.viewportBehavior ?? VIEWPORT_BEHAVIORS.WORLD_SPACE_CULL,
    compositionPadding: geometry.compositionPadding ?? { left: gap, right: gap, top: Math.round(gap * 0.35), bottom: 0 },
    placementCategory,
    nativePixelSize: geometry.nativePixelSize ?? nativePixelSizeFor(record),
    referenceWorldHeight: geometry.referenceWorldHeight ?? referenceWorldHeightFor(record, geometry),
    preferredScale: geometry.preferredScale ?? 1,
    effectOrigin: geometry.effectOrigin ?? null,
  }),
  });
};

const grounded = (drawW, drawH, collisionW, collisionH, extraX = 0, extraTop = 0) => ({
  visualBounds: rect(-drawW / 2, -drawH, drawW, drawH),
  collisionBounds: rect(-collisionW / 2, -collisionH, collisionW, collisionH),
  placementFootprint: rect(-drawW / 2 - extraX, -drawH - extraTop, drawW + extraX * 2, drawH + extraTop),
  groundAnchor: { x: 0, y: 0 },
  renderLayer: "GAMEPLAY",
  allowedZones: ["walkable-surface"],
  forbiddenZones: ["solid-platform-interior", "hazard", "exit-clearance", "other-entity-footprint"],
  minimumClearance: clearance(6),
  scalePolicy: canonicalScale(1, 1),
  anchorPolicy: GROUND_CONTACT,
});

const flying = (drawW, drawH, collisionW, collisionH) => ({
  visualBounds: rect(-drawW / 2, -drawH / 2, drawW, drawH),
  collisionBounds: rect(-collisionW / 2, -collisionH / 2, collisionW, collisionH),
  placementFootprint: rect(-drawW / 2 - 12, -drawH / 2 - 20, drawW + 24, drawH + 40),
  groundAnchor: { x: 0, y: drawH / 2 },
  renderLayer: "GAMEPLAY",
  allowedZones: ["authored-flight-band"],
  forbiddenZones: ["terrain", "platform-interior", "viewport-edge", "other-entity-footprint"],
  minimumClearance: clearance(8),
  scalePolicy: canonicalScale(1, 1),
  anchorPolicy: FREE_ANCHOR,
});

const playerRecords = Object.values(PLAYABLE_CHARACTERS).map((profile) => {
  const animations = profile.animations;
  const frameBounds = Object.values(animations).map(({ drawWidth, drawHeight, offsetY = 0 }) => (
    rect(-drawWidth / 2, -drawHeight + offsetY, drawWidth, drawHeight - offsetY)
  ));
  const envelope = motionEnvelope(frameBounds);
  return makeRecord({
    id: profile.id,
    category: "player",
    assetSource: profile.atlasSrc,
  nativeSize: { w: 1152, h: 4224, cellW: 192, cellH: 192 },
  renderedSize: { small: [84, 84], large: [110, 110], maximum: [envelope.w, envelope.h] },
    sourceRects: animationSourceRects(animations, 192, 192),
    runtimeDestinations: animationDestinations(animations, { w: 84, h: 84 }),
    origin: "destination center-bottom",
    facing: "right-authored; horizontal flip around destination center",
    animations,
    requiredStates: Object.freeze([...PLAYER_FORM_STATES.small.map((state) => `small_${state}`), ...PLAYER_FORM_STATES.large.map((state) => `large_${state}`)]),
  }, {
    visualBounds: envelope,
    collisionBounds: rect(-profile.large.width / 2, -profile.large.height, profile.large.width, profile.large.height),
    placementFootprint: motionEnvelope([envelope, rect(-71, -140, 142, 140)]),
    groundAnchor: { x: 0, y: 0 },
    renderLayer: "GAMEPLAY",
    allowedZones: ["walkable-surface", "authored-airspace"],
    forbiddenZones: ["solid-platform-interior", "out-of-world"],
    minimumClearance: clearance(0),
    scalePolicy: canonicalScale(1, 1),
    anchorPolicy: GROUND_CONTACT,
  });
});

const levelOneDraw = Object.freeze({
  snake: [64, 64], pigeon: [66, 66], wasp: [66, 66], mosquito: [64, 64],
  possum: [78, 78], spider: [64, 64], fox: [72, 72],
});
const levelOneCollision = Object.freeze({
  snake: [58, 28], pigeon: [46, 38], wasp: [48, 32], mosquito: [46, 30],
  possum: [58, 38], spider: [52, 30], fox: [62, 40],
});
const levelOneEnemyRecords = LEVEL_ONE_ENEMY_KINDS.map((kind) => {
  const [drawW, drawH] = levelOneDraw[kind];
  const [collisionW, collisionH] = levelOneCollision[kind];
  const isFlying = kind === "wasp" || kind === "mosquito";
  return makeRecord({
    id: kind,
    category: "enemy",
    levelIds: ["level-1"],
    assetSource: kind === "pigeon" || kind === "possum" ? "assets/enemy-motion.png" : "assets/generated/enemy-variety-motion.png",
    nativeSize: { cellW: 192, cellH: 192, frames: 4 },
    renderedSize: { w: drawW, h: drawH },
    sourceRects: { move: cellRects({ row: LEVEL_ONE_ENEMY_ANIMATIONS[kind].move.row, frames: 4, cellW: 192, cellH: 192 }) },
    runtimeDestinations: { move: repeated(4, { w: drawW, h: drawH }) },
    origin: isFlying ? "destination center" : "destination center-bottom",
    facing: "right-authored; horizontal flip around destination center",
    animations: LEVEL_ONE_ENEMY_ANIMATIONS[kind],
    requiredStates: ["move"],
  }, isFlying ? flying(drawW, drawH, collisionW, collisionH) : grounded(drawW, drawH, collisionW, collisionH, 8, 4));
});

// Authoritative animation manifest and actual runtime destinations.
const levelTwoEnemyRecords = LEVEL_TWO_ENEMY_KINDS.map((kind) => {
  const { drawWidth: drawW, drawHeight: drawH } = LEVEL_TWO_ENEMY_DRAW_GEOMETRY[kind];
  const [collisionW, collisionH] = LEVEL_TWO_ENEMY_COLLISION[kind];
  return makeRecord({
    id: kind,
    category: "enemy",
    levelIds: ["level-2"],
    assetSource: "assets/generated/level2-enemy-motion.png",
    nativeSize: { w: 768, h: 4032, cellW: 192, cellH: 192, rows: 21, columns: 4 },
    renderedSize: { w: drawW, h: drawH },
    sourceRects: animationSourceRects(LEVEL_TWO_ENEMY_ANIMATIONS[kind], 192, 192),
    runtimeDestinations: animationDestinations(LEVEL_TWO_ENEMY_ANIMATIONS[kind], { w: drawW, h: drawH }),
    origin: kind === "moth" ? "destination center" : "source baseline row 176 to destination ground",
    facing: "right-authored; horizontal flip around destination center with dead-zone facing",
    animations: LEVEL_TWO_ENEMY_ANIMATIONS[kind],
    requiredStates: Object.keys(LEVEL_TWO_ENEMY_ANIMATIONS[kind]),
  }, kind === "moth" ? flying(drawW, drawH, collisionW, collisionH) : grounded(drawW, drawH, collisionW, collisionH, kind === "terrier" ? 26 : 16, 8));
});

const bossRecords = [
  makeRecord({
    id: "trash-heap-tyrant", category: "boss", levelIds: ["level-1"],
    assetSource: "assets/generated/boss-motion.png", nativeSize: { w: 1536, h: 2048, cellW: 256, cellH: 256, rows: 8, columns: 6 },
    renderedSize: { maximum: [166, 166] }, origin: "destination center-bottom",
    sourceRects: animationSourceRects(BOSS_ANIMATIONS, 256, 256),
    runtimeDestinations: animationDestinations(BOSS_ANIMATIONS, { w: 166, h: 166 }),
    facing: "right-authored; centered horizontal flip", animations: BOSS_ANIMATIONS,
    requiredStates: ["idle", "walk", "windup", "charge", "recover", "hit", "rage", "defeat"],
  }, {
    ...grounded(166, 166, 96, 96),
    // Physical placement is the rendered sprite; the authored arena reserve
    // remains a composition concern rather than invisible collision geometry.
    compositionPadding: { left: 64, right: 64, top: 16, bottom: 0 },
  }),
  makeRecord({
    id: "brutus-bin-hound", category: "boss", levelIds: ["level-2"],
    assetSource: "assets/generated/brutus-motion.png", nativeSize: { w: 1024, h: 2112, cellW: 256, cellH: 192, rows: 11, columns: 4 },
    renderedSize: { w: BRUTUS_RENDER_METRICS.drawWidth, h: BRUTUS_RENDER_METRICS.drawHeight },
    sourceRects: animationSourceRects(BRUTUS_ANIMATIONS, 256, 192),
    runtimeDestinations: animationDestinations(BRUTUS_ANIMATIONS, { w: BRUTUS_RENDER_METRICS.drawWidth, h: BRUTUS_RENDER_METRICS.drawHeight }),
    origin: "audited source baseline inset to destination ground", facing: "right-authored; centered horizontal flip",
    animations: BRUTUS_ANIMATIONS, requiredStates: Object.keys(BRUTUS_ANIMATIONS),
  }, grounded(220, 165, 96, 96, 86, 28)),
];

const backgroundRecords = [LEVEL_ONE, LEVEL_TWO].flatMap((level) => level.backgroundSets.flatMap(({ zoneId, stage }) => (
  ["far", "middle", "close"].map((layerName) => makeRecord({
    id: `${level.id}-${stage}-${layerName}`,
    category: "background",
    levelIds: [level.id],
    assetSource: `assets/backgrounds/${level.id.replace("level-", "level")}-${stage}-${layerName}.png`,
    nativeSize: { w: 2048, h: 716 }, renderedSize: { w: 2048, h: 716 },
    origin: "viewport tile top-left", facing: "not applicable", animations: null, requiredStates: [],
  }, {
    visualBounds: rect(0, 0, 2048, 716), collisionBounds: rect(0, 0, 0, 0), placementFootprint: rect(0, 0, 2048, 716),
    groundAnchor: { x: 0, y: 603 }, renderLayer: layerName === "far" ? "FAR_BACKGROUND" : "BACKGROUND_SCENERY",
    allowedZones: [zoneId], forbiddenZones: ["gameplay-layer"], minimumClearance: clearance(0),
    scalePolicy: { kind: SCALE_POLICIES.VIEWPORT_COVER, min: 1, max: 1, preserveAspectRatio: true },
    viewportBehavior: VIEWPORT_BEHAVIORS.PARALLAX_TILE,
  }))
)));

const surfaceRecords = [LEVEL_ONE, LEVEL_TWO].flatMap((level) => level.surfaces
  .filter((surface) => !surface.visual)
  .map((surface) => makeRecord({
  id: `${level.id}-${surface.id}`,
  entityId: surface.id,
  category: surface.kind === "ground" ? "terrain" : "platform",
  levelIds: [level.id], assetSource: surface.kind === "ground" ? "assets/ground-seamless.png" : ["box", "crate"].includes(surface.kind) ? "assets/generated/decorative-atlas.png" : `assets/generated/${surface.kind}-platform-strip.png`,
  nativeSize: null, renderedSize: { w: surface.w, h: surface.h },
  origin: "world rectangle top-left", facing: "not applicable", animations: null, requiredStates: [],
}, {
  visualBounds: rect(0, 0, surface.w, surface.h), collisionBounds: rect(0, 0, surface.w, surface.h), placementFootprint: rect(0, 0, surface.w, surface.h),
  groundAnchor: { x: 0, y: 0 }, renderLayer: "TERRAIN", allowedZones: ["authored-world-geometry"], forbiddenZones: [],
  minimumClearance: clearance(0), scalePolicy: { kind: SCALE_POLICIES.NINE_SLICE_OR_TILE, min: 1, max: 1, preserveAspectRatio: true },
})));

const levelTwoVisualPlatformRecords = [];

const decorativeRecords = Object.entries(DECORATIVE_PROPS).map(([id, meta]) => makeRecord({
  id, category: id === "checkpoint" ? "interactive-prop" : "decorative-prop", levelIds: ["level-1", "level-2"],
  assetSource: "assets/generated/decorative-atlas.png", nativeSize: { w: 768, h: 512, cellW: 256, cellH: 256 },
  renderedSize: { w: Math.round(meta.sourceWidth * 0.5), h: Math.round(meta.sourceHeight * 0.5) },
  sourceRects: { idle: rect(
    meta.frame.column * 256 + Math.round((256 - meta.sourceWidth) / 2),
    meta.frame.row * 256 + meta.baseline - meta.sourceHeight,
    meta.sourceWidth,
    meta.sourceHeight,
  ) },
  runtimeDestinations: { idle: [{ w: Math.round(meta.sourceWidth * 0.5), h: Math.round(meta.sourceHeight * 0.5) }] },
  origin: "audited source baseline to destination ground", facing: "not applicable", animations: null, requiredStates: [],
}, {
  ...grounded(Math.round(meta.sourceWidth * 0.5), Math.round(meta.sourceHeight * 0.5), Math.round(meta.sourceWidth * 0.5), Math.round(meta.sourceHeight * 0.5)),
  renderLayer: id === "checkpoint" ? "GAMEPLAY" : "GROUND_DECOR",
  allowedZones: ["walkable-surface"], forbiddenZones: ["platform-interior", "hazard", "pickup-clearance", "enemy-footprint"], minimumClearance: clearance(6),
}));

const groundedPropRecord = ({ id, category, sourceRects, renderedSize, runtimeDestinations = null, renderLayer, runtimeOwner = null }) => makeRecord({
  id,
  category,
  levelIds: ["level-2"],
  assetSource: LEVEL_TWO_PROP_ASSET,
  nativeSize: { cellW: LEVEL_TWO_PROP_ATLAS.cell, cellH: LEVEL_TWO_PROP_ATLAS.cell },
  sourceRects,
  renderedSize,
  runtimeDestinations: runtimeDestinations ?? Object.fromEntries(Object.entries(sourceRects).map(([state, sources]) => [
    state,
    repeated(Array.isArray(sources) ? sources.length : 1, renderedSize),
  ])),
  runtimeOwner,
  origin: "source baseline to destination ground",
  facing: "mirrored around named attachment origin",
  animations: null,
  requiredStates: [],
}, {
  ...grounded(renderedSize.w, renderedSize.h, Math.min(renderedSize.w, 84), Math.min(renderedSize.h, 68), 8),
  renderLayer,
  allowedZones: ["walkable-surface"],
  forbiddenZones: ["unrelated-platform-interior", "player-spawn"],
  minimumClearance: clearance(4),
});

const lampDraw = lampPostDrawRect({ x: 0, y: 0, w: 96, h: 208 });
const lampVisibleBounds = lampPostVisibleDrawRect({ x: -48, y: -208, w: 96, h: 208 });
const lampCollisionBounds = rect(-48, -208, 96, 208);
const lampPostRecord = makeRecord({
  id: "lamp-post",
  category: "interactive-prop",
  levelIds: ["level-2"],
  assetSource: "assets/generated/level2-lamp-post.png",
  nativeSize: { w: LAMP_POST_RENDER_METRICS.sourceWidth, h: LAMP_POST_RENDER_METRICS.sourceHeight },
  renderedSize: { w: lampDraw.w, h: lampDraw.h },
  sourceRects: { idle: [rect(0, 0, LAMP_POST_RENDER_METRICS.sourceWidth, LAMP_POST_RENDER_METRICS.sourceHeight)] },
  runtimeDestinations: { idle: [{ w: lampDraw.w, h: lampDraw.h }] },
  runtimeOwner: "level-two-lamp-post-render",
  origin: "source bottom-center to destination ground",
  facing: "not applicable",
  animations: null,
  requiredStates: [],
}, {
  visualBounds: lampVisibleBounds,
  collisionBounds: lampCollisionBounds,
  placementFootprint: motionEnvelope([lampVisibleBounds, lampCollisionBounds]),
  groundAnchor: { x: 0, y: 0 },
  renderLayer: "GAMEPLAY",
  allowedZones: ["walkable-surface"],
  forbiddenZones: ["unrelated-platform-interior", "player-spawn"],
  minimumClearance: clearance(4),
  scalePolicy: canonicalScale(1, 1),
  anchorPolicy: GROUND_CONTACT,
});

const propRecords = [
  groundedPropRecord({ id: "loose-acorn-pile", category: "decorative-prop", sourceRects: { idle: [rect(128, 128, 128, 128)] }, renderedSize: { w: 96, h: 96 }, renderLayer: "GROUND_DECOR", runtimeOwner: "level-two-prop-render" }),
  groundedPropRecord({ id: "residential-trash-can", category: "interactive-prop", sourceRects: { idle: [rect(0, 128, 128, 128)] }, renderedSize: { w: 112, h: 112 }, renderLayer: "GAMEPLAY", runtimeOwner: "level-two-prop-render" }),
  groundedPropRecord({ id: "hydrant-body", category: "interactive-prop", sourceRects: { idle: [rect(0, 256, 128, 128)] }, renderedSize: { w: 96, h: 96 }, renderLayer: "GAMEPLAY", runtimeOwner: "brutus-crash-mechanic" }),
];

const pickupRecords = [["trash", 46, 46], ["taco", 58, 58], ["cap", 51, 42]].map(([id, w, h]) => makeRecord({
  id, category: "pickup", levelIds: ["level-1", "level-2"],
  assetSource: id === "trash" ? "assets/generated/trash-pickups-motion.png" : id === "taco" ? "assets/generated/taco-power-motion.png" : "assets/raccoon-sprites.png",
  nativeSize: id === "cap" ? { w: 1448, h: 1086 } : { cellW: 192, cellH: 192 }, renderedSize: { w, h }, origin: "destination center", facing: "not applicable",
  sourceRects: id === "cap"
    ? { idle: rect(385, 615, 58, 48) }
    : { idle: id === "trash"
      ? Array.from({ length: 16 }, (_, index) => rect((index % 4) * 192, Math.floor(index / 4) * 192, 192, 192))
      : cellRects({ row: 0, frames: 4, cellW: 192, cellH: 192 }) },
  runtimeDestinations: { idle: repeated(id === "trash" ? 16 : id === "taco" ? 4 : 1, { w, h }) },
  animations: id === "cap" ? null : { idle: { row: 0, frames: 4, fps: 5, loop: true } }, requiredStates: id === "cap" ? [] : ["idle"],
}, {
  visualBounds: rect(-w / 2, -h / 2 - 2, w, h + 4), collisionBounds: rect(-14, -14, 28, 28), placementFootprint: rect(-w / 2 - 4, -h / 2 - 8, w + 8, h + 16),
  groundAnchor: { x: 0, y: h / 2 + 4 }, renderLayer: "GAMEPLAY", allowedZones: ["authored-reward-zone"],
  forbiddenZones: ["solid-platform-interior", "hazard", "enemy-footprint"], minimumClearance: clearance(4), scalePolicy: canonicalScale(1, 1),
}));

const dumpsterRecord = makeRecord({
  id: "victory-dumpster",
  category: "interactive-prop",
  levelIds: ["level-1", "level-2"],
  assetSource: "assets/generated/dumpster-holy-atlas.png",
  nativeSize: { w: DUMPSTER_CELL * 4, h: DUMPSTER_CELL * 2, cellW: DUMPSTER_CELL, cellH: DUMPSTER_CELL, rows: 2, columns: 4 },
  sourceRects: {
    sealed: rect(0, DUMPSTER_STATES.sealed.row * DUMPSTER_CELL, DUMPSTER_CELL, DUMPSTER_CELL),
    holy: Array.from({ length: 4 }, (_, column) => rect(column * DUMPSTER_CELL, DUMPSTER_STATES.holy.row * DUMPSTER_CELL, DUMPSTER_CELL, DUMPSTER_CELL)),
  },
  renderedSize: { w: DUMPSTER_DRAW_WIDTH, h: DUMPSTER_DRAW_HEIGHT },
  runtimeDestinations: {
    sealed: [{ w: DUMPSTER_DRAW_WIDTH, h: DUMPSTER_DRAW_HEIGHT }],
    holy: repeated(4, { w: DUMPSTER_DRAW_WIDTH, h: DUMPSTER_DRAW_HEIGHT }),
  },
  origin: "destination center-bottom; both reveal rows share one grounded rect",
  facing: "not applicable",
  animations: {
    sealed: { row: DUMPSTER_STATES.sealed.row, frames: 1, fps: 1, loop: false },
    holy: { row: DUMPSTER_STATES.holy.row, frames: 4, fps: 1.25, loop: true },
  },
  requiredStates: ["sealed", "holy"],
}, {
  ...grounded(
    DUMPSTER_SOURCE_VISIBLE_BOUNDS.w * DUMPSTER_UNIFORM_SCALE,
    DUMPSTER_SOURCE_VISIBLE_BOUNDS.h * DUMPSTER_UNIFORM_SCALE,
    DUMPSTER_SOURCE_VISIBLE_BOUNDS.w * DUMPSTER_UNIFORM_SCALE,
    DUMPSTER_SOURCE_VISIBLE_BOUNDS.h * DUMPSTER_UNIFORM_SCALE,
  ),
  renderLayer: "GAMEPLAY",
  allowedZones: ["goal-zone", "post-boss-arena"],
  forbiddenZones: ["active-boss-arena", "solid-platform-interior"],
  minimumClearance: clearance(8),
});

const miscRecords = [
  makeRecord({ id: "ordinary-bin-lid", category: "projectile", levelIds: ["level-1", "level-2"], assetSource: LEVEL_TWO_PROP_ASSET, nativeSize: { cellW: 128, cellH: 128 }, renderedSize: { w: 34, h: 34 }, sourceRects: animationSourceRects({ active: LEVEL_TWO_PROP_FRAMES.acorn }, 128, 128), runtimeDestinations: { active: repeated(4, { w: 34, h: 34 }) }, origin: "center", facing: "velocity-controlled rotation", animations: { active: LEVEL_TWO_PROP_FRAMES.acorn }, requiredStates: ["active"] }, {
    visualBounds: rect(-17, -17, 34, 34), collisionBounds: rect(-8, -8, 16, 16), placementFootprint: rect(-22, -22, 44, 44), groundAnchor: { x: 0, y: 17 }, renderLayer: "GAMEPLAY_EFFECTS", allowedZones: ["authored-projectile-lane"], forbiddenZones: ["source-owner-footprint"], minimumClearance: clearance(0), scalePolicy: canonicalScale(1, 1),
  }),
  makeRecord({ id: "brutus-rolling-can", category: "projectile", levelIds: ["level-2"], assetSource: LEVEL_TWO_PROP_ASSET, nativeSize: { cellW: 128, cellH: 128 }, renderedSize: { w: 42, h: 42 }, sourceRects: animationSourceRects({ active: LEVEL_TWO_PROP_FRAMES["rolling-can"] }, 128, 128), runtimeDestinations: { active: [{ w: 42, h: 42 }] }, origin: "center", facing: "velocity-controlled rotation", animations: { active: LEVEL_TWO_PROP_FRAMES["rolling-can"] }, requiredStates: ["active"] }, {
    ...grounded(42, 42, 22, 22, 6), renderLayer: "GAMEPLAY_EFFECTS", allowedZones: ["boss-arena-floor"], forbiddenZones: ["boss-platform-interior"], minimumClearance: clearance(0),
  }),
  makeRecord({ id: "pit-and-drainage-gap", category: "hazard", levelIds: ["level-1", "level-2"], assetSource: null, nativeSize: null, renderedSize: null, origin: "authored gap rectangle", facing: "not applicable", animations: null, requiredStates: [] }, {
    visualBounds: rect(0, 0, 1, 1), collisionBounds: rect(0, 0, 1, 1), placementFootprint: rect(0, 0, 1, 1), groundAnchor: { x: 0, y: 0 }, renderLayer: "TERRAIN", allowedZones: ["gap-between-surfaces"], forbiddenZones: ["walkable-surface"], minimumClearance: clearance(0), scalePolicy: canonicalScale(1, 1),
  }),
  makeRecord({ id: "impact-particles", category: "effect", levelIds: ["level-1", "level-2"], assetSource: null, nativeSize: null, renderedSize: { min: 2, max: 8 }, origin: "particle center", facing: "velocity vector", animations: { active: { row: 0, frames: 1, fps: 1, loop: false } }, requiredStates: ["active"] }, {
    visualBounds: rect(-4, -4, 8, 8), collisionBounds: rect(0, 0, 0, 0), placementFootprint: rect(-8, -8, 16, 16), groundAnchor: { x: 0, y: 4 }, renderLayer: "GAMEPLAY_EFFECTS", allowedZones: ["gameplay-viewport"], forbiddenZones: [], minimumClearance: clearance(0), scalePolicy: canonicalScale(0.25, 1),
  }),
  makeRecord({ id: "gameplay-hud", category: "viewport-ui", levelIds: ["level-1", "level-2"], assetSource: null, nativeSize: null, renderedSize: "responsive safe-area", origin: "screen-space", facing: "not applicable", animations: null, requiredStates: [] }, {
    visualBounds: rect(0, 0, 960, 96), collisionBounds: rect(0, 0, 0, 0), placementFootprint: rect(0, 0, 960, 96), groundAnchor: { x: 0, y: 96 }, renderLayer: "HUD", allowedZones: ["viewport-safe-area"], forbiddenZones: ["touch-controls"], minimumClearance: clearance(0), scalePolicy: { kind: SCALE_POLICIES.VIEWPORT_COVER, min: 0.5, max: 2, preserveAspectRatio: true }, viewportBehavior: VIEWPORT_BEHAVIORS.SCREEN_SPACE_SAFE_AREA,
  }),
];

export const IMPLEMENTED_VISUAL_INVENTORY = Object.freeze([
  ...backgroundRecords, ...surfaceRecords, ...levelTwoVisualPlatformRecords, ...decorativeRecords, ...propRecords, lampPostRecord, ...pickupRecords,
  dumpsterRecord, ...miscRecords, ...playerRecords, ...levelOneEnemyRecords, ...levelTwoEnemyRecords, ...bossRecords,
]);

const drawFamily = (id, renderer, recordIds) => Object.freeze({ id, renderer, recordIds: Object.freeze(recordIds) });

// Every runtime art path must name the inventory record(s) whose source crop
// and destination geometry it uses. This is coverage, not a second renderer.
export const RUNTIME_DRAW_FAMILY_MANIFEST = Object.freeze([
  drawFamily("decorative-props", "drawDecorativeProp", ["bush", "tree", "bin", "crate", "checkpoint", "tires"]),
  drawFamily("level-one-enemies", "drawEnemy/enemyMotion+varietyEnemyMotion", ["snake", "pigeon", "wasp", "mosquito", "possum", "spider", "fox"]),
  drawFamily("level-two-enemies", "drawEnemy/levelTwoEnemyMotion", ["squirrel", "terrier", "skunk", "moth"]),
  drawFamily("players", "drawSprite/profileAnimations", ["raccoon", "jimothy"]),
  drawFamily("bosses", "drawEnemy/bossAnimation+brutusDrawRect", ["trash-heap-tyrant", "brutus-bin-hound"]),
  drawFamily("pickups", "drawSprite/trashPickupRows+tacoPowerMotion+sprites.cap", ["trash", "taco", "cap"]),
  drawFamily("victory-dumpster", "drawSprite/dumpsterFrame+dumpsterDrawRect", ["victory-dumpster"]),
  drawFamily("level-two-props", "drawSprite/levelTwoPropFrame", ["loose-acorn-pile", "residential-trash-can", "hydrant-body"]),
  drawFamily("level-two-lamp-post", "drawImage/lampPostDrawRect", ["lamp-post"]),
  drawFamily("ordinary-bin-lid", "drawSprite/binLids", ["ordinary-bin-lid"]),
  drawFamily("brutus-rolling-can", "drawSprite/binLids", ["brutus-rolling-can"]),
  drawFamily("procedural-effects", "canvas fill/particle renderer", ["pit-and-drainage-gap", "impact-particles", "gameplay-hud"]),
]);

// Exact measured alpha-crop → runtime-destination mismatches. The recipes are
// literal committed geometry, deliberately independent of inventory output:
// changing a crop, destination, or one animation frame must fail the audit.
const distortionFrame = (id, state, frame, source, destination, issue) => Object.freeze({
  id, state, frame, source: Object.freeze({ ...source }), destination: Object.freeze({ ...destination }), issue,
});
export const MEASURED_RUNTIME_DISTORTION_FRAMES = Object.freeze([
  distortionFrame("tires", "idle", 0, rect(528, 373, 224, 115), { w: 112, h: 58 }, "VIS-007"),
]);

const immutableRoute = (route) => Object.freeze({ ...route });

export const VISUAL_QA_ROUTES = Object.freeze([
  { id: "l1-start", levelId: "level-1", checkpoint: "start", viewport: "desktop", url: "/?backgroundTest=woodland&visualQa=l1-start" },
  { id: "l1-creek", levelId: "level-1", checkpoint: "creek", viewport: "desktop", url: "/?backgroundTest=creek&visualQa=l1-creek" },
  { id: "l1-highway", levelId: "level-1", checkpoint: "highway", viewport: "desktop", url: "/?backgroundTest=highway&visualQa=l1-highway" },
  { id: "l1-industrial", levelId: "level-1", checkpoint: "industrial", viewport: "desktop", url: "/?backgroundTest=industrial&visualQa=l1-industrial" },
  { id: "l1-park", levelId: "level-1", checkpoint: "park", viewport: "desktop", url: "/?backgroundTest=park&visualQa=l1-park" },
  { id: "l1-middle", levelId: "level-1", checkpoint: "middle", viewport: "desktop", url: "/?backgroundTest=highway&visualQa=l1-middle" },
  { id: "l1-end", levelId: "level-1", checkpoint: "end", viewport: "mobile-landscape", url: "/?backgroundTest=park&visualQa=l1-end" },
  { id: "l1-boss", levelId: "level-1", checkpoint: "boss", bossId: "trash-heap-tyrant", viewport: "desktop", url: "/?bossTest=1&visualQa=l1-boss" },
  { id: "l1-victory", levelId: "level-1", checkpoint: "victory", viewport: "desktop", url: "/?victoryTest=1&visualQa=l1-victory" },
  { id: "l2-backyard", levelId: "level-2", checkpoint: "backyard", viewport: "desktop", url: "/?level=2&levelTest=backyard&visualQa=l2-backyard" },
  { id: "l2-street", levelId: "level-2", checkpoint: "street", viewport: "desktop", url: "/?level=2&levelTest=street&visualQa=l2-street" },
  { id: "l2-obstacle", levelId: "level-2", checkpoint: "obstacle", viewport: "desktop", url: "/?level=2&levelTest=obstacle&visualQa=l2-obstacle" },
  { id: "l2-drainage", levelId: "level-2", checkpoint: "drainage", viewport: "desktop", url: "/?level=2&levelTest=drainage&visualQa=l2-drainage" },
  { id: "l2-runway", levelId: "level-2", checkpoint: "runway", viewport: "desktop", url: "/?level=2&levelTest=runway&visualQa=l2-runway" },
  { id: "l2-main-street", levelId: "level-2", checkpoint: "main-street", viewport: "desktop", url: "/?level=2&levelTest=main-street&visualQa=l2-main-street" },
  { id: "l2-start", levelId: "level-2", checkpoint: "start", viewport: "mobile-portrait", url: "/?level=2&levelTest=backyard&visualQa=l2-start" },
  { id: "l2-middle", levelId: "level-2", checkpoint: "middle", viewport: "desktop", url: "/?level=2&levelTest=obstacle&visualQa=l2-middle" },
  { id: "l2-end", levelId: "level-2", checkpoint: "end", viewport: "mobile-landscape", url: "/?level=2&levelTest=main-street&visualQa=l2-end" },
  { id: "l2-squirrel", levelId: "level-2", checkpoint: "squirrel", viewport: "desktop", url: "/?encounterTest=squirrel&visualQa=l2-squirrel" },
  { id: "l2-terrier", levelId: "level-2", checkpoint: "terrier", viewport: "desktop", url: "/?encounterTest=terrier&visualQa=l2-terrier" },
  { id: "l2-skunk", levelId: "level-2", checkpoint: "skunk", viewport: "desktop", url: "/?encounterTest=skunk&visualQa=l2-skunk" },
  { id: "l2-moth", levelId: "level-2", checkpoint: "moth", viewport: "desktop", url: "/?encounterTest=moth&visualQa=l2-moth" },
  { id: "l2-interaction", levelId: "level-2", checkpoint: "interaction", viewport: "desktop", url: "/?encounterTest=interaction&visualQa=l2-interaction" },
  { id: "l2-boss", levelId: "level-2", checkpoint: "boss", bossId: "brutus-bin-hound", viewport: "desktop", url: "/?bossTest=brutus&visualQa=l2-boss" },
  { id: "l2-victory", levelId: "level-2", checkpoint: "victory", viewport: "desktop", url: "/?victoryTest=level2&visualQa=l2-victory" },
  { id: "player-states", levelId: "level-1", checkpoint: "states", viewport: "desktop", url: "/?powerupTest=taco&visualQa=player-states&debugVisuals=1" },
  { id: "enemy-states", levelId: "level-2", checkpoint: "states", viewport: "desktop", url: "/?encounterTest=interaction&visualQa=enemy-states&debugVisuals=1" },
].map(immutableRoute));

export function inventorySummary(inventory = IMPLEMENTED_VISUAL_INVENTORY) {
  const unique = (values) => [...new Set(values)].sort();
  return {
    levels: unique(inventory.flatMap(({ levelIds = [] }) => levelIds)),
    players: unique(inventory.filter(({ category }) => category === "player").map(({ id }) => id)),
    enemies: unique(inventory.filter(({ category }) => category === "enemy").map(({ id }) => id)),
    bosses: unique(inventory.filter(({ category }) => category === "boss").map(({ id }) => id)),
    categories: unique(inventory.map(({ category }) => category)),
  };
}

export function validateImplementedVisualInventory(inventory = IMPLEMENTED_VISUAL_INVENTORY) {
  const errors = inventory.flatMap((record) => validateVisualContract(record.contract));
  for (const record of inventory) {
    if (record.category === "player") {
      errors.push(...validateAnimationStateScale(record).map((error) => `${record.id}: ${error}`));
    }
    if (!record.animations) continue;
    const entries = Object.fromEntries(Object.entries(record.animations).map(([name, animation]) => [name, {
      ...animation,
      row: animation.row ?? 0,
      frames: animation.frames,
    }]));
    const atlas = record.nativeSize?.rows && record.nativeSize?.columns
      ? { rows: record.nativeSize.rows, columns: record.nativeSize.columns }
      : null;
    errors.push(...validateAnimationManifest(entries, { requiredStates: record.requiredStates, atlas }).map((error) => `${record.id}: ${error}`));
  }
  const ids = new Set();
  for (const record of inventory) {
    const scopedId = `${record.levelIds?.join(",") ?? "global"}:${record.category}:${record.id}`;
    if (ids.has(scopedId)) errors.push(`${record.id}: duplicate inventory record`);
    ids.add(scopedId);
  }
  return errors;
}
