import test from "node:test";
import assert from "node:assert/strict";

import {
  campaignLevelById,
  campaignLightingAt,
  campaignZoneAt,
  registerCampaignLevels,
  validateCampaignLevel,
} from "../app/campaign-level.mjs";
import { LEVEL_ONE } from "../app/level-one.mjs";

test("campaign registry returns registered immutable definitions", () => {
  registerCampaignLevels([LEVEL_ONE]);
  assert.equal(campaignLevelById("level-1"), LEVEL_ONE);
  assert.equal(Object.isFrozen(campaignLevelById("level-1")), true);
});

test("campaign registry falls back to Level 1 for an unknown id", () => {
  registerCampaignLevels([LEVEL_ONE]);
  assert.equal(campaignLevelById("missing"), LEVEL_ONE);
});

test("campaign contract reports missing cross-references", () => {
  const broken = { ...LEVEL_ONE, encounters: [{ id: "bad", zoneId: "missing", enemies: [] }] };
  assert.deepEqual(validateCampaignLevel(broken), ["encounter bad references unknown zone missing"]);
});

test("generic zone and lighting lookup preserve Level 1 boundaries", () => {
  assert.equal(campaignZoneAt(LEVEL_ONE, 1150).id, "creek-and-ruined-mill");
  assert.equal(campaignLightingAt(LEVEL_ONE, 5200).lighting, "moonlit");
});

test("Level 1 exposes the shared campaign contract fields", () => {
  assert.equal(LEVEL_ONE.title, "Woodlands to City Limits");
  assert.equal(LEVEL_ONE.worldWidth, 6600);
  assert.ok(LEVEL_ONE.surfaces.length > 0);
  assert.equal(LEVEL_ONE.backgroundSets.length, 5);
  assert.deepEqual(LEVEL_ONE.exit, { nextLevelId: "level-2", x: 6520 });
});
