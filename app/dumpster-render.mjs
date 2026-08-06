export const DUMPSTER_DRAW_WIDTH = 220;
export const DUMPSTER_DRAW_HEIGHT = 180;
export const DUMPSTER_IDLE_FPS = 0;
export const DUMPSTER_STINK_FPS = 2;

export function dumpsterFrameIndex(elapsed, bossDefeated = false) {
  if (!bossDefeated) return 0;
  return Math.floor(Math.max(0, elapsed) * DUMPSTER_STINK_FPS) % 4;
}

export function dumpsterDrawRect(worldX, cameraX, groundY) {
  return {
    x: worldX - cameraX,
    y: groundY - DUMPSTER_DRAW_HEIGHT,
    width: DUMPSTER_DRAW_WIDTH,
    height: DUMPSTER_DRAW_HEIGHT,
  };
}
