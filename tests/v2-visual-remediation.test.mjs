import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createBrutusState, brutusArenaHazards } from "../app/brutus-boss.mjs";
import {
  LEVEL_TWO_ENVIRONMENT_TRANSITIONS,
  transitionLevelTwoEnvironment,
} from "../app/level-two-environment.mjs";
import { LEVEL_TWO_PROP_FRAMES, LEVEL_TWO_PROP_RUNTIME_OWNERS } from "../app/level-two-props.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import {
  IMPLEMENTED_VISUAL_INVENTORY,
  validateAnimationStateScale,
  validateFixedAspectDestinations,
} from "../app/visual-inventory.mjs";

const shippedSprinklerPaths = [
  "../app/brutus-boss.mjs",
  "../app/boss-arena.mjs",
  "../app/level-two-enemies.mjs",
  "../app/level-two-environment.mjs",
  "../app/level-two-props.mjs",
  "../app/level-two.mjs",
  "../app/trash-dash-game.tsx",
  "../app/visual-inventory.mjs",
  "../scripts/build-level-two-props.mjs",
];

const source = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("deleted sprinkler feature has no shipped runtime, configuration, builder, or audio path", async () => {
  for (const relativePath of shippedSprinklerPaths) {
    assert.doesNotMatch(await source(relativePath), /\bsprinklers?\b/i, relativePath);
  }
  assert.ok(Object.keys(LEVEL_TWO_PROP_FRAMES).every((name) => !/sprinkler/i.test(name)));
  assert.ok(IMPLEMENTED_VISUAL_INVENTORY.every(({ id }) => !/sprinkler/i.test(id)));
  assert.equal(Object.hasOwn(LEVEL_TWO.boss, "sprinklers"), false);
});

test("every Level 2 prop cell has one exact reachable runtime owner", async () => {
  assert.deepEqual(LEVEL_TWO_PROP_RUNTIME_OWNERS, {
    acorn: "bin-lid-source",
    "charge-obstacle": "level-two-environment",
    "boss-platform-left": "brutus-platform-left",
    "boss-platform-right": "brutus-platform-right",
    "rolling-can": "brutus-rolling-can",
    "hydrant-idle": "brutus-crash-mechanic",
  });
  assert.deepEqual(Object.keys(LEVEL_TWO_PROP_FRAMES), Object.keys(LEVEL_TWO_PROP_RUNTIME_OWNERS));

  const runtime = await source("../app/trash-dash-game.tsx");
  for (const frame of Object.keys(LEVEL_TWO_PROP_RUNTIME_OWNERS)) {
    if (frame.startsWith("boss-platform-")) {
      assert.ok(LEVEL_TWO.surfaces.some(({ visual }) => visual === frame), `${frame}: surface owner`);
    } else if (frame === "acorn") {
      assert.match(runtime, /levelTwoPropFrame\("acorn"/);
    } else if (frame === "rolling-can") {
      assert.match(runtime, /propName = lid\.ownerId === "brutus-can" \? "rolling-can" : "acorn"/);
    } else {
      assert.match(runtime, new RegExp(`levelTwoPropFrame\\("${frame}"`), `${frame}: runtime draw`);
    }
  }
});

test("Brutus never emits a deleted sprinkler hazard in any phase", () => {
  const initial = createBrutusState();
  for (const phase of [1, 2, 3]) {
    for (const mode of ["idle", "charge", "stunned", "defeated"]) {
      const hazards = brutusArenaHazards({ ...initial, phase, hp: phase === 3 ? 1 : 3, mode });
      assert.ok(hazards.every(({ kind }) => !/sprinkler/i.test(kind)));
    }
  }
});

test("runtime entry, retry, checkpoint, phase, and re-entry keep one stable hydrant identity", () => {
  let state;
  for (const transition of LEVEL_TWO_ENVIRONMENT_TRANSITIONS) {
    state = transitionLevelTwoEnvironment(state, LEVEL_TWO, transition);
    const hydrants = state.records.filter(({ kind }) => kind === "hydrant");
    assert.equal(hydrants.length, 1, `${transition} hydrant count`);
    assert.equal(hydrants[0].id, LEVEL_TWO.boss.hydrant.id);
    assert.equal(new Set(state.records.map(({ id }) => id)).size, state.records.length, `${transition} duplicate IDs`);
  }
  assert.equal(state.transition, "re-entry");
});

test("fixed-aspect destination validation is mutation-sensitive", () => {
  const record = {
    id: "fixed-prop",
    sourceRects: { idle: [{ x: 0, y: 0, w: 48, h: 64 }] },
    runtimeDestinations: { idle: [{ w: 72, h: 96 }] },
  };
  assert.deepEqual(validateFixedAspectDestinations(record), []);
  assert.match(validateFixedAspectDestinations({
    ...record,
    runtimeDestinations: { idle: [{ w: 73, h: 96 }] },
  })[0], /nonuniform fixed-aspect destination/);
});

test("animation-state scale validation rejects character-only state multipliers", () => {
  const record = {
    id: "character",
    runtimeDestinations: {
      idle: [{ w: 84, h: 84 }],
      run: [{ w: 84, h: 84 }, { w: 84, h: 84 }],
      victory: [{ w: 84, h: 84 }],
    },
  };
  assert.deepEqual(validateAnimationStateScale(record), []);
  assert.match(validateAnimationStateScale({
    ...record,
    runtimeDestinations: { ...record.runtimeDestinations, victory: [{ w: 88, h: 88 }] },
  })[0], /state-dependent destination scale/);
});

test("canonical player inventory validates runtime destination scale by form", () => {
  for (const player of IMPLEMENTED_VISUAL_INVENTORY.filter(({ category }) => category === "player")) {
    assert.deepEqual(validateAnimationStateScale(player), [], player.id);
  }
});
