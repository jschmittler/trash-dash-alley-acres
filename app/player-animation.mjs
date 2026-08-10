export const PLAYER_ATLAS = Object.freeze({ cell: 192, columns: 6, rows: 22, baseline: 184 });

export const PLAYER_FORM_STATES = {
  small: ["idle", "walk", "run", "jump", "fall", "land", "hurt", "skid", "defeat", "victory"],
  large: ["idle", "walk", "run", "jump", "fall", "land", "tail_swipe", "hurt", "shrink", "glide", "skid", "victory"],
};

const entry = (row, frames, fps, loop, drawSize, baseline = PLAYER_ATLAS.baseline) => ({
  row,
  frames,
  fps,
  loop,
  drawWidth: drawSize,
  drawHeight: drawSize,
  baseline,
  offsetY: Math.round(drawSize - (baseline * drawSize) / PLAYER_ATLAS.cell),
});

export const PLAYER_ANIMATIONS = {
  small_idle: entry(0, 4, 3, true, 84),
  small_walk: entry(1, 6, 8, true, 84),
  small_run: entry(2, 6, 12, true, 84),
  small_jump: entry(3, 2, 8, false, 84),
  small_fall: entry(4, 2, 8, false, 84),
  small_land: entry(5, 2, 10, false, 84),
  small_hurt: entry(6, 3, 8, false, 84),
  small_skid: entry(7, 3, 10, false, 84),
  small_defeat: entry(8, 4, 6, false, 84),
  small_victory: entry(9, 4, 7, true, 84),
  large_idle: entry(10, 4, 3, true, 110),
  large_walk: entry(11, 6, 8, true, 110),
  large_run: entry(12, 6, 12, true, 110),
  large_jump: entry(13, 2, 8, false, 110),
  large_fall: entry(14, 2, 8, false, 110),
  large_land: entry(15, 2, 10, false, 110),
  large_tail_swipe: entry(16, 5, 14, false, 110),
  large_hurt: entry(17, 3, 8, false, 110),
  large_shrink: entry(18, 4, 10, false, 110),
  large_glide: entry(19, 6, 7, true, 110),
  large_skid: entry(20, 3, 10, false, 110),
  large_victory: entry(21, 4, 7, true, 110),
};

export function selectPlayerAnimation(input, animations = PLAYER_ANIMATIONS) {
  const form = input.form === "large" ? "large" : "small";
  const candidates = [
    input.defeated ? "small_defeat" : null,
    input.hurt ? `${form}_hurt` : null,
    input.shrinking && form === "large" ? "large_shrink" : null,
    input.victorious ? `${form}_victory` : null,
    input.attacking && form === "large" ? "large_tail_swipe" : null,
    !input.grounded && input.gliding && form === "large" ? "large_glide" : null,
    !input.grounded ? `${form}_${input.vy < 0 ? "jump" : "fall"}` : null,
    input.landing ? `${form}_land` : null,
    input.skidding ? `${form}_skid` : null,
    Math.abs(input.vx) >= 250 ? `${form}_run` : null,
    Math.abs(input.vx) >= 22 ? `${form}_walk` : null,
    `${form}_idle`,
  ];
  return candidates.find((name) => name && animations[name]) ?? "small_idle";
}

export function animationFrame(animation, elapsed) {
  const raw = Math.floor(elapsed * animation.fps);
  return animation.loop ? raw % animation.frames : Math.min(animation.frames - 1, raw);
}

export function isTailSwipeActive(frameIndex) {
  return frameIndex === 1 || frameIndex === 2;
}
