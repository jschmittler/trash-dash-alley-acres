const entry = (row, frames, fps, loop) => ({ row, frames, fps, loop });

export const JIMOTHY_ANIMATIONS = {
  idle: entry(0, 4, 3, true),
  walk: entry(1, 4, 7, true),
  run: entry(2, 4, 11, true),
  jump: entry(3, 4, 8, false),
  fall: entry(4, 4, 8, true),
  forage: entry(5, 4, 5, true),
  paw_swipe: entry(6, 4, 10, false),
  roll: entry(7, 4, 10, true),
  climb: entry(8, 4, 8, true),
  eat: entry(9, 4, 6, true),
  groom: entry(10, 4, 5, true),
  hurt: entry(11, 4, 8, false),
};
