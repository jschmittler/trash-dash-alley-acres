export const LEVEL_TWO_PROP_ATLAS = Object.freeze({
  cell: 128,
  columns: 4,
  rows: 3,
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
});

export const LEVEL_TWO_PROP_RUNTIME_OWNERS = Object.freeze({
  acorn: "bin-lid-source",
  "charge-obstacle": "level-two-environment",
  "boss-platform-left": "brutus-platform-left",
  "boss-platform-right": "brutus-platform-right",
  "rolling-can": "brutus-rolling-can",
  "hydrant-idle": "brutus-crash-mechanic",
});

export const HYDRANT_RENDER_METRICS = Object.freeze({
  drawWidth: 96,
  drawHeight: 96,
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
