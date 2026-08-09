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
