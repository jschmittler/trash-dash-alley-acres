"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearInputState,
  readBrowserExperience,
  subscribeBrowserExperience,
  toggleGameFullscreen,
} from "./mobile-experience.mjs";
import {
  createGameMusic,
  disposeGameMusic,
  pauseGameMusic,
  playGameMusic,
  setGameMusicMuted,
  switchGameMusic,
} from "./music-controller.mjs";
import { createEnemyPatrol } from "./enemy-surface.mjs";
import {
  advanceHurtTimer,
  beginPlayerHurt,
  nextEnemyIntent,
  resolvePitFall,
} from "./gameplay-animation-state.mjs";
import {
  PLAYER_ANIMATIONS,
  animationFrame,
  isTailSwipeActive,
} from "./player-animation.mjs";
import { getPlayableCharacter, PLAYABLE_CHARACTERS, selectCharacterAnimation } from "./playable-character.mjs";
import {
  createCharacterSelectionState,
  moveCharacterSelection,
  confirmCharacterSelection,
} from "./character-selection.mjs";
import {
  BOSS_ANIMATIONS,
  BOSS_SEQUENCE_DURATIONS,
  bossAnimationFrame,
  isBossChargeActive,
  selectBossAnimation,
} from "./boss-animation.mjs";
import {
  activateBossArena,
  clampArenaBossX as metadataClampArenaBossX,
  clampArenaPlayerX as metadataClampArenaPlayerX,
  selectBossTestRoute,
} from "./boss-arena.mjs";
import {
  advanceBossTransition,
  createBossTransition,
} from "./boss-transition.mjs";
import {
  createPowerupNotice,
  POWERUP_PAUSE_DURATION,
  POWERUP_NOTICE_DURATION,
} from "./powerup-announcement.mjs";
import { evaluateVictoryRecord } from "./victory-phase.mjs";
import {
  brutusAnimation,
  brutusAnimationFrame,
  brutusArenaHazards,
  createBrutusState,
  moveBrutusInArena,
  updateBrutus,
} from "./brutus-boss.mjs";
import {
  DUMPSTER_DRAW_HEIGHT,
  DUMPSTER_DRAW_WIDTH,
  dumpsterDrawRect,
  dumpsterFrame,
  dumpsterRevealProgress,
  selectDumpsterState,
} from "./dumpster-render.mjs";
import {
  DECORATIVE_PROPS,
  decorativeCollisionRect,
  decorativeDrawRect,
  decorativeShadowRect,
  platformStripSegments,
} from "./decorative-render.mjs";
import { pickupYAboveSurface } from "./pickup-layout.mjs";
import { CAMPAIGN_LEVELS } from "./campaign.mjs";
import { campaignLevelById, campaignLightingAt, campaignZoneAt } from "./campaign-level.mjs";
import {
  applyCarriedProgress,
  createLevelRuntime,
  nextCampaignStart,
} from "./level-runtime.mjs";
import {
  levelBackgroundAssetEntries,
  levelBackgroundBlendAt,
  PARALLAX_SPEEDS,
} from "./level-background.mjs";
import {
  advanceLevelTwoEnemyPlayback,
  applyLevelTwoBehaviorTransition,
  beginLevelTwoEnemyHit,
  enemyAnimationFrame,
  facingFromVelocity,
  LEVEL_TWO_ENEMY_COLLISION,
  levelTwoEnemyAnimation,
  levelTwoEnemyCanContactDamage,
  levelTwoEnemyCanReceiveAttack,
  levelTwoEnvironmentRecords,
  reflectBinLidFromTail,
  selectChargeObstacle,
  selectEncounterTestRoute,
  updateLevelTwoEnemy,
  updateSprinkler,
} from "./level-two-enemies.mjs";

type Screen = "title" | "characterSelect" | "playing" | "paused" | "gameover" | "won";
type Frame = readonly [number, number, number, number];
type BackgroundLayers = { far: HTMLImageElement | null; middle: HTMLImageElement | null; close: HTMLImageElement | null };
type PlatformKind = "ground" | "branch" | "metal" | "crate";
type PickupKind = "trash" | "taco" | "cap";
type EnemyKind =
  | "pigeon" | "slime" | "beetle" | "possum" | "boss"
  | "bat" | "wasp" | "mosquito" | "moth"
  | "snake" | "spider" | "rat" | "hedgehog"
  | "fox" | "crow" | "boar" | "frog"
  | "squirrel" | "terrier" | "skunk";
type EnemyMovement = "grounded" | "platform" | "flying";
type PowerupNoticeKind = "taco" | "cap";

interface EnemySpawnDefinition {
  kind: string;
  movement?: EnemyMovement;
  x: number;
  y?: number;
  flightY?: number;
  patrol?: readonly [number, number];
  surfaceId?: string;
  flightBand?: string;
}

interface CampaignLevelDefinition {
  id: string;
  title: string;
  worldWidth: number;
  zones: Array<{ id: string; startX: number; endX: number; lighting: string }>;
  surfaces: Array<Platform & { id: string; hazard?: boolean }>;
  flightBands?: Array<{ id: string; startX: number; endX: number; minY: number; maxY: number }>;
  backgroundSets: Array<{ zoneId: string; stage: string }>;
  encounters: Array<{ enemies: EnemySpawnDefinition[] }>;
  rewards: Array<{ kind: string; x: number; surfaceY: number }>;
  checkpoints: Array<{ id: string; x: number; respawnX: number; label: string }>;
  boss: {
    kind: string;
    runwayStartX?: number;
    triggerX: number;
    arenaStartX: number;
    arenaEndX: number;
    surfaceId?: string;
    hydrant?: Omit<EnvironmentCollision, "kind" | "encounterId">;
    recoveryX?: number;
    sprinklers?: Array<Omit<EnvironmentCollision, "kind" | "encounterId"> & { side: "left" | "right" }>;
    postBossStartX?: number;
  };
  exit: { nextLevelId: string | null; x: number };
}

interface CarriedCampaignProgress {
  selectedCharacterId: string;
  large: boolean;
  glider: number;
  trash: number;
  score: number;
  lives: number;
}

