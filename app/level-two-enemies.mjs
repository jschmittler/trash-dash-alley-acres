const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const approach = (value, target, amount) => (
  value < target ? Math.min(target, value + amount) : Math.max(target, value - amount)
);

export const ATTACK_TELL_MIN = 0.35;
export const ATTACK_TELL_MAX = 0.65;

export const SQUIRREL_STATES = Object.freeze(["idle", "telegraph", "throw", "recover", "defeated"]);
export const TERRIER_STATES = Object.freeze(["sleep", "wake", "charge", "stunned", "recover", "defeated"]);
export const SKUNK_STATES = Object.freeze(["patrol", "telegraph", "spray", "recover", "defeated"]);
export const MOTH_STATES = Object.freeze(["orbit", "telegraph", "dive", "climb", "defeated"]);

export const LEVEL_TWO_ENEMY_COLLISION = Object.freeze({
  squirrel: Object.freeze([50, 36]),
  terrier: Object.freeze([64, 42]),
  skunk: Object.freeze([58, 38]),
  moth: Object.freeze([50, 34]),
});

const SQUIRREL_TELL = 0.48;
const TERRIER_TELL = 0.5;
const SKUNK_TELL = 0.52;
const MOTH_TELL = 0.42;

export const ATTACK_TELLS = Object.freeze({
  squirrel: SQUIRREL_TELL,
  terrier: TERRIER_TELL,
  skunk: SKUNK_TELL,
  moth: MOTH_TELL,
});

export function updateBinLid(lid, { tailSwipeHit = false } = {}) {
  if (!tailSwipeHit || lid.reflected) return { ...lid };
  return { ...lid, vx: 190, reflected: true };
}

export function reflectBinLidFromTail(lid, { tailSwipeHit = false, playerFacing = 1 } = {}) {
  if (!tailSwipeHit || lid.reflected) return { ...lid };
  const reflected = updateBinLid(lid, { tailSwipeHit: true });
  return { ...reflected, vx: Math.abs(reflected.vx) * (playerFacing < 0 ? -1 : 1) };
}

export function facingFromVelocity(vx, facing, deadZone = 8) {
  if (Math.abs(vx) <= deadZone) return facing;
  return vx < 0 ? -1 : 1;
}

export function updateSquirrel(squirrel, { dt, playerInRange = false, defeated = false }) {
  if (defeated || squirrel.state === "defeated") {
    return { ...squirrel, state: "defeated", timer: 0, vx: 0, spawnLid: false };
  }
  if (squirrel.state === "idle") {
    return playerInRange
      ? { ...squirrel, state: "telegraph", timer: SQUIRREL_TELL, vx: 0, spawnLid: false }
      : { ...squirrel, spawnLid: false };
  }
  const timer = Math.max(0, (squirrel.timer ?? 0) - dt);
  if (squirrel.state === "telegraph") {
    return timer === 0
      ? { ...squirrel, state: "throw", timer: 0.18, vx: 0, spawnLid: true }
      : { ...squirrel, timer, vx: 0, spawnLid: false };
  }
  if (squirrel.state === "throw") {
    return timer === 0
      ? { ...squirrel, state: "recover", timer: 0.65, vx: 0, spawnLid: false }
      : { ...squirrel, timer, vx: 0, spawnLid: false };
  }
  if (squirrel.state === "recover") {
    return timer === 0
      ? { ...squirrel, state: "idle", timer: 0, vx: squirrel.facing === -1 ? -42 : 42, spawnLid: false }
      : { ...squirrel, timer, vx: 0, spawnLid: false };
  }
  return { ...squirrel, spawnLid: false };
}

export function updateTerrier(terrier, context) {
  const {
    dt,
    patrolMinX,
    patrolMaxX,
    obstacleHit = false,
    obstacle = null,
    playerInRange = false,
    playerX = terrier.x,
    defeated = false,
  } = context;
  if (defeated || terrier.state === "defeated") {
    return { ...terrier, state: "defeated", timer: 0, vx: 0 };
  }
  if (terrier.state === "sleep") {
    return playerInRange
      ? { ...terrier, state: "wake", timer: TERRIER_TELL, vx: 0 }
      : { ...terrier, vx: 0 };
  }
  const timer = Math.max(0, (terrier.timer ?? 0) - dt);
  if (terrier.state === "wake") {
    if (timer > 0) return { ...terrier, timer, vx: 0 };
    const facing = playerX < terrier.x ? -1 : 1;
    return { ...terrier, state: "charge", timer: 0, facing, vx: facing * 420 };
  }
  if (terrier.state === "charge") {
    const targetX = terrier.x + terrier.vx * dt;
    const obstacleX = obstacle
      ? (terrier.vx < 0 ? obstacle.x + obstacle.w : obstacle.x - (terrier.w ?? 0))
      : targetX;
    const x = clamp(obstacleX, patrolMinX, patrolMaxX);
    const hitEdge = x === patrolMinX || x === patrolMaxX;
    return obstacle || obstacleHit || hitEdge
      ? { ...terrier, x, state: "stunned", timer: 0.58, vx: 0 }
      : { ...terrier, x };
  }
  if (terrier.state === "stunned") {
    return timer === 0
      ? { ...terrier, state: "recover", timer: 0.45, vx: 0 }
      : { ...terrier, timer, vx: 0 };
  }
  if (terrier.state === "recover") {
    return timer === 0
      ? { ...terrier, state: "sleep", timer: 0, vx: 0 }
      : { ...terrier, timer, vx: 0 };
  }
  return { ...terrier };
}

