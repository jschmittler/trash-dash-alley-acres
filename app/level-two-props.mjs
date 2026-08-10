export const LEVEL_TWO_PROP_ATLAS = Object.freeze({
  cell: 128,
  columns: 4,
  rows: 4,
  baseline: 112,
});

export const LEVEL_TWO_PROP_ASSET = "assets/generated/level2-props.png";

const cell = (column, row) => Object.freeze([column * 128, row * 128, 128, 128]);

export const LEVEL_TWO_PROP_FRAMES = Object.freeze({
  acorn: Object.freeze({ frames: Object.freeze([cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0)]), fps: 9, loop: true }),
  "charge-obstacle": Object.freeze({ frames: Object.freeze([cell(0, 1)]), fps: 0, loop: false }),
  "boss-platform-left": Object.freeze({ frames: Object.freeze([cell(1, 1)]), fps: 0, loop: false }),
  "boss-platform-right": Object.freeze({ frames: Object.freeze([cell(2, 1)]), fps: 0, loop: false }),
  "rolling-can": Object.freeze({ frames: Object.freeze([cell(3, 1)]), fps: 0, loop: false }),
  "sprinkler-idle": Object.freeze({ frames: Object.freeze([cell(0, 2)]), fps: 0, loop: false }),
  "sprinkler-spray": Object.freeze({ frames: Object.freeze([cell(1, 2), cell(2, 2), cell(3, 2), cell(0, 3)]), fps: 10, loop: true }),
  hydrant: Object.freeze({ frames: Object.freeze([cell(1, 3)]), fps: 0, loop: false }),
});

export const SPRINKLER_RENDER_METRICS = Object.freeze({
  bodyWidth: 82, bodyHeight: 82, sourceNozzle: Object.freeze({ x: 74, y: 43 }), waterWidth: 132, waterHeight: 96,
});
export const HYDRANT_RENDER_METRICS = Object.freeze({
  drawWidth: 72, drawHeight: 96, sourceNozzle: Object.freeze({ x: 96, y: 54 }), waterWidth: 144, waterHeight: 96,
});
export const LAMP_POST_RENDER_METRICS = Object.freeze({ drawWidth: 96, drawHeight: 208 });

export function sprinklerBodyDrawRect(item) {
  const groundY = item.y + item.h;
  const { bodyWidth: w, bodyHeight: h } = SPRINKLER_RENDER_METRICS;
  return { x: item.x + item.w / 2 - w / 2, y: groundY - LEVEL_TWO_PROP_ATLAS.baseline / LEVEL_TWO_PROP_ATLAS.cell * h, w, h };
}

export function sprinklerEmitterOrigin(item, direction = 1) {
  const draw = sprinklerBodyDrawRect(item);
  const sourceX = direction < 0 ? LEVEL_TWO_PROP_ATLAS.cell - SPRINKLER_RENDER_METRICS.sourceNozzle.x : SPRINKLER_RENDER_METRICS.sourceNozzle.x;
  return { x: draw.x + sourceX / LEVEL_TWO_PROP_ATLAS.cell * draw.w, y: draw.y + SPRINKLER_RENDER_METRICS.sourceNozzle.y / LEVEL_TWO_PROP_ATLAS.cell * draw.h };
}

export function sprinklerWaterDrawRect(origin, direction = 1) {
  const { waterWidth: w, waterHeight: h } = SPRINKLER_RENDER_METRICS;
  return { x: direction < 0 ? origin.x + 4 - w : origin.x - 4, y: origin.y - h / 2, w, h };
}

export function hydrantDrawRect(item) {
  const groundY = item.y + item.h;
  const { drawWidth: w, drawHeight: h } = HYDRANT_RENDER_METRICS;
  return { x: item.x + item.w / 2 - w / 2, y: groundY - LEVEL_TWO_PROP_ATLAS.baseline / LEVEL_TWO_PROP_ATLAS.cell * h, w, h };
}

export function hydrantNozzleOrigin(item, direction = 1) {
  const draw = hydrantDrawRect(item);
  const sourceX = direction < 0 ? LEVEL_TWO_PROP_ATLAS.cell - HYDRANT_RENDER_METRICS.sourceNozzle.x : HYDRANT_RENDER_METRICS.sourceNozzle.x;
  return { x: draw.x + sourceX / LEVEL_TWO_PROP_ATLAS.cell * draw.w, y: draw.y + HYDRANT_RENDER_METRICS.sourceNozzle.y / LEVEL_TWO_PROP_ATLAS.cell * draw.h };
}

export function hydrantWaterDrawRect(origin, direction = 1) {
  const { waterWidth: w, waterHeight: h } = HYDRANT_RENDER_METRICS;
  return { x: direction < 0 ? origin.x + 4 - w : origin.x - 4, y: origin.y - h / 2, w, h };
}

export function lampPostDrawRect(item) {
  const { drawWidth: w, drawHeight: h } = LAMP_POST_RENDER_METRICS;
  const groundY = item.y + item.h;
  return { x: item.x + item.w / 2 - w / 2, y: groundY - h, w, h };
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
  const w = 104;
  const h = 96;
  return {
    x: platform.x + platform.w / 2 - w / 2,
    y: platform.y + platform.h - 84,
    w,
    h,
  };
}
