import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { normalizeGroundedComponents } from "../../scripts/parallax-baseline.mjs";

const STAGES = ["backyard", "street", "obstacle", "drainage", "main-street"];
const LAYERS = ["far", "middle", "close"];
const WIDTH = 2048;
const HEIGHT = 716;
const RUNTIME_BASELINE = 603;
const KEY = Object.freeze({ red: 255, green: 0, blue: 255 });
const TRANSPARENT_KEY_DISTANCE = 118;

const sourceRoot = new URL("./source/", import.meta.url);
const outputRoot = new URL("../../public/assets/backgrounds/", import.meta.url);
const contactSheetPath = fileURLToPath(new URL("./level2-backgrounds-contact-sheet.png", import.meta.url));

const sourcePath = (stage, layer) => fileURLToPath(
  new URL(`level2-${stage}-${layer}-source.png`, sourceRoot),
);
const outputPath = (stage, layer) => fileURLToPath(
  new URL(`level2-${stage}-${layer}.png`, outputRoot),
);

function removeMagentaKey(data, info) {
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const redDistance = data[offset] - KEY.red;
    const greenDistance = data[offset + 1] - KEY.green;
    const blueDistance = data[offset + 2] - KEY.blue;
    const distance = Math.sqrt(
      redDistance ** 2 + greenDistance ** 2 + blueDistance ** 2,
    );
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const stronglyMagenta =
      Math.min(red, blue) > 52
      && Math.min(red, blue) - green > 26
      && Math.abs(red - blue) < 110
      && red + blue > 165;

    if (distance <= TRANSPARENT_KEY_DISTANCE || stronglyMagenta) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    } else {
      data[offset + 3] = 255;
    }
  }
  return data;
}

async function buildFar(stage) {
  await sharp(sourcePath(stage, "far"))
    .removeAlpha()
    .resize(WIDTH, HEIGHT, { fit: "fill", kernel: sharp.kernel.nearest })
    .png({ palette: false })
    .toFile(outputPath(stage, "far"));
}

async function keyedRuntimeImage(stage, layer) {
  const { data, info } = await sharp(sourcePath(stage, layer))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const keyed = removeMagentaKey(data, info);
  const resized = await sharp(keyed, { raw: info })
    .resize(WIDTH, HEIGHT, { fit: "fill", kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (layer !== "middle") return resized;
  return normalizeGroundedComponents(resized.data, resized.info, {
    baseline: RUNTIME_BASELINE,
  });
}

async function buildMovingPlate(stage, layer) {
  const image = await keyedRuntimeImage(stage, layer);
  await sharp(image.data, { raw: image.info })
    .png({ palette: false })
    .toFile(outputPath(stage, layer));
}

async function makeContactSheet() {
  const thumbWidth = 512;
  const thumbHeight = 179;
  const labelHeight = 24;
  const cellHeight = thumbHeight + labelHeight;
  const sheet = sharp({
    create: {
      width: thumbWidth * LAYERS.length,
      height: cellHeight * STAGES.length,
      channels: 4,
      background: "#11162a",
    },
  });
  const composites = [];
  for (let row = 0; row < STAGES.length; row += 1) {
    for (let column = 0; column < LAYERS.length; column += 1) {
      const stage = STAGES[row];
      const layer = LAYERS[column];
      const input = await sharp(outputPath(stage, layer))
        .flatten({ background: column === 0 ? "#11162a" : "#767c91" })
        .resize(thumbWidth, thumbHeight, { fit: "fill", kernel: sharp.kernel.nearest })
        .png()
        .toBuffer();
      composites.push({ input, left: column * thumbWidth, top: row * cellHeight + labelHeight });
    }
  }
  await sheet.composite(composites).png().toFile(contactSheetPath);
}

await mkdir(fileURLToPath(outputRoot), { recursive: true });
for (const stage of STAGES) {
  await buildFar(stage);
  await buildMovingPlate(stage, "middle");
  await buildMovingPlate(stage, "close");
}
await makeContactSheet();

console.log(
  `Built ${STAGES.length * LAYERS.length} Level 2 semantic parallax plates and contact sheet.`,
);
