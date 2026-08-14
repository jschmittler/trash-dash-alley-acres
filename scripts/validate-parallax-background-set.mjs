import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

export const TRASH_DASH_PARALLAX_CONTRACT = Object.freeze({
  viewport: Object.freeze({ width: 960, height: 540 }),
  segmentWidth: 1320,
  segmentHeight: 540,
  layers: Object.freeze(["far", "middle", "close"]),
  parallaxSpeeds: Object.freeze({ far: 0.018, middle: 0.055, close: 0.13 }),
});

const alphaSummary = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  let visible = 0;
  let mixedRows = 0;
  for (let y = 0; y < info.height; y += 1) {
    let rowTransparent = false;
    let rowVisible = false;
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      rowTransparent ||= alpha === 0;
      rowVisible ||= alpha > 0;
      if (alpha === 0) transparent += 1;
      else visible += 1;
    }
    if (rowTransparent && rowVisible) mixedRows += 1;
  }
  return { transparent, visible, mixedRows };
};

export async function validateParallaxBackgroundSet({ directory, levelId, stages }) {
  const errors = [];
  const files = [];
  if (!/^level\d+$/.test(levelId)) errors.push(`levelId must look like level1, received ${levelId}`);
  if (!Array.isArray(stages) || stages.length !== 5 || new Set(stages).size !== 5) {
    errors.push("exactly five unique stage names are required");
  }
  for (const stage of stages ?? []) {
    for (const layer of TRASH_DASH_PARALLAX_CONTRACT.layers) {
      const name = `${levelId}-${stage}-${layer}.png`;
      const file = path.join(directory, name);
      try {
        await access(file);
      } catch {
        errors.push(`missing ${name}`);
        continue;
      }
      const metadata = await sharp(file).metadata();
      if (metadata.format !== "png") errors.push(`${name} must be PNG`);
      if (metadata.width !== TRASH_DASH_PARALLAX_CONTRACT.segmentWidth || metadata.height !== TRASH_DASH_PARALLAX_CONTRACT.segmentHeight) {
        errors.push(`${name} must be ${TRASH_DASH_PARALLAX_CONTRACT.segmentWidth}x${TRASH_DASH_PARALLAX_CONTRACT.segmentHeight}`);
      }
      const alpha = await alphaSummary(file);
      if (layer === "far" && alpha.transparent !== 0) errors.push(`${name} far layer must be fully opaque`);
      if (layer !== "far" && (alpha.transparent === 0 || alpha.visible === 0)) errors.push(`${name} must contain both transparent and visible pixels`);
      if (layer !== "far" && alpha.mixedRows < 12) errors.push(`${name} needs object-shaped alpha; found only ${alpha.mixedRows} mixed rows`);
      files.push({ name, width: metadata.width, height: metadata.height, alpha });
    }
  }
  return { valid: errors.length === 0, errors, files, contract: TRASH_DASH_PARALLAX_CONTRACT };
}

async function runCli() {
  const [, , directory, levelId, ...stages] = process.argv;
  if (!directory || !levelId || stages.length === 0) {
    console.error("Usage: node scripts/validate-parallax-background-set.mjs <directory> <levelId> <stage> <stage> <stage> <stage> <stage>");
    process.exitCode = 1;
    return;
  }
  const report = await validateParallaxBackgroundSet({ directory, levelId, stages });
  if (!report.valid) {
    console.error(`Parallax background validation failed:\n- ${report.errors.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${report.files.length} ${levelId} parallax plates at 1320x540.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runCli();
