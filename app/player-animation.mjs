export const PLAYER_FORM_STATES = {
  small: ["idle", "walk", "run", "jump", "fall", "land", "hurt", "skid", "defeat", "victory"],
  large: ["idle", "walk", "run", "jump", "fall", "land", "tail_swipe", "hurt", "shrink", "glide", "skid", "victory"],
};

const entry = (row, frames, fps, loop, drawWidth, drawHeight, offsetY = 0) => ({
  row,
  frames,
  fps,
  loop,
  drawWidth,
  drawHeight,
  offsetY,
});

export const PLAYER_ANIMATIONS = {
  small_idle: entry(0, 4, 3, true, 84, 84),
  small_walk: entry(1, 6, 8, true, 84, 84),
  small_run: entry(2, 6, 12, true, 88, 84),
  small_jump: entry(3, 2, 8, false, 86, 88),
  small_fall: entry(4, 2, 8, false, 86, 88),
  small_land: entry(5, 2, 10, false, 88, 82),
  small_hurt: entry(6, 3, 8, false, 96, 84),
  small_skid: entry(7, 3, 10, false, 90, 84),
  small_defeat: entry(8, 4, 6, false, 96, 84),
  small_victory: entry(9, 4, 7, true, 88, 88),
  large_idle: entry(10, 4, 3, true, 110, 110),
  large_walk: entry(11, 6, 8, true, 110, 110),
  large_run: entry(12, 6, 12, true, 116, 110),
  large_jump: entry(13, 2, 8, false, 112, 114),
  large_fall: entry(14, 2, 8, false, 112, 114),
  large_land: entry(15, 2, 10, false, 118, 104),
  large_tail_swipe: entry(16, 5, 14, false, 142, 112),
  large_hurt: entry(17, 3, 8, false, 126, 100),
  large_shrink: entry(18, 4, 10, false, 120, 108),
  large_glide: entry(19, 6, 7, true, 140, 140),
  large_skid: entry(20, 3, 10, false, 120, 108),
  large_victory: entry(21, 4, 7, true, 116, 114),
};

export function selectPlayerAnimation(input) {
  const form = input.form === "large" ? "large" : "small";
  if (input.defeated) return "small_defeat";
  if (input.hurt) return `${form}_hurt`;
  if (input.shrinking && form === "large") return "large_shrink";
  if (input.victorious) return `${form}_victory`;
  if (input.attacking && form === "large") return "large_tail_swipe";
  if (!input.grounded && input.gliding && form === "large") return "large_glide";
  if (!input.grounded) return `${form}_${input.vy < 0 ? "jump" : "fall"}`;
  if (input.landing) return `${form}_land`;
  if (input.skidding) return `${form}_skid`;
  if (Math.abs(input.vx) >= 250) return `${form}_run`;
  if (Math.abs(input.vx) >= 22) return `${form}_walk`;
  return `${form}_idle`;
}

export function animationFrame(animation, elapsed) {
  const raw = Math.floor(elapsed * animation.fps);
  return animation.loop ? raw % animation.frames : Math.min(animation.frames - 1, raw);
}

export function isTailSwipeActive(frameIndex) {
  return frameIndex === 1 || frameIndex === 2;
}
