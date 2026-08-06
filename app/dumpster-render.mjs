/**
 * The dumpster has one canonical destination footprint.  The atlas rows only
 * change its treatment: row 0 is the sealed, dormant goal and row 1 is the
 * restored holy-grail reveal.
 */
export const DUMPSTER_CELL = 192;
export const DUMPSTER_FRAME_COUNT = 4;
export const DUMPSTER_DRAW_WIDTH = 220;
export const DUMPSTER_DRAW_HEIGHT = 180;
export const DUMPSTER_HOLY_FPS = 1.25;
export const DUMPSTER_REVEAL_DURATION = 0.8;

export const DUMPSTER_STATES = Object.freeze({
  sealed: Object.freeze({ row: 0, loop: false }),
  holy: Object.freeze({ row: 1, loop: true }),
});

export function selectDumpsterState(bossDefeated) {
  return bossDefeated ? "holy" : "sealed";
}

export function dumpsterFrameIndex(elapsed, state = "sealed") {
  if (state === "sealed") return 0;
  const seconds = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  return Math.floor(seconds * DUMPSTER_HOLY_FPS) % DUMPSTER_FRAME_COUNT;
}

export function dumpsterFrame(state, elapsed = 0) {
  const selected = DUMPSTER_STATES[state] ?? DUMPSTER_STATES.sealed;
  return {
    source: [dumpsterFrameIndex(elapsed, state) * DUMPSTER_CELL, selected.row * DUMPSTER_CELL, DUMPSTER_CELL, DUMPSTER_CELL],
    row: selected.row,
    index: dumpsterFrameIndex(elapsed, state),
  };
}

export function dumpsterDrawRect(worldX, cameraX, groundY) {
  return {
    x: worldX - cameraX,
    y: groundY - DUMPSTER_DRAW_HEIGHT,
    width: DUMPSTER_DRAW_WIDTH,
    height: DUMPSTER_DRAW_HEIGHT,
  };
}

export function dumpsterRevealProgress(elapsedSinceDefeat) {
  const seconds = Number.isFinite(elapsedSinceDefeat) ? Math.max(0, elapsedSinceDefeat) : 0;
  const linear = Math.min(1, seconds / DUMPSTER_REVEAL_DURATION);
  // Smoothstep gives the reveal a gentle ease-in/ease-out without moving the
  // destination rectangle or changing the dumpster's contact baseline.
  return linear * linear * (3 - 2 * linear);
}
