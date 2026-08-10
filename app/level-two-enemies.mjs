const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const approach = (value, target, amount) => (
  value < target ? Math.min(target, value + amount) : Math.max(target, value - amount)
);

export const ATTACK_TELL_MIN = 0.35;
export const ATTACK_TELL_MAX = 0.65;

export const SQUIRREL_STATES = Object.freeze([
  "idle", "throw-anticipation", "throw-release", "throw-follow-through", "throw-recover", "defeated",
]);
export const TERRIER_STATES = Object.freeze([
  "sleep", "sit", "wake", "charge", "impact", "hit", "recover", "defeated",
]);
export const SKUNK_STATES = Object.freeze(["patrol", "telegraph", "spray", "recover", "defeated"]);
export const MOTH_STATES = Object.freeze(["orbit", "telegraph", "dive", "climb", "defeated"]);

export const LEVEL_TWO_ENEMY_COLLISION = Object.freeze({
  squirrel: Object.freeze([50, 36]),
  terrier: Object.freeze([64, 42]),
  skunk: Object.freeze([58, 38]),
  moth: Object.freeze([50, 34]),
});

export const LEVEL_TWO_ENEMY_RENDER = Object.freeze({
  squirrel: Object.freeze({ drawWidth: 78, drawHeight: 76, anchor: "ground" }),
  terrier: Object.freeze({ drawWidth: 94, drawHeight: 82, anchor: "ground" }),
  skunk: Object.freeze({ drawWidth: 90, drawHeight: 78, anchor: "ground" }),
  moth: Object.freeze({ drawWidth: 84, drawHeight: 82, anchor: "center" }),
});

export const LEVEL_TWO_ENEMY_DRAW_GEOMETRY = Object.freeze({
  squirrel: Object.freeze({ drawWidth: 76, drawHeight: 76, anchor: "ground" }),
  terrier: Object.freeze({ drawWidth: 82, drawHeight: 82, anchor: "ground" }),
  skunk: Object.freeze({ drawWidth: 78, drawHeight: 78, anchor: "ground" }),
  moth: Object.freeze({ drawWidth: 82, drawHeight: 82, anchor: "center" }),
});

const LEVEL_TWO_MOTION_CELL = 192;
const LEVEL_TWO_GROUND_INSET = 16;

export function levelTwoEnemyDrawRect(enemy, renderX = enemy.x) {
  const render = LEVEL_TWO_ENEMY_DRAW_GEOMETRY[enemy.kind];
  if (!render) throw new RangeError(`Unknown Level 2 render kind "${enemy.kind}"`);
  const x = renderX + enemy.w / 2 - render.drawWidth / 2;
  if (render.anchor === "center") {
    return {
      x,
      y: enemy.y + enemy.h / 2 - render.drawHeight / 2,
      w: render.drawWidth,
      h: render.drawHeight,
    };
  }
  return {
    x,
    y: enemy.y + enemy.h - render.drawHeight + render.drawHeight * (LEVEL_TWO_GROUND_INSET / LEVEL_TWO_MOTION_CELL),
    w: render.drawWidth,
    h: render.drawHeight,
  };
}

const SQUIRREL_TELL = 0.48;
const SKUNK_TELL = 0.52;
const MOTH_TELL = 0.42;

export const SQUIRREL_THROW = Object.freeze({
  anticipation: SQUIRREL_TELL,
  release: 0.12,
  followThrough: 0.22,
  recover: 0.45,
  pawOffset: Object.freeze({ x: 30, y: 12 }),
  projectile: Object.freeze({ w: 28, h: 10, speed: 140 }),
});

