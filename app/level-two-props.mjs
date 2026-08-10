export const LEVEL_TWO_PROP_ATLAS = Object.freeze({
  cell: 128,
  columns: 4,
  rows: 4,
  baseline: 112,
});

export const LEVEL_TWO_PROP_ASSET = "assets/generated/level2-props.png";
export const LEVEL_TWO_LAMP_POST_ASSET = "assets/generated/level2-lamp-post.png";

const cell = (column, row) => Object.freeze([column * 128, row * 128, 128, 128]);

export const LEVEL_TWO_PROP_FRAMES = Object.freeze({
  acorn: Object.freeze({ frames: Object.freeze([cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0)]), fps: 9, loop: true }),
  "charge-obstacle": Object.freeze({ frames: Object.freeze([cell(0, 1)]), fps: 0, loop: false }),
  "boss-platform-left": Object.freeze({ frames: Object.freeze([cell(1, 1)]), fps: 0, loop: false }),
  "boss-platform-right": Object.freeze({ frames: Object.freeze([cell(2, 1)]), fps: 0, loop: false }),
  "rolling-can": Object.freeze({ frames: Object.freeze([cell(3, 1)]), fps: 0, loop: false }),
  "hydrant-idle": Object.freeze({ frames: Object.freeze([cell(0, 2)]), fps: 0, loop: false }),
  "hydrant-build": Object.freeze({ frames: Object.freeze([cell(1, 2)]), fps: 0, loop: false }),
  "hydrant-spray": Object.freeze({ frames: Object.freeze([cell(2, 2)]), fps: 0, loop: false }),
  "hydrant-recover": Object.freeze({ frames: Object.freeze([cell(3, 2)]), fps: 0, loop: false }),
  "hydrant-water-burst": Object.freeze({ frames: Object.freeze([cell(0, 3)]), fps: 0, loop: false }),
  "hydrant-water-full": Object.freeze({ frames: Object.freeze([cell(1, 3), cell(2, 3)]), fps: 12, loop: true }),
  "hydrant-water-taper": Object.freeze({ frames: Object.freeze([cell(3, 3)]), fps: 0, loop: false }),
});

export const HYDRANT_RENDER_METRICS = Object.freeze({
  drawWidth: 96,
  drawHeight: 96,
  sourceNozzle: Object.freeze({ x: 96, y: 54 }),
  waterWidth: 144,
  waterHeight: 144,
});

export const CHARGE_OBSTACLE_RENDER_METRICS = Object.freeze({
  drawSize: 112,
});

export const BRUTUS_PLATFORM_RENDER_METRICS = Object.freeze({
  sourceBoundsByVisual: Object.freeze({
    "boss-platform-left": Object.freeze({ top: 25, bottom: 112, visibleWidth: 96 }),
    "boss-platform-right": Object.freeze({ top: 28, bottom: 112, visibleWidth: 96 }),
  }),
});

export const PORCH_LIGHT_RENDER_METRICS = Object.freeze({
  drawWidth: 96,
  drawHeight: 96,
  sourceAttachment: Object.freeze({ x: 18, y: 52 }),
});

const LAMP_POST_SOURCE_WIDTH = 192;
const LAMP_POST_SOURCE_HEIGHT = 256;
const LAMP_POST_DRAW_HEIGHT = 208;

export const LAMP_POST_RENDER_METRICS = Object.freeze({
  sourceWidth: LAMP_POST_SOURCE_WIDTH,
  sourceHeight: LAMP_POST_SOURCE_HEIGHT,
  drawWidth: LAMP_POST_SOURCE_WIDTH / LAMP_POST_SOURCE_HEIGHT * LAMP_POST_DRAW_HEIGHT,
  drawHeight: LAMP_POST_DRAW_HEIGHT,
  visibleBounds: Object.freeze({ x: 41, y: 7, w: 111, h: 248 }),
  sourceLight: Object.freeze({ x: 136, y: 72 }),
});


export function chargeObstacleDrawRect(item) {
  const size = CHARGE_OBSTACLE_RENDER_METRICS.drawSize;
  const groundY = item.y + item.h;
  return {
    x: item.x + item.w / 2 - size / 2,
    y: groundY - LEVEL_TWO_PROP_ATLAS.baseline / LEVEL_TWO_PROP_ATLAS.cell * size,
    w: size,
    h: size,
  };
}

