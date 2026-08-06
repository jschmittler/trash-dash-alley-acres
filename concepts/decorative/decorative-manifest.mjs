/** Canonical geometry for the side-on decorative atlas. */
export const DECORATIVE_PROPS = Object.freeze({
  bush: Object.freeze({ frame: Object.freeze({ row: 0, column: 0, width: 256, height: 256 }), sourceWidth: 224, sourceHeight: 136, baseline: 232, shadowOffset: 6 }),
  tree: Object.freeze({ frame: Object.freeze({ row: 0, column: 1, width: 256, height: 256 }), sourceWidth: 149, sourceHeight: 224, baseline: 232, shadowOffset: 8 }),
  bin: Object.freeze({ frame: Object.freeze({ row: 0, column: 2, width: 256, height: 256 }), sourceWidth: 182, sourceHeight: 224, baseline: 232, shadowOffset: 8 }),
  crate: Object.freeze({ frame: Object.freeze({ row: 1, column: 0, width: 256, height: 256 }), sourceWidth: 224, sourceHeight: 169, baseline: 232, shadowOffset: 6 }),
  checkpoint: Object.freeze({ frame: Object.freeze({ row: 1, column: 1, width: 256, height: 256 }), sourceWidth: 224, sourceHeight: 176, baseline: 232, shadowOffset: 7 }),
  tires: Object.freeze({ frame: Object.freeze({ row: 1, column: 2, width: 256, height: 256 }), sourceWidth: 224, sourceHeight: 115, baseline: 232, shadowOffset: 6 }),
});

export const platformStrips = Object.freeze({
  branch: Object.freeze({
    height: 128,
    left: Object.freeze({ x: 0, y: 0, width: 128, height: 128 }),
    middle: Object.freeze({ x: 128, y: 0, width: 128, height: 128 }),
    right: Object.freeze({ x: 256, y: 0, width: 128, height: 128 }),
  }),
  metal: Object.freeze({
    height: 128,
    left: Object.freeze({ x: 0, y: 0, width: 128, height: 128 }),
    middle: Object.freeze({ x: 128, y: 0, width: 128, height: 128 }),
    right: Object.freeze({ x: 256, y: 0, width: 128, height: 128 }),
  }),
});

export const DECORATIVE_PROP_ORDER = Object.freeze(["bush", "tree", "bin", "crate", "checkpoint", "tires"]);
