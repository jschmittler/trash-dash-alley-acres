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
    spawnX: 720,
    enemies: [{ kind: "snake", x: 720, patrol: [660, 790] }],
  },
  {
    id: "campsite-overlook-birds",
    zoneId: "deep-woodland",
    spawnX: 1010,
    enemies: [
      { kind: "pigeon", x: 980, patrol: [920, 1080] },
      { kind: "pigeon", x: 1060, patrol: [980, 1130] },
    ],
    bypass: "campsite-upper-route",
  },
  {
    id: "creek-entry-air-threats",
    zoneId: "creek-and-ruined-mill",
    spawnX: 1320,
    enemies: [
      { kind: "wasp", x: 1320, y: 330, patrol: [1250, 1450] },
      { kind: "mosquito", x: 1510, y: 250, patrol: [1430, 1620] },
    ],
  },
  {
    id: "mill-interior-layers",
    zoneId: "creek-and-ruined-mill",
    spawnX: 1920,
    enemies: [
      { kind: "spider", x: 1880, patrol: [1800, 2010] },
      { kind: "pigeon", x: 1990, patrol: [1880, 2140] },
      { kind: "pigeon", x: 2090, patrol: [1990, 2240] },
    ],
    bypass: "mill-glider-route",
  },
  {
    id: "highway-main-lane-opossum",
    zoneId: "forest-edge-highway",
    spawnX: 2570,
    enemies: [{ kind: "possum", x: 2570, patrol: [2450, 2750] }],
    bypass: "highway-culvert-route",
  },
  {
    id: "highway-fox-spike",
    zoneId: "forest-edge-highway",
    spawnX: 3200,
    enemies: [
      { kind: "fox", x: 3180, patrol: [2980, 3370] },
      { kind: "mosquito", x: 3310, y: 235, patrol: [3150, 3470] },
    ],
    bypass: "highway-culvert-route",
  },
  {
    id: "industrial-rail-yard-layers",
    zoneId: "industrial-city-fringe",
    spawnX: 4080,
    enemies: [
      { kind: "spider", x: 4040, patrol: [3900, 4210] },
      { kind: "pigeon", x: 4160, patrol: [4000, 4340] },
      { kind: "pigeon", x: 4260, patrol: [4100, 4460] },
    ],
    bypass: "industrial-container-route",
  },
  {
    id: "park-approach-snake",
    zoneId: "urban-park-transition",
    spawnX: 5000,
    enemies: [{ kind: "snake", x: 5000, patrol: [4900, 5120] }],
  },
];

const rewards = [
  { id: "starter-trash-trail", kind: "trash", x: 240, surfaceY: 0, optional: false },
  { id: "campsite-first-taco", kind: "taco", x: 960, surfaceY: 340, optional: true, gate: "campsite-upper-route" },
  { id: "creek-recovery-trash", kind: "trash", x: 1210, surfaceY: 0, optional: true, gate: "creek-entry" },
  { id: "mill-glider-cap", kind: "cap", x: 2020, surfaceY: 280, optional: true, gate: "mill-glider-route" },
  { id: "mill-bonus-cache", kind: "trash", x: 2190, surfaceY: 220, optional: true, gate: "mill-glider-route" },
  { id: "highway-taco", kind: "taco", x: 2860, surfaceY: 300, optional: true, gate: "highway-culvert-route" },
  { id: "industrial-trash-chain", kind: "trash", x: 3910, surfaceY: 0, optional: true, gate: "industrial-container-route" },
  { id: "boss-checkpoint", kind: "checkpoint", x: 4870, surfaceY: 0, optional: false, gate: "park-transition" },
  { id: "park-final-taco", kind: "taco", x: 5230, surfaceY: 260, optional: true, gate: "park-overlook" },
];

const checkpoints = [
  { id: "creek-checkpoint", x: 1130, respawnX: 1080, label: "Creek checkpoint" },
  { id: "highway-checkpoint", x: 2770, respawnX: 2700, label: "Highway checkpoint" },
  { id: "boss-runway-checkpoint", x: 4870, respawnX: 4800, label: "Boss runway checkpoint" },
];

const routeChoices = [
  { id: "campsite-upper-route", label: "Campsite cache", startX: 840, endX: 1060, optional: true, rewardIds: ["campsite-first-taco"] },
  { id: "mill-glider-route", label: "Mill glider route", startX: 1880, endX: 2240, optional: true, rewardIds: ["mill-glider-cap", "mill-bonus-cache"] },
  { id: "highway-culvert-route", label: "Highway culvert shortcut", startX: 2750, endX: 3200, optional: true, rewardIds: ["highway-taco"], bypassEncounterIds: ["highway-main-lane-opossum", "highway-fox-spike"] },
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
};

// Mirrors the runtime collision platforms so subsequent campaign levels can
// provide their geometry without the browser game component as an authority.
const surfaces = [
  { x: 0, y: 468, w: 1380, h: 90, kind: "ground" },
  { x: 1490, y: 468, w: 980, h: 90, kind: "ground" },
  { x: 2590, y: 468, w: 1020, h: 90, kind: "ground" },
  { x: 3730, y: 468, w: 1010, h: 90, kind: "ground" },
  { x: 4870, y: 468, w: 1730, h: 90, kind: "ground" },
  { x: 620, y: 366, w: 220, h: 22, kind: "branch" },
  { x: 1160, y: 396, w: 160, h: 72, kind: "ground" },
  { x: 1510, y: 352, w: 270, h: 22, kind: "branch" },
  { x: 1810, y: 300, w: 190, h: 22, kind: "branch" },
  { x: 2070, y: 260, w: 175, h: 22, kind: "branch" },
  { x: 2220, y: 360, w: 190, h: 22, kind: "branch" },
  { x: 2660, y: 385, w: 240, h: 22, kind: "branch" },
  { x: 3000, y: 330, w: 180, h: 22, kind: "branch" },
  { x: 3300, y: 372, w: 180, h: 22, kind: "branch" },
  { x: 3520, y: 312, w: 150, h: 22, kind: "branch" },
  { x: 3800, y: 392, w: 190, h: 22, kind: "metal" },
  { x: 4030, y: 350, w: 230, h: 22, kind: "metal" },
  { x: 4300, y: 320, w: 210, h: 22, kind: "metal" },
  { x: 4560, y: 380, w: 180, h: 22, kind: "metal" },
  { x: 5000, y: 382, w: 180, h: 22, kind: "metal" },
  { x: 5230, y: 330, w: 170, h: 22, kind: "metal" },
  { x: 878, y: 383, w: 112, h: 85, kind: "box" },
  { x: 938, y: 383, w: 112, h: 85, kind: "box" },
  { x: 5100, y: 383, w: 112, h: 85, kind: "box" },
  { x: 6150, y: 383, w: 112, h: 85, kind: "box" },
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