interface PowerupNotice {
  kind: PowerupNoticeKind;
  title: string;
  detail: string;
  accent: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Platform extends Rect {
  kind: PlatformKind;
}

interface Pickup extends Rect {
  kind: PickupKind;
  active: boolean;
  phase: number;
}

interface Enemy extends Rect {
  id: string;
  kind: EnemyKind;
  vx: number;
  facing: 1 | -1;
  animationState: keyof typeof BOSS_ANIMATIONS | "walking" | "hit";
  active: boolean;
  spawned: boolean;
  phase: number;
  hp: number;
  hitCooldown: number;
  originX: number;
  surfaceY: number;
  patrolMinX: number;
  patrolMaxX: number;
  actionTimer: number;
  attackCooldown: number;
  ragePlayed: boolean;
  rageQueued: boolean;
  behaviorState: string;
  surfaceId?: string;
  flightBand?: string;
  sprayActive: boolean;
  stateElapsed: number;
  visualState: string | null;
  visualTimer: number;
  brutusState: ReturnType<typeof createBrutusState> | null;
  brutusCanSpawned: boolean;
}

interface BinLid extends Rect {
  vx: number;
  reflected: boolean;
  ownerId: string;
  lightweight: true;
  active: boolean;
}

interface EnvironmentCollision extends Rect {
  id: string;
  kind: "bin-lid-source" | "charge-obstacle" | "sprinkler" | "porch-light" | "hydrant";
  encounterId: string;
  flightBand?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Player extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 1 | -1;
  large: boolean;
  glider: number;
  invulnerable: number;
  coyote: number;
  jumpBuffer: number;
  attackTimer: number;
  attackId: number;
  boostCooldown: number;
  anim: number;
  animationName: string;
  animationElapsed: number;
  landingTimer: number;
  airtime: number;
  skidTimer: number;
  shrinkTimer: number;
  endSequence: "won" | "gameover" | null;
  endTimer: number;
  hurtTimer: number;
  pendingDamage: "shrink" | "respawn" | "gameover" | null;
}

interface World {
  levelId: string;
  level: CampaignLevelDefinition;
  campaignProgress: CarriedCampaignProgress | null;
  worldWidth: number;
  checkpoints: CampaignLevelDefinition["checkpoints"];
  surfaces: CampaignLevelDefinition["surfaces"];
  hazards: CampaignLevelDefinition["surfaces"];
  platforms: Platform[];
  selectedCharacterId: string;
  player: Player;
  enemies: Enemy[];
  binLids: BinLid[];
  environment: EnvironmentCollision[];
  pickups: Pickup[];
  particles: Particle[];
  cameraX: number;
  checkpoint: number;
  checkpointReached: boolean;
  checkpointIndex: number;
  bossDefeated: boolean;
  dumpsterRevealStartedAt: number | null;
  arenaActive: boolean;
  bossTransition: { fromCameraX: number; elapsed: number } | null;
  trash: number;
  score: number;
  lives: number;
  elapsed: number;
  message: string;
  messageTimer: number;
}

const WIDTH = 960;
const HEIGHT = 540;
const GROUND_Y = 468;
const DUMPSTER_RIGHT_MARGIN = 30;
const MOTION_CELL = 192;
const ASSET_CELL = 256;
const INITIAL_BROWSER_EXPERIENCE = {
  touchFirst: false,
  portrait: false,
  fullscreen: false,
  fullscreenSupported: false,
};

// The selector will provide the active profile in the next gameplay pass. Keep
// the existing raccoon run on the profile registry so rendering and animation
// routing already share the same character contract.
const RACCOON_PROFILE = getPlayableCharacter("raccoon");

const levelTwoTestStarts: Record<string, [number, number]> = {
  backyard: [180, 0],
  street: [1380, 1020],
  obstacle: [2840, 2480],
  drainage: [4350, 3990],
  runway: [5400, 5040],
  "main-street": [6660, 6240],
};

const levelTwoTestSurfaces: Record<keyof typeof levelTwoTestStarts, string> = {
  backyard: "backyard-lawn",
  street: "street-ground",
  obstacle: "obstacle-lawn",
  drainage: "drainage-entry-lawn",
  runway: "boss-runway",
  "main-street": "victory-street",
};

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
const bossArenaCameraX = (world: World) => world.level.boss.arenaStartX;
const clampArenaPlayerX = (world: World, x: number, width: number) => (
  metadataClampArenaPlayerX(x, width, world.level.boss)
);
const clampArenaBossX = (world: World, x: number, width: number) => (
  metadataClampArenaBossX(x, width, world.level.boss)
);
const worldBossSpawnX = (level: CampaignLevelDefinition) => level.boss.arenaStartX + 480;
const dumpsterGoalWorldX = (world: World) => (
  bossArenaCameraX(world) + WIDTH - DUMPSTER_RIGHT_MARGIN - DUMPSTER_DRAW_WIDTH
);

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const motionRow = (row: number, count: number): Frame[] =>
  Array.from({ length: count }, (_, index) => [index * MOTION_CELL, row * MOTION_CELL, MOTION_CELL, MOTION_CELL] as Frame);

const enemyMotion = {
  pigeon: motionRow(0, 4),
  slime: motionRow(1, 4),
  beetle: motionRow(2, 4),
  possum: motionRow(3, 4),
};

const varietyEnemyMotion = {
  bat: motionRow(0, 4),
  wasp: motionRow(1, 4),
  mosquito: motionRow(2, 4),
  moth: motionRow(3, 4),
  snake: motionRow(4, 4),
  spider: motionRow(5, 4),
  rat: motionRow(6, 4),
  hedgehog: motionRow(7, 4),
  fox: motionRow(8, 4),
  crow: motionRow(9, 4),
  boar: motionRow(10, 4),
  frog: motionRow(11, 4),
};

const trashPickupMotion = {
  can: motionRow(0, 4),
  bottle: motionRow(1, 4),
  banana: motionRow(2, 4),
  appleCore: motionRow(3, 4),
};
const trashPickupRows = [
  trashPickupMotion.can,
  trashPickupMotion.bottle,
  trashPickupMotion.banana,
  trashPickupMotion.appleCore,
];

const tacoPowerMotion = motionRow(0, 4);
const flyingEnemies = new Set<EnemyKind>(["bat", "wasp", "mosquito", "moth", "crow"]);
const levelTwoEnemyKinds = new Set<EnemyKind>(["squirrel", "terrier", "skunk", "moth"]);
const varietyEnemyDrawSizes: Record<keyof typeof varietyEnemyMotion, [number, number]> = {
  bat: [68, 68],
  wasp: [66, 66],
  mosquito: [64, 64],
  moth: [68, 68],
  snake: [74, 64],
  spider: [70, 64],
  rat: [72, 66],
  hedgehog: [70, 66],
  fox: [82, 72],
  crow: [72, 70],
  boar: [84, 74],
  frog: [66, 62],
};

const sprites = {
  smallIdle: [18, 10, 76, 84] as Frame,
  smallWalk: [
    [94, 10, 72, 84],
    [169, 9, 74, 85],
    [244, 10, 72, 84],
    [320, 9, 74, 85],
    [397, 10, 74, 84],
    [474, 10, 75, 84],
  ] as Frame[],
  smallRun: [
    [17, 103, 83, 82],
    [105, 103, 82, 82],
    [194, 104, 87, 81],
  ] as Frame[],
  smallJump: [622, 8, 78, 91] as Frame,
  smallFall: [785, 5, 82, 95] as Frame,
  smallHurt: [1307, 100, 105, 83] as Frame,
  smallRoll: [308, 105, 76, 75] as Frame,
  largeIdle: [18, 201, 83, 105] as Frame,
  largeWalk: [
    [104, 201, 84, 105],
    [190, 202, 85, 104],
    [280, 203, 84, 103],
    [366, 201, 88, 105],
    [458, 201, 84, 105],
    [545, 202, 82, 104],
  ] as Frame[],
  largeJump: [707, 199, 84, 109] as Frame,
  largeFall: [798, 199, 86, 109] as Frame,
  largeHurt: [1328, 225, 100, 83] as Frame,
  glider: [
    [34, 437, 112, 105],
    [147, 438, 112, 104],
    [260, 438, 110, 104],
    [372, 438, 112, 104],
    [486, 438, 111, 104],
    [602, 438, 110, 104],
  ] as Frame[],
  trashCan: [26, 623, 39, 43] as Frame,
  banana: [260, 622, 49, 43] as Frame,
  bag: [328, 563, 48, 56] as Frame,
  cap: [385, 615, 58, 48] as Frame,
  crate: [480, 554, 82, 74] as Frame,
  box: [691, 557, 79, 70] as Frame,
  bin: [943, 551, 78, 80] as Frame,
  checkpoint: [1364, 552, 78, 80] as Frame,
  pigeon: [
    [14, 673, 69, 70],
    [89, 673, 70, 70],
    [166, 673, 70, 70],
    [243, 673, 70, 70],
  ] as Frame[],
  slime: [
    [356, 668, 71, 72],
    [426, 668, 72, 72],
    [499, 668, 72, 72],
  ] as Frame[],
  beetle: [
    [611, 672, 84, 68],
    [696, 672, 83, 68],
    [782, 672, 84, 68],
  ] as Frame[],
  possum: [
    [12, 742, 91, 72],
    [103, 742, 91, 72],
    [199, 742, 91, 72],
  ] as Frame[],
  ground: [14, 812, 58, 65] as Frame,
  branch: [793, 888, 151, 49] as Frame,
  metal: [514, 882, 112, 59] as Frame,
  bush: [16, 1007, 129, 77] as Frame,
  tree: [218, 986, 81, 98] as Frame,
  horizon: [554, 952, 879, 133] as Frame,
} as const;

const makeCratePlatform = (x: number, groundY = GROUND_Y): Platform => ({
  ...decorativeCollisionRect("crate", x, groundY),
  kind: "crate",
});

const cratePlatforms: Platform[] = [
  makeCratePlatform(878),
  makeCratePlatform(938),
  makeCratePlatform(5100),
  makeCratePlatform(6150),
];

const mapLevelSurfacesToPlatforms = (
  surfaces: CampaignLevelDefinition["surfaces"],
): Platform[] => surfaces
  .filter(({ hazard }) => !hazard)
  .map(({ x, y, w, h, kind }) => ({
    x,
    y,
    w,
    h,
    kind: kind === "crate" || (kind as string) === "box" ? "crate" : kind,
  }));

const scenery = [
  { x: 360, groundY: GROUND_Y, prop: "bush" as const },
  { x: 1260, groundY: GROUND_Y, prop: "tree" as const },
  { x: 2050, groundY: GROUND_Y, prop: "bush" as const },
  { x: 2860, groundY: GROUND_Y, prop: "tree" as const },
  { x: 3940, groundY: GROUND_Y, prop: "bin" as const },
  { x: 4480, groundY: GROUND_Y, prop: "tires" as const },
];

const makeEnemy = (
  spawn: EnemySpawnDefinition,
  supports: CampaignLevelDefinition["surfaces"],
): Enemy => {
  const kind = spawn.kind as EnemyKind;
  const x = spawn.x;
  const sizes: Record<EnemyKind, [number, number]> = {
    pigeon: [46, 38],
    slime: [46, 38],
    beetle: [50, 34],
    possum: [58, 38],
    boss: [96, 96],
    bat: [50, 34],
    wasp: [48, 32],
    mosquito: [46, 30],
    moth: LEVEL_TWO_ENEMY_COLLISION.moth,
    snake: [58, 28],
    spider: [52, 30],
    rat: [54, 34],
    hedgehog: [52, 34],
    fox: [62, 40],
    crow: [52, 36],
    boar: [62, 42],
    frog: [48, 30],
    squirrel: LEVEL_TWO_ENEMY_COLLISION.squirrel,
    terrier: LEVEL_TWO_ENEMY_COLLISION.terrier,
    skunk: LEVEL_TWO_ENEMY_COLLISION.skunk,
  };
  const [w, h] = sizes[kind];
  const patrolRadius = kind === "boss" ? 360 : kind === "slime" ? 85 : 105;
  const grounded = spawn.movement ? spawn.movement !== "flying" : !flyingEnemies.has(kind);
  const authoredSupport = grounded && spawn.surfaceId
    ? supports.find(({ id }) => id === spawn.surfaceId)
    : null;
  const surfaceY = grounded
    ? authoredSupport?.y ?? spawn.y ?? GROUND_Y
    : spawn.flightY ?? spawn.y ?? GROUND_Y;
  const patrol = createEnemyPatrol({
    x,
    width: w,
    surfaceY,
    surfaceId: spawn.surfaceId,
    patrolRadius,
    grounded,
    patrolBounds: spawn.patrol,
  }, supports);
  const patrolMinX = patrol.minX;
  const patrolMaxX = patrol.maxX;
  const spawnX = patrol.spawnX;
  const vx = kind === "boss" ? 0 : kind === "fox" || kind === "boar" ? -78 : flyingEnemies.has(kind) ? -64 : -42;
  return {
    id: `${kind}:${spawnX}:${spawn.surfaceId ?? spawn.flightBand ?? "free"}`,
    kind,
    x: spawnX,
    y: patrol.surfaceY - h,
    w,
    h,
    vx,
    facing: vx < 0 ? -1 : 1,
    animationState: "walking",
    active: kind === "boss" || spawnX <= 780,
    spawned: kind === "boss" || spawnX <= 780,
    phase: x / 100,
    hp: kind === "boss" ? 3 : 1,
    hitCooldown: 0,
    originX: spawnX,
    surfaceY: patrol.surfaceY,
    patrolMinX,
    patrolMaxX,
    actionTimer: 0,
    attackCooldown: kind === "boss" ? 1.1 : 0,
    ragePlayed: false,
    rageQueued: false,
    behaviorState: kind === "terrier" ? "sleep" : kind === "skunk" ? "patrol" : kind === "moth" ? "orbit" : "idle",
    surfaceId: spawn.surfaceId,
    flightBand: spawn.flightBand,
    sprayActive: false,
    stateElapsed: 0,
    visualState: null,
    visualTimer: 0,
    brutusState: null,
    brutusCanSpawned: false,
  };
};

const makePickup = (kind: PickupKind, x: number, y: number, phase = 0): Pickup => ({
  kind,
  x,
  y,
  w: kind === "trash" ? 30 : 38,
  h: kind === "trash" ? 30 : 38,
  active: true,
  phase,
});

const makeSurfacePickup = (
  kind: PickupKind,
  x: number,
  surfaceY: number,
  phase = 0,
  gap = 18,
) => makePickup(kind, x, pickupYAboveSurface(kind, surfaceY, gap), phase);

const makeWorld = (
  selectedCharacterId = "raccoon",
  levelId = "level-1",
  carried: CarriedCampaignProgress | null = null,
): World => {
  const level = campaignLevelById(levelId) as CampaignLevelDefinition;
  const selectedProfile = getPlayableCharacter(carried?.selectedCharacterId ?? selectedCharacterId);
  const player: Player = {
    x: 125,
    y: GROUND_Y - 46,
    w: 32,
    h: 46,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
    large: false,
    glider: 0,
    invulnerable: 0,
    coyote: 0.12,
    jumpBuffer: 0,
    attackTimer: 0,
    attackId: 0,
    boostCooldown: 0,
    anim: 0,
    animationName: "small_idle",
    animationElapsed: 0,
    landingTimer: 0,
    airtime: 0,
    skidTimer: 0,
    shrinkTimer: 0,
    endSequence: null,
    endTimer: 0,
    hurtTimer: 0,
    pendingDamage: null,
  };
  applyCarriedProgress(player, carried);
  if (player.large) {
    player.y = GROUND_Y - 58;
    player.w = 38;
    player.h = 58;
    player.animationName = "large_idle";
  }

  const runtime = createLevelRuntime(level, {
    makeEnemy: (spawn: EnemySpawnDefinition, supports: CampaignLevelDefinition["surfaces"]) => (
      makeEnemy(spawn, supports)
    ),
    makePickup: (reward: CampaignLevelDefinition["rewards"][number], index: number) => makeSurfacePickup(
      reward.kind as PickupKind,
      reward.x,
      reward.surfaceY === 0 ? GROUND_Y : reward.surfaceY,
      index,
    ),
  });

  const boss = makeEnemy({
    kind: "boss",
    x: worldBossSpawnX(level),
    surfaceId: level.boss.surfaceId,
  }, runtime.surfaces);
  if (level.boss.kind === "brutus") {
    boss.brutusState = createBrutusState();
    boss.behaviorState = boss.brutusState.mode;
  }

  return {
    levelId: level.id,
    level,
    campaignProgress: carried ? { ...carried } : null,
    worldWidth: level.worldWidth,
    checkpoints: runtime.checkpoints,
    surfaces: runtime.surfaces,
    hazards: runtime.hazards,
    platforms: mapLevelSurfacesToPlatforms(runtime.surfaces),
    selectedCharacterId: selectedProfile.id,
    player,
    enemies: runtime.enemies.concat(boss),
    binLids: [],
    environment: level.id === "level-2"
      ? [
          ...levelTwoEnvironmentRecords() as EnvironmentCollision[],
          ...(level.boss.hydrant ? [{ ...level.boss.hydrant, kind: "hydrant", encounterId: "brutus" } as EnvironmentCollision] : []),
          ...(level.boss.sprinklers ?? []).map((item) => ({ ...item, kind: "sprinkler", encounterId: "brutus" } as EnvironmentCollision)),
        ]
      : [],
    pickups: runtime.pickups,
    particles: [],
    cameraX: 0,
    checkpoint: 125,
    checkpointReached: false,
    checkpointIndex: -1,
    bossDefeated: false,
    dumpsterRevealStartedAt: null,
    arenaActive: false,
    bossTransition: null,
    trash: carried?.trash ?? 0,
    score: carried?.score ?? 0,
    lives: carried?.lives ?? 3,
    elapsed: 0,
    message: "A / D to move • Space to jump",
    messageTimer: 5,
  };
};

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
};

