export const BOSS_TRANSITION_DURATION = 0.9;

export function createBossTransition(cameraX) {
  return { fromCameraX: cameraX, elapsed: 0 };
}

export function advanceBossTransition(transition, dt, targetCameraX) {
  const elapsed = Math.min(BOSS_TRANSITION_DURATION, transition.elapsed + Math.max(0, dt));
  const progress = elapsed / BOSS_TRANSITION_DURATION;
  const eased = progress * progress * (3 - 2 * progress);
  return {
    cameraX: transition.fromCameraX + (targetCameraX - transition.fromCameraX) * eased,
    transition: { ...transition, elapsed },
    complete: elapsed >= BOSS_TRANSITION_DURATION,
  };
}
