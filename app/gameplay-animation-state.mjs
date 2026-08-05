export const POSSUM_CHASE_RADIUS = 250;
export const POSSUM_FACING_DEAD_ZONE = 18;
export const BOSS_WALK_FRAMES = [0, 1, 2, 3, 2, 1];

const facingFromVelocity = (vx, fallback) => (
  Math.abs(vx) >= 1 ? (vx < 0 ? -1 : 1) : fallback
);

export function nextEnemyIntent({ kind, enemyX, originX, playerX, vx, facing }) {
  let nextVelocity = vx;

  if (kind === "possum") {
    const distance = playerX - enemyX;
    if (
      Math.abs(distance) > POSSUM_FACING_DEAD_ZONE
      && Math.abs(distance) < POSSUM_CHASE_RADIUS
    ) {
      nextVelocity = Math.sign(distance) * 105;
    } else if (
      Math.abs(distance) >= POSSUM_CHASE_RADIUS
      && Math.abs(enemyX - originX) > 72
    ) {
      nextVelocity = Math.sign(originX - enemyX) * 55;
    }
  }

  return {
    vx: nextVelocity,
    facing: facingFromVelocity(nextVelocity, facing),
  };
}

export function bossFrameIndex(phase) {
  return BOSS_WALK_FRAMES[Math.floor(phase) % BOSS_WALK_FRAMES.length];
}

export function bossAnimationState(hitCooldown) {
  return hitCooldown > 0 ? "hit" : "walking";
}
