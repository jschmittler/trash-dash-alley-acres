import assert from "node:assert/strict";
import test from "node:test";

import {
  IMPLEMENTED_VISUAL_INVENTORY,
  VISUAL_QA_ROUTES,
  inventorySummary,
  validateImplementedVisualInventory,
} from "../app/visual-inventory.mjs";

const REQUIRED_GAME_WIDE_ROUTES = [
  "l1-start", "l1-creek", "l1-highway", "l1-industrial", "l1-park", "l1-boss", "l1-victory",
  "l2-backyard", "l2-street", "l2-obstacle", "l2-drainage", "l2-runway", "l2-main-street",
  "l2-squirrel", "l2-terrier", "l2-skunk", "l2-moth", "l2-interaction", "l2-boss", "l2-victory",
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
