export const BOSS_ARENA_LEFT = 5640;
export const BOSS_ARENA_RIGHT = 6600;
export const BOSS_ARENA_TRIGGER_X = 5680;
export const BOSS_ARENA_CAMERA_X = 5640;

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export function activateBossArena(enemies) {
  return {
    arenaActive: true,
    enemies: enemies.map((enemy) => enemy.kind === "boss" ? { ...enemy } : { ...enemy, active: false }),
  };
}

export function clampArenaPlayerX(x, width) {
  return clamp(x, BOSS_ARENA_LEFT + 24, BOSS_ARENA_RIGHT - width - 24);
}

export function clampArenaBossX(x, width) {
  return clamp(x, BOSS_ARENA_LEFT + 100, BOSS_ARENA_RIGHT - width - 36);
}

export function bossArenaCameraX() {
  return BOSS_ARENA_CAMERA_X;
}
