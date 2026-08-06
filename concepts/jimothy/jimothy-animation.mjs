const entry = (row, frames, fps, loop, drawWidth, drawHeight, baseline = 184) => ({
  row,
  frames,
  fps,
  loop,
  drawWidth,
  drawHeight,
  baseline,
  offsetY: 0,
});

// Full-parity animation manifest. Source art is right-facing and is flipped
// by the renderer for left-facing movement. All frames share a 184px ground
// baseline inside their 192px cells.
export const JIMOTHY_ANIMATIONS = {
  small_idle: entry(0, 4, 3, true, 84, 84),
  small_walk: entry(1, 4, 8, true, 84, 84),
  small_run: entry(2, 4, 11, true, 88, 84),
  small_jump: entry(3, 4, 8, false, 86, 88),
  small_fall: entry(4, 4, 8, true, 86, 88),
  small_land: entry(5, 4, 10, false, 88, 82),
  small_hurt: entry(6, 4, 8, false, 96, 84),
  small_skid: entry(7, 4, 10, false, 90, 84),
  small_defeat: entry(8, 4, 6, false, 96, 84),
  small_victory: entry(9, 4, 7, true, 88, 88),
  large_idle: entry(10, 4, 3, true, 110, 110),
  large_walk: entry(11, 4, 8, true, 110, 110),
  large_run: entry(12, 4, 11, true, 116, 110),
  large_jump: entry(13, 4, 8, false, 112, 114),
  large_fall: entry(14, 4, 8, true, 112, 114),
  large_land: entry(15, 4, 10, false, 118, 104),
  large_tail_swipe: entry(16, 4, 14, false, 142, 112),
  large_hurt: entry(17, 4, 8, false, 126, 100),
  large_shrink: entry(18, 4, 10, false, 120, 108),
  large_glide: entry(19, 4, 7, true, 140, 140),
  large_skid: entry(20, 4, 10, false, 120, 108),
  large_victory: entry(21, 4, 7, true, 116, 114),
};

export const JIMOTHY_ANIMATION_BASELINES = Object.fromEntries(
  Object.entries(JIMOTHY_ANIMATIONS).map(([name, animation]) => [name, animation.baseline]),
);

// Optional source motions remain available to the concept viewer only.
export const JIMOTHY_CONCEPT_ANIMATIONS = {
  forage: entry(5, 4, 5, true, 84, 84),
  paw_swipe: entry(6, 4, 10, false, 108, 96),
  roll: entry(7, 4, 10, true, 96, 84),
  climb: entry(8, 4, 8, true, 88, 96),
  eat: entry(9, 4, 6, true, 84, 84),
  groom: entry(10, 4, 5, true, 84, 84),
  hurt: entry(11, 4, 8, false, 96, 84),
};
