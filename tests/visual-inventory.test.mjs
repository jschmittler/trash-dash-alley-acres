import assert from "node:assert/strict";
import test from "node:test";

import { LEVEL_TWO } from "../app/level-two.mjs";
import { lampPostDrawRect } from "../app/level-two-props.mjs";
import {
  IMPLEMENTED_VISUAL_INVENTORY,
  RUNTIME_DRAW_FAMILY_MANIFEST,
  VISUAL_QA_ROUTES,
  inventorySummary,
  validateImplementedVisualInventory,
} from "../app/visual-inventory.mjs";

const REQUIRED_GAME_WIDE_ROUTES = [
  "l1-start", "l1-creek", "l1-highway", "l1-industrial", "l1-park", "l1-boss", "l1-victory",
  "l2-backyard", "l2-street", "l2-obstacle", "l2-drainage", "l2-runway", "l2-main-street",
  "l2-squirrel", "l2-terrier", "l2-skunk", "l2-moth", "l2-interaction", "l2-boss", "l2-victory",
];

const EXPECTED_VISUAL_QA_ROUTES = [
  { id: "l1-start", levelId: "level-1", checkpoint: "start", viewport: "desktop", url: "/?backgroundTest=woodland&visualQa=l1-start" },
  { id: "l1-creek", levelId: "level-1", checkpoint: "creek", viewport: "desktop", url: "/?backgroundTest=creek&visualQa=l1-creek" },
  { id: "l1-highway", levelId: "level-1", checkpoint: "highway", viewport: "desktop", url: "/?backgroundTest=highway&visualQa=l1-highway" },
  { id: "l1-industrial", levelId: "level-1", checkpoint: "industrial", viewport: "desktop", url: "/?backgroundTest=industrial&visualQa=l1-industrial" },
  { id: "l1-park", levelId: "level-1", checkpoint: "park", viewport: "desktop", url: "/?backgroundTest=park&visualQa=l1-park" },
  { id: "l1-middle", levelId: "level-1", checkpoint: "middle", viewport: "desktop", url: "/?backgroundTest=highway&visualQa=l1-middle" },
  { id: "l1-end", levelId: "level-1", checkpoint: "end", viewport: "mobile-landscape", url: "/?backgroundTest=park&visualQa=l1-end" },
  { id: "l1-boss", levelId: "level-1", checkpoint: "boss", bossId: "trash-heap-tyrant", viewport: "desktop", url: "/?bossTest=1&visualQa=l1-boss" },
  { id: "l1-victory", levelId: "level-1", checkpoint: "victory", viewport: "desktop", url: "/?victoryTest=1&visualQa=l1-victory" },
  { id: "l2-backyard", levelId: "level-2", checkpoint: "backyard", viewport: "desktop", url: "/?level=2&levelTest=backyard&visualQa=l2-backyard" },
  { id: "l2-street", levelId: "level-2", checkpoint: "street", viewport: "desktop", url: "/?level=2&levelTest=street&visualQa=l2-street" },
  { id: "l2-obstacle", levelId: "level-2", checkpoint: "obstacle", viewport: "desktop", url: "/?level=2&levelTest=obstacle&visualQa=l2-obstacle" },
  { id: "l2-drainage", levelId: "level-2", checkpoint: "drainage", viewport: "desktop", url: "/?level=2&levelTest=drainage&visualQa=l2-drainage" },
  { id: "l2-runway", levelId: "level-2", checkpoint: "runway", viewport: "desktop", url: "/?level=2&levelTest=runway&visualQa=l2-runway" },
  { id: "l2-main-street", levelId: "level-2", checkpoint: "main-street", viewport: "desktop", url: "/?level=2&levelTest=main-street&visualQa=l2-main-street" },
  { id: "l2-start", levelId: "level-2", checkpoint: "start", viewport: "mobile-portrait", url: "/?level=2&levelTest=backyard&visualQa=l2-start" },
  { id: "l2-middle", levelId: "level-2", checkpoint: "middle", viewport: "desktop", url: "/?level=2&levelTest=obstacle&visualQa=l2-middle" },
  { id: "l2-end", levelId: "level-2", checkpoint: "end", viewport: "mobile-landscape", url: "/?level=2&levelTest=main-street&visualQa=l2-end" },
  { id: "l2-squirrel", levelId: "level-2", checkpoint: "squirrel", viewport: "desktop", url: "/?encounterTest=squirrel&visualQa=l2-squirrel" },
  { id: "l2-terrier", levelId: "level-2", checkpoint: "terrier", viewport: "desktop", url: "/?encounterTest=terrier&visualQa=l2-terrier" },
  { id: "l2-skunk", levelId: "level-2", checkpoint: "skunk", viewport: "desktop", url: "/?encounterTest=skunk&visualQa=l2-skunk" },
  { id: "l2-moth", levelId: "level-2", checkpoint: "moth", viewport: "desktop", url: "/?encounterTest=moth&visualQa=l2-moth" },
  { id: "l2-interaction", levelId: "level-2", checkpoint: "interaction", viewport: "desktop", url: "/?encounterTest=interaction&visualQa=l2-interaction" },
  { id: "l2-boss", levelId: "level-2", checkpoint: "boss", bossId: "brutus-bin-hound", viewport: "desktop", url: "/?bossTest=brutus&visualQa=l2-boss" },
  { id: "l2-victory", levelId: "level-2", checkpoint: "victory", viewport: "desktop", url: "/?victoryTest=level2&visualQa=l2-victory" },
  { id: "player-states", levelId: "level-1", checkpoint: "states", viewport: "desktop", url: "/?powerupTest=taco&visualQa=player-states&debugVisuals=1" },
  { id: "enemy-states", levelId: "level-2", checkpoint: "states", viewport: "desktop", url: "/?encounterTest=interaction&visualQa=enemy-states&debugVisuals=1" },
];

