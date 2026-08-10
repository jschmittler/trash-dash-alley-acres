import { dumpsterCollisionRect, dumpsterPlacementFootprint } from "./dumpster-render.mjs";
import { decorativeCollisionRect } from "./decorative-render.mjs";
import { rectIntersectionArea, validateFootprintSeparation } from "./world-placement.mjs";

export const BOSS_ARENA_LEFT = 5640;
export const BOSS_ARENA_RIGHT = 6600;
export const BOSS_ARENA_TRIGGER_X = 5680;
export const BOSS_ARENA_CAMERA_X = 5640;
export const BOSS_INTRO_DURATION = 1.1;
export const BOSS_ENTRY_MOTION_LIMITS = Object.freeze({
  maximumStepSeconds: 0.033,
  maximumRunSpeed: 330,
  maximumPlayerWidth: 38,
  minimumClearance: 6,
});

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export function advanceBossArenaEntryX(playerX, {
  speed = BOSS_ENTRY_MOTION_LIMITS.maximumRunSpeed,
  dt = BOSS_ENTRY_MOTION_LIMITS.maximumStepSeconds,
} = {}) {
  const boundedSpeed = clamp(Number.isFinite(speed) ? speed : 0, 0, BOSS_ENTRY_MOTION_LIMITS.maximumRunSpeed);
  const boundedDt = clamp(Number.isFinite(dt) ? dt : 0, 0, BOSS_ENTRY_MOTION_LIMITS.maximumStepSeconds);
  return playerX + boundedSpeed * boundedDt;
}

export function latestSafeBossArenaTriggerX(firstPlatformX, limits = BOSS_ENTRY_MOTION_LIMITS) {
  const worstStep = limits.maximumRunSpeed * limits.maximumStepSeconds;
  return Math.floor(firstPlatformX - limits.maximumPlayerWidth - limits.minimumClearance - worstStep);
}

const defaultArena = Object.freeze({
  triggerX: BOSS_ARENA_TRIGGER_X,
  arenaStartX: BOSS_ARENA_LEFT,
  arenaEndX: BOSS_ARENA_RIGHT,
});

const bossTestRoutes = Object.freeze({
  "1": Object.freeze({ levelId: "level-1", playerX: 5590, checkpointX: 5590, cameraX: 5280, glider: 0 }),
  arena: Object.freeze({ levelId: "level-1", playerX: 5690, checkpointX: 5590, cameraX: 5280, glider: 0 }),
  brutus: Object.freeze({ levelId: "level-2", playerX: 5680, checkpointX: 5200, cameraX: 5650, glider: 14, activateArena: true }),
});

export function selectBossTestRoute(routeName) {
  return bossTestRoutes[routeName] ?? null;
}

export function activateBossArena(enemies) {
  return {
    arenaActive: true,
    // Ordinary encounters belong to the level, not the boss arena. Removing
    // them entirely prevents stale draw/collision paths from resurrecting a
    // deactivated enemy during the camera runway.
    enemies: enemies.filter((enemy) => enemy.kind === "boss").map((enemy) => ({ ...enemy, active: true })),
  };
}

