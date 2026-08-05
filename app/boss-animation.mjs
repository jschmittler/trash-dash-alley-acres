const entry = (row, frames, fps, loop, drawWidth = 166, drawHeight = 166) => ({
  row, frames, fps, loop, drawWidth, drawHeight,
});

export const BOSS_ANIMATIONS = {
  idle: entry(0, 4, 3, true, 158, 158),
  walk: entry(1, 6, 8, true),
  windup: entry(2, 3, 6, false, 172, 158),
  charge: entry(3, 4, 8, false, 184, 152),
  recover: entry(4, 3, 7, false, 176, 158),
  hit: entry(5, 4, 8, false, 174, 166),
  rage: entry(6, 4, 6, false, 180, 170),
  defeat: entry(7, 6, 7, false, 184, 160),
};

export const BOSS_SEQUENCE_DURATIONS = {
  windup: 0.52,
  charge: 0.56,
  recover: 0.48,
  hit: 0.5,
  rage: 0.72,
  defeat: 0.9,
};

export function selectBossAnimation(input) {
  if (input.defeated) return "defeat";
  if (input.hit) return "hit";
  if (input.raging) return "rage";
  if (["windup", "charge", "recover"].includes(input.action)) return input.action;
  if (Math.abs(input.vx) >= 1) return "walk";
  return "idle";
}

export function bossAnimationFrame(animation, elapsed) {
  const raw = Math.floor(elapsed * animation.fps);
  return animation.loop ? raw % animation.frames : Math.min(animation.frames - 1, raw);
}

export function isBossChargeActive(frameIndex) {
  return frameIndex === 1 || frameIndex === 2;
}