test("inventory covers every implemented level, hero, enemy roster, boss and rendered category", () => {
  const summary = inventorySummary(IMPLEMENTED_VISUAL_INVENTORY);
  assert.deepEqual(summary.levels, ["level-1", "level-2"]);
  assert.deepEqual(summary.players, ["jimothy", "raccoon"]);
  assert.deepEqual(summary.bosses, ["brutus-bin-hound", "trash-heap-tyrant"]);
  for (const kind of ["snake", "pigeon", "wasp", "mosquito", "possum", "spider", "fox", "squirrel", "terrier", "skunk", "moth"]) {
    assert.ok(summary.enemies.includes(kind), kind);
  }
  for (const category of [
    "background", "terrain", "platform", "decorative-prop", "interactive-prop", "pickup",
    "projectile", "hazard", "effect", "player", "enemy", "boss", "viewport-ui",
  ]) assert.ok(summary.categories.includes(category), category);
});

test("renderer draw-family manifest binds every named runtime path to canonical inventory records", () => {
  const ids = new Set(IMPLEMENTED_VISUAL_INVENTORY.map(({ id }) => id));
  const families = new Set(RUNTIME_DRAW_FAMILY_MANIFEST.map(({ id }) => id));
  const expectedFamilies = [
    "decorative-props", "level-one-enemies", "level-two-enemies", "players", "bosses", "pickups",
    "victory-dumpster", "level-two-props",
    "level-two-lamp-post", "ordinary-bin-lid", "brutus-rolling-can", "procedural-effects",
  ];
  assert.deepEqual([...families].sort(), expectedFamilies.sort(), "renderer draw families are exhaustive");
  for (const id of expectedFamilies) {
    assert.ok(families.has(id), id);
  }
  for (const family of RUNTIME_DRAW_FAMILY_MANIFEST) {
    assert.ok(family.renderer.length > 0, `${family.id}: renderer`);
    assert.ok(family.recordIds.length > 0, `${family.id}: record coverage`);
    for (const recordId of family.recordIds) assert.ok(ids.has(recordId), `${family.id}:${recordId}`);
  }
  assert.equal(LEVEL_TWO.surfaces.some(({ visual }) => visual), false, "Level 2 no longer owns bespoke visual-platform cells");
  const boundRecordIds = new Set(RUNTIME_DRAW_FAMILY_MANIFEST.flatMap(({ recordIds }) => recordIds));
  for (const { id, category, assetSource } of IMPLEMENTED_VISUAL_INVENTORY) {
    if (assetSource && ["projectile", "effect"].includes(category)) assert.ok(boundRecordIds.has(id), `explicit ${category}: ${id}`);
  }
  const dumpster = IMPLEMENTED_VISUAL_INVENTORY.find(({ id }) => id === "victory-dumpster");
  assert.deepEqual(Object.keys(dumpster.sourceRects), ["sealed", "holy"]);
  assert.deepEqual(dumpster.requiredStates, ["sealed", "holy"]);
});

