import { JIMOTHY_ANIMATIONS } from "../concepts/jimothy/jimothy-animation.mjs";
import { PLAYER_ANIMATIONS, selectPlayerAnimation } from "./player-animation.mjs";

const atlas = (path) => path;

const raccoon = {
  id: "raccoon",
  displayName: "Trashy",
  atlasSrc: atlas("assets/generated/player-hero-motion.png"),
  selectionPortraitSrc: "assets/generated/trashy-selection-portrait.png",
  small: {
    width: 32,
    height: 46,
    drawWidth: 84,
    drawHeight: 84,
    hitbox: { x: 4, y: 3, w: 24, h: 43 },
  },
  large: {
    width: 38,
    height: 58,
    drawWidth: 110,
    drawHeight: 110,
    hitbox: { x: 4, y: 4, w: 30, h: 54 },
  },
  animations: PLAYER_ANIMATIONS,
  attackFrames: [1, 2],
};

const jimothy = {
  id: "jimothy",
  displayName: "Jimothy",
  atlasSrc: atlas("assets/generated/jimothy-hero-motion.png"),
  selectionPortraitSrc: "assets/generated/jimothy-selection-portrait.png",
  small: {
    width: 32,
    height: 46,
    drawWidth: 84,
    drawHeight: 84,
    hitbox: { x: 4, y: 3, w: 24, h: 43 },
  },
  large: {
    width: 38,
    height: 58,
    drawWidth: 110,
    drawHeight: 110,
    hitbox: { x: 4, y: 4, w: 30, h: 54 },
  },
  animations: JIMOTHY_ANIMATIONS,
  attackFrames: [1, 2],
};

export const PLAYABLE_CHARACTERS = Object.freeze({ raccoon, jimothy });

export function getPlayableCharacter(id) {
  return PLAYABLE_CHARACTERS[id] ?? PLAYABLE_CHARACTERS.raccoon;
}

export function selectCharacterAnimation(character, input) {
  const profile = typeof character === "string" ? getPlayableCharacter(character) : character ?? PLAYABLE_CHARACTERS.raccoon;
  return selectPlayerAnimation(input, profile.animations);
}
