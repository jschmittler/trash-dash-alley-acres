import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { JIMOTHY_ANIMATIONS } from "../concepts/jimothy/jimothy-animation.mjs";

test("private Jimothy atlas matches its manifest", async () => {
  const path = fileURLToPath(new URL("../concepts/jimothy/jimothy-animation-atlas.png", import.meta.url));
  const metadata = await sharp(path).metadata();
  assert.equal(metadata.width, 768);
  assert.equal(metadata.height, 2304);
  assert.equal(Object.keys(JIMOTHY_ANIMATIONS).length, 12);
  await access(new URL("../concepts/jimothy/jimothy-animation-contact-sheet.png", import.meta.url));
});

test("Jimothy remains absent from public and runtime code", async () => {
  const game = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(game, /jimothy/i);
  assert.doesNotMatch(packageJson, /public\/.*jimothy/i);
});
