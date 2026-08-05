import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { BOSS_ANIMATIONS } from "../app/boss-animation.mjs";

const atlasPath = fileURLToPath(new URL("../public/assets/generated/boss-motion.png", import.meta.url));

test("canonical boss atlas matches its manifest and keeps every frame populated", async () => {
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1536);
  assert.equal(info.height, 2048);
  for (const [name, animation] of Object.entries(BOSS_ANIMATIONS)) {
    for (let frame = 0; frame < animation.frames; frame += 1) {
      let opaque = 0;
      for (let y = animation.row * 256 + 1; y < (animation.row + 1) * 256 - 1; y += 1) {
        for (let x = frame * 256 + 1; x < (frame + 1) * 256 - 1; x += 1) {
          if (data[(y * info.width + x) * 4 + 3] > 0) opaque += 1;
        }
      }
      assert.ok(opaque > 1000, `${name} frame ${frame} is populated`);
    }
  }
});

test("boss visual review sheet exists", async () => {
  await access(new URL("../public/assets/generated/boss-contact-sheet.png", import.meta.url));
});
