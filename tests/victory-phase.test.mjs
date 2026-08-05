import assert from "node:assert/strict";
import test from "node:test";

import { evaluateVictoryRecord } from "../app/victory-phase.mjs";

test("victory records identify new score and time records independently", () => {
  assert.deepEqual(evaluateVictoryRecord({ score: 4200, time: 61, bestScore: 4000, bestTime: 65 }), {
    score: true,
    time: true,
  });
  assert.deepEqual(evaluateVictoryRecord({ score: 4200, time: 70, bestScore: 5000, bestTime: 65 }), {
    score: false,
    time: false,
  });
});

test("a first completion counts as a best-time record", () => {
  assert.deepEqual(evaluateVictoryRecord({ score: 100, time: 12, bestScore: 0, bestTime: 0 }), {
    score: true,
    time: true,
  });
});
