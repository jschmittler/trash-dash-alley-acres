export const POSSUM_CHASE_RADIUS = 250;
export const POSSUM_FACING_DEAD_ZONE = 18;
export const PLAYER_HURT_DURATION = 0.48;

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

export function beginPlayerHurt({
  large,
  lives,
  invulnerable,
  hurtTimer,
  direction,
}) {
  if (lives <= 0 || invulnerable > 0 || hurtTimer > 0) return null;

  return {
    timer: PLAYER_HURT_DURATION,
    outcome: large ? "shrink" : lives > 1 ? "respawn" : "gameover",
    vx: direction * 190,
    vy: -280,
  };
}

export function advanceHurtTimer(timer, dt) {
  const nextTimer = Math.max(0, timer - dt);
  return {
    timer: nextTimer,
    complete: timer > 0 && nextTimer === 0,
  };
}

export function resolvePitFall(lives) {
  const nextLives = Math.max(0, lives - 1);
  return {
    lives: nextLives,
    outcome: nextLives > 0 ? "respawn" : "gameover",
  };
}