export function squirrelThrowAttachment(squirrel, facing = 1) {
  return {
    x: squirrel.x + squirrel.w / 2 + (facing < 0 ? -1 : 1) * SQUIRREL_THROW.pawOffset.x,
    y: squirrel.y + SQUIRREL_THROW.pawOffset.y,
  };
}

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
    return { ...squirrel, state: "defeated", timer: 0, vx: 0, spawnAcorn: false };
  }
  if (squirrel.state === "idle") {
    return playerInRange
      ? { ...squirrel, state: "throw-anticipation", timer: SQUIRREL_THROW.anticipation, vx: 0, spawnAcorn: false }
      : { ...squirrel, spawnAcorn: false };
  }
  const timer = Math.max(0, (squirrel.timer ?? 0) - dt);
  if (squirrel.state === "throw-anticipation") {
    return timer === 0
      ? { ...squirrel, state: "throw-release", timer: SQUIRREL_THROW.release, vx: 0, spawnAcorn: true }
      : { ...squirrel, timer, vx: 0, spawnAcorn: false };
  }
  if (squirrel.state === "throw-release") {
    return timer === 0
      ? { ...squirrel, state: "throw-follow-through", timer: SQUIRREL_THROW.followThrough, vx: 0, spawnAcorn: false }
      : { ...squirrel, timer, vx: 0, spawnAcorn: false };
  }
  if (squirrel.state === "throw-follow-through") {
    return timer === 0
      ? { ...squirrel, state: "throw-recover", timer: SQUIRREL_THROW.recover, vx: 0, spawnAcorn: false }
      : { ...squirrel, timer, vx: 0, spawnAcorn: false };
  }
  if (squirrel.state === "throw-recover") {
    return timer === 0
      ? { ...squirrel, state: "idle", timer: 0, vx: squirrel.facing === -1 ? -42 : 42, spawnAcorn: false }
      : { ...squirrel, timer, vx: 0, spawnAcorn: false };
  }
  return { ...squirrel, spawnAcorn: false };
}

