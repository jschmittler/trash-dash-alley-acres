import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  LEVEL_TWO_ENVIRONMENT_TRANSITIONS,
  applyLevelTwoEnvironmentTransition,
  createLevelTwoEnvironmentRuntime,
} from "../app/level-two-environment.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import { createBrutusState, updateBrutus } from "../app/brutus-boss.mjs";

const hydrantsIn = (runtime) => runtime.environment.filter(({ kind }) => kind === "hydrant");

const assertSingleHydrant = (runtime, expectedIdentity, transition) => {
  const hydrants = hydrantsIn(runtime);
  assert.equal(hydrants.length, 1, `${transition}: hydrant count`);
  assert.equal(hydrants[0].id, LEVEL_TWO.boss.hydrant.id, `${transition}: canonical ID`);
  assert.strictEqual(hydrants[0], expectedIdentity, `${transition}: runtime identity changed`);
  assert.equal(Object.isFrozen(hydrants[0]), true, `${transition}: mutable hydrant`);
};

test("one runtime hydrant identity survives death, checkpoint recovery, every phase, defeat, and exit", () => {
  assert.deepEqual(LEVEL_TWO_ENVIRONMENT_TRANSITIONS, [
    "entry",
    "death",
    "retry",
    "checkpoint-recovery",
    "phase-change",
    "defeat",
    "exit",
    "re-entry",
  ]);

  const runtime = createLevelTwoEnvironmentRuntime(LEVEL_TWO, "entry");
  const identity = hydrantsIn(runtime)[0];
  assertSingleHydrant(runtime, identity, "fresh entry");

  let boss = createBrutusState();
  const transitions = ["death", "checkpoint-recovery"];
  for (const hp of [2, 1, 0]) {
    boss = updateBrutus({ ...boss, hp: hp + 1, phase: 3 - hp, mode: "stunned-open" }, {
      dt: 0,
      playerAttackHit: true,
    });
    if (hp > 0) transitions.push("phase-change");
  }
  transitions.push("defeat", "exit");

  for (const transition of transitions) {
    applyLevelTwoEnvironmentTransition(runtime, transition);
    assertSingleHydrant(runtime, identity, transition);
  }
  assert.equal(runtime.environmentState.revision, transitions.length + 1);
});

test("retry and re-entry runtime constructors retain one canonical identity and reject append mutations", () => {
  for (const transition of ["retry", "re-entry"]) {
    const runtime = createLevelTwoEnvironmentRuntime(LEVEL_TWO, transition);
    const [hydrant] = hydrantsIn(runtime);
    assertSingleHydrant(runtime, hydrant, transition);
    assert.throws(() => runtime.environment.push(hydrant), TypeError, `${transition}: duplicate append`);
    assert.throws(() => { hydrant.id = "duplicate-hydrant"; }, TypeError, `${transition}: ID mutation`);
  }
});

test("the shipped world routes lifecycle events through the actual environment owner", async () => {
  const runtime = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  for (const transition of ["death", "checkpoint-recovery", "phase-change", "defeat", "exit"]) {
    assert.match(
      runtime,
      new RegExp(`applyLevelTwoEnvironmentTransition\\(world, ["']${transition}["']\\)`),
      `missing actual ${transition} runtime transition`,
    );
  }
  assert.match(runtime, /startGame\([^\n]+["']retry["']\)/);
  assert.match(runtime, /startGame\([^\n]+["']re-entry["']\)/);
});