export function TrashDashGame() {
  const cabinetRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atlasRef = useRef<HTMLImageElement | null>(null);
  const playerHeroMotionRef = useRef<HTMLImageElement | null>(null);
  const jimothyHeroMotionRef = useRef<HTMLImageElement | null>(null);
  const bossMotionRef = useRef<HTMLImageElement | null>(null);
  const brutusMotionRef = useRef<HTMLImageElement | null>(null);
  const enemyMotionRef = useRef<HTMLImageElement | null>(null);
  const varietyEnemyMotionRef = useRef<HTMLImageElement | null>(null);
  const levelTwoEnemyMotionRef = useRef<HTMLImageElement | null>(null);
  const trashPickupMotionRef = useRef<HTMLImageElement | null>(null);
  const tacoPowerMotionRef = useRef<HTMLImageElement | null>(null);
  const dumpsterAtlasRef = useRef<HTMLImageElement | null>(null);
  const decorativeAtlasRef = useRef<HTMLImageElement | null>(null);
  const branchPlatformRef = useRef<HTMLImageElement | null>(null);
  const metalPlatformRef = useRef<HTMLImageElement | null>(null);
  const groundTileRef = useRef<HTMLImageElement | null>(null);
  const forestFarRef = useRef<HTMLImageElement | null>(null);
  const forestNearRef = useRef<HTMLImageElement | null>(null);
  const cityFarRef = useRef<HTMLImageElement | null>(null);
  const cityNearRef = useRef<HTMLImageElement | null>(null);
  const levelBackgroundRefs = useRef<Record<string, BackgroundLayers>>({});
  const levelBackgroundLoadPromisesRef = useRef(new Map<string, Promise<void>>());
  const levelEnemyLoadPromisesRef = useRef(new Map<string, Promise<void>>());
  const worldRef = useRef<World>(makeWorld());
  const keysRef = useRef(new Set<string>());
  const pressedRef = useRef(new Set<string>());
  const screenRef = useRef<Screen>("title");
  const selectedCharacterRef = useRef("raccoon");
  const audioRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicSwitchIdRef = useRef(0);
  const mutedRef = useRef(false);
  const lastFrameRef = useRef(0);
  const hudTickRef = useRef(0);
  const fullscreenPendingRef = useRef(false);
  const powerupPauseTimerRef = useRef<number | null>(null);
  const powerupNoticeTimerRef = useRef<number | null>(null);
  const powerupPausedRef = useRef(false);
  const powerupNoticeRef = useRef<PowerupNotice | null>(null);
  const browserExperienceRef = useRef(INITIAL_BROWSER_EXPERIENCE);
  const [screen, setScreen] = useState<Screen>("title");
  const [characterSelection, setCharacterSelection] = useState(() => createCharacterSelectionState(Object.keys(PLAYABLE_CHARACTERS)));
  const [loaded, setLoaded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [portraitDismissed, setPortraitDismissed] = useState(false);
  const [browserExperience, setBrowserExperience] = useState(INITIAL_BROWSER_EXPERIENCE);
  const [hud, setHud] = useState({ trash: 0, score: 0, lives: 3, time: 0, glider: 0 });
  const [best, setBest] = useState({ score: 0, time: 0 });
  const [victoryRecord, setVictoryRecord] = useState({ score: false, time: false });

  const loadLevelBackgrounds = useCallback((activeLevel: CampaignLevelDefinition) => {
    const pending = levelBackgroundLoadPromisesRef.current.get(activeLevel.id);
    if (pending) return pending;
    const entries = levelBackgroundAssetEntries(activeLevel) as Array<{
      zoneId: string;
      layer: keyof BackgroundLayers;
      source: string;
    }>;
    const loadImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = assetUrl(source);
    });
    const request = Promise.all(entries.map(({ source }) => loadImage(source)))
      .then((images) => {
        const loadedBackgrounds: Record<string, BackgroundLayers> = {};
        entries.forEach(({ zoneId, layer }, index) => {
          loadedBackgrounds[zoneId] ??= { far: null, middle: null, close: null };
          loadedBackgrounds[zoneId][layer] = images[index];
        });
        levelBackgroundRefs.current = {
          ...levelBackgroundRefs.current,
          ...loadedBackgrounds,
        };
      })
      .catch((error) => {
        levelBackgroundLoadPromisesRef.current.delete(activeLevel.id);
        throw error;
      });
    levelBackgroundLoadPromisesRef.current.set(activeLevel.id, request);
    return request;
  }, []);
  const loadLevelEnemyAtlas = useCallback((activeLevel: CampaignLevelDefinition) => {
    if (activeLevel.id !== "level-2" || (levelTwoEnemyMotionRef.current && brutusMotionRef.current)) return Promise.resolve();
    const pending = levelEnemyLoadPromisesRef.current.get(activeLevel.id);
    if (pending) return pending;
    const loadImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = assetUrl(source);
    });
    const request = Promise.all([
      loadImage("assets/generated/level2-enemy-motion.png"),
      loadImage("assets/generated/brutus-motion.png"),
    ]).then(([enemyAtlas, brutusAtlas]) => {
      levelTwoEnemyMotionRef.current = enemyAtlas;
      brutusMotionRef.current = brutusAtlas;
    }).catch((error) => {
      levelEnemyLoadPromisesRef.current.delete(activeLevel.id);
      throw error;
    });
    levelEnemyLoadPromisesRef.current.set(activeLevel.id, request);
    return request;
  }, []);
  const [powerupNotice, setPowerupNotice] = useState<PowerupNotice | null>(null);
  const [campaignContinuationAvailable, setCampaignContinuationAvailable] = useState(false);

  const changeScreen = useCallback((next: Screen) => {
    if (next !== "playing") pauseGameMusic(musicRef.current);
    screenRef.current = next;
    setScreen(next);
  }, []);

  const clearHeldInput = useCallback(() => {
    clearInputState(keysRef.current, pressedRef.current);
  }, []);

  const interruptGame = useCallback(() => {
    clearHeldInput();
    if (screenRef.current === "playing") changeScreen("paused");
  }, [changeScreen, clearHeldInput]);

  const tone = useCallback((frequency: number, duration = 0.08, type: OscillatorType = "square") => {
    if (mutedRef.current) return;
    const context = audioRef.current;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, []);

  const burst = useCallback((world: World, x: number, y: number, color: string, amount = 7) => {
    for (let index = 0; index < amount; index += 1) {
      const angle = (Math.PI * 2 * index) / amount + Math.random() * 0.5;
      const speed = 55 + Math.random() * 90;
      world.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.4 + Math.random() * 0.35,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }, []);

  const setMessage = useCallback((world: World, message: string, time = 2.2) => {
    world.message = message;
    world.messageTimer = time;
  }, []);

  const dismissPowerupNotice = useCallback(() => {
    if (powerupPauseTimerRef.current !== null) {
      window.clearTimeout(powerupPauseTimerRef.current);
      powerupPauseTimerRef.current = null;
    }
    if (powerupNoticeTimerRef.current !== null) {
      window.clearTimeout(powerupNoticeTimerRef.current);
      powerupNoticeTimerRef.current = null;
    }
    powerupPausedRef.current = false;
    powerupNoticeRef.current = null;
    setPowerupNotice(null);
    lastFrameRef.current = performance.now();
  }, []);

  const showPowerupNotice = useCallback((kind: PowerupNoticeKind) => {
    if (powerupPauseTimerRef.current !== null) window.clearTimeout(powerupPauseTimerRef.current);
    if (powerupNoticeTimerRef.current !== null) window.clearTimeout(powerupNoticeTimerRef.current);
    const notice = createPowerupNotice(kind) as PowerupNotice;
    powerupPausedRef.current = true;
    powerupNoticeRef.current = notice;
    setPowerupNotice(notice);
    powerupPauseTimerRef.current = window.setTimeout(() => {
      powerupPausedRef.current = false;
      powerupPauseTimerRef.current = null;
      lastFrameRef.current = performance.now();
    }, POWERUP_PAUSE_DURATION * 1000);
    powerupNoticeTimerRef.current = window.setTimeout(dismissPowerupNotice, POWERUP_NOTICE_DURATION * 1000);
    tone(kind === "taco" ? 760 : 980, 0.16, "triangle");
  }, [dismissPowerupNotice, tone]);

  const openCharacterSelect = useCallback(() => {
    clearHeldInput();
    setCharacterSelection(createCharacterSelectionState(Object.keys(PLAYABLE_CHARACTERS)));
    changeScreen("characterSelect");
  }, [changeScreen, clearHeldInput]);

  const startGame = useCallback((
    characterId = selectedCharacterRef.current,
    levelIdOverride: string | null = null,
    carried: CarriedCampaignProgress | null = null,
  ) => {
    clearHeldInput();
    dismissPowerupNotice();
    setVictoryRecord({ score: false, time: false });
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    void audioRef.current.resume();
    musicSwitchIdRef.current += 1;
    disposeGameMusic(musicRef.current);
    musicRef.current = createGameMusic(assetUrl("assets/audio/raccoon-rush-loop.m4a"));
    void playGameMusic(musicRef.current, { muted: mutedRef.current, restart: true });
    const selectedProfile = getPlayableCharacter(characterId);
    selectedCharacterRef.current = selectedProfile.id;
    const devParams = import.meta.env.DEV && !levelIdOverride ? new URLSearchParams(window.location.search) : null;
    const bossTest = devParams?.get("bossTest") ?? null;
    const bossRoute = selectBossTestRoute(bossTest);
    const levelTest = devParams?.get("levelTest") ?? null;
    const backgroundTest = devParams?.get("backgroundTest") ?? null;
    const powerupTest = devParams?.get("powerupTest") ?? null;
    const victoryTest = devParams?.get("victoryTest") ?? null;
    const encounterTest = devParams?.get("encounterTest") ?? null;
    const levelTwoRequested = devParams?.get("level") === "2"
      || levelTest === "level2-start"
      || (levelTest !== null && Object.hasOwn(levelTwoTestStarts, levelTest))
      || encounterTest !== null
      || bossRoute?.levelId === "level-2"
      || victoryTest === "level2";
    const levelId = levelIdOverride ?? (levelTwoRequested ? "level-2" : "level-1");
    const testCarry = levelTest === "level2-start"
      ? {
          selectedCharacterId: selectedProfile.id,
          large: true,
          glider: 14,
          trash: 5,
          score: 0,
          lives: 3,
        }
      : null;
    const nextWorld = makeWorld(selectedProfile.id, levelId, carried ?? testCarry);
    if (encounterTest !== null) {
      const selected = selectEncounterTestRoute(nextWorld.level, encounterTest) as {
        encounter: { enemies: EnemySpawnDefinition[] };
        environment: EnvironmentCollision[];
        playerX: number;
        playerSurfaceId: string;
        cameraX: number;
      };
      nextWorld.enemies = selected.encounter.enemies.map((spawn) => {
        const enemy = makeEnemy(spawn, nextWorld.surfaces);
        enemy.spawned = true;
        enemy.active = true;
        return enemy;
      });
      nextWorld.environment = selected.environment;
      const surface = nextWorld.surfaces.find(({ id }) => id === selected.playerSurfaceId);
      if (!surface) throw new RangeError(`Missing encounter test surface "${selected.playerSurfaceId}"`);
      nextWorld.player.x = clamp(selected.playerX, surface.x, surface.x + surface.w - nextWorld.player.w);
      nextWorld.player.y = surface.y - nextWorld.player.h;
      nextWorld.player.grounded = true;
      nextWorld.cameraX = clamp(selected.cameraX, 0, nextWorld.worldWidth - WIDTH);
    } else if (bossRoute) {
      nextWorld.player.x = bossRoute.playerX;
      nextWorld.player.y = GROUND_Y - 58;
      nextWorld.player.w = 38;
      nextWorld.player.h = 58;
      nextWorld.player.large = true;
      nextWorld.player.animationName = "large_idle";
      nextWorld.trash = 5;
      nextWorld.player.glider = bossRoute.glider;
      nextWorld.checkpoint = bossRoute.checkpointX;
      nextWorld.checkpointReached = true;
      nextWorld.checkpointIndex = nextWorld.checkpoints.length - 1;
      nextWorld.cameraX = bossRoute.cameraX;
    } else if (levelTest !== null && Object.hasOwn(levelTwoTestStarts, levelTest)) {
      const route = levelTest as keyof typeof levelTwoTestStarts;
      const [requestedX, requestedCameraX] = levelTwoTestStarts[route];
      const surface = nextWorld.surfaces.find(({ id }) => id === levelTwoTestSurfaces[route]);
      if (surface) {
        nextWorld.player.x = clamp(requestedX, surface.x, surface.x + surface.w - nextWorld.player.w);
        nextWorld.player.y = surface.y - nextWorld.player.h;
        nextWorld.player.grounded = true;
      }
      nextWorld.cameraX = clamp(requestedCameraX, 0, nextWorld.worldWidth - WIDTH);
      if (route === "main-street") {
        nextWorld.bossDefeated = true;
        nextWorld.arenaActive = false;
        nextWorld.dumpsterRevealStartedAt = 0;
        nextWorld.enemies = [];
      }
    } else if (backgroundTest) {
      const backgroundStarts: Record<string, [number, number]> = {
        woodland: [620, 260],
        creek: [1700, 1340],
        highway: [2900, 2420],
        industrial: [4100, 3620],
        park: [5200, 4680],
      };
      const [startX, cameraX] = backgroundStarts[backgroundTest] ?? backgroundStarts.creek;
      nextWorld.player.x = startX;
      nextWorld.player.y = GROUND_Y - nextWorld.player.h;
      nextWorld.cameraX = cameraX;
    } else if (levelTest === "creek" || levelTest === "highway") {
      nextWorld.player.x = levelTest === "creek" ? 1180 : 3000;
      nextWorld.player.y = GROUND_Y - nextWorld.player.h;
      nextWorld.cameraX = levelTest === "creek" ? 820 : 2520;
    } else if (powerupTest === "taco" || powerupTest === "cap") {
      nextWorld.player.x = powerupTest === "taco" ? 920 : 3580;
      nextWorld.player.y = powerupTest === "taco"
        ? cratePlatforms[0].y - nextWorld.player.h
        : 215;
      nextWorld.cameraX = powerupTest === "taco" ? 560 : 3320;
    } else if (victoryTest === "level2") {
      nextWorld.player.x = nextWorld.level.boss.postBossStartX ?? nextWorld.level.boss.arenaEndX;
      nextWorld.player.y = GROUND_Y - 58;
      nextWorld.player.w = 38;
      nextWorld.player.h = 58;
      nextWorld.player.large = true;
      nextWorld.player.glider = 14;
      nextWorld.player.animationName = "large_idle";
      nextWorld.bossDefeated = true;
      nextWorld.arenaActive = false;
      nextWorld.enemies = [];
      nextWorld.trash = 5;
      nextWorld.cameraX = nextWorld.level.boss.arenaEndX - 120;
    } else if (victoryTest === "1") {
      nextWorld.player.x = 6350;
      nextWorld.player.y = GROUND_Y - 58;
      nextWorld.player.w = 38;
      nextWorld.player.h = 58;
      nextWorld.player.large = true;
      nextWorld.player.endSequence = "won";
      nextWorld.player.endTimer = 0.02;
      nextWorld.bossDefeated = true;
      nextWorld.dumpsterRevealStartedAt = 62.2;
      nextWorld.trash = 12;
      nextWorld.score = 4720;
      nextWorld.elapsed = 63;
      nextWorld.cameraX = 5640;
      setVictoryRecord({ score: true, time: true });
    }
    void Promise.all([loadLevelBackgrounds(nextWorld.level), loadLevelEnemyAtlas(nextWorld.level)])
      .then(() => {
        worldRef.current = nextWorld;
        setCampaignContinuationAvailable(Boolean(
          nextWorld.level.exit?.nextLevelId && CAMPAIGN_LEVELS.has(nextWorld.level.exit.nextLevelId),
        ));
        lastFrameRef.current = performance.now();
        changeScreen("playing");
        tone(520, 0.08);
        window.setTimeout(() => tone(720, 0.12), 80);
      })
      .catch(() => setLoaded(false));
  }, [changeScreen, clearHeldInput, dismissPowerupNotice, loadLevelBackgrounds, loadLevelEnemyAtlas, tone]);

  const continueCampaign = useCallback(() => {
    const transition = nextCampaignStart(worldRef.current) as {
      levelId: string;
      carried: CarriedCampaignProgress;
    } | null;
    if (!transition || !CAMPAIGN_LEVELS.has(transition.levelId)) return;
    startGame(transition.carried.selectedCharacterId, transition.levelId, transition.carried);
  }, [startGame]);

  const confirmCharacter = useCallback(() => {
    const selectedId = confirmCharacterSelection(characterSelection);
    selectedCharacterRef.current = selectedId;
    startGame(selectedId);
  }, [characterSelection, startGame]);

  const moveCharacter = useCallback((delta: number) => {
    setCharacterSelection((state) => moveCharacterSelection(state, delta));
  }, []);

  const togglePause = useCallback(() => {
    if (screenRef.current === "playing") changeScreen("paused");
    else if (screenRef.current === "paused") {
      lastFrameRef.current = performance.now();
      changeScreen("playing");
      void playGameMusic(musicRef.current, { muted: mutedRef.current });
    }
  }, [changeScreen]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    setGameMusicMuted(musicRef.current, mutedRef.current);
    if (!mutedRef.current && screenRef.current === "playing") {
      void playGameMusic(musicRef.current);
    }
  }, []);

  const setTouchKey = useCallback((code: string, active: boolean) => {
    if (active) {
      if (!keysRef.current.has(code)) pressedRef.current.add(code);
      keysRef.current.add(code);
    } else {
      keysRef.current.delete(code);
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (fullscreenPendingRef.current) return;
    fullscreenPendingRef.current = true;
    await toggleGameFullscreen(cabinetRef.current, document, window.screen.orientation);
    fullscreenPendingRef.current = false;
    const next = readBrowserExperience(window, document);
    browserExperienceRef.current = next;
    setBrowserExperience(next);
  }, []);

  useEffect(() => {
    const storedScore = Number(window.localStorage.getItem("trash-dash-high-score") ?? 0);
    const storedTime = Number(window.localStorage.getItem("trash-dash-best-time") ?? 0);
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setBest({ score: storedScore, time: storedTime });
    });
    const loadImage = (source: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
      });

    void Promise.all([
      loadImage(assetUrl("assets/raccoon-sprites.png")),
      loadImage(assetUrl(RACCOON_PROFILE.atlasSrc)),
      loadImage(assetUrl(getPlayableCharacter("jimothy").atlasSrc)),
      loadImage(assetUrl("assets/generated/boss-motion.png")),
      loadImage(assetUrl("assets/enemy-motion.png")),
      loadImage(assetUrl("assets/generated/enemy-variety-motion.png")),
      loadImage(assetUrl("assets/generated/trash-pickups-motion.png")),
      loadImage(assetUrl("assets/generated/taco-power-motion.png")),
      loadImage(assetUrl("assets/generated/dumpster-holy-atlas.png")),
      loadImage(assetUrl("assets/generated/decorative-atlas.png")),
      loadImage(assetUrl("assets/generated/branch-platform-strip.png")),
      loadImage(assetUrl("assets/generated/metal-platform-strip.png")),
      loadImage(assetUrl("assets/ground-seamless.png")),
      loadImage(assetUrl("assets/backgrounds/forest-far.png")),
      loadImage(assetUrl("assets/backgrounds/forest-near.png")),
      loadImage(assetUrl("assets/backgrounds/city-far.png")),
      loadImage(assetUrl("assets/backgrounds/city-near.png")),
    ])
      .then(async ([atlas, playerHeroAtlas, jimothyHeroAtlas, bossAtlas, enemyAtlas, varietyEnemyAtlas, trashPickupAtlas, tacoPowerAtlas, dumpsterAtlas, decorativeAtlas, branchPlatform, metalPlatform, groundTile, forestFar, forestNear, cityFar, cityNear]) => {
        if (cancelled) return;
        atlasRef.current = atlas;
        playerHeroMotionRef.current = playerHeroAtlas;
        jimothyHeroMotionRef.current = jimothyHeroAtlas;
        bossMotionRef.current = bossAtlas;
        enemyMotionRef.current = enemyAtlas;
        varietyEnemyMotionRef.current = varietyEnemyAtlas;
        trashPickupMotionRef.current = trashPickupAtlas;
        tacoPowerMotionRef.current = tacoPowerAtlas;
        dumpsterAtlasRef.current = dumpsterAtlas;
        decorativeAtlasRef.current = decorativeAtlas;
        branchPlatformRef.current = branchPlatform;
        metalPlatformRef.current = metalPlatform;
        groundTileRef.current = groundTile;
        forestFarRef.current = forestFar;
        forestNearRef.current = forestNear;
        cityFarRef.current = cityFar;
        cityNearRef.current = cityNear;
        await Promise.all([
          loadLevelBackgrounds(worldRef.current.level),
          loadLevelEnemyAtlas(worldRef.current.level),
        ]);
        if (cancelled) return;
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadLevelBackgrounds, loadLevelEnemyAtlas]);

  useEffect(() => {
    return () => {
      if (powerupPauseTimerRef.current !== null) window.clearTimeout(powerupPauseTimerRef.current);
      if (powerupNoticeTimerRef.current !== null) window.clearTimeout(powerupNoticeTimerRef.current);
      disposeGameMusic(musicRef.current);
      musicRef.current = null;
    };
  }, []);

  useEffect(() => {
    let initialized = false;
    let cancelled = false;

    const syncBrowserExperience = () => {
      if (cancelled) return;
      const previous = browserExperienceRef.current;
      const next = readBrowserExperience(window, document);
      browserExperienceRef.current = next;
      setBrowserExperience(next);

      if (initialized && (previous.portrait !== next.portrait || (previous.fullscreen && !next.fullscreen))) {
        interruptGame();
      }
      initialized = true;
    };

    const unsubscribe = subscribeBrowserExperience(window, document, syncBrowserExperience);
    window.queueMicrotask(syncBrowserExperience);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [interruptGame]);

  useEffect(() => {
    const handled = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Space",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
      "KeyE",
      "KeyZ",
      "KeyX",
      "ShiftLeft",
      "ShiftRight",
    ]);

    const onKeyDown = (event: KeyboardEvent) => {
      if (handled.has(event.code)) event.preventDefault();
      if (!keysRef.current.has(event.code)) pressedRef.current.add(event.code);
      keysRef.current.add(event.code);

      if ((event.code === "Enter" || event.code === "Space") && screenRef.current === "title") {
        openCharacterSelect();
      }
      if (screenRef.current === "characterSelect") {
        if (event.code === "ArrowLeft" || event.code === "KeyA") moveCharacter(-1);
        if (event.code === "ArrowRight" || event.code === "KeyD") moveCharacter(1);
        if (event.code === "Enter" || event.code === "Space") confirmCharacter();
      }
      if (event.code === "Escape" || event.code === "KeyP") togglePause();
      if (event.code === "KeyR" && screenRef.current !== "title" && screenRef.current !== "characterSelect") startGame();
      if (event.code === "KeyM") toggleMute();
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const onBlur = () => interruptGame();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") interruptGame();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearHeldInput();
    };
  }, [clearHeldInput, confirmCharacter, interruptGame, moveCharacter, openCharacterSelect, startGame, toggleMute, togglePause]);

  useEffect(() => {
    let animationFrameId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;

    const keyHeld = (...codes: string[]) => codes.some((code) => keysRef.current.has(code));
    const keyPressed = (...codes: string[]) => codes.some((code) => pressedRef.current.has(code));

    const playerHeight = (player: Player) => (player.large ? 58 : 46);

    const transformPlayer = (player: Player, large: boolean) => {
      const feet = player.y + player.h;
      player.large = large;
      player.w = large ? 38 : 32;
      player.h = playerHeight(player);
      player.y = feet - player.h;
    };

    const respawn = (world: World) => {
      const player = world.player;
      player.x = world.arenaActive
        ? clampArenaPlayerX(world, world.level.boss.triggerX, player.w)
        : world.checkpoint;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.invulnerable = 1.8;
      player.glider = 0;
      player.attackTimer = 0;
      player.boostCooldown = 0;
      player.jumpBuffer = 0;
      player.animationName = player.large ? "large_idle" : "small_idle";
      player.animationElapsed = 0;
      player.landingTimer = 0;
      player.airtime = 0;
      player.skidTimer = 0;
      player.shrinkTimer = 0;
      player.endSequence = null;
      player.endTimer = 0;
      player.hurtTimer = 0;
      player.pendingDamage = null;
      world.bossTransition = null;
      world.cameraX = world.arenaActive ? bossArenaCameraX(world) : Math.max(0, world.checkpoint - 180);
      setMessage(world, "Back on your paws!", 1.7);
    };

    const hurtPlayer = (world: World, direction: number) => {
      const player = world.player;
      const hurt = beginPlayerHurt({
        large: player.large,
        lives: world.lives,
        invulnerable: player.invulnerable,
        hurtTimer: player.hurtTimer,
        direction,
      });
      if (!hurt) return;

      tone(130, 0.18, "sawtooth");
      burst(world, player.x + player.w / 2, player.y + player.h / 2, "#f6d477", 11);
      player.hurtTimer = hurt.timer;
      player.pendingDamage = hurt.outcome;
      player.vx = hurt.vx;
      player.vy = hurt.vy;
      player.grounded = false;
      player.glider = 0;
      player.attackTimer = 0;
      player.shrinkTimer = 0;
      player.animationName = player.large ? "large_hurt" : "small_hurt";
      player.animationElapsed = 0;
    };

    const finishPlayerHurt = (world: World) => {
      const player = world.player;
      const outcome = player.pendingDamage;
      player.pendingDamage = null;

      if (outcome === "shrink") {
        player.shrinkTimer = 0.4;
        player.invulnerable = 1.8;
        setMessage(world, "Oof — back to small!", 1.6);
      } else if (outcome === "respawn") {
        world.lives -= 1;
        transformPlayer(player, false);
        respawn(world);
      } else if (outcome === "gameover") {
        world.lives = Math.max(0, world.lives - 1);
        player.endSequence = "gameover";
        player.endTimer = 0.66;
        player.vx = 0;
      }
      return outcome;
    };

    const handlePitFall = (world: World) => {
      const player = world.player;
      const pit = resolvePitFall(world.lives);
      world.lives = pit.lives;
      transformPlayer(player, false);
      player.hurtTimer = 0;
      player.pendingDamage = null;
      player.attackTimer = 0;
      player.glider = 0;
      player.shrinkTimer = 0;
      player.endSequence = null;
      player.endTimer = 0;
      burst(world, player.x + player.w / 2, HEIGHT - 8, "#f6d477", 11);
      tone(100, 0.2, "sawtooth");

      if (pit.outcome === "respawn") respawn(world);
      else changeScreen("gameover");
    };

    const setBossState = (
      enemy: Enemy,
      state: keyof typeof BOSS_ANIMATIONS,
      duration = 0,
    ) => {
      enemy.animationState = state;
      enemy.actionTimer = duration;
      enemy.phase = 0;
    };

    const enterBossArena = (world: World) => {
      const transition = createBossTransition(world.cameraX, world.level.boss);
      const activated = activateBossArena(world.enemies);
      world.enemies = activated.enemies;
      world.arenaActive = activated.arenaActive;
      world.bossTransition = transition;
      const boss = world.enemies.find((enemy) => enemy.kind === "boss");
      if (boss) {
        boss.active = true;
        boss.vx = 0;
        if (boss.brutusState) {
          boss.brutusState = createBrutusState();
          boss.behaviorState = boss.brutusState.mode;
          boss.stateElapsed = 0;
        } else {
          boss.attackCooldown = 0.85;
          setBossState(boss, "idle");
        }
      }
      setMessage(world, boss?.brutusState ? "BRUTUS THE BIN-HOUND" : "TRASH HEAP TYRANT", 2.4);
      tone(92, 0.32, "sawtooth");

      const switchId = ++musicSwitchIdRef.current;
      void switchGameMusic(
        musicRef.current,
        assetUrl("assets/audio/trash-heap-tyrant-loop.m4a"),
        { muted: mutedRef.current },
      ).then((nextMusic) => {
        if (switchId === musicSwitchIdRef.current) musicRef.current = nextMusic;
        else if (nextMusic !== musicRef.current) disposeGameMusic(nextMusic);
      });
    };

    const damageEnemy = (world: World, enemy: Enemy, stomp = false) => {
      if (enemy.kind === "boss" && enemy.brutusState) {
        if (!enemy.active || enemy.hitCooldown > 0) return;
        const previousHp = enemy.brutusState.hp;
        const next = updateBrutus(enemy.brutusState, { dt: 0, playerAttackHit: true });
        if (next.hp === previousHp) return;
        enemy.brutusState = next;
        enemy.hp = next.hp;
        enemy.behaviorState = next.mode;
        enemy.stateElapsed = 0;
        enemy.hitCooldown = 0.16;
        enemy.vx = 0;
        burst(world, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffd248", 12);
        tone(170, 0.09, "square");
        if (next.hp === 0) {
          world.score += 2500;
          setMessage(world, "Brutus is headed for the pool!", 2);
        } else {
          setMessage(world, `${next.hp} hits left!`, 1.2);
        }
        return;
      }
      if (
        !enemy.active
        || enemy.hitCooldown > 0
        || (enemy.kind !== "boss" && enemy.hp <= 0)
        || (levelTwoEnemyKinds.has(enemy.kind) && !levelTwoEnemyCanReceiveAttack(enemy.kind, enemy.behaviorState))
        || (enemy.kind === "boss" && enemy.animationState === "defeat")
      ) return;
      enemy.hp -= 1;
      enemy.hitCooldown = 0.5;
      burst(world, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.kind === "boss" ? "#ffd248" : "#c7f170", enemy.kind === "boss" ? 12 : 7);
      tone(enemy.kind === "boss" ? 170 : 260, 0.09, "square");
      if (enemy.kind === "boss") {
        enemy.vx = 0;
        if (enemy.hp <= 0) {
          enemy.hp = 0;
          world.score += 2500;
          setBossState(enemy, "defeat", BOSS_SEQUENCE_DURATIONS.defeat);
          setMessage(world, "The tyrant is falling!", 2);
        } else {
          if (enemy.hp === 1 && !enemy.ragePlayed) enemy.rageQueued = true;
          setBossState(enemy, "hit", BOSS_SEQUENCE_DURATIONS.hit);
          setMessage(world, `${enemy.hp} hits left!`, 1.2);
        }
      } else if (enemy.hp <= 0) {
        if (levelTwoEnemyKinds.has(enemy.kind)) {
          Object.assign(enemy, beginLevelTwoEnemyHit(enemy));
        } else {
          enemy.active = false;
        }
        world.score += stomp ? 250 : 180;
      }
    };

    const finishBossDefeat = (world: World, boss: Enemy) => {
      boss.active = false;
      boss.vx = 0;
      world.bossDefeated = true;
      world.dumpsterRevealStartedAt = world.elapsed;
      setMessage(world, "Alley cleared — depot ahead!", 3);
      tone(420, 0.12);
      window.setTimeout(() => tone(620, 0.15), 100);
    };

    const finishBrutusDefeat = (world: World, boss: Enemy) => {
      if (world.bossDefeated) return;
      boss.active = false;
      boss.vx = 0;
      world.bossDefeated = true;
      world.arenaActive = false;
      world.bossTransition = null;
      world.binLids = [];
      setMessage(world, "Cul-de-sac cleared — downtown ahead!", 3);
      tone(420, 0.12);
      window.setTimeout(() => tone(620, 0.15), 100);
    };

    const updateBrutusBoss = (world: World, boss: Enemy, dt: number) => {
      const state = boss.brutusState;
      if (!state) return;
      boss.hitCooldown = Math.max(0, boss.hitCooldown - dt);
      if (!world.arenaActive || world.bossTransition) {
        boss.vx = 0;
        boss.y = boss.surfaceY - boss.h;
        return;
      }

      const movement = moveBrutusInArena(boss, state, { dt, boss: world.level.boss });
      boss.x = movement.x;
      boss.vx = movement.vx;
      boss.facing = movement.facing;

      const next = updateBrutus(state, { dt, hydrantHit: movement.hydrantHit });
      if (next.mode !== state.mode || next.visualState !== state.visualState) boss.stateElapsed = 0;
      else boss.stateElapsed += dt;
      boss.brutusState = next;
      boss.hp = next.hp;
      boss.behaviorState = next.mode;
      if (next.mode === "charge" && state.mode !== "charge") {
        boss.facing = world.player.x < boss.x ? -1 : 1;
      }

      if (next.phase === 2 && !boss.brutusCanSpawned) {
        boss.brutusCanSpawned = true;
        world.binLids = world.binLids.filter(({ ownerId }) => ownerId !== "brutus-can");
        world.binLids.push({
          x: boss.x + boss.w / 2 - 16,
          y: boss.surfaceY - 32,
          w: 32,
          h: 32,
          vx: boss.facing < 0 ? -170 : 170,
          reflected: false,
          ownerId: "brutus-can",
          lightweight: true,
          active: true,
        });
      }
      if (next.phase >= 3) world.binLids = world.binLids.filter(({ ownerId }) => ownerId !== "brutus-can");
      if (next.arenaUnlocked) finishBrutusDefeat(world, boss);
      boss.y = boss.surfaceY - boss.h;
    };

    const updateBoss = (world: World, boss: Enemy, dt: number) => {
      if (boss.brutusState) {
        updateBrutusBoss(world, boss, dt);
        return;
      }
      boss.phase += dt;
      boss.hitCooldown = Math.max(0, boss.hitCooldown - dt);
      boss.actionTimer = Math.max(0, boss.actionTimer - dt);
      if (!world.arenaActive) {
        boss.vx = 0;
        boss.animationState = "idle";
        boss.y = boss.surfaceY - boss.h;
        return;
      }

      // During the camera runway the boss is an introduction, not an active
      // combatant. Hold it still and grounded until the arena is fully framed.
      // This prevents attacks or walk cycles from starting behind the easing
      // camera and gives the player a clean, readable reveal.
      if (world.bossTransition) {
        boss.vx = 0;
        boss.animationState = "idle";
        boss.y = boss.surfaceY - boss.h;
        return;
      }

      const state = boss.animationState;
      if (state === "defeat") {
        boss.vx = 0;
        if (boss.actionTimer <= 0) finishBossDefeat(world, boss);
      } else if (state === "hit") {
        boss.vx = 0;
        if (boss.actionTimer <= 0) {
          if (boss.rageQueued) {
            boss.rageQueued = false;
            boss.ragePlayed = true;
            setBossState(boss, "rage", BOSS_SEQUENCE_DURATIONS.rage);
          } else {
            boss.attackCooldown = boss.ragePlayed ? 0.58 : 0.92;
            setBossState(boss, "walk");
          }
        }
      } else if (state === "rage") {
        boss.vx = 0;
        if (boss.actionTimer <= 0) {
          boss.attackCooldown = 0.4;
          setBossState(boss, "walk");
        }
      } else if (state === "windup") {
        boss.vx = 0;
        if (boss.actionTimer <= 0) {
          boss.facing = world.player.x < boss.x ? -1 : 1;
          boss.vx = boss.facing * (boss.ragePlayed ? 360 : 310);
          setBossState(boss, "charge", BOSS_SEQUENCE_DURATIONS.charge);
        }
      } else if (state === "charge") {
        boss.x += boss.vx * dt;
        const clampedX = clampArenaBossX(world, boss.x, boss.w);
        const hitWall = clampedX !== boss.x;
        boss.x = clampedX;
        if (boss.actionTimer <= 0 || hitWall) {
          boss.vx = 0;
          setBossState(boss, "recover", BOSS_SEQUENCE_DURATIONS.recover);
        }
      } else if (state === "recover") {
        boss.vx = 0;
        if (boss.actionTimer <= 0) {
          boss.attackCooldown = boss.ragePlayed ? 0.62 : 1.05;
          setBossState(boss, "walk");
        }
      } else {
        boss.attackCooldown = Math.max(0, boss.attackCooldown - dt);
        boss.facing = world.player.x < boss.x ? -1 : 1;
        boss.vx = boss.facing * (boss.ragePlayed ? 88 : 66);
        boss.x = clampArenaBossX(world, boss.x + boss.vx * dt, boss.w);
        if (boss.attackCooldown <= 0) setBossState(boss, "windup", BOSS_SEQUENCE_DURATIONS.windup);
      }

      boss.y = boss.surfaceY - boss.h;
      boss.animationState = selectBossAnimation({
        defeated: boss.animationState === "defeat",
        hit: boss.animationState === "hit",
        raging: boss.animationState === "rage",
        action: boss.animationState,
        vx: boss.vx,
      }) as Enemy["animationState"];
    };

    const update = (world: World, dt: number) => {
      const player = world.player;
      const profile = getPlayableCharacter(world.selectedCharacterId);
      const wasGrounded = player.grounded;
      const previousY = player.y;
      const previousBottom = previousY + player.h;
      world.elapsed += dt;
      player.anim += dt;
      player.animationElapsed += dt;
      player.invulnerable = Math.max(0, player.invulnerable - dt);
      player.attackTimer = Math.max(0, player.attackTimer - dt);
      player.boostCooldown = Math.max(0, player.boostCooldown - dt);
      player.glider = Math.max(0, player.glider - dt);
      player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
      player.landingTimer = Math.max(0, player.landingTimer - dt);
      player.skidTimer = Math.max(0, player.skidTimer - dt);
      if (!wasGrounded) player.airtime += dt;
      world.messageTimer = Math.max(0, world.messageTimer - dt);

      if (player.endSequence) {
        player.endTimer = Math.max(0, player.endTimer - dt);
        if (player.endTimer <= 0) {
          const completedScreen = player.endSequence;
          player.endSequence = null;
          changeScreen(completedScreen);
          pressedRef.current.clear();
          return;
        }
      }

      if (player.shrinkTimer > 0) {
        player.shrinkTimer = Math.max(0, player.shrinkTimer - dt);
        if (player.shrinkTimer <= 0) transformPlayer(player, false);
      }

      const hurtStep = advanceHurtTimer(player.hurtTimer, dt);
      player.hurtTimer = hurtStep.timer;
      if (hurtStep.complete) {
        const outcome = finishPlayerHurt(world);
        if (outcome === "respawn" || screenRef.current !== "playing") {
          pressedRef.current.clear();
          return;
        }
      }

      const acceptsInput = player.hurtTimer <= 0 && player.shrinkTimer <= 0 && player.endSequence === null;

      const left = acceptsInput && keyHeld("ArrowLeft", "KeyA");
      const right = acceptsInput && keyHeld("ArrowRight", "KeyD");
      const running = acceptsInput && keyHeld("ShiftLeft", "ShiftRight", "KeyX");
      const jumpHeld = acceptsInput && keyHeld("Space", "ArrowUp", "KeyW");
      const jumpPressed = acceptsInput && keyPressed("Space", "ArrowUp", "KeyW");
      const actionPressed = acceptsInput && keyPressed("KeyE", "KeyZ");

      if (jumpPressed) player.jumpBuffer = 0.13;
      player.coyote = player.grounded ? 0.12 : Math.max(0, player.coyote - dt);

      const direction = (right ? 1 : 0) - (left ? 1 : 0);
      if (direction && Math.sign(player.vx) === -direction && Math.abs(player.vx) > 120) {
        player.skidTimer = 0.16;
      }
      const targetSpeed = direction * (running ? 330 : 225);
      const acceleration = player.grounded ? 1900 : 1050;
      const speedDelta = targetSpeed - player.vx;
      player.vx += Math.sign(speedDelta) * Math.min(Math.abs(speedDelta), acceleration * dt);
      if (!direction && player.grounded) player.vx *= Math.pow(0.0008, dt);
      if (direction) player.facing = direction as 1 | -1;

      if (player.jumpBuffer > 0 && player.coyote > 0) {
        player.vy = -615;
        player.grounded = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        tone(380, 0.08);
        burst(world, player.x + player.w / 2, player.y + player.h, "#e7d8a5", 4);
      }

      const isGliding = player.glider > 0 && jumpHeld && player.vy > 10;
      const gravity = isGliding ? 430 : 1750;
      if (!jumpHeld && player.vy < -210) player.vy += 2100 * dt;
      player.vy = Math.min(isGliding ? 155 : 780, player.vy + gravity * dt);

      if (actionPressed && player.glider > 0 && player.boostCooldown <= 0) {
        player.vy = Math.min(player.vy, -240);
        player.boostCooldown = 1.05;
        tone(560, 0.1, "triangle");
      } else if (actionPressed && player.large && player.glider <= 0 && player.attackTimer <= 0) {
        player.attackTimer = 0.32;
        player.attackId += 1;
        tone(210, 0.07, "sawtooth");
      }

      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.x = Math.max(0, Math.min(world.worldWidth - player.w, player.x));
      player.grounded = false;

      for (const platform of world.platforms) {
        const bottom = player.y + player.h;
        const overlapsX = player.x + player.w > platform.x + 4 && player.x < platform.x + platform.w - 4;
        if (overlapsX && player.vy >= 0 && previousBottom <= platform.y + 8 && bottom >= platform.y) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
          break;
        }
      }

      if (player.grounded) {
        if (!wasGrounded && player.airtime > 0.08) player.landingTimer = 0.12;
        player.airtime = 0;
      }

      if (player.y > HEIGHT + 120) {
        handlePitFall(world);
        pressedRef.current.clear();
        return;
      }

      if (
        !world.arenaActive
        && !world.bossDefeated
        && world.level.boss.runwayStartX !== undefined
        && player.x >= world.level.boss.runwayStartX
      ) {
        world.enemies = world.enemies.filter(({ kind }) => kind === "boss");
      }
      if (!world.arenaActive && !world.bossDefeated && player.x >= world.level.boss.triggerX) enterBossArena(world);
      if (world.arenaActive) player.x = clampArenaPlayerX(world, player.x, player.w);

      const nextCheckpointIndex = world.checkpoints.findIndex((checkpoint, index) =>
        index > world.checkpointIndex && player.x >= checkpoint.x,
      );
      if (nextCheckpointIndex >= 0) {
        const checkpoint = world.checkpoints[nextCheckpointIndex];
        world.checkpointIndex = nextCheckpointIndex;
        world.checkpointReached = true;
        world.checkpoint = checkpoint.respawnX;
        world.score += 500;
        setMessage(world, `${checkpoint.label}!`, 2.4);
        tone(660, 0.12);
      }

      for (const pickup of world.pickups) {
        if (!pickup.active) continue;
        if (!intersects(player, pickup)) continue;
        pickup.active = false;
        world.score += pickup.kind === "trash" ? 100 : 500;
        if (pickup.kind === "trash") {
          world.trash += 1;
          tone(620 + (world.trash % 5) * 65, 0.07);
          if (world.trash % 5 === 0 && !player.large) {
            transformPlayer(player, true);
            showPowerupNotice("taco");
          }
        } else if (pickup.kind === "taco") {
          transformPlayer(player, true);
          showPowerupNotice("taco");
        } else {
          player.glider = 14;
          transformPlayer(player, true);
          showPowerupNotice("cap");
        }
        burst(world, pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, pickup.kind === "cap" ? "#ffd248" : "#8bdc63", 8);
      }

      const nextPlayerAnimation = selectCharacterAnimation(profile, {
        form: player.large ? "large" : "small",
        defeated: player.endSequence === "gameover",
        hurt: player.hurtTimer > 0,
        shrinking: player.shrinkTimer > 0,
        victorious: player.endSequence === "won",
        attacking: player.attackTimer > 0,
        grounded: player.grounded,
        gliding: player.glider > 0 && jumpHeld && player.vy > 10,
        landing: player.landingTimer > 0,
        skidding: player.skidTimer > 0,
        vx: player.vx,
        vy: player.vy,
      }) as keyof typeof PLAYER_ANIMATIONS;
      if (nextPlayerAnimation !== player.animationName) {
        player.animationName = nextPlayerAnimation;
        player.animationElapsed = 0;
      }

      for (const enemy of world.enemies) {
        if (!enemy.spawned && enemy.kind !== "boss" && player.x >= enemy.originX - 340) {
          enemy.spawned = true;
          enemy.active = true;
        }
        if (!enemy.active) continue;
        if (enemy.kind === "boss") {
          updateBoss(world, enemy, dt);
          if (!enemy.active) continue;
        } else {
          if (enemy.kind !== "moth") enemy.phase += dt * Math.max(3.4, Math.abs(enemy.vx) / 26);
          enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
          if (levelTwoEnemyKinds.has(enemy.kind)) {
            Object.assign(enemy, advanceLevelTwoEnemyPlayback(enemy, dt));
          }
        }

        if (enemy.kind !== "boss") {
          if (levelTwoEnemyKinds.has(enemy.kind)) {
            if (enemy.behaviorState === "defeated") {
              enemy.actionTimer = Math.max(0, enemy.actionTimer - dt);
              if (enemy.actionTimer === 0) enemy.active = false;
              continue;
            }
            const playerInRange = Math.abs((player.x + player.w / 2) - (enemy.x + enemy.w / 2)) < (
              enemy.kind === "terrier" ? 300 : enemy.kind === "moth" ? 210 : 260
            );
            if (enemy.kind === "squirrel" && enemy.behaviorState === "idle" && !playerInRange) {
              enemy.x = clamp(enemy.x + enemy.vx * dt, enemy.patrolMinX, enemy.patrolMaxX);
              if (enemy.x === enemy.patrolMinX) enemy.vx = Math.abs(enemy.vx);
              if (enemy.x === enemy.patrolMaxX) enemy.vx = -Math.abs(enemy.vx);
            }
            const obstacle = enemy.kind === "terrier"
              ? selectChargeObstacle(
                  enemy,
                  world.environment.filter(({ kind }) => kind === "charge-obstacle"),
                  dt,
                )
              : null;
            const flightBand = enemy.kind === "moth"
              ? world.level.flightBands?.find(({ id }) => id === enemy.flightBand)
              : null;
            if (enemy.kind === "moth" && !flightBand) {
              throw new RangeError(`Missing authored flight band "${enemy.flightBand}"`);
            }
            const next = updateLevelTwoEnemy({
              ...enemy,
              state: enemy.behaviorState,
              timer: enemy.actionTimer,
            }, {
              dt,
              playerInRange,
              playerX: player.x + player.w / 2,
              playerY: player.y,
              patrolMinX: enemy.patrolMinX,
              patrolMaxX: enemy.patrolMaxX,
              obstacle,
              lightX: enemy.originX,
              flightY: enemy.surfaceY - enemy.h,
              flightBand,
            });
            Object.assign(enemy, applyLevelTwoBehaviorTransition(enemy, next.state));
            enemy.actionTimer = next.timer ?? enemy.actionTimer;
            enemy.x = next.x ?? enemy.x;
            enemy.y = enemy.kind === "moth" ? next.y ?? enemy.y : enemy.surfaceY - enemy.h;
            enemy.vx = next.vx ?? enemy.vx;
            enemy.sprayActive = next.sprayActive ?? false;
            enemy.phase = next.phase ?? enemy.phase;
            enemy.facing = facingFromVelocity(enemy.vx, enemy.facing);
            if (enemy.kind === "skunk" && enemy.sprayActive) {
              const sprayRect: Rect = {
                x: enemy.facing > 0 ? enemy.x - 126 : enemy.x + enemy.w,
                y: enemy.y + 2,
                w: 126,
                h: enemy.h + 18,
              };
              if (intersects(player, sprayRect)) player.vx = enemy.facing > 0 ? -280 : 280;
              for (const other of world.enemies) {
                if (other.kind === "terrier" && other.behaviorState === "sleep" && intersects(other, sprayRect)) {
                  other.behaviorState = "wake";
                  other.actionTimer = 0.5;
                }
              }
            }
            if (next.spawnLid) {
              world.binLids.push({
                x: enemy.x + enemy.w / 2 - 14,
                y: enemy.y + 8,
                w: 28,
                h: 10,
                vx: enemy.facing * 140,
                reflected: false,
                ownerId: enemy.id,
                lightweight: true,
                active: true,
              });
            }
          } else {
            const intent = nextEnemyIntent({
              kind: enemy.kind,
              enemyX: enemy.x,
              originX: enemy.originX,
              playerX: player.x,
              vx: enemy.vx,
              facing: enemy.facing,
            });
            enemy.vx = intent.vx;
            enemy.facing = intent.facing;
            enemy.x += enemy.vx * (enemy.kind === "slime" ? 0.35 : 1) * dt;

            const patrolMin = enemy.patrolMinX;
            const patrolMax = enemy.patrolMaxX;
            if (enemy.x <= patrolMin) {
              enemy.x = patrolMin;
              enemy.vx = Math.abs(enemy.vx);
              enemy.facing = 1;
            } else if (enemy.x >= patrolMax) {
              enemy.x = patrolMax;
              enemy.vx = -Math.abs(enemy.vx);
              enemy.facing = -1;
            }
            enemy.y = enemy.surfaceY - enemy.h + (flyingEnemies.has(enemy.kind) ? Math.sin(enemy.phase * 0.82) * 11 : 0);
          }
        }

        const profileAnimations = profile.animations as Record<string, typeof PLAYER_ANIMATIONS.small_idle>;
        const playerAnimation = profileAnimations[player.animationName] ?? profileAnimations.small_idle;
        const playerFrameIndex = animationFrame(playerAnimation, player.animationElapsed);
        if (player.large && player.animationName === "large_tail_swipe" && (isTailSwipeActive(playerFrameIndex) || profile.attackFrames.includes(playerFrameIndex))) {
          const attackRect: Rect = {
            x: player.facing > 0 ? player.x + player.w - 4 : player.x - 58,
            y: player.y + 8,
            w: 62,
            h: player.h - 10,
          };
          if (intersects(attackRect, enemy)) damageEnemy(world, enemy);
        }

        if (!intersects(player, enemy)) continue;
        const bossAnimation = enemy.kind === "boss" && !enemy.brutusState
          ? BOSS_ANIMATIONS[enemy.animationState as keyof typeof BOSS_ANIMATIONS]
          : null;
        const bossFrame = bossAnimation ? bossAnimationFrame(bossAnimation, enemy.phase) : 0;
        const bossCanDamage = enemy.kind === "boss"
          ? enemy.brutusState
            ? enemy.brutusState.mode === "charge"
            : enemy.animationState === "walk"
              || (enemy.animationState === "charge" && isBossChargeActive(bossFrame))
          : !levelTwoEnemyKinds.has(enemy.kind)
            || levelTwoEnemyCanContactDamage(enemy.kind, enemy.behaviorState);
        const stomped = player.vy > 80 && previousBottom <= enemy.y + 16;
        if (stomped) {
          player.vy = -360;
          damageEnemy(world, enemy, true);
        } else if (bossCanDamage && enemy.hitCooldown <= 0) {
          hurtPlayer(world, player.x < enemy.x ? -1 : 1);
        }
      }

      const attackAnimation = (profile.animations as Record<string, typeof PLAYER_ANIMATIONS.small_idle>)[player.animationName];
      const attackFrameIndex = attackAnimation ? animationFrame(attackAnimation, player.animationElapsed) : 0;
      const tailSwipeRect: Rect | null = player.large
        && player.animationName === "large_tail_swipe"
        && (isTailSwipeActive(attackFrameIndex) || profile.attackFrames.includes(attackFrameIndex))
        ? {
            x: player.facing > 0 ? player.x + player.w - 4 : player.x - 58,
            y: player.y + 8,
            w: 62,
            h: player.h - 10,
          }
        : null;
      for (const lid of world.binLids) {
        if (!lid.active) continue;
        if (tailSwipeRect && intersects(tailSwipeRect, lid)) {
          Object.assign(lid, reflectBinLidFromTail(lid, {
            tailSwipeHit: true,
            playerFacing: player.facing,
          }));
        }
        for (const sprinkler of world.environment.filter(({ kind }) => kind === "sprinkler")) {
          const brutus = world.enemies.find((enemy) => enemy.kind === "boss" && enemy.brutusState);
          const activeSide = brutus
            ? brutusArenaHazards(brutus.brutusState).find(({ kind }) => kind === "sprinkler")?.side
            : null;
          const authoredSide = world.level.boss.sprinklers?.find(({ id }) => id === sprinkler.id)?.side;
          const sprinklerActive = sprinkler.encounterId === "brutus"
            ? Boolean(activeSide && activeSide === authoredSide)
            : Math.sin(world.elapsed * 2.4 + sprinkler.x) > -0.15;
          const stream: Rect = { x: sprinkler.x - 74, y: sprinkler.y - 104, w: 182, h: 128 };
          if (sprinklerActive && intersects(lid, stream)) {
            Object.assign(lid, updateSprinkler(lid, {
              active: true,
              direction: authoredSide === "right"
                ? -1
                : authoredSide === "left" ? 1 : Math.sin(world.elapsed * 1.2 + sprinkler.x) < 0 ? -1 : 1,
            }));
          }
        }
        for (const skunk of world.enemies.filter(({ kind, sprayActive }) => kind === "skunk" && sprayActive)) {
          const stream: Rect = {
            x: skunk.facing > 0 ? skunk.x - 126 : skunk.x + skunk.w,
            y: skunk.y + 2,
            w: 126,
            h: skunk.h + 18,
          };
          if (intersects(lid, stream)) {
            Object.assign(lid, updateSprinkler(lid, { active: true, direction: -skunk.facing }));
          }
        }
        lid.x += lid.vx * dt;
        if (lid.reflected) {
          for (const enemy of world.enemies) {
            if (!enemy.active || enemy.id === lid.ownerId || enemy.kind === "boss" || !intersects(lid, enemy)) continue;
            damageEnemy(world, enemy);
            lid.active = false;
            break;
          }
          const owner = world.enemies.find(({ id }) => id === lid.ownerId);
          if (lid.active && owner?.active && intersects(lid, owner)) {
            damageEnemy(world, owner);
            lid.active = false;
          }
        } else if (intersects(lid, player)) {
          hurtPlayer(world, lid.vx < 0 ? -1 : 1);
          lid.active = false;
        }
        if (lid.x < -80 || lid.x > world.worldWidth + 80) lid.active = false;
      }
      world.binLids = world.binLids.filter(({ active }) => active);

      const brutus = world.enemies.find((enemy) => enemy.kind === "boss" && enemy.brutusState);
      const activeBrutusSprinkler = brutus
        ? brutusArenaHazards(brutus.brutusState).find(({ kind }) => kind === "sprinkler")
        : null;
      if (activeBrutusSprinkler) {
        const sprinkler = world.environment.find((item) => (
          item.kind === "sprinkler"
          && item.encounterId === "brutus"
          && (world.level.boss.sprinklers ?? []).find(({ id, side }) => id === item.id && side === activeBrutusSprinkler.side)
        ));
        if (sprinkler) {
          const stream: Rect = {
            x: activeBrutusSprinkler.side === "left" ? sprinkler.x : sprinkler.x - 148,
            y: sprinkler.y - 104,
            w: 182,
            h: 128,
          };
          if (intersects(player, stream)) hurtPlayer(world, activeBrutusSprinkler.side === "left" ? 1 : -1);
        }
      }

      for (const particle of world.particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 420 * dt;
        particle.life -= dt;
      }
      world.particles = world.particles.filter((particle) => particle.life > 0);

      if (world.bossDefeated && player.x > world.level.exit.x - 220 && screenRef.current === "playing" && !player.endSequence) {
        world.score += Math.max(0, Math.floor(4000 - world.elapsed * 12));
        const oldScore = Number(window.localStorage.getItem("trash-dash-high-score") ?? 0);
        const oldTime = Number(window.localStorage.getItem("trash-dash-best-time") ?? 0);
        const nextScore = Math.max(oldScore, world.score);
        const nextTime = oldTime === 0 ? world.elapsed : Math.min(oldTime, world.elapsed);
        setVictoryRecord(evaluateVictoryRecord({
          score: world.score,
          time: world.elapsed,
          bestScore: oldScore,
          bestTime: oldTime,
        }));
        window.localStorage.setItem("trash-dash-high-score", String(nextScore));
        window.localStorage.setItem("trash-dash-best-time", String(nextTime));
        setBest({ score: nextScore, time: nextTime });
        player.endSequence = "won";
        player.endTimer = 0.58;
        player.vx = 0;
        player.animationName = player.large ? "large_victory" : "small_victory";
        player.animationElapsed = 0;
        tone(640, 0.15);
        window.setTimeout(() => tone(800, 0.18), 120);
      }

      if (world.arenaActive && world.bossTransition) {
        const transition = advanceBossTransition(world.bossTransition, dt, world.level.boss);
        world.cameraX = transition.cameraX;
        world.bossTransition = transition.complete ? null : transition.transition;
      } else {
        const cameraTarget = world.arenaActive
          ? bossArenaCameraX(world)
          : Math.max(0, Math.min(world.worldWidth - WIDTH, player.x - WIDTH * 0.36));
        world.cameraX += (cameraTarget - world.cameraX) * Math.min(1, dt * (world.arenaActive ? 9 : 5.5));
      }
      pressedRef.current.clear();
    };

    const drawSprite = (
      frame: Frame,
      x: number,
      y: number,
      w: number,
      h: number,
      flip = false,
      alpha = 1,
      source: HTMLImageElement | null = atlasRef.current,
    ) => {
      const atlas = source;
      if (!atlas) return;
      const drawX = Math.round(x);
      const drawY = Math.round(y);
      const drawW = Math.round(w);
      const drawH = Math.round(h);
      context.save();
      context.globalAlpha = alpha;
      if (flip) {
        context.translate(drawX + drawW, drawY);
        context.scale(-1, 1);
        context.drawImage(atlas, frame[0], frame[1], frame[2], frame[3], 0, 0, drawW, drawH);
      } else {
        context.drawImage(atlas, frame[0], frame[1], frame[2], frame[3], drawX, drawY, drawW, drawH);
      }
      context.restore();
    };

    const drawCloud = (x: number, y: number, scale: number) => {
      const unit = Math.max(4, Math.round(8 * scale));
      const left = Math.round(x);
      const top = Math.round(y);
      context.fillStyle = "#d9eef1";
      context.fillRect(left + unit, top + unit * 2, unit * 9, unit * 2);
      context.fillStyle = "#fff7d8";
      context.fillRect(left + unit * 2, top + unit, unit * 7, unit * 2);
      context.fillRect(left + unit * 3, top, unit * 3, unit * 3);
      context.fillRect(left + unit * 6, top + unit, unit * 3, unit * 2);
    };

    const drawTiledLayer = (
      image: HTMLImageElement | null,
      camera: number,
      speed: number,
      y: number,
      drawWidth: number,
      drawHeight: number,
      alpha: number,
    ) => {
      if (!image || alpha <= 0) return;
      const offset = -Math.round((camera * speed) % drawWidth);
      context.save();
      context.globalAlpha = alpha;
      for (let x = offset - drawWidth; x < WIDTH + drawWidth; x += drawWidth) {
        context.drawImage(image, Math.round(x), y, drawWidth, drawHeight);
      }
      context.restore();
    };

    const drawDecorativeProp = (
      prop: keyof typeof DECORATIVE_PROPS,
      worldX: number,
      groundY: number,
      camera: number,
      alpha = 1,
    ) => {
      const rect = decorativeDrawRect(prop, worldX, camera, groundY);
      const meta = DECORATIVE_PROPS[prop];
      const sourceX = meta.frame.column * ASSET_CELL + Math.round((ASSET_CELL - meta.sourceWidth) / 2);
      const sourceY = meta.frame.row * ASSET_CELL + meta.baseline - meta.sourceHeight;
      const atlas = decorativeAtlasRef.current;
      if (!atlas) return;
      context.save();
      context.globalAlpha = alpha;
      context.drawImage(atlas, sourceX, sourceY, meta.sourceWidth, meta.sourceHeight, rect.x, rect.y, rect.width, rect.height);
      const shadow = decorativeShadowRect(prop, rect);
      context.fillStyle = "rgba(10, 18, 26, 0.28)";
      context.beginPath();
      context.ellipse(shadow.x + shadow.width / 2, shadow.y + shadow.height / 2, shadow.width / 2, shadow.height / 2, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const drawPlatformStrip = (kind: "branch" | "metal", x: number, y: number, width: number) => {
      const image = kind === "branch" ? branchPlatformRef.current : metalPlatformRef.current;
      if (!image) return;
      for (const segment of platformStripSegments(kind, x, y - 4, width)) {
        if (segment.dest.width <= 0) continue;
        context.drawImage(image, segment.source.x, segment.source.y, segment.source.width, segment.source.height, segment.dest.x, segment.dest.y, segment.dest.width, segment.dest.height);
      }
    };

    const render = (world: World) => {
      const camera = Math.round(world.cameraX);
      const cityMix = Math.max(0, Math.min(1, (camera - 2140) / 1050));
      const forestMix = 1 - cityMix;
      context.clearRect(0, 0, WIDTH, HEIGHT);
      const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, cityMix > 0.5 ? "#7085ad" : "#64c7e6");
      sky.addColorStop(0.58, cityMix > 0.5 ? "#a28ba3" : "#83d8e4");
      sky.addColorStop(1, cityMix > 0.5 ? "#d4a27f" : "#badbaf");
      context.fillStyle = sky;
      context.fillRect(0, 0, WIDTH, GROUND_Y);

      const cloudLayout = [
        { x: 80, y: 55, scale: 1.05, speed: 0.035 },
        { x: 335, y: 145, scale: 0.8, speed: 0.055 },
        { x: 610, y: 72, scale: 1.2, speed: 0.04 },
        { x: 875, y: 215, scale: 0.72, speed: 0.065 },
        { x: 1110, y: 125, scale: 0.9, speed: 0.05 },
      ];
      for (const cloud of cloudLayout) {
        const cloudX = ((cloud.x - camera * cloud.speed + 180) % 1180 + 1180) % 1180 - 180;
        context.save();
        context.globalAlpha = 0.72 * forestMix;
        drawCloud(cloudX, cloud.y, cloud.scale);
        context.restore();
      }

      // Each environment has two independently tiled strips. Their different
      // camera speeds create depth while the oversized art keeps repetition subtle.
      const backgroundDrawHeight = 514;
      const backgroundDrawY = GROUND_Y - backgroundDrawHeight;
      const stageCenterX = camera + WIDTH * 0.5;
      const activeLevel = world.level;
      const stageZone = campaignZoneAt(activeLevel, stageCenterX);
      const stageBackground = levelBackgroundRefs.current[stageZone.id] ?? null;
      if (stageBackground) {
        const drawStageSet = (layers: { far: HTMLImageElement | null; middle: HTMLImageElement | null; close: HTMLImageElement | null }, alpha: number) => {
          drawTiledLayer(layers.far, camera, PARALLAX_SPEEDS.far, -46, 2048, 716, alpha);
          drawTiledLayer(layers.middle, camera, PARALLAX_SPEEDS.middle, -46, 2048, 716, alpha);
          drawTiledLayer(layers.close, camera, PARALLAX_SPEEDS.close, -46, 2048, 716, alpha);
        };
        const blendState = levelBackgroundBlendAt(stageCenterX, activeLevel.zones);
        const leftBackground = levelBackgroundRefs.current[blendState.leftId] ?? null;
        const rightBackground = blendState.rightId ? levelBackgroundRefs.current[blendState.rightId] ?? null : null;
        if (leftBackground && rightBackground) {
          drawStageSet(leftBackground, 1 - blendState.blend);
          drawStageSet(rightBackground, blendState.blend);
        } else {
          drawStageSet(stageBackground, 1);
        }
      }
      if (!stageBackground) {
        drawTiledLayer(forestFarRef.current, camera, 0.055, backgroundDrawY, 1540, backgroundDrawHeight, forestMix * 0.92);
        drawTiledLayer(forestNearRef.current, camera, 0.13, backgroundDrawY, 1540, backgroundDrawHeight, forestMix * 0.82);
        drawTiledLayer(cityFarRef.current, camera, 0.045, backgroundDrawY, 1540, backgroundDrawHeight, cityMix * 0.72);
        drawTiledLayer(cityNearRef.current, camera, 0.11, backgroundDrawY, 1540, backgroundDrawHeight, cityMix * 0.9);
      }
      const lighting = campaignLightingAt(world.level, camera + WIDTH * 0.5);
      const lightingOverlays: Record<string, { color: string; alpha: number } | null> = {
        "late-afternoon": null,
        sunset: { color: "rgba(255, 132, 66, 0.14)", alpha: 0.72 },
        dusk: { color: "rgba(75, 78, 152, 0.18)", alpha: 0.78 },
        night: { color: "rgba(12, 28, 78, 0.24)", alpha: 0.84 },
        moonlit: { color: "rgba(36, 46, 116, 0.28)", alpha: 0.9 },
      };
      const lightingOverlay = lightingOverlays[lighting.lighting];
      if (lightingOverlay) {
        context.save();
        context.globalAlpha = lighting.progress * lightingOverlay.alpha;
        context.fillStyle = lightingOverlay.color;
        context.fillRect(0, 0, WIDTH, GROUND_Y);
        context.restore();
      }
      if (world.arenaActive) {
        const arenaShade = context.createLinearGradient(0, 0, 0, GROUND_Y);
        arenaShade.addColorStop(0, "rgba(8, 9, 24, 0.46)");
        arenaShade.addColorStop(1, "rgba(31, 10, 29, 0.2)");
        context.fillStyle = arenaShade;
        context.fillRect(0, 0, WIDTH, GROUND_Y);
      }

      for (const item of scenery) {
        const x = item.x - camera;
        if (x < -160 || x > WIDTH + 160) continue;
        drawDecorativeProp(item.prop, item.x, item.groundY, camera);
      }

      for (const platform of world.platforms) {
        const x = platform.x - camera;
        if (x + platform.w < -80 || x > WIDTH + 80) continue;
        if (platform.kind === "ground") {
          context.save();
          context.beginPath();
          context.rect(Math.round(x), platform.y - 2, Math.ceil(platform.w), platform.h + 2);
          context.clip();
          context.fillStyle = "#6f3d25";
          context.fillRect(Math.round(x), platform.y, Math.ceil(platform.w), platform.h);
          const groundTile = groundTileRef.current;
          if (groundTile) {
            for (let tileX = 0; tileX < platform.w + 64; tileX += 64) {
              context.drawImage(groundTile, Math.round(x + tileX), platform.y - 2, 65, 66);
            }
          }
          context.restore();
        } else if (platform.kind === "branch") {
          drawPlatformStrip("branch", x, platform.y, platform.w);
        } else if (platform.kind === "metal") {
          drawPlatformStrip("metal", x, platform.y, platform.w);
        } else {
          drawDecorativeProp("crate", platform.x, platform.y + platform.h, camera);
        }
      }

      for (const [index, checkpoint] of world.checkpoints.entries()) {
        const checkpointAlpha = index <= world.checkpointIndex ? 1 : 0.62;
        drawDecorativeProp("checkpoint", checkpoint.x, GROUND_Y, camera, checkpointAlpha);
      }
      const dumpsterRect = dumpsterDrawRect(dumpsterGoalWorldX(world), camera, GROUND_Y);
      const dumpsterState = selectDumpsterState(world.bossDefeated);
      const revealElapsed = world.dumpsterRevealStartedAt === null
        ? (world.bossDefeated ? 0.8 : 0)
        : world.elapsed - world.dumpsterRevealStartedAt;
      const revealProgress = world.bossDefeated ? dumpsterRevealProgress(revealElapsed) : 0;
      const sealedFrame = dumpsterFrame("sealed", world.elapsed).source as Frame;
      const holyFrame = dumpsterFrame("holy", world.elapsed).source as Frame;
      if (dumpsterState === "sealed") {
        drawSprite(
          sealedFrame,
          dumpsterRect.x,
          dumpsterRect.y,
          DUMPSTER_DRAW_WIDTH,
          DUMPSTER_DRAW_HEIGHT,
          false,
          0.62,
          dumpsterAtlasRef.current,
        );
      } else {
        // Crossfade treatment only; both rows use the same destination rect,
        // so the wheels and ground contact never jump during the reveal.
        drawSprite(
          sealedFrame,
          dumpsterRect.x,
          dumpsterRect.y,
          DUMPSTER_DRAW_WIDTH,
          DUMPSTER_DRAW_HEIGHT,
          false,
          0.62 * (1 - revealProgress),
          dumpsterAtlasRef.current,
        );
        drawSprite(
          holyFrame,
          dumpsterRect.x,
          dumpsterRect.y,
          DUMPSTER_DRAW_WIDTH,
          DUMPSTER_DRAW_HEIGHT,
          false,
          revealProgress,
          dumpsterAtlasRef.current,
        );
      }

      context.save();
      context.font = "900 15px var(--font-body), sans-serif";
      context.textAlign = "center";
      context.fillStyle = "#173e3b";
      if (camera < 550) {
        context.fillText("MOVE  A / D", 245 - camera, 378);
        context.fillText("JUMP  SPACE", 245 - camera, 398);
      }
      if (camera > 2900 && camera < 3600) {
        context.fillText("HOLD JUMP TO GLIDE", 3530 - camera, 265);
      }
      context.restore();

      for (const item of world.environment) {
        const x = item.x - camera;
        if (x < -180 || x > WIDTH + 180) continue;
        context.save();
        if (item.kind === "sprinkler") {
          const brutus = world.enemies.find((enemy) => enemy.kind === "boss" && enemy.brutusState);
          const activeSide = brutus
            ? brutusArenaHazards(brutus.brutusState).find(({ kind }) => kind === "sprinkler")?.side
            : null;
          const authoredSide = world.level.boss.sprinklers?.find(({ id }) => id === item.id)?.side;
          const sprinklerActive = item.encounterId === "brutus"
            ? Boolean(activeSide && activeSide === authoredSide)
            : Math.sin(world.elapsed * 2.4 + item.x) > -0.15;
          context.fillStyle = "#173e3b";
          context.fillRect(x, item.y, item.w, item.h);
          context.fillStyle = "#9ddfd1";
          context.fillRect(x + 8, item.y - 4, item.w - 16, 6);
          if (sprinklerActive) {
            context.strokeStyle = "#9ddfd1";
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(x + item.w / 2, item.y);
            const direction = authoredSide === "right" ? -1 : 1;
            context.lineTo(x + item.w / 2 + direction * 74, item.y - 94);
            context.stroke();
          }
        } else if (item.kind === "charge-obstacle") {
          context.fillStyle = "#173e3b";
          context.fillRect(x, item.y, item.w, item.h);
          context.fillStyle = "#6d8791";
          context.fillRect(x + 6, item.y + 7, item.w - 12, item.h - 14);
        } else if (item.kind === "bin-lid-source") {
          context.fillStyle = "#173e3b";
          context.beginPath();
          context.ellipse(x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = "#9fb0b4";
          context.beginPath();
          context.ellipse(x + item.w / 2, item.y + item.h / 2, item.w / 2 - 3, item.h / 2 - 3, 0, 0, Math.PI * 2);
          context.fill();
        } else if (item.kind === "porch-light") {
          context.fillStyle = "#173e3b";
          context.fillRect(x + 6, item.y - 8, 8, item.h + 12);
          context.fillStyle = "#ffd86a";
          context.fillRect(x + 2, item.y, 16, 12);
        } else if (item.kind === "hydrant") {
          context.fillStyle = "#172b46";
          context.fillRect(x + 5, item.y + 10, item.w - 10, item.h - 10);
          context.fillStyle = "#d9584d";
          context.fillRect(x + 9, item.y + 5, item.w - 18, item.h - 12);
          context.fillRect(x, item.y + 22, item.w, 15);
          context.fillStyle = "#ffd36a";
          context.fillRect(x + 14, item.y, item.w - 28, 7);
        }
        context.restore();
      }

      for (const pickup of world.pickups) {
        if (!pickup.active) continue;
        const x = pickup.x - camera;
        if (x < -80 || x > WIDTH + 80) continue;
        const y = pickup.y + Math.sin(world.elapsed * 1.65 + pickup.phase) * 2;
        const pickupFrame = Math.floor(world.elapsed * 5 + pickup.phase) % 4;
        if (pickup.kind === "taco") {
          drawSprite(tacoPowerMotion[pickupFrame], x - 10, y - 12, 58, 58, false, 1, tacoPowerMotionRef.current);
        } else if (pickup.kind === "cap") {
          drawSprite(sprites.cap, x - 9, y - 7, 50, 42);
        } else {
          const trashFrames = trashPickupRows[Math.abs(Math.floor(pickup.phase)) % trashPickupRows.length];
          drawSprite(trashFrames[pickupFrame], x - 8, y - 10, 46, 46, false, 1, trashPickupMotionRef.current);
        }
      }

      for (const lid of world.binLids) {
        const x = lid.x - camera;
        if (x < -60 || x > WIDTH + 60) continue;
        context.save();
        context.translate(x + lid.w / 2, lid.y + lid.h / 2);
        context.rotate(world.elapsed * (lid.reflected ? 15 : lid.ownerId === "brutus-can" ? 5 : 10));
        if (lid.ownerId === "brutus-can") {
          context.fillStyle = "#172b46";
          context.fillRect(-lid.w / 2, -lid.h / 2, lid.w, lid.h);
          context.fillStyle = "#708695";
          context.fillRect(-lid.w / 2 + 4, -lid.h / 2 + 3, lid.w - 8, lid.h - 8);
          context.fillStyle = "#172b46";
          context.fillRect(-lid.w / 2 + 7, lid.h / 2 - 5, 6, 6);
          context.fillRect(lid.w / 2 - 13, lid.h / 2 - 5, 6, 6);
          context.restore();
          continue;
        }
        context.fillStyle = "#173e3b";
        context.beginPath();
        context.ellipse(0, 0, lid.w / 2, lid.h / 2, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = lid.reflected ? "#c7f170" : "#aebbc2";
        context.beginPath();
        context.ellipse(0, 0, lid.w / 2 - 3, lid.h / 2 - 2, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      for (const enemy of world.enemies) {
        if (!enemy.active) continue;
        const x = enemy.x - camera;
        if (x < -150 || x > WIDTH + 150) continue;
        const frameIndex = Math.floor(enemy.phase) % 4;
        const flip = enemy.facing < 0;
        const drawEnemy = (
          frame: Frame,
          drawW: number,
          drawH: number,
          alpha = 1,
          source: HTMLImageElement | null = atlasRef.current,
        ) => {
          drawSprite(
            frame,
            x + enemy.w / 2 - drawW / 2,
            enemy.y + enemy.h - drawH,
            drawW,
            drawH,
            flip,
            alpha,
            source,
          );
        };
        if (enemy.kind === "pigeon") drawEnemy(enemyMotion.pigeon[frameIndex], 66, 66, 1, enemyMotionRef.current);
        if (enemy.kind === "slime") drawEnemy(enemyMotion.slime[frameIndex], 62, 62, 1, enemyMotionRef.current);
        if (enemy.kind === "beetle") drawEnemy(enemyMotion.beetle[frameIndex], 68, 68, 1, enemyMotionRef.current);
        if (enemy.kind === "possum") drawEnemy(enemyMotion.possum[frameIndex], 78, 78, 1, enemyMotionRef.current);
        const varietyKind = enemy.kind as keyof typeof varietyEnemyMotion;
        const varietyFrames = varietyEnemyMotion[varietyKind];
        if (varietyFrames && !(world.levelId === "level-2" && levelTwoEnemyKinds.has(enemy.kind))) {
          const [drawW, drawH] = varietyEnemyDrawSizes[varietyKind];
          drawEnemy(varietyFrames[frameIndex], drawW, drawH, 1, varietyEnemyMotionRef.current);
        }
        if (world.levelId === "level-2" && levelTwoEnemyKinds.has(enemy.kind)) {
          const animation = levelTwoEnemyAnimation(enemy.kind, enemy.visualState ?? enemy.behaviorState);
          if (animation) {
            const stateFrame = enemyAnimationFrame(animation, enemy.stateElapsed);
            const stateFrameRect = [
              stateFrame * MOTION_CELL,
              animation.row * MOTION_CELL,
              MOTION_CELL,
              MOTION_CELL,
            ] as Frame;
            const drawSizes: Record<"squirrel" | "terrier" | "skunk" | "moth", [number, number]> = {
              squirrel: [78, 76], terrier: [94, 82], skunk: [90, 78], moth: [84, 82],
            };
            const [drawW, drawH] = drawSizes[enemy.kind as keyof typeof drawSizes];
            const drawY = enemy.kind === "moth"
              ? enemy.y + enemy.h / 2 - drawH / 2
              : enemy.y + enemy.h - drawH + drawH * (16 / MOTION_CELL);
            drawSprite(
              stateFrameRect,
              x + enemy.w / 2 - drawW / 2,
              drawY,
              drawW,
              drawH,
              flip,
              1,
              levelTwoEnemyMotionRef.current,
            );
          }
        }
        if (enemy.kind === "boss") {
          if (enemy.brutusState) {
            const animation = brutusAnimation(enemy.brutusState);
            const stateFrame = brutusAnimationFrame(animation, enemy.stateElapsed);
            const frame = [stateFrame * 256, animation.row * 192, 256, 192] as Frame;
            const drawWidth = 220;
            const drawHeight = 165;
            drawSprite(
              frame,
              x + enemy.w / 2 - drawWidth / 2,
              enemy.y + enemy.h - drawHeight + drawHeight * (16 / 192),
              drawWidth,
              drawHeight,
              flip,
              1,
              brutusMotionRef.current,
            );
          } else {
            const bossAnimation = BOSS_ANIMATIONS[enemy.animationState as keyof typeof BOSS_ANIMATIONS];
            const bossFrameIndex = bossAnimationFrame(bossAnimation, enemy.phase);
            const bossFrame = [
              bossFrameIndex * ASSET_CELL,
              bossAnimation.row * ASSET_CELL,
              ASSET_CELL,
              ASSET_CELL,
            ] as Frame;
            drawEnemy(
              bossFrame,
              bossAnimation.drawWidth,
              bossAnimation.drawHeight,
              1,
              bossMotionRef.current,
            );
          }
          context.fillStyle = "#173e3b";
          context.fillRect(x + 4, enemy.y - 48, 88, 9);
          context.fillStyle = "#ffb13b";
          context.fillRect(x + 7, enemy.y - 45, 82 * (enemy.hp / 3), 3);
        }
      }

      const player = world.player;
      const playerX = player.x - camera;
      const profile = getPlayableCharacter(world.selectedCharacterId);
      const profileAnimations = profile.animations as Record<string, typeof PLAYER_ANIMATIONS.small_idle>;
      const playerAnimation = profileAnimations[player.animationName] ?? profileAnimations.small_idle;
      const playerFrameIndex = animationFrame(playerAnimation, player.animationElapsed);
      const frame = [
        playerFrameIndex * MOTION_CELL,
        playerAnimation.row * MOTION_CELL,
        MOTION_CELL,
        MOTION_CELL,
      ] as Frame;
      const drawW = playerAnimation.drawWidth;
      const drawH = playerAnimation.drawHeight;
      const groundedVisualOffset = player.grounded ? (player.large ? 5 : 4) : 0;

      drawSprite(
        frame,
        playerX + player.w / 2 - drawW / 2,
        player.y + player.h - drawH + playerAnimation.offsetY + groundedVisualOffset,
        drawW,
        drawH,
        player.facing < 0,
        player.hurtTimer <= 0 && player.invulnerable > 0 && Math.floor(player.invulnerable * 18) % 2 ? 0.45 : 1,
        world.selectedCharacterId === "jimothy" ? jimothyHeroMotionRef.current : playerHeroMotionRef.current,
      );

      for (const particle of world.particles) {
        context.globalAlpha = Math.max(0, particle.life * 1.8);
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x - camera), Math.round(particle.y), particle.size, particle.size);
      }
      context.globalAlpha = 1;

      if (world.messageTimer > 0 && screenRef.current === "playing") {
        const alpha = Math.min(1, world.messageTimer * 2);
        context.save();
        context.globalAlpha = alpha;
        context.font = "1000 17px var(--font-body), sans-serif";
        const width = Math.min(520, context.measureText(world.message).width + 42);
        context.fillStyle = "#163c3c";
        context.beginPath();
        context.roundRect(WIDTH / 2 - width / 2, 24, width, 40, 12);
        context.fill();
        context.fillStyle = "#fff4ce";
        context.textAlign = "center";
        context.fillText(world.message, WIDTH / 2, 50);
        context.restore();
      }
    };

    const loop = (timestamp: number) => {
      const elapsed = lastFrameRef.current ? (timestamp - lastFrameRef.current) / 1000 : 0;
      const dt = Math.min(0.033, Math.max(0, elapsed));
      lastFrameRef.current = timestamp;
      const world = worldRef.current;
      if (screenRef.current === "playing" && !powerupPausedRef.current) update(world, dt);
      render(world);

      if (timestamp - hudTickRef.current > 100) {
        hudTickRef.current = timestamp;
        setHud({
          trash: world.trash,
          score: world.score,
          lives: world.lives,
          time: world.elapsed,
          glider: world.player.glider,
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [burst, changeScreen, setMessage, showPowerupNotice, tone]);

  const canContinueCampaign = screen === "won" && campaignContinuationAvailable;

  const overlay = (() => {
    if (screen === "title") {
      return (
        <div className="screen-overlay">
          <div className="screen-copy">
            <h1 className="game-title">
              Trash Dash <span>Alley Acres</span>
            </h1>
            <p>Turn five tasty scraps into big raccoon energy. Glide the gaps, clean up the alley, and reach the recycling depot.</p>
            <button className="primary-button" type="button" onClick={openCharacterSelect} disabled={!loaded}>
              {loaded ? "Start rummaging" : "Loading the alley…"}
            </button>
            <span className="controls-line">Move A/D or arrows · Jump Space · Run Shift · Action E</span>
          </div>
        </div>
      );
    }
    if (screen === "characterSelect") {
      return (
        <div className="screen-overlay character-select-overlay" data-testid="character-selection" role="dialog" aria-labelledby="character-selection-title">
          <div className="character-select-copy">
            <span className="selection-kicker">Choose your raccoon</span>
            <h2 id="character-selection-title">Pick a runner</h2>
            <p>Every hero can clean up Alley Acres. Choose the style that feels right.</p>
            <div className="character-cards" role="radiogroup" aria-label="Playable characters">
              {characterSelection.ids.map((id) => {
                const profile = getPlayableCharacter(id);
                const selected = id === characterSelection.selectedId;
                const preview = profile.selectionPortraitSrc;
                return (
                  <button
                    className={`character-card ${selected ? "is-selected" : ""}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Play as ${profile.displayName}`}
                    data-character-id={id}
                    key={id}
                    onClick={() => setCharacterSelection((state) => ({ ...state, index: state.ids.indexOf(id), selectedId: id }))}
                  >
                    <span className="character-preview"><img src={assetUrl(preview)} alt="" /></span>
                    <strong>{profile.displayName}</strong>
                    <span>{id === "raccoon" ? "Trash-powered speedster" : "A clever alley climber"}</span>
                  </button>
                );
              })}
            </div>
            <div className="button-row selection-actions">
              <button className="primary-button" type="button" data-testid="confirm-character" onClick={confirmCharacter}>Start as {getPlayableCharacter(characterSelection.selectedId).displayName}</button>
              <button className="secondary-button" type="button" onClick={() => changeScreen("title")}>Back</button>
            </div>
            <span className="controls-line">Arrow keys / A-D to choose · Enter or Space to confirm</span>
          </div>
        </div>
      );
    }
    if (screen === "paused") {
      return (
        <div className="screen-overlay compact">
          <div className="screen-copy">
            <h2>Snack break</h2>
            <p>The alley is paused. Your checkpoint and collected trash are safe.</p>
            <div className="button-row">
              <button className="primary-button" type="button" onClick={togglePause}>Keep rummaging</button>
              <button className="secondary-button" type="button" onClick={() => startGame()}>Restart run</button>
            </div>
          </div>
        </div>
      );
    }
    if (screen === "gameover") {
      return (
        <div className="screen-overlay compact">
          <div className="screen-copy">
            <h2>Out of paws</h2>
            <p>You scored {hud.score.toLocaleString()} points. The alley is ready for another run.</p>
              <button className="primary-button" type="button" onClick={openCharacterSelect}>Try again</button>
          </div>
        </div>
      );
    }
    if (screen === "won") {
      return (
        <div className="screen-overlay victory-overlay">
          <div className="victory-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <i className={`confetti-piece confetti-${index + 1}`} key={index} />)}
          </div>
          <div className="victory-copy">
            <span className="victory-kicker">ALLEY ACRES CLEARED</span>
            <h2>YOU WIN!</h2>
            <p className="victory-subtitle">The trash heap tyrant is recycled.</p>
            <div className="victory-results">
              <div><span>Scraps</span><strong>{hud.trash}</strong></div>
              <div><span>Score</span><strong>{hud.score.toLocaleString()}</strong></div>
              <div><span>Time</span><strong>{formatTime(hud.time)}</strong></div>
            </div>
            <p className="victory-best">Best run: {best.score.toLocaleString()} points{best.time ? ` · ${formatTime(best.time)}` : ""}</p>
            {(victoryRecord.score || victoryRecord.time) && <span className="new-record">NEW BEST!</span>}
            <div className="button-row">
              {canContinueCampaign ? (
                <>
                  <button className="primary-button" type="button" onClick={continueCampaign}>CONTINUE</button>
                  <button className="secondary-button" type="button" onClick={openCharacterSelect}>Run it again</button>
                </>
              ) : (
                <button className="primary-button" type="button" onClick={openCharacterSelect}>Run it again</button>
              )}
              <button className="secondary-button" type="button" onClick={() => { clearHeldInput(); changeScreen("title"); }}>Back to title</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  })();

  const touchProps = (code: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add("is-pressed");
      setTouchKey(code, true);
    },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.classList.remove("is-pressed");
      setTouchKey(code, false);
    },
    onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.classList.remove("is-pressed");
      setTouchKey(code, false);
    },
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) return;
      event.currentTarget.classList.remove("is-pressed");
      setTouchKey(code, false);
    },
    onLostPointerCapture: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.classList.remove("is-pressed");
      setTouchKey(code, false);
    },
    onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  const showOrientationPrompt =
    browserExperience.touchFirst &&
    browserExperience.portrait &&
    !portraitDismissed &&
    (screen === "title" || screen === "playing");

  return (
    <main className="game-page">
      <section ref={cabinetRef} className="game-cabinet" aria-label="Trash Dash: Alley Acres browser game">
        <div className="hud">
          <div className="brand-lockup">
            <strong>Trash Dash</strong>
            <span>Alley Acres</span>
          </div>
          <div className="hud-stat trash"><span>Trash</span><strong>{hud.trash}</strong></div>
          <div className="hud-stat score"><span>Score</span><strong>{hud.score.toLocaleString()}</strong></div>
          <div className="hud-stat time"><span>Time</span><strong>{formatTime(hud.time)}</strong></div>
          <div className="hud-stat lives"><span>Paws</span><strong>{hud.lives}</strong></div>
          <div className={`hud-stat glider ${hud.glider <= 0 ? "empty" : ""}`}><span>Glide</span><strong>{hud.glider > 0 ? `${Math.ceil(hud.glider)}s` : "—"}</strong></div>
          <div className="hud-actions">
            <button className="icon-button" type="button" onClick={togglePause} aria-label={screen === "paused" ? "Resume game" : "Pause game"}>Pause</button>
            <button className="icon-button" type="button" onClick={toggleMute} aria-label={muted ? "Unmute sound" : "Mute sound"}>{muted ? "Sound" : "Mute"}</button>
            {browserExperience.fullscreenSupported && (
              <button
                className="icon-button fullscreen-button"
                type="button"
                onClick={handleFullscreen}
                aria-label={browserExperience.fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {browserExperience.fullscreen ? "Exit" : "Full"}
              </button>
            )}
          </div>
        </div>

        <div className={`game-stage ${screen === "playing" ? "is-playing" : ""}`}>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            width={WIDTH}
            height={HEIGHT}
            aria-label="Side-scrolling platform game. Move right through Alley Acres, collect trash, and defeat the trash-bag monster."
          />
          {!loaded && <div className="load-status" role="status">Loading raccoon sprites…</div>}
          {overlay}

          {powerupNotice && screen === "playing" && (
            <div className={`powerup-flash ${powerupNotice.kind}`} role="status" aria-live="polite" aria-label={powerupNotice.title}>
              <span className="powerup-flash-title">{powerupNotice.title}</span>
            </div>
          )}

          {showOrientationPrompt && (
            <div className="orientation-prompt" role="dialog" aria-labelledby="orientation-title">
              <div className="orientation-copy">
                <strong id="orientation-title">Rotate for the best view</strong>
                <span>Trash Dash plays best with your phone held sideways.</span>
              </div>
              <div className="button-row">
                {browserExperience.fullscreenSupported && (
                  <button className="primary-button" type="button" onClick={handleFullscreen}>
                    Try landscape fullscreen
                  </button>
                )}
                <button className="secondary-button" type="button" onClick={() => setPortraitDismissed(true)}>
                  Play in portrait
                </button>
              </div>
            </div>
          )}

          {screen === "playing" && (
            <>
              <div className="touch-deck-hint" aria-hidden="true">
                <strong>Pocket controls</strong>
                <span>Hold Jump to glide · Action swings your tail</span>
              </div>
              <div className="touch-controls" aria-label="Touch game controls">
                <div className="touch-cluster">
                  <button className="touch-button" type="button" aria-label="Move left" {...touchProps("ArrowLeft")}>Left</button>
                  <button className="touch-button" type="button" aria-label="Move right" {...touchProps("ArrowRight")}>Right</button>
                </div>
                <div className="touch-cluster">
                  <button className="touch-button sprint" type="button" aria-label="Sprint" {...touchProps("ShiftLeft")}>Dash</button>
                  <button className="touch-button action" type="button" aria-label="Run or use action" {...touchProps("KeyE")}>Action</button>
                  <button className="touch-button jump" type="button" aria-label="Jump" {...touchProps("Space")}>Jump</button>
                </div>
              </div>
            </>
          )}
          <p className="sr-only" aria-live="polite">
            {screen === "playing" ? `Playing. ${hud.trash} trash collected, ${hud.lives} lives remaining.` : screen}
          </p>
        </div>
      </section>
    </main>
  );
}