export function selectChargeObstacle(terrier, obstacles, dt) {
  if (!terrier.vx) return null;
  const targetX = terrier.x + terrier.vx * dt;
  const currentLeft = terrier.x;
  const currentRight = terrier.x + terrier.w;
  const targetLeft = targetX;
  const targetRight = targetX + terrier.w;
  const candidates = obstacles.filter((obstacle) => {
    const verticalOverlap = terrier.y < obstacle.y + obstacle.h && terrier.y + terrier.h > obstacle.y;
    if (!verticalOverlap) return false;
    const alreadyOverlapping = currentLeft < obstacle.x + obstacle.w && currentRight > obstacle.x;
    if (terrier.vx > 0) return alreadyOverlapping || (currentRight <= obstacle.x && targetRight >= obstacle.x);
    return alreadyOverlapping || (currentLeft >= obstacle.x + obstacle.w && targetLeft <= obstacle.x + obstacle.w);
  });
  return candidates.sort((left, right) => (
    terrier.vx > 0 ? left.x - right.x : (right.x + right.w) - (left.x + left.w)
  ))[0] ?? null;
}

export function levelTwoEnemyCanContactDamage(kind, state) {
  if (state === "defeated") return false;
  if (kind === "terrier" && (state === "stunned" || state === "recover")) return false;
  if (kind === "moth" && state === "climb") return false;
  return true;
}

export function levelTwoEnemyCanReceiveAttack(_kind, state) {
  return state !== "defeated";
}

export function updateSkunk(skunk, context) {
  const {
    dt,
    patrolMinX,
    patrolMaxX,
    playerInRange = false,
    defeated = false,
  } = context;
  if (defeated || skunk.state === "defeated") {
    return { ...skunk, state: "defeated", timer: 0, vx: 0, sprayActive: false };
  }
  if (skunk.state === "patrol") {
    if (playerInRange) {
      return { ...skunk, state: "telegraph", timer: SKUNK_TELL, vx: 0, sprayActive: false };
    }
    let x = clamp(skunk.x + skunk.vx * dt, patrolMinX, patrolMaxX);
    let vx = skunk.vx;
    if (x === patrolMinX) vx = Math.abs(vx);
    if (x === patrolMaxX) vx = -Math.abs(vx);
    return { ...skunk, x, vx, sprayActive: false };
  }
  const timer = Math.max(0, (skunk.timer ?? 0) - dt);
  if (skunk.state === "telegraph") {
    return timer === 0
      ? { ...skunk, state: "spray", timer: 0.34, vx: 0, sprayActive: true }
      : { ...skunk, timer, vx: 0, sprayActive: false };
  }
  if (skunk.state === "spray") {
    return timer === 0
      ? { ...skunk, state: "recover", timer: 0.62, vx: 0, sprayActive: false }
      : { ...skunk, timer, vx: 0, sprayActive: true };
  }
  if (skunk.state === "recover") {
    return timer === 0
      ? { ...skunk, state: "patrol", timer: 0, vx: skunk.facing === -1 ? -42 : 42, sprayActive: false }
      : { ...skunk, timer, vx: 0, sprayActive: false };
  }
  return { ...skunk, sprayActive: false };
}

export function updateSprinkler(object, { active = false, direction = 1 } = {}) {
  if (!active || (!object.reflected && !object.lightweight)) return { ...object };
  return { ...object, vx: direction < 0 ? -150 : 150 };
}

