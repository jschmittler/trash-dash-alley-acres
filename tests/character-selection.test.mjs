import test from "node:test";
import assert from "node:assert/strict";
import {
  confirmCharacterSelection,
  createCharacterSelectionState,
  moveCharacterSelection,
} from "../app/character-selection.mjs";

test("selection starts focused on the first available character", () => {
  assert.deepEqual(createCharacterSelectionState(["raccoon", "jimothy"]), {
    ids: ["raccoon", "jimothy"], index: 0, selectedId: "raccoon",
  });
  assert.equal(createCharacterSelectionState(["raccoon", "jimothy"], 1).selectedId, "jimothy");
});

test("selection ignores unknown ids and falls back to raccoon", () => {
  assert.deepEqual(createCharacterSelectionState(["unknown", "jimothy"]), {
    ids: ["jimothy"], index: 0, selectedId: "jimothy",
  });
  assert.equal(createCharacterSelectionState([], 4).selectedId, "raccoon");
});

test("selection wraps focus in both directions", () => {
  const state = createCharacterSelectionState(["raccoon", "jimothy"]);
  assert.equal(moveCharacterSelection(state, -1).selectedId, "jimothy");
  assert.equal(moveCharacterSelection(state, 1).selectedId, "jimothy");
  assert.equal(moveCharacterSelection(state, 2).selectedId, "raccoon");
});

test("confirmation returns the focused playable character id", () => {
  const state = moveCharacterSelection(createCharacterSelectionState(["raccoon", "jimothy"]), 1);
  assert.equal(confirmCharacterSelection(state), "jimothy");
  assert.equal(confirmCharacterSelection({ ids: ["missing"], index: 0 }), "raccoon");
});
