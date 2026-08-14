/**
 * Declarative definition for Level 1: Woodlands to City Limits.
 *
 * This module intentionally has no browser or React dependencies so it can be
 * consumed by the Canvas runtime and validated in Node tests.
 */

import { campaignLightingAt, campaignZoneAt } from "./campaign-level.mjs";

const freezeDeep = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
};

// Design names are mapped to the existing runtime EnemyKind values: bird is
// rendered by the pigeon atlas and bee by the wasp atlas.
export const LEVEL_ONE_ENEMY_KINDS = freezeDeep([
  "snake",
  "pigeon",
  "wasp",
  "mosquito",
  "possum",
  "spider",
  "fox",
]);

const zones = [
  {
    id: "deep-woodland",
    startX: 0,
    endX: 1150,
    background: "forest",
    lighting: "late-afternoon",
    landmark: "campsite",
  },
  {
    id: "creek-and-ruined-mill",
    startX: 1150,
    endX: 2350,
    background: "forest",
    lighting: "sunset",
    landmark: "ruined-mill",
  },
  {
    id: "forest-edge-highway",
    startX: 2350,
    endX: 3550,
    background: "forest",
    lighting: "dusk",
    landmark: "highway",
  },
  {
    id: "industrial-city-fringe",
    startX: 3550,
    endX: 4800,
    background: "city",
    lighting: "night",
    landmark: "rail-yard",
  },
  {
    id: "urban-park-transition",
    startX: 4800,
    endX: 5680,
    background: "city",
    lighting: "moonlit",
    landmark: "urban-park",
  },
];

const encounters = [
  {
    id: "woodland-clearing-snake",
    zoneId: "deep-woodland",
    spawnX: 300,
    sizeClass: "small",
    enemies: [{ kind: "snake", x: 400, patrol: [340, 470], surfaceId: "ground-woodland" }],
  },
  {
    id: "campsite-overlook-birds",
    zoneId: "deep-woodland",
    spawnX: 1010,
    sizeClass: "small",
    enemies: [
      { kind: "pigeon", x: 911, patrol: [900, 922], surfaceId: "crate-campsite-left" },
      { kind: "pigeon", x: 1025, patrol: [1008, 1038], surfaceId: "crate-campsite-right" },
    ],
    bypass: "campsite-upper-route",
  },
  {
    id: "creek-entry-air-threats",
    zoneId: "creek-and-ruined-mill",
    spawnX: 1400,
    sizeClass: "small",
    enemies: [
      { kind: "wasp", x: 1320, y: 330, patrol: [1271, 1450], flightBand: "creek-airspace" },
      { kind: "mosquito", x: 1510, y: 296, patrol: [1430, 1553], flightBand: "creek-airspace" },
    ],
  },
  {
    id: "mill-interior-layers",
    zoneId: "creek-and-ruined-mill",
    spawnX: 2000,
    sizeClass: "small",
    enemies: [
      { kind: "spider", x: 1880, patrol: [1800, 2010], surfaceId: "ground-creek" },
      { kind: "pigeon", x: 1990, patrol: [1880, 2140], surfaceId: "ground-creek" },
      { kind: "pigeon", x: 2090, patrol: [1990, 2240], surfaceId: "ground-creek" },
    ],
    bypass: "mill-glider-route",
  },
  {
    id: "highway-main-lane-opossum",
    zoneId: "forest-edge-highway",
    spawnX: 2590,
    sizeClass: "large",
    enemies: [{ kind: "possum", x: 2650, patrol: [2608, 2740], surfaceId: "ground-highway" }],
    bypass: "highway-culvert-route",
  },
  {
    id: "highway-fox-spike",
    zoneId: "forest-edge-highway",
    spawnX: 3550,
    sizeClass: "large",
    enemies: [
      { kind: "fox", x: 3490, patrol: [3440, 3517], surfaceId: "ground-highway" },
      { kind: "mosquito", x: 3380, y: 276, patrol: [3320, 3403], flightBand: "highway-airspace" },
    ],
    bypass: "highway-culvert-route",
  },
  {
    id: "industrial-rail-yard-layers",
    zoneId: "industrial-city-fringe",
    spawnX: 4270,
    sizeClass: "small",
    enemies: [
      { kind: "spider", x: 4040, patrol: [3900, 4210], surfaceId: "ground-industrial" },
      { kind: "pigeon", x: 4160, patrol: [4000, 4340], surfaceId: "ground-industrial" },
      { kind: "pigeon", x: 4260, patrol: [4100, 4460], surfaceId: "ground-industrial" },
    ],
    bypass: "industrial-container-route",
  },
  {
    id: "park-approach-snake",
    zoneId: "urban-park-transition",
    spawnX: 5000,
    sizeClass: "small",
    enemies: [{ kind: "snake", x: 5000, patrol: [4900, 5120], surfaceId: "ground-park" }],
  },
];

