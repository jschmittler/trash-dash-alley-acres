import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { activateBossArena, clampArenaPlayerX } from "../../app/boss-arena.mjs";
import { brutusArenaHazards, createBrutusState, updateBrutus } from "../../app/brutus-boss.mjs";
import { LEVEL_TWO } from "../../app/level-two.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
let state = createBrutusState();
let elapsed = 0;
const transitions = [{ elapsed, mode: state.mode, hp: state.hp, phase: state.phase, arenaUnlocked: state.arenaUnlocked }];
for (let step = 0; step < 300 && !state.arenaUnlocked; step += 1) {
  const previous = state;
  state = updateBrutus(state, {
    dt: 0.1,
    hydrantHit: state.mode === "charge",
    playerAttackHit: state.mode === "stunned-open",
  });
  elapsed = Number((elapsed + 0.1).toFixed(1));
  if (state.mode !== previous.mode || state.hp !== previous.hp) {
    transitions.push({
      elapsed,
      mode: state.mode,
      hp: state.hp,
      phase: state.phase,
      hazards: brutusArenaHazards(state),
      arenaUnlocked: state.arenaUnlocked,
    });
  }
}

if (!state.arenaUnlocked || state.mode !== "complete") throw new Error("Brutus trace did not reach full defeat completion");
if (transitions.slice(0, -1).some(({ arenaUnlocked }) => arenaUnlocked)) throw new Error("Arena unlocked before the final trace state");

const activated = activateBossArena([
  { kind: "terrier", active: true },
  { kind: "moth", active: true },
  { kind: "boss", active: true },
], LEVEL_TWO.boss);

const audit = {
  dt: 0.1,
  completionElapsed: elapsed,
  transitions,
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
