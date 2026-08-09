/**
 * Declarative definition for Level 2: Suburban After Dark.
 *
 * This module is deliberately browser-independent. The runtime consumes these
 * records for collision, population, rewards, and campaign progression.
 */

import { campaignLightingAt, campaignZoneAt } from "./campaign-level.mjs";

const freezeDeep = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
};

export const LEVEL_TWO_ENEMY_KINDS = freezeDeep(["squirrel", "terrier", "skunk", "moth"]);

const zones = [
  { id: "moonlit-backyard", startX: 0, endX: 1250, background: "backyard", lighting: "moonlit", landmark: "porch-and-fence" },
  { id: "garbage-night-street", startX: 1250, endX: 2700, background: "street", lighting: "night", landmark: "parked-cars" },
  { id: "backyard-obstacle-course", startX: 2700, endX: 4200, background: "obstacle", lighting: "moonlit", landmark: "treehouse" },
  { id: "drainage-ditch", startX: 4200, endX: 5550, background: "drainage", lighting: "pre-dawn", landmark: "culvert" },
  { id: "suburban-main-street", startX: 5550, endX: 7200, background: "main-street", lighting: "pre-dawn", landmark: "cul-de-sac" },
];

// Support records are the only standable geometry. Hazards stay out of this
// list so a spawn can never silently resolve onto water or a drainage gap.
const surfaces = [
  { id: "backyard-lawn", x: 0, y: 468, w: 1250, h: 90, kind: "ground" },
  { id: "backyard-porch", x: 380, y: 374, w: 230, h: 24, kind: "branch" },
  { id: "backyard-fence", x: 690, y: 332, w: 300, h: 24, kind: "branch" },
  { id: "street-ground", x: 1250, y: 468, w: 1450, h: 90, kind: "ground" },
  { id: "street-mailbox", x: 2070, y: 382, w: 100, h: 22, kind: "branch" },
  { id: "parked-car-west", x: 2190, y: 358, w: 185, h: 26, kind: "metal" },
  { id: "parked-car-east", x: 2415, y: 358, w: 185, h: 26, kind: "metal" },
  { id: "street-fence-east", x: 2510, y: 332, w: 145, h: 24, kind: "branch" },
  { id: "obstacle-lawn", x: 2700, y: 468, w: 1500, h: 90, kind: "ground" },
  { id: "trampoline-landing", x: 3030, y: 400, w: 145, h: 22, kind: "metal" },
  { id: "obstacle-fence", x: 3280, y: 338, w: 220, h: 24, kind: "branch" },
  { id: "treehouse-platform", x: 3550, y: 252, w: 280, h: 26, kind: "branch" },
  { id: "poolside-ledge", x: 3880, y: 370, w: 190, h: 22, kind: "branch" },
  { id: "drainage-entry-lawn", x: 4200, y: 468, w: 350, h: 90, kind: "ground" },
  { id: "culvert-route", x: 4470, y: 404, w: 430, h: 40, kind: "ground" },
  { id: "utility-approach", x: 4520, y: 342, w: 120, h: 22, kind: "metal" },
  { id: "utility-route", x: 4560, y: 278, w: 520, h: 22, kind: "metal" },
  { id: "drainage-landing", x: 4920, y: 468, w: 630, h: 90, kind: "ground" },
  { id: "boss-runway", x: 5300, y: 468, w: 400, h: 90, kind: "ground" },
  { id: "cul-de-sac", x: 5700, y: 468, w: 850, h: 90, kind: "ground" },
  { id: "brutus-platform-left", x: 5724, y: 404, w: 72, h: 64, kind: "crate", visual: "boss-platform-left" },
  { id: "brutus-platform-right", x: 6454, y: 404, w: 72, h: 64, kind: "crate", visual: "boss-platform-right" },
  { id: "victory-street", x: 6550, y: 468, w: 650, h: 90, kind: "ground" },
];

const flightBands = [
  { id: "porch-light-orbit", startX: 3950, endX: 4200, minY: 180, maxY: 340 },
  { id: "drainage-moth-low", startX: 4300, endX: 4620, minY: 210, maxY: 350 },
  { id: "drainage-moth-high", startX: 4500, endX: 4820, minY: 150, maxY: 300 },
];