const rewards = [
  { id: "starter-trash-trail", kind: "trash", x: 240, surfaceId: "ground-woodland", surfaceY: 468, optional: false },
  { id: "campsite-first-taco", kind: "taco", x: 920, surfaceId: "crate-campsite-left", surfaceY: 383, optional: true, gate: "campsite-upper-route" },
  { id: "creek-recovery-trash", kind: "trash", x: 1210, surfaceId: "mill-ledge", surfaceY: 396, optional: true, gate: "creek-entry" },
  { id: "mill-glider-cap", kind: "cap", x: 2100, surfaceId: "branch-mill-high", surfaceY: 260, optional: true, gate: "mill-glider-route" },
  { id: "mill-bonus-cache", kind: "trash", x: 2190, surfaceId: "branch-mill-high", surfaceY: 260, optional: true, gate: "mill-glider-route" },
  { id: "highway-taco", kind: "taco", x: 2820, surfaceId: "branch-highway-entry", surfaceY: 385, optional: true, gate: "highway-culvert-route" },
  { id: "industrial-trash-chain", kind: "trash", x: 3910, surfaceId: "metal-rail-entry", surfaceY: 392, optional: true, gate: "industrial-container-route" },
  { id: "boss-checkpoint", kind: "checkpoint", x: 4870, surfaceId: "ground-park", surfaceY: 468, optional: false, gate: "park-transition" },
  { id: "park-final-taco", kind: "taco", x: 5260, surfaceId: "metal-park-overlook", surfaceY: 330, optional: true, gate: "park-overlook" },
];

const checkpoints = [
  { id: "creek-checkpoint", x: 1130, respawnX: 1080, surfaceId: "ground-woodland", label: "Creek checkpoint" },
  { id: "highway-checkpoint", x: 2770, respawnX: 2700, surfaceId: "ground-highway", label: "Highway checkpoint" },
  { id: "boss-runway-checkpoint", x: 4930, respawnX: 4900, surfaceId: "ground-park", label: "Boss runway checkpoint" },
];

const routeChoices = [
  { id: "campsite-upper-route", label: "Campsite cache", startX: 840, endX: 1060, optional: true, rewardIds: ["campsite-first-taco"] },
  { id: "mill-glider-route", label: "Mill glider route", startX: 1880, endX: 2240, optional: true, rewardIds: ["mill-glider-cap", "mill-bonus-cache"] },
  { id: "highway-culvert-route", label: "Highway culvert shortcut", startX: 2750, endX: 3600, optional: true, rewardIds: ["highway-taco"], bypassEncounterIds: ["highway-main-lane-opossum", "highway-fox-spike"] },
  { id: "industrial-container-route", label: "Industrial container route", startX: 3820, endX: 4380, optional: true, rewardIds: ["industrial-trash-chain"], bypassEncounterIds: ["industrial-rail-yard-layers"] },
];

const boss = {
  id: "trash-heap-tyrant",
  kind: "boss",
  triggerX: 5680,
  arenaStartX: 5640,
  arenaEndX: 6600,
  runwayStartX: 5200,
  checkpointId: "boss-runway-checkpoint",
  surfaceId: "ground-park",
};

