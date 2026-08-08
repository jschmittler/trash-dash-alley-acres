import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { activateBossArena, clampArenaPlayerX } from "../../app/boss-arena.mjs";
import {
  brutusArenaHazards,
  createBrutusState,
  moveBrutusInArena,
  updateBrutus,
} from "../../app/brutus-boss.mjs";
import { LEVEL_TWO } from "../../app/level-two.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
let state = createBrutusState();
let elapsed = 0;
let actor = {
  x: LEVEL_TWO.boss.arenaStartX + 480,
  w: 96,
  facing: -1,
};
const transitions = [{
  elapsed, mode: state.mode, hp: state.hp, phase: state.phase, x: actor.x, arenaUnlocked: state.arenaUnlocked,
}];
const chargeProfiles = [];
let activeCharge = null;
let defeatExitStartX = null;
for (let step = 0; step < 300 && !state.arenaUnlocked; step += 1) {
  const previous = state;
  const movement = moveBrutusInArena(actor, state, { dt: 0.1, boss: LEVEL_TWO.boss });
  actor = { ...actor, ...movement };
  state = updateBrutus(state, {
    dt: 0.1,
    hydrantHit: movement.hydrantHit,
    playerAttackHit: state.mode === "stunned-open",
  });
  elapsed = Number((elapsed + 0.1).toFixed(1));
  if (state.mode === "charge" && previous.mode !== "charge") {
    actor.facing = -1;
    activeCharge = { phase: state.phase, startElapsed: elapsed, startX: actor.x };
  }
  if (movement.hydrantHit) {
    if (!activeCharge) throw new Error("Hydrant contact occurred without a tracked charge");
    chargeProfiles.push({
      phase: activeCharge.phase,
      startX: activeCharge.startX,
      impactX: actor.x,
      travel: activeCharge.startX - actor.x,
      elapsed: Number((elapsed - activeCharge.startElapsed).toFixed(1)),
    });
    activeCharge = null;
  }
  if (state.mode === "defeat-exit" && previous.mode !== "defeat-exit") defeatExitStartX = actor.x;
  if (state.mode !== previous.mode || state.hp !== previous.hp) {
    transitions.push({
      elapsed,
      mode: state.mode,
      hp: state.hp,
      phase: state.phase,
      x: actor.x,
      hydrantHit: movement.hydrantHit,
      hazards: brutusArenaHazards(state),
      arenaUnlocked: state.arenaUnlocked,
    });
  }
}

if (!state.arenaUnlocked || state.mode !== "complete") throw new Error("Brutus trace did not reach full defeat completion");
if (transitions.slice(0, -1).some(({ arenaUnlocked }) => arenaUnlocked)) throw new Error("Arena unlocked before the final trace state");
if (chargeProfiles.length !== 3) throw new Error(`Expected three position-authored hydrant contacts, found ${chargeProfiles.length}`);
if (!chargeProfiles.every(({ travel }) => travel >= 300)) throw new Error("A phase charge re-collided without leaving the hydrant");
if (!(chargeProfiles[0].elapsed > chargeProfiles[1].elapsed && chargeProfiles[1].elapsed > chargeProfiles[2].elapsed)) {
  throw new Error("Accelerated phase charge times are not strictly descending");
}
if (defeatExitStartX === null || actor.x <= defeatExitStartX) throw new Error("Defeat exit did not translate Brutus away");

const activated = activateBossArena([
  { kind: "terrier", active: true },
  { kind: "moth", active: true },
  { kind: "boss", active: true },
], LEVEL_TWO.boss);

const audit = {
  dt: 0.1,
  completionElapsed: elapsed,
  transitions,
  chargeProfiles,
  defeatExit: { startX: defeatExitStartX, completeX: actor.x, travel: actor.x - defeatExitStartX },
  runwayOrdinaryAfterActivation: activated.enemies.filter(({ kind }) => kind !== "boss").length,
  lockedPlayerSamples: [5400, 5750, 6700].map((x) => clampArenaPlayerX(x, 38, LEVEL_TWO.boss)),
  releasePlayerSample: 6700,
  manualFeelBoundary: [
    "Input cadence and audiovisual feel require browser playtesting.",
    "Localhost/browser access was prohibited for Task 7; no browser attempt was made.",
  ],
};

await writeFile(path.join(root, "brutus-arena-trace.json"), `${JSON.stringify(audit, null, 2)}\n`);
console.log(`Brutus reaches complete at ${elapsed.toFixed(1)}s; runway ordinary count ${audit.runwayOrdinaryAfterActivation}.`);