export function completeBossArena() {
  return {
    arenaActive: false,
    bossDefeated: true,
    bossTransition: null,
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

export function validateBossArenaPlacement(level, {
  minimumRunway = 360,
  maximumJumpRise = 140,
} = {}) {
  const errors = [];
  const arena = level?.boss;
  if (!arena) return [`${level?.id ?? "unknown"}: missing boss arena`];
  if (arena.triggerX - arena.runwayStartX < minimumRunway) {
    errors.push(`${level.id}: boss runway is shorter than ${minimumRunway}px`);
  }
  const floor = level.surfaces.find(({ id }) => id === arena.surfaceId);
  if (!floor) errors.push(`${level.id}: missing boss floor ${arena.surfaceId}`);
  if (arena.spawnX !== undefined && (arena.spawnX < arena.arenaStartX || arena.spawnX > arena.arenaEndX)) {
    errors.push(`${level.id}: boss spawn is outside arena`);
  }
  if (arena.recoveryX !== undefined && (arena.recoveryX < arena.arenaStartX || arena.recoveryX > arena.arenaEndX)) {
    errors.push(`${level.id}: boss recovery point is outside arena`);
  }
  for (const prop of [arena.hydrant].filter(Boolean)) {
    if (prop.surfaceId !== arena.surfaceId || (floor && prop.y + prop.h !== floor.y)) {
      errors.push(`${level.id}/${prop.id}: boss prop is not grounded on ${arena.surfaceId}`);
    }
  }
  const platforms = level.surfaces.filter(({ id }) => id.startsWith("brutus-platform-"));
  if (platforms.length > 0) {
    if (platforms.length !== 2) errors.push(`${level.id}: boss utility platforms must be a symmetric pair`);
    const [left, right] = platforms.toSorted((a, b) => a.x - b.x);
    if (left && right) {
      const arenaCenter = (arena.arenaStartX + arena.arenaEndX) / 2;
      const leftOffset = arenaCenter - (left.x + left.w / 2);
      const rightOffset = right.x + right.w / 2 - arenaCenter;
      if (Math.abs(leftOffset - rightOffset) > 1) errors.push(`${level.id}: boss utility platforms are asymmetric`);
      if (floor && (floor.y - left.y > maximumJumpRise || floor.y - right.y > maximumJumpRise)) {
        errors.push(`${level.id}: boss utility platform exceeds normal jump reach`);
      }
      if (left.x < arena.arenaStartX || right.x + right.w > arena.arenaEndX) {
        errors.push(`${level.id}: boss utility platform leaves arena bounds`);
      }
      const worstStepEntryX = advanceBossArenaEntryX(arena.triggerX);
      const triggerViolatesPlatformClearance = [left, right].some((platform) => (
        worstStepEntryX < platform.x + platform.w
        && worstStepEntryX
          + BOSS_ENTRY_MOTION_LIMITS.maximumPlayerWidth
          + BOSS_ENTRY_MOTION_LIMITS.minimumClearance > platform.x
      ));
      if (triggerViolatesPlatformClearance) {
        errors.push(`${level.id}: boss entry worst step violates utility-platform clearance`);
      }
    }
  }
  if (arena.victoryDumpster) {
    const support = level.surfaces.find(({ id }) => id === arena.victoryDumpster.surfaceId);
    if (!support) {
      errors.push(`${level.id}: missing victory dumpster support ${arena.victoryDumpster.surfaceId}`);
    } else {
      const playerRoute = {
        x: arena.postBossStartX,
        y: support.y - 58,
        w: level.exit.x - 220 + 38 - arena.postBossStartX,
        h: 58,
      };
      const crateFootprints = platforms.flatMap((platform) => [
        {
          id: `${platform.id}-visual`,
          ownerId: platform.id,
          bounds: { x: platform.x, y: platform.y, w: platform.w, h: platform.h },
        },
        {
          id: `${platform.id}-collision`,
          ownerId: platform.id,
          bounds: decorativeCollisionRect("crate", platform.x, support.y),
        },
      ]);
      const footprints = [
        ...crateFootprints,
        { id: "victory-dumpster-glow", ownerId: "victory-dumpster", bounds: dumpsterPlacementFootprint(arena.victoryDumpster.x, support.y) },
        { id: "victory-dumpster-collision", ownerId: "victory-dumpster", bounds: dumpsterCollisionRect(arena.victoryDumpster.x, support.y) },
        { id: "post-boss-player-route", bounds: playerRoute },
      ];
      errors.push(...validateFootprintSeparation(footprints)
        .map((error) => `${level.id}: ${error}`));
      const dumpster = dumpsterPlacementFootprint(arena.victoryDumpster.x, support.y);
      const activeArena = {
        x: arena.arenaStartX,
        y: 0,
        w: arena.arenaEndX - arena.arenaStartX,
        h: support.y,
      };
      if (
        rectIntersectionArea(dumpster, activeArena) > 0
        || rectIntersectionArea(dumpsterCollisionRect(arena.victoryDumpster.x, support.y), activeArena) > 0
      ) {
        errors.push(`${level.id}: victory dumpster enters forbidden active boss arena`);
      }
      if (dumpster.y + dumpster.h !== support.y || dumpster.x + dumpster.w > level.worldWidth) {
        errors.push(`${level.id}: victory dumpster is not grounded inside world bounds`);
      }
    }
  }
  return errors;
}
