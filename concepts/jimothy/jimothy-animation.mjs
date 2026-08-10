const CELL = 192;
const BASELINE = 184;

const entry = (row, frames, fps, loop, drawSize, baseline = BASELINE) => ({
  row,
  frames,
  fps,
  loop,
  drawWidth: drawSize,
  drawHeight: drawSize,
  baseline,
  // The renderer positions the destination rectangle from its bottom edge.
  // Convert the source-cell baseline into destination pixels so feet stay on
  // the same world surface for every animation size.
  offsetY: Math.round(drawSize - (baseline * drawSize) / CELL),
});

// Full-parity animation manifest. Source art is right-facing and is flipped
// by the renderer for left-facing movement. All frames share a 184px ground
// baseline inside their 192px cells.
export const JIMOTHY_ANIMATIONS = {
  small_idle: entry(0, 4, 3, true, 84),
  small_walk: entry(1, 4, 8, true, 84),
  small_run: entry(2, 4, 11, true, 84),
  small_jump: entry(3, 4, 8, false, 84),
  small_fall: entry(4, 4, 8, true, 84),
  small_land: entry(5, 4, 10, false, 84),
  small_hurt: entry(6, 4, 8, false, 84),
  small_skid: entry(7, 4, 10, false, 84),
  small_defeat: entry(8, 4, 6, false, 84),
  small_victory: entry(9, 4, 7, true, 84),
  large_idle: entry(10, 4, 3, true, 110),
  large_walk: entry(11, 4, 8, true, 110),
  large_run: entry(12, 4, 11, true, 110),
  large_jump: entry(13, 4, 8, false, 110),
  large_fall: entry(14, 4, 8, true, 110),
  large_land: entry(15, 4, 10, false, 110),
  large_tail_swipe: entry(16, 4, 14, false, 110),
  large_hurt: entry(17, 4, 8, false, 110),
  large_shrink: entry(18, 4, 10, false, 110),
  large_glide: entry(19, 4, 7, true, 110),
  large_skid: entry(20, 4, 10, false, 110),
  large_victory: entry(21, 4, 7, true, 110),
};

export const JIMOTHY_ANIMATION_BASELINES = Object.fromEntries(
  Object.entries(JIMOTHY_ANIMATIONS).map(([name, animation]) => [name, animation.baseline]),
);

// Reachable states that cannot share any of the legacy concept-sheet rows.
// The builder consumes this manifest directly, so this semantic ownership is
// tested alongside the production atlas rather than living in documentation.
export const JIMOTHY_SOURCE_STATE_IDENTITY = Object.freeze({
  small_land: Object.freeze({ semanticState: "land", source: "source/jimothy-land-source.png", frames: 4 }),
  large_land: Object.freeze({ semanticState: "land", source: "source/jimothy-land-source.png", frames: 4 }),
  small_defeat: Object.freeze({ semanticState: "defeat", source: "source/jimothy-defeat-source.png", frames: 4 }),
  small_victory: Object.freeze({ semanticState: "victory", source: "source/jimothy-victory-source.png", frames: 4 }),
  large_victory: Object.freeze({ semanticState: "victory", source: "source/jimothy-victory-source.png", frames: 4 }),
  large_glide: Object.freeze({ semanticState: "glide", source: "source/jimothy-large-glide-source.png", frames: 4 }),
});

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