const encounters = [
  {
    id: "backyard-squirrel-tutorial", zoneId: "moonlit-backyard", spawnX: 780, sizeClass: "small",
    enemies: [{ kind: "squirrel", movement: "platform", x: 800, patrol: [720, 930], surfaceId: "backyard-fence" }],
  },
  {
    id: "street-terrier-tutorial", zoneId: "garbage-night-street", spawnX: 1540, sizeClass: "large", recoveryEndX: 2500,
    enemies: [{ kind: "terrier", movement: "grounded", x: 1580, patrol: [1420, 2480], surfaceId: "street-ground" }],
  },
  {
    id: "street-squirrel-repeat", zoneId: "garbage-night-street", spawnX: 2550, sizeClass: "small", bypass: "parked-car-route",
    enemies: [{ kind: "squirrel", movement: "platform", x: 2570, patrol: [2520, 2640], surfaceId: "street-fence-east" }],
  },
  {
    id: "obstacle-skunk-tutorial", zoneId: "backyard-obstacle-course", spawnX: 2900, sizeClass: "medium",
    enemies: [{ kind: "skunk", movement: "grounded", x: 2920, patrol: [2800, 3100], surfaceId: "obstacle-lawn" }],
  },
  {
    id: "obstacle-interaction-test", zoneId: "backyard-obstacle-course", spawnX: 3460, sizeClass: "medium", bypass: "treehouse-route",
    enemies: [
      { kind: "squirrel", movement: "platform", x: 3640, patrol: [3580, 3780], surfaceId: "treehouse-platform" },
      { kind: "skunk", movement: "grounded", x: 3440, patrol: [3300, 3550], surfaceId: "obstacle-lawn" },
    ],
  },
  {
    id: "porch-light-moth-introduction", zoneId: "backyard-obstacle-course", spawnX: 4010, sizeClass: "small",
    enemies: [{ kind: "moth", movement: "flying", x: 4020, flightY: 220, flightBand: "porch-light-orbit", patrol: [3960, 4160] }],
  },
  {
    id: "drainage-mastery", zoneId: "drainage-ditch", spawnX: 4650, sizeClass: "large", recoveryEndX: 5300, bypass: "culvert-bypass",
    enemies: [
      { kind: "moth", movement: "flying", x: 4400, flightY: 280, flightBand: "drainage-moth-low", patrol: [4320, 4600] },
      { kind: "moth", movement: "flying", x: 4680, flightY: 205, flightBand: "drainage-moth-high", patrol: [4520, 4800] },
      { kind: "terrier", movement: "grounded", x: 5030, patrol: [4950, 5250], surfaceId: "drainage-landing" },
    ],
  },
  // This is a population marker, not an ordinary hostile group. It keeps the
  // runway's quiet handoff explicit for the runtime and direct test routes.
  { id: "boss-runway", zoneId: "drainage-ditch", spawnX: 5300, sizeClass: "runway", enemies: [] },
];

const rewards = [
  { id: "backyard-porch-trash", kind: "trash", x: 510, surfaceId: "backyard-porch", surfaceY: 374, optional: true, gate: "backyard-porch-route" },
  { id: "street-car-trash-chain", kind: "trash", x: 2280, surfaceId: "parked-car-west", surfaceY: 358, optional: true, gate: "parked-car-route" },
  { id: "street-car-trash-cap", kind: "trash", x: 2500, surfaceId: "parked-car-east", surfaceY: 358, optional: true, gate: "parked-car-route" },
  { id: "treehouse-taco-refresh", kind: "taco", x: 3680, surfaceId: "treehouse-platform", surfaceY: 252, optional: true, gate: "treehouse-route" },
  { id: "poolside-major-cache", kind: "trash", x: 3980, surfaceId: "poolside-ledge", surfaceY: 370, optional: true, gate: "poolside-secret" },
  { id: "culvert-recovery-trash", kind: "trash", x: 4700, surfaceId: "culvert-route", surfaceY: 404, optional: true, gate: "culvert-bypass" },
  { id: "utility-premium-cache", kind: "trash", x: 4850, surfaceId: "utility-route", surfaceY: 278, optional: true, gate: "utility-line-mastery" },
  { id: "main-street-alley-cache", kind: "trash", x: 6820, zoneId: "suburban-main-street", surfaceId: "victory-street", surfaceY: 468, optional: true, secret: true },
  { id: "street-checkpoint-reward", kind: "checkpoint", x: 1370, surfaceId: "street-ground", surfaceY: 468, optional: false },
  { id: "obstacle-checkpoint-reward", kind: "checkpoint", x: 2750, surfaceId: "obstacle-lawn", surfaceY: 468, optional: false },
  { id: "drainage-checkpoint-reward", kind: "checkpoint", x: 4270, surfaceId: "drainage-entry-lawn", surfaceY: 468, optional: false },
  { id: "boss-checkpoint-reward", kind: "checkpoint", x: 5270, surfaceId: "drainage-landing", surfaceY: 468, optional: false },
];