test("animated prop consumers bind all committed source frames to runtime destinations", () => {
  const record = (id) => IMPLEMENTED_VISUAL_INVENTORY.find((candidate) => candidate.id === id);
  const binLid = record("ordinary-bin-lid");
  assert.deepEqual(binLid.sourceRects.active, [
    { x: 0, y: 0, w: 128, h: 128 }, { x: 128, y: 0, w: 128, h: 128 },
    { x: 256, y: 0, w: 128, h: 128 }, { x: 384, y: 0, w: 128, h: 128 },
  ]);
  assert.deepEqual(binLid.runtimeDestinations.active, Array.from({ length: 4 }, () => ({ w: 34, h: 34 })));
  const lamp = record("lamp-post");
  const runtimeLamp = lampPostDrawRect({ x: 0, y: 0, w: 96, h: 208 });
  assert.deepEqual(lamp.sourceRects.idle, [{ x: 0, y: 0, w: 192, h: 256 }]);
  assert.deepEqual(lamp.runtimeDestinations.idle, [{ w: runtimeLamp.w, h: runtimeLamp.h }]);
  assert.equal(runtimeLamp.w / 192, runtimeLamp.h / 256);
});

test("Level 2 boss platforms inherit the canonical decorative crate record", () => {
  const crate = IMPLEMENTED_VISUAL_INVENTORY.find(({ id }) => id === "crate");
  assert.deepEqual(crate.renderedSize, { w: 112, h: 85 });
  for (const surface of LEVEL_TWO.surfaces.filter(({ id }) => id.startsWith("brutus-platform-"))) {
    assert.equal(surface.kind, "crate");
    assert.deepEqual({ w: surface.w, h: surface.h }, crate.renderedSize);
  }
});

test("every implemented inventory record satisfies placement, scale, layer and animation contracts", () => {
  assert.deepEqual(validateImplementedVisualInventory(), []);
});

test("deterministic visual QA routes cover level thirds, bosses, states and supported viewports", () => {
  for (const levelId of ["level-1", "level-2"]) {
    for (const checkpoint of ["start", "middle", "end"]) {
      assert.ok(VISUAL_QA_ROUTES.some((route) => route.levelId === levelId && route.checkpoint === checkpoint));
    }
  }
  assert.ok(VISUAL_QA_ROUTES.some(({ bossId }) => bossId === "trash-heap-tyrant"));
  assert.ok(VISUAL_QA_ROUTES.some(({ bossId }) => bossId === "brutus-bin-hound"));
  for (const viewport of ["desktop", "mobile-landscape", "mobile-portrait"]) {
    assert.ok(VISUAL_QA_ROUTES.some((route) => route.viewport === viewport), viewport);
  }
  assert.ok(VISUAL_QA_ROUTES.every((route) => route.url.includes("visualQa=")));
});

test("visual QA catalog covers every Level 1 and Level 2 integrity checkpoint", () => {
  assert.deepEqual(
    REQUIRED_GAME_WIDE_ROUTES.filter((id) => !VISUAL_QA_ROUTES.some((route) => route.id === id)),
    [],
  );
});

test("visual QA catalog is deeply immutable and preserves exact route metadata", () => {
  assert.deepEqual(VISUAL_QA_ROUTES, EXPECTED_VISUAL_QA_ROUTES);
  assert.equal(Object.isFrozen(VISUAL_QA_ROUTES), true);
  assert.ok(VISUAL_QA_ROUTES.every(Object.isFrozen));
  assert.throws(() => {
    VISUAL_QA_ROUTES[0].url = "/?visualQa=mutated";
  }, TypeError);
  assert.throws(() => {
    VISUAL_QA_ROUTES.push({});
  }, TypeError);
});
