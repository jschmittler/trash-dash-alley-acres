const VISIBLE_BOTTOM_OFFSET = Object.freeze({
  trash: 36,
  taco: 46,
  cap: 35,
});

export function pickupVisibleBottom(kind, y) {
  const offset = VISIBLE_BOTTOM_OFFSET[kind];
  if (offset === undefined) throw new Error(`Unknown pickup kind: ${kind}`);
  return y + offset;
}

export function pickupYAboveSurface(kind, surfaceY, gap = 18) {
  const offset = VISIBLE_BOTTOM_OFFSET[kind];
  if (offset === undefined) throw new Error(`Unknown pickup kind: ${kind}`);
  return Math.round(surfaceY - offset - gap);
}
