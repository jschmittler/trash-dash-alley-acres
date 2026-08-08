export const BOSS_ARENA_LEFT = 5640;
export const BOSS_ARENA_RIGHT = 6600;
export const BOSS_ARENA_TRIGGER_X = 5680;
export const BOSS_ARENA_CAMERA_X = 5640;
export const BOSS_INTRO_DURATION = 1.1;

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

const defaultArena = Object.freeze({
  triggerX: BOSS_ARENA_TRIGGER_X,
  arenaStartX: BOSS_ARENA_LEFT,
  arenaEndX: BOSS_ARENA_RIGHT,
});

export function activateBossArena(enemies) {
  return {
    arenaActive: true,
    // Ordinary encounters belong to the level, not the boss arena. Removing
    // them entirely prevents stale draw/collision paths from resurrecting a
    // deactivated enemy during the camera runway.
    enemies: enemies.filter((enemy) => enemy.kind === "boss").map((enemy) => ({ ...enemy, active: true })),
  };
}

export function clampArenaPlayerX(x, width, arena = defaultArena) {
  return clamp(x, arena.arenaStartX + 24, arena.arenaEndX - width - 24);
}

export function clampArenaBossX(x, width, arena = defaultArena) {
  return clamp(x, arena.arenaStartX + 100, arena.arenaEndX - width - 36);
}

export function bossArenaCameraX(arena = defaultArena) {
  return arena.arenaStartX;
}