export function updateTerrier(terrier, context) {
  const {
    dt,
    patrolMinX,
    patrolMaxX,
    obstacleHit = false,
    obstacle = null,
    playerInRange,
    playerX = terrier.x,
    defeated = false,
  } = context;
  if (defeated || terrier.state === "defeated") {
    return { ...terrier, state: "defeated", timer: 0, vx: 0 };
  }
  if (terrier.state === "sleep" || terrier.state === "sit") {
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
    if (playerInRange === false) {
      return { ...terrier, state: "sit", timer: 0, vx: 0, resumeFacing: null };
    }
    const targetX = terrier.x + terrier.vx * dt;
    const obstacleX = obstacle
      ? (terrier.vx < 0 ? obstacle.x + obstacle.w : obstacle.x - (terrier.w ?? 0))
      : targetX;
    const x = clamp(obstacleX, patrolMinX, patrolMaxX);
    const hitEdge = x === patrolMinX || x === patrolMaxX;
    return obstacle || obstacleHit || hitEdge
      ? {
          ...terrier,
          x,
          state: "impact",
          timer: TERRIER_SEQUENCE_DURATIONS.impact,
          vx: 0,
          resumeFacing: terrier.facing === -1 ? 1 : -1,
        }
      : { ...terrier, x };
  }
  if (terrier.state === "impact") {
    return timer === 0
      ? { ...terrier, state: "recover", timer: TERRIER_SEQUENCE_DURATIONS.recover, vx: 0 }
      : { ...terrier, timer, vx: 0 };
  }
  if (terrier.state === "hit") {
    return timer === 0
      ? { ...terrier, state: "recover", timer: TERRIER_SEQUENCE_DURATIONS.recover, vx: 0 }
      : { ...terrier, timer, vx: 0 };
  }
  if (terrier.state === "recover") {
    if (timer > 0) return { ...terrier, timer, vx: 0 };
    const facing = terrier.resumeFacing ?? terrier.facing ?? 1;
    return { ...terrier, state: "charge", timer: 0, facing, vx: facing * 420, resumeFacing: null };
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
  if (kind === "terrier" && (state === "impact" || state === "hit" || state === "recover")) return false;
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
  const render = LEVEL_TWO_ENEMY_RENDER.moth;
  const visualPadX = flightBand ? Math.max(0, (render.drawWidth - (moth.w ?? 0)) / 2) : 0;
  const visualPadY = flightBand ? Math.max(0, (render.drawHeight - (moth.h ?? 0)) / 2) : 0;
  const bandMinX = flightBand ? flightBand.startX + visualPadX : legacyMinX;
  const bandMaxX = flightBand ? flightBand.endX - (moth.w ?? 0) - visualPadX : legacyMaxX;
  const bandMinY = flightBand ? flightBand.minY + visualPadY : legacyMinY;
  const bandMaxY = flightBand ? flightBand.maxY - (moth.h ?? 0) - visualPadY : legacyMaxY;
  const targetLightX = clamp(lightX, bandMinX, bandMaxX);
  const targetFlightY = clamp(flightY, bandMinY, bandMaxY);
  if (defeated || moth.state === "defeated") {
    return { ...moth, state: "defeated", timer: 0, vx: 0, vy: 0 };
  }
  if (moth.state === "orbit") {
    const phase = (moth.phase ?? 0) + dt * 2.2;
    const x = clamp(targetLightX + Math.sin(phase) * Math.min(72, (bandMaxX - bandMinX) / 2), bandMinX, bandMaxX);
    const y = clamp(targetFlightY + Math.sin(phase * 2) * Math.min(34, (bandMaxY - bandMinY) / 2), bandMinY, bandMaxY);
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
    const x = approach(moth.x, targetLightX, 150 * dt);
    const y = approach(moth.y, targetFlightY, 140 * dt);
    const vx = dt > 0 ? (x - moth.x) / dt : 0;
    const vy = dt > 0 ? (y - moth.y) / dt : 0;
    return x === targetLightX && y === targetFlightY
      ? { ...moth, x: targetLightX, y: targetFlightY, state: "orbit", timer: 0, vx, vy, phase: 0 }
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

const animation = (row, frames, fps = 7, loop = false, startFrame = 0) => Object.freeze({ row, frames, fps, loop, startFrame });

export const LEVEL_TWO_ENEMY_ANIMATIONS = Object.freeze({
  squirrel: Object.freeze({
    locomotion: animation(0, 4, 8, true), telegraph: animation(1, 4, 7), attack: animation(2, 4, 20),
    anticipation: animation(2, 1, 1, false, 0), release: animation(2, 1, 1, false, 1),
    followThrough: animation(2, 1, 1, false, 2), recover: animation(2, 1, 1, false, 3),
    hit: animation(3, 2, 9), defeat: animation(4, 2, 5),
  }),
  terrier: Object.freeze({
    locomotion: animation(5, 4, 9, true), sleep: animation(6, 1, 1), sit: animation(6, 1, 1, false, 3),
    wake: animation(6, 2, 5, false, 1), telegraph: animation(6, 2, 5, false, 1),
    charge: animation(7, 4, 12, true), attack: animation(7, 4, 12, true),
    impact: animation(8, 2, 9), hit: animation(8, 2, 9, false, 2),
    recover: animation(9, 4, 7), defeat: animation(10, 2, 5),
  }),
  skunk: Object.freeze({
    locomotion: animation(11, 4, 7, true), telegraph: animation(12, 4, 7), attack: animation(13, 4, 12),
    // The last spray cell is the authored follow-through/recovery pose.
    recover: animation(13, 1, 6, false, 3), hit: animation(14, 2, 9), defeat: animation(15, 2, 5),
  }),
  moth: Object.freeze({
    locomotion: animation(16, 4, 10, true), telegraph: animation(17, 4, 8), attack: animation(18, 4, 12, true),
    // Flight locomotion is the compatible authored return motion; it is not a hit reaction.
    climb: animation(16, 4, 10, true), hit: animation(19, 2, 9), defeat: animation(20, 2, 6),
  }),
});

export function levelTwoEnemyAnimationDuration(animationState) {
  return animationState.frames / animationState.fps;
}

export const TERRIER_SEQUENCE_DURATIONS = Object.freeze({
  wake: levelTwoEnemyAnimationDuration(LEVEL_TWO_ENEMY_ANIMATIONS.terrier.wake),
  impact: levelTwoEnemyAnimationDuration(LEVEL_TWO_ENEMY_ANIMATIONS.terrier.impact),
  hit: levelTwoEnemyAnimationDuration(LEVEL_TWO_ENEMY_ANIMATIONS.terrier.hit),
  recover: levelTwoEnemyAnimationDuration(LEVEL_TWO_ENEMY_ANIMATIONS.terrier.recover),
});

const TERRIER_TELL = TERRIER_SEQUENCE_DURATIONS.wake;

export const ATTACK_TELLS = Object.freeze({
  squirrel: SQUIRREL_TELL,
  terrier: TERRIER_TELL,
  skunk: SKUNK_TELL,
  moth: MOTH_TELL,
});

export const LEVEL_TWO_ENEMY_STATE_ANIMATION_KEYS = Object.freeze({
  squirrel: Object.freeze({
    idle: "locomotion", "throw-anticipation": "anticipation", "throw-release": "release",
    "throw-follow-through": "followThrough", "throw-recover": "recover", hit: "hit", defeated: "defeat",
  }),
  terrier: Object.freeze({
    sleep: "sleep", sit: "sit", wake: "wake", charge: "charge", impact: "impact", recover: "recover",
    hit: "hit", defeated: "defeat",
  }),
  skunk: Object.freeze({
    patrol: "locomotion", telegraph: "telegraph", spray: "attack", recover: "recover", hit: "hit", defeated: "defeat",
  }),
  moth: Object.freeze({
    orbit: "locomotion", telegraph: "telegraph", dive: "attack", climb: "climb", hit: "hit", defeated: "defeat",
  }),
});

export function enemyAnimationFrame(animationState, elapsed) {
  const rawFrame = Math.floor(Math.max(0, elapsed) * animationState.fps);
  const localFrame = animationState.loop
    ? rawFrame % animationState.frames
    : Math.min(animationState.frames - 1, rawFrame);
  return (animationState.startFrame ?? 0) + localFrame;
}

export function beginLevelTwoEnemyDefeat(enemy) {
  const hitDuration = levelTwoEnemyAnimationDuration(levelTwoEnemyAnimation(enemy.kind, "hit"));
  const defeatDuration = levelTwoEnemyAnimationDuration(levelTwoEnemyAnimation(enemy.kind, "defeated"));
  return {
    ...enemy,
    behaviorState: "defeated",
    visualState: "hit",
    visualTimer: hitDuration,
    stateElapsed: 0,
    actionTimer: hitDuration + defeatDuration,
    vx: 0,
  };
}

export function beginLevelTwoTerrierHit(enemy) {
  return {
    ...enemy,
    behaviorState: "hit",
    visualState: null,
    visualTimer: 0,
    stateElapsed: 0,
    actionTimer: TERRIER_SEQUENCE_DURATIONS.hit,
    resumeFacing: enemy.facing ?? 1,
    vx: 0,
  };
}

export function beginLevelTwoEnemyDamageReaction(enemy) {
  if ((enemy.hp ?? 0) <= 0) return beginLevelTwoEnemyDefeat(enemy);
  if (enemy.kind === "terrier") return beginLevelTwoTerrierHit(enemy);
  return { ...enemy };
}

export function advanceLevelTwoEnemyPlayback(enemy, dt) {
  let remaining = Math.max(0, dt);
  let visualState = enemy.visualState ?? null;
  let visualTimer = enemy.visualTimer ?? 0;
  let stateElapsed = enemy.stateElapsed ?? 0;
  let actionTimer = enemy.actionTimer ?? 0;
  const decrease = (timer, amount) => {
    const next = timer - amount;
    return next <= 1e-9 ? 0 : next;
  };

  if (visualState) {
    const visualStep = Math.min(remaining, visualTimer);
    visualTimer = decrease(visualTimer, visualStep);
    stateElapsed += visualStep;
    remaining -= visualStep;
    if (enemy.behaviorState === "defeated") actionTimer = decrease(actionTimer, visualStep);
    if (visualTimer === 0) {
      visualState = null;
      stateElapsed = 0;
      if (enemy.behaviorState === "defeated") {
        actionTimer = levelTwoEnemyAnimationDuration(levelTwoEnemyAnimation(enemy.kind, "defeated"));
      }
    }
  }
  if (remaining > 0 || !enemy.visualState) {
    stateElapsed += remaining;
    if (enemy.behaviorState === "defeated") actionTimer = decrease(actionTimer, remaining);
  }

  return {
    ...enemy,
    visualState,
    visualTimer,
    stateElapsed,
    actionTimer,
  };
}

export function applyLevelTwoBehaviorTransition(enemy, state, actionTimer = enemy.actionTimer) {
  return {
    ...enemy,
    behaviorState: state,
    actionTimer,
    stateElapsed: state !== enemy.behaviorState ? 0 : enemy.stateElapsed,
  };
}

export function beginLevelTwoTerrierWake(enemy) {
  return applyLevelTwoBehaviorTransition(enemy, "wake", TERRIER_SEQUENCE_DURATIONS.wake);
}

export function levelTwoEnemyAnimation(kind, state) {
  const animations = LEVEL_TWO_ENEMY_ANIMATIONS[kind];
  const key = LEVEL_TWO_ENEMY_STATE_ANIMATION_KEYS[kind]?.[state];
  if (!animations || !key || !animations[key]) {
    throw new RangeError(`Unknown Level 2 animation state "${kind}/${state}"`);
  }
  return animations[key];
}

export const ENCOUNTER_TEST_ROUTES = Object.freeze({
  squirrel: Object.freeze({
    encounterId: "backyard-squirrel-tutorial", playerX: 620, playerSurfaceId: "backyard-lawn", cameraX: 430,
    environment: Object.freeze([{ id: "backyard-loose-acorns", kind: "loose-acorn-pile", x: 884, y: 298, w: 78, h: 34, placementType: "ON_SURFACE", surfaceId: "backyard-fence" }]),
  }),
  terrier: Object.freeze({
    encounterId: "street-terrier-tutorial", playerX: 1370, playerSurfaceId: "street-ground", cameraX: 1230,
    environment: Object.freeze([{ id: "street-residential-trash-can", kind: "residential-trash-can", x: 1750, y: 356, w: 88, h: 112, placementType: "ON_SURFACE", surfaceId: "street-ground" }]),
  }),
  skunk: Object.freeze({
    encounterId: "obstacle-skunk-tutorial", playerX: 2780, playerSurfaceId: "obstacle-lawn", cameraX: 2660,
    environment: Object.freeze([]),
  }),
  moth: Object.freeze({
    encounterId: "porch-light-moth-introduction", playerX: 3890, playerSurfaceId: "poolside-ledge", cameraX: 3540,
    environment: Object.freeze([{ id: "moth-lamp-post", kind: "lamp-post", x: 4102, y: 260, w: 96, h: 208, flightBand: "porch-light-orbit", placementType: "ON_SURFACE", surfaceId: "obstacle-lawn" }]),
  }),
  interaction: Object.freeze({
    encounterId: "obstacle-interaction-test", playerX: 3260, playerSurfaceId: "obstacle-lawn", cameraX: 3120,
    environment: Object.freeze([
      { id: "interaction-loose-acorns", kind: "loose-acorn-pile", x: 3684, y: 218, w: 78, h: 34, placementType: "ON_SURFACE", surfaceId: "treehouse-platform" },
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