export function updateMoth(moth, context) {
  const {
    dt,
    lightX,
    flightY,
    flightBand = null,
    bandMinX: legacyMinX = lightX - 90,
    bandMaxX: legacyMaxX = lightX + 90,
    bandMinY: legacyMinY = flightY - 55,
    bandMaxY: legacyMaxY = flightY + 55,
    playerInRange = false,
    playerX = lightX,
    playerY = flightY + 170,
    defeated = false,
  } = context;
  const bandMinX = flightBand?.startX ?? legacyMinX;
  const bandMaxX = flightBand ? flightBand.endX - (moth.w ?? 0) : legacyMaxX;
  const bandMinY = flightBand?.minY ?? legacyMinY;
  const bandMaxY = flightBand ? flightBand.maxY - (moth.h ?? 0) : legacyMaxY;
  if (defeated || moth.state === "defeated") {
    return { ...moth, state: "defeated", timer: 0, vx: 0, vy: 0 };
  }
  if (moth.state === "orbit") {
    const phase = (moth.phase ?? 0) + dt * 2.2;
    const x = clamp(lightX + Math.sin(phase) * Math.min(72, (bandMaxX - bandMinX) / 2), bandMinX, bandMaxX);
    const y = clamp(flightY + Math.sin(phase * 2) * Math.min(34, (bandMaxY - bandMinY) / 2), bandMinY, bandMaxY);
    const vx = dt > 0 ? (x - moth.x) / dt : 0;
    const vy = dt > 0 ? (y - moth.y) / dt : 0;
    return playerInRange
      ? { ...moth, x, y, phase, state: "telegraph", timer: MOTH_TELL, vx, vy }
      : { ...moth, x, y, phase, vx, vy };
  }
  const timer = Math.max(0, (moth.timer ?? 0) - dt);
  if (moth.state === "telegraph") {
    if (timer > 0) return { ...moth, timer, vx: 0, vy: 0 };
    const direction = playerX < moth.x ? -1 : 1;
    return { ...moth, state: "dive", timer: 0.7, vx: direction * 150, vy: 240 };
  }
  if (moth.state === "dive") {
    const x = clamp(moth.x + (moth.vx ?? 0) * dt, bandMinX, bandMaxX);
    const diveTargetY = clamp(playerY, bandMinY, bandMaxY);
    const y = clamp(Math.min(diveTargetY, moth.y + (moth.vy ?? 240) * dt), bandMinY, bandMaxY);
    return timer === 0 || y === diveTargetY
      ? { ...moth, x, y, state: "climb", timer: 0, vx: 0, vy: -140 }
      : { ...moth, x, y, timer };
  }
  if (moth.state === "climb") {
    const x = approach(moth.x, lightX, 150 * dt);
    const y = approach(moth.y, flightY, 140 * dt);
    const vx = dt > 0 ? (x - moth.x) / dt : 0;
    const vy = dt > 0 ? (y - moth.y) / dt : 0;
    return x === lightX && y === flightY
      ? { ...moth, x: lightX, y: flightY, state: "orbit", timer: 0, vx, vy, phase: 0 }
      : { ...moth, x, y, vx, vy };
  }
  return { ...moth };
}

export function updateLevelTwoEnemy(enemy, context) {
  if (enemy.kind === "squirrel") return updateSquirrel(enemy, context);
  if (enemy.kind === "terrier") return updateTerrier(enemy, context);
  if (enemy.kind === "skunk") return updateSkunk(enemy, context);
  if (enemy.kind === "moth") return updateMoth(enemy, context);
  throw new RangeError(`Unknown Level 2 enemy kind "${enemy.kind}"`);
}

const animation = (row, frames, fps = 7, loop = false) => Object.freeze({ row, frames, fps, loop });

export const LEVEL_TWO_ENEMY_ANIMATIONS = Object.freeze({
  squirrel: Object.freeze({
    locomotion: animation(0, 4, 8, true), telegraph: animation(1, 4, 7), attack: animation(2, 4, 20),
    hit: animation(3, 2, 9), defeat: animation(4, 2, 5),
  }),
  terrier: Object.freeze({
    locomotion: animation(5, 4, 9, true), sleep: animation(6, 1, 1), telegraph: animation(6, 4, 7), attack: animation(7, 4, 12, true),
    hit: animation(8, 2, 9), defeat: animation(9, 2, 5),
  }),
  skunk: Object.freeze({
    locomotion: animation(10, 4, 7, true), telegraph: animation(11, 4, 7), attack: animation(12, 4, 12),
    hit: animation(13, 2, 9), defeat: animation(14, 2, 5),
  }),
  moth: Object.freeze({
    locomotion: animation(15, 4, 10, true), telegraph: animation(16, 4, 8), attack: animation(17, 4, 12, true),
    hit: animation(18, 2, 9), defeat: animation(19, 2, 6),
  }),
});

export function enemyAnimationFrame(animationState, elapsed) {
  const rawFrame = Math.floor(Math.max(0, elapsed) * animationState.fps);
  return animationState.loop
    ? rawFrame % animationState.frames
    : Math.min(animationState.frames - 1, rawFrame);
}

