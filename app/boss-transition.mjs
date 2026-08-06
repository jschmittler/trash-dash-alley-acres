// The runway is deliberately long enough for the player to read the arena
// before control is handed back. Keeping this value in the pure transition
// module makes the camera behavior deterministic in tests and in the game.
export const BOSS_TRANSITION_DURATION = 1.1;

export function createBossTransition(cameraX) {
  return { fromCameraX: cameraX, lastCameraX: cameraX, targetCameraX: cameraX, elapsed: 0 };
}

export function advanceBossTransition(transition, dt, targetCameraX) {
  const elapsed = Math.min(BOSS_TRANSITION_DURATION, transition.elapsed + Math.max(0, dt));
  const progress = elapsed / BOSS_TRANSITION_DURATION;
  const eased = progress * progress * (3 - 2 * progress);
  // The boss camera only travels forward. This also makes the transition safe
  // if a stale/retargeted camera value is passed while the runway is active.
  const destination = Math.max(
    transition.fromCameraX,
    transition.targetCameraX ?? transition.fromCameraX,
    targetCameraX,
  );
  const proposedCameraX = transition.fromCameraX + (destination - transition.fromCameraX) * eased;
  const cameraX = Math.max(transition.lastCameraX ?? transition.fromCameraX, proposedCameraX);
  return {
    cameraX,
    transition: { ...transition, elapsed, lastCameraX: cameraX, targetCameraX: destination },
    complete: elapsed >= BOSS_TRANSITION_DURATION,
  };
}
