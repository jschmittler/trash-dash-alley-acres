import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { TRASH_DASH_PARALLAX_CONTRACT, validateParallaxBackgroundSet } from "../scripts/validate-parallax-background-set.mjs";

const stages = ["woodland", "creek", "highway", "industrial", "park"];

async function writePlate(directory, stage, layer) {
  const file = path.join(directory, `level1-${stage}-${layer}.png`);
  if (layer === "far") {
    await sharp({ create: { width: 1320, height: 540, channels: 4, background: "#17305c" } }).png().toFile(file);
    return;
  }
  const alpha = Buffer.from(`<svg width="1320" height="540" xmlns="http://www.w3.org/2000/svg"><rect x="80" y="80" width="240" height="350" fill="#203f38"/><rect x="830" y="120" width="180" height="390" fill="#344d31"/></svg>`);
  await sharp(alpha).png().toFile(file);
}

test("approved v2 contract requires five three-layer 1320x540 PNG stage sets", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "trash-dash-parallax-"));
  try {
    for (const stage of stages) for (const layer of TRASH_DASH_PARALLAX_CONTRACT.layers) await writePlate(directory, stage, layer);
    const report = await validateParallaxBackgroundSet({ directory, levelId: "level1", stages });
    assert.equal(report.valid, true, report.errors.join("\n"));
    assert.equal(report.files.length, 15);
    assert.deepEqual(TRASH_DASH_PARALLAX_CONTRACT.parallaxSpeeds, { far: 0.018, middle: 0.055, close: 0.13 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("v2 contract rejects a transparent far layer and a wrongly sized moving plate", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "trash-dash-parallax-"));
  try {
    for (const stage of stages) for (const layer of TRASH_DASH_PARALLAX_CONTRACT.layers) await writePlate(directory, stage, layer);
    await sharp({ create: { width: 1320, height: 540, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(path.join(directory, "level1-woodland-far.png"));
    await sharp({ create: { width: 960, height: 540, channels: 4, background: "#203f38" } }).png().toFile(path.join(directory, "level1-creek-close.png"));
    const report = await validateParallaxBackgroundSet({ directory, levelId: "level1", stages });
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((error) => error.includes("woodland-far.png far layer must be fully opaque")));
    assert.ok(report.errors.some((error) => error.includes("creek-close.png must be 1320x540")));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