export function hydrantDrawRect(item) {
  const groundY = item.y + item.h;
  const { drawWidth: w, drawHeight: h } = HYDRANT_RENDER_METRICS;
  return {
    x: item.x + item.w / 2 - w / 2,
    y: groundY - LEVEL_TWO_PROP_ATLAS.baseline / LEVEL_TWO_PROP_ATLAS.cell * h,
    w,
    h,
  };
}

export function hydrantNozzleOrigin(item, direction = 1) {
  const draw = hydrantDrawRect(item);
  const sourceX = direction < 0
    ? LEVEL_TWO_PROP_ATLAS.cell - HYDRANT_RENDER_METRICS.sourceNozzle.x
    : HYDRANT_RENDER_METRICS.sourceNozzle.x;
  return {
    x: draw.x + sourceX / LEVEL_TWO_PROP_ATLAS.cell * draw.w,
    y: draw.y + HYDRANT_RENDER_METRICS.sourceNozzle.y / LEVEL_TWO_PROP_ATLAS.cell * draw.h,
  };
}

export function hydrantWaterDrawRect(origin, direction = 1) {
  const { waterWidth: w, waterHeight: h } = HYDRANT_RENDER_METRICS;
  return {
    x: direction < 0 ? origin.x + 4 - w : origin.x - 4,
    y: origin.y - h / 2,
    w,
    h,
  };
}

export function hydrantVisualState(active, progress = 0) {
  if (!active) return { body: "hydrant-idle", water: null };
  const phase = Math.max(0, Math.min(1, progress));
  if (phase < 0.18) return { body: "hydrant-build", water: "hydrant-water-burst" };
  if (phase < 0.82) return { body: "hydrant-spray", water: "hydrant-water-full" };
  return { body: "hydrant-recover", water: "hydrant-water-taper" };
}

export function porchLightDrawRect(item) {
  const { drawWidth: w, drawHeight: h, sourceAttachment } = PORCH_LIGHT_RENDER_METRICS;
  return {
    x: item.x - sourceAttachment.x / LEVEL_TWO_PROP_ATLAS.cell * w,
    y: item.y - sourceAttachment.y / LEVEL_TWO_PROP_ATLAS.cell * h,
    w,
    h,
  };
}

export function lampPostDrawRect(item) {
  const { drawWidth: w, drawHeight: h } = LAMP_POST_RENDER_METRICS;
  const groundY = item.y + item.h;
  return { x: item.x + item.w / 2 - w / 2, y: groundY - h, w, h };
}

export function lampPostVisibleDrawRect(item) {
  const draw = lampPostDrawRect(item);
  const { sourceWidth, sourceHeight, visibleBounds } = LAMP_POST_RENDER_METRICS;
  return {
    x: draw.x + visibleBounds.x / sourceWidth * draw.w,
    y: draw.y + visibleBounds.y / sourceHeight * draw.h,
    w: visibleBounds.w / sourceWidth * draw.w,
    h: visibleBounds.h / sourceHeight * draw.h,
  };
}

export function lampEmitterOrigin(item) {
  const draw = lampPostDrawRect(item);
  const { sourceWidth, sourceHeight, sourceLight } = LAMP_POST_RENDER_METRICS;
  return {
    x: draw.x + sourceLight.x / sourceWidth * draw.w,
    y: draw.y + sourceLight.y / sourceHeight * draw.h,
  };
}

export function levelTwoPropFrame(name, elapsed = 0) {
  const animation = LEVEL_TWO_PROP_FRAMES[name];
  if (!animation) return LEVEL_TWO_PROP_FRAMES.acorn.frames[0];
  if (animation.frames.length === 1 || animation.fps <= 0) return animation.frames[0];

  const rawFrame = Math.max(0, Math.floor(elapsed * animation.fps));
  const frameIndex = animation.loop
    ? rawFrame % animation.frames.length
    : Math.min(animation.frames.length - 1, rawFrame);
  return animation.frames[frameIndex];
}

export function levelTwoPlatformDrawRect(platform) {
  const sourceBounds = BRUTUS_PLATFORM_RENDER_METRICS.sourceBoundsByVisual[platform.visual]
    ?? { top: 0, bottom: LEVEL_TWO_PROP_ATLAS.cell };
  const scale = platform.w / sourceBounds.visibleWidth;
  const size = LEVEL_TWO_PROP_ATLAS.cell * scale;
  return {
    x: platform.x + platform.w / 2 - size / 2,
    y: platform.y + platform.h - sourceBounds.bottom * scale,
    w: size,
    h: size,
  };
}
