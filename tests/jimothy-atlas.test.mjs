import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { JIMOTHY_ANIMATIONS } from "../concepts/jimothy/jimothy-animation.mjs";

test("private Jimothy concept atlas remains available", async () => {
  const path = fileURLToPath(new URL("../concepts/jimothy/jimothy-animation-atlas.png", import.meta.url));
  const metadata = await sharp(path).metadata();
  assert.equal(metadata.width, 1152);
  assert.equal(metadata.height, 4224);
  await access(new URL("../concepts/jimothy/jimothy-animation-contact-sheet.png", import.meta.url));
});

test("Jimothy is represented by the shared animation manifest", async () => {
  assert.equal(Object.keys(JIMOTHY_ANIMATIONS).length, 22);
  assert.ok(JIMOTHY_ANIMATIONS.large_tail_swipe);
  assert.ok(JIMOTHY_ANIMATIONS.large_glide);
  const game = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(game, /jimothy/i);
});