const checkpoints = [
  { id: "street-checkpoint", x: 1370, respawnX: 1300, label: "Street checkpoint" },
  { id: "obstacle-course-checkpoint", x: 2750, respawnX: 2710, label: "Obstacle-course checkpoint" },
  { id: "drainage-checkpoint", x: 4270, respawnX: 4210, label: "Drainage checkpoint" },
  { id: "boss-runway-checkpoint", x: 5270, respawnX: 5200, label: "Boss runway checkpoint" },
];

const routeChoices = [
  { id: "backyard-porch-route", label: "Backyard porch route", startX: 380, endX: 990, optional: true, rewardIds: ["backyard-porch-trash"] },
  { id: "parked-car-route", label: "Parked-car route", startX: 2080, endX: 2600, optional: true, rewardIds: ["street-car-trash-chain", "street-car-trash-cap"], bypassEncounterIds: ["street-squirrel-repeat"] },
  { id: "treehouse-route", label: "Treehouse route", startX: 3030, endX: 3830, optional: true, rewardIds: ["treehouse-taco-refresh"], bypassEncounterIds: ["obstacle-interaction-test"] },
  { id: "poolside-secret", label: "Poolside secret", startX: 3850, endX: 4080, optional: true, rewardIds: ["poolside-major-cache"] },
  { id: "culvert-bypass", label: "Culvert bypass", startX: 4470, endX: 4900, optional: true, rewardIds: ["culvert-recovery-trash"], bypassEncounterIds: ["drainage-mastery"] },
  { id: "utility-line-mastery", label: "Utility-line mastery route", startX: 4560, endX: 5080, optional: true, rewardIds: ["utility-premium-cache"] },
];

const backgroundSets = [
  { zoneId: "moonlit-backyard", stage: "backyard" },
  { zoneId: "garbage-night-street", stage: "street" },
  { zoneId: "backyard-obstacle-course", stage: "obstacle" },
  { zoneId: "drainage-ditch", stage: "drainage" },
  { zoneId: "suburban-main-street", stage: "main-street" },
];

export const LEVEL_TWO = freezeDeep({
  id: "level-2",
  title: "Suburban After Dark",
  worldWidth: 7200,
  zones,
  surfaces,
  flightBands,
  backgroundSets,
  encounters,
  rewards,
  checkpoints,
  routeChoices,
  boss: {
    id: "brutus-bin-hound",
    kind: "brutus",
    runwayStartX: 5300,
    triggerX: 5750,
    arenaStartX: 5700,
    arenaEndX: 6550,
    surfaceId: "cul-de-sac",
    checkpointId: "boss-runway-checkpoint",
    hydrant: { id: "brutus-hydrant", x: 5810, y: 400, w: 42, h: 68 },
    recoveryX: 6200,
    defeatExitX: 6740,
    sprinklers: [
      { id: "brutus-sprinkler-left", side: "left", x: 6000, y: 444, w: 34, h: 24 },
      { id: "brutus-sprinkler-right", side: "right", x: 6320, y: 444, w: 34, h: 24 },
    ],
    postBossStartX: 6550,
  },
  exit: { nextLevelId: "level-3", x: 7120 },
});

export function levelTwoZoneAt(x) {
  return campaignZoneAt(LEVEL_TWO, x);
}

export function levelTwoLightingAt(x) {
  return campaignLightingAt(LEVEL_TWO, x);
}

export function levelTwoEncounterData() {
  return LEVEL_TWO.encounters;
}