export function beginLevelTwoEnemyHit(enemy) {
  return {
    ...enemy,
    behaviorState: "defeated",
    visualState: "hit",
    visualTimer: 0.18,
    stateElapsed: 0,
    actionTimer: 0.55,
    vx: 0,
  };
}

export function advanceLevelTwoEnemyPlayback(enemy, dt) {
  const visualTimer = Math.max(0, (enemy.visualTimer ?? 0) - dt);
  const visualExpired = Boolean(enemy.visualState) && visualTimer === 0;
  return {
    ...enemy,
    visualState: visualExpired ? null : enemy.visualState ?? null,
    visualTimer,
    stateElapsed: visualExpired ? 0 : (enemy.stateElapsed ?? 0) + dt,
  };
}

export function applyLevelTwoBehaviorTransition(enemy, state) {
  return {
    ...enemy,
    behaviorState: state,
    stateElapsed: state !== enemy.behaviorState && !enemy.visualState ? 0 : enemy.stateElapsed,
  };
}

export function levelTwoEnemyAnimation(kind, state) {
  const animations = LEVEL_TWO_ENEMY_ANIMATIONS[kind];
  if (!animations) return null;
  if (state === "defeated") return animations.defeat;
  if (state === "hit") return animations.hit;
  if (kind === "terrier" && state === "sleep") return animations.sleep;
  if (state === "telegraph" || state === "wake") return animations.telegraph;
  if (state === "throw" || state === "charge" || state === "spray" || state === "dive") return animations.attack;
  if (state === "stunned" || state === "recover" || (kind === "moth" && state === "climb")) return animations.hit;
  return animations.locomotion;
}

export const ENCOUNTER_TEST_ROUTES = Object.freeze({
  squirrel: Object.freeze({
    encounterId: "backyard-squirrel-tutorial", playerX: 620, playerSurfaceId: "backyard-lawn", cameraX: 430,
    environment: Object.freeze([{ id: "backyard-bin-lids", kind: "bin-lid-source", x: 900, y: 306, w: 46, h: 18 }]),
  }),
  terrier: Object.freeze({
    encounterId: "street-terrier-tutorial", playerX: 1370, playerSurfaceId: "street-ground", cameraX: 1230,
    environment: Object.freeze([{ id: "street-charge-bin", kind: "charge-obstacle", x: 2440, y: 400, w: 54, h: 68 }]),
  }),
  skunk: Object.freeze({
    encounterId: "obstacle-skunk-tutorial", playerX: 2780, playerSurfaceId: "obstacle-lawn", cameraX: 2660,
    environment: Object.freeze([{ id: "tutorial-sprinkler", kind: "sprinkler", x: 3060, y: 444, w: 34, h: 24 }]),
  }),
  moth: Object.freeze({
    encounterId: "porch-light-moth-introduction", playerX: 3890, playerSurfaceId: "poolside-ledge", cameraX: 3540,
    environment: Object.freeze([{ id: "porch-light", kind: "porch-light", x: 4020, y: 220, w: 20, h: 20, flightBand: "porch-light-orbit" }]),
  }),
  interaction: Object.freeze({
    encounterId: "obstacle-interaction-test", playerX: 3260, playerSurfaceId: "obstacle-lawn", cameraX: 3120,
    environment: Object.freeze([
      { id: "interaction-bin-lids", kind: "bin-lid-source", x: 3700, y: 226, w: 46, h: 18 },
      { id: "interaction-sprinkler", kind: "sprinkler", x: 3480, y: 444, w: 34, h: 24 },
    ]),
  }),
});

export function levelTwoEnvironmentRecords() {
  return Object.values(ENCOUNTER_TEST_ROUTES).flatMap((route) => (
    route.environment.map((item) => ({ ...item, encounterId: route.encounterId }))
  ));
}

export function selectEncounterTestRoute(level, routeName) {
  const route = ENCOUNTER_TEST_ROUTES[routeName];
  if (!route) throw new RangeError(`Unknown encounter test "${routeName}"`);
  const encounter = level.encounters.find(({ id }) => id === route.encounterId);
  if (!encounter) throw new RangeError(`Missing authored encounter "${route.encounterId}"`);
  if (!level.surfaces.some(({ id }) => id === route.playerSurfaceId)) {
    throw new RangeError(`Missing encounter test surface "${route.playerSurfaceId}"`);
  }
  for (const item of route.environment) {
    if (item.flightBand && !level.flightBands?.some(({ id }) => id === item.flightBand)) {
      throw new RangeError(`Missing encounter test flight band "${item.flightBand}"`);
    }
  }
  return {
    ...route,
    encounter,
    encounters: [encounter],
    environment: route.environment.map((item) => ({ ...item, encounterId: encounter.id })),
  };
}
