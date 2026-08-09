const animation = (row, frames, fps, loop = true) => Object.freeze({ row, frames, fps, loop });

// Level 1 presently exposes locomotion only, but its timing remains a
// state-local contract rather than a side effect of patrol movement speed.
export const LEVEL_ONE_ENEMY_ANIMATIONS = Object.freeze({
  snake: Object.freeze({ move: animation(4, 4, 7) }),
  pigeon: Object.freeze({ move: animation(0, 4, 7) }),
  wasp: Object.freeze({ move: animation(1, 4, 7) }),
  mosquito: Object.freeze({ move: animation(2, 4, 7) }),
  possum: Object.freeze({ move: animation(3, 4, 7) }),
  spider: Object.freeze({ move: animation(5, 4, 7) }),
  fox: Object.freeze({ move: animation(8, 4, 7) }),
});

export function levelOneEnemyAnimation(kind, state = "move") {
  const animationState = LEVEL_ONE_ENEMY_ANIMATIONS[kind]?.[state];
  if (!animationState) throw new RangeError(`Unknown Level 1 animation state "${kind}/${state}"`);
  return animationState;
}

export function levelOneEnemyAnimationFrame(kind, state, elapsed, phaseOffset = 0) {
  const animationState = levelOneEnemyAnimation(kind, state);
  const rawFrame = Math.floor(Math.max(0, elapsed) * animationState.fps);
  const seed = Math.floor(Math.abs(phaseOffset)) % animationState.frames;
  return animationState.loop
    ? (seed + rawFrame) % animationState.frames
    : Math.min(animationState.frames - 1, seed + rawFrame);
}