// Mirrors the runtime collision platforms so subsequent campaign levels can
// provide their geometry without the browser game component as an authority.
const surfaces = [
  { id: "ground-woodland", x: 0, y: 468, w: 1380, h: 90, kind: "ground" },
  { id: "ground-creek", x: 1490, y: 468, w: 980, h: 90, kind: "ground" },
  { id: "ground-highway", x: 2590, y: 468, w: 1020, h: 90, kind: "ground" },
  { id: "ground-industrial", x: 3730, y: 468, w: 1010, h: 90, kind: "ground" },
  { id: "ground-park", x: 4870, y: 468, w: 1730, h: 90, kind: "ground" },
  { id: "branch-woodland", x: 620, y: 366, w: 220, h: 22, kind: "branch" },
  { id: "mill-ledge", x: 1160, y: 396, w: 160, h: 72, kind: "ground" },
  { id: "branch-creek-low", x: 1510, y: 352, w: 270, h: 22, kind: "branch" },
  { id: "branch-mill-low", x: 1810, y: 300, w: 190, h: 22, kind: "branch" },
  { id: "branch-mill-high", x: 2070, y: 260, w: 175, h: 22, kind: "branch" },
  { id: "branch-mill-exit", x: 2220, y: 360, w: 190, h: 22, kind: "branch" },
  { id: "branch-highway-entry", x: 2660, y: 385, w: 240, h: 22, kind: "branch" },
  { id: "branch-highway-overpass", x: 3000, y: 330, w: 180, h: 22, kind: "branch" },
  { id: "branch-highway-approach", x: 3300, y: 372, w: 180, h: 22, kind: "branch" },
  { id: "branch-highway-exit", x: 3520, y: 312, w: 150, h: 22, kind: "branch" },
  { id: "metal-rail-entry", x: 3800, y: 392, w: 190, h: 22, kind: "metal" },
  { id: "metal-rail-low", x: 4030, y: 350, w: 230, h: 22, kind: "metal" },
  { id: "metal-rail-high", x: 4300, y: 320, w: 210, h: 22, kind: "metal" },
  { id: "metal-rail-exit", x: 4560, y: 380, w: 180, h: 22, kind: "metal" },
  { id: "metal-park-entry", x: 5000, y: 382, w: 180, h: 22, kind: "metal" },
  { id: "metal-park-overlook", x: 5230, y: 330, w: 170, h: 22, kind: "metal" },
  { id: "crate-campsite-left", x: 878, y: 383, w: 112, h: 85, kind: "box" },
  { id: "crate-campsite-right", x: 990, y: 383, w: 112, h: 85, kind: "box" },
  { id: "crate-park-entry", x: 5100, y: 383, w: 112, h: 85, kind: "box" },
  { id: "crate-boss-runway", x: 6150, y: 383, w: 112, h: 85, kind: "box" },
];

const flightBands = [
  { id: "campsite-canopy", startX: 920, endX: 1130, minY: 310, maxY: 430 },
  { id: "creek-airspace", startX: 1250, endX: 1620, minY: 220, maxY: 360 },
  { id: "mill-loft", startX: 1880, endX: 2240, minY: 220, maxY: 360 },
  { id: "highway-airspace", startX: 3150, endX: 3470, minY: 200, maxY: 340 },
  { id: "rail-yard-airspace", startX: 4000, endX: 4460, minY: 240, maxY: 380 },
];

const backgroundSets = [
  { zoneId: "deep-woodland", stage: "woodland" },
  { zoneId: "creek-and-ruined-mill", stage: "creek" },
  { zoneId: "forest-edge-highway", stage: "highway" },
  { zoneId: "industrial-city-fringe", stage: "industrial" },
  { zoneId: "urban-park-transition", stage: "park" },
];

export const LEVEL_ONE = freezeDeep({
  id: "level-1",
  title: "Woodlands to City Limits",
  worldWidth: 6600,
  zones,
  surfaces,
  flightBands,
  backgroundSets,
  encounters,
  rewards,
  checkpoints,
  routeChoices,
  boss,
  exit: { nextLevelId: "level-2", x: 6520 },
});

export function levelOneZoneAt(x) {
  return campaignZoneAt(LEVEL_ONE, x);
}

export function levelOneLightingAt(x) {
  return campaignLightingAt(LEVEL_ONE, x);
}

export function levelOneEncounterData() {
  return LEVEL_ONE.encounters;
}
