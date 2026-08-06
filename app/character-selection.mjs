import { getPlayableCharacter, PLAYABLE_CHARACTERS } from "./playable-character.mjs";

const FALLBACK_ID = "raccoon";

/** @typedef {{ ids: string[], index: number, selectedId: string }} CharacterSelectionState */

export function createCharacterSelectionState(ids = Object.keys(PLAYABLE_CHARACTERS), initialIndex = 0) {
  const available = Array.from(new Set(ids)).filter((id) => id in PLAYABLE_CHARACTERS);
  const normalized = available.length ? available : [FALLBACK_ID];
  const index = Number.isFinite(initialIndex)
    ? ((Math.trunc(initialIndex) % normalized.length) + normalized.length) % normalized.length
    : 0;
  return { ids: normalized, index, selectedId: normalized[index] };
}

export function moveCharacterSelection(state, delta) {
  const current = createCharacterSelectionState(state?.ids, state?.index ?? 0);
  const amount = Number.isFinite(delta) ? Math.trunc(delta) : 0;
  const index = ((current.index + amount) % current.ids.length + current.ids.length) % current.ids.length;
  return { ...current, index, selectedId: current.ids[index] };
}

export function confirmCharacterSelection(state) {
  const current = createCharacterSelectionState(state?.ids, state?.index ?? 0);
  return getPlayableCharacter(current.selectedId).id;
}
