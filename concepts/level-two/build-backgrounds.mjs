import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { normalizeGroundedComponents } from "../../scripts/parallax-baseline.mjs";

const STAGES = ["backyard", "street", "obstacle", "drainage", "main-street"];
const LAYERS = ["far", "middle", "close"];
const WIDTH = 1320;
const HEIGHT = 540;
const RUNTIME_BASELINE = 500;
const FAR_VALUE_STEP = 32;
const KEY = Object.freeze({ red: 255, green: 0, blue: 255 });
const TRANSPARENT_KEY_DISTANCE = 118;
const CONTINUATION_MARGIN = 120;

const sourceRoot = new URL("./source-v2/", import.meta.url);
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

function quantizeRgbValues(data, info) {
  for (let offset = 0; offset < data.length; offset += info.channels) {
    for (let channel = 0; channel < 3; channel += 1) {
      data[offset + channel] = Math.min(
        255,
        Math.round(data[offset + channel] / FAR_VALUE_STEP) * FAR_VALUE_STEP,
      );
    }
  }
  return data;
}

function normalizeFarHorizontalSeam(data, info) {
  for (let y = 0; y < info.height; y += 1) {
    for (let distance = 0; distance < CONTINUATION_MARGIN; distance += 1) {
      const left = (y * info.width + distance) * info.channels;
      const right = (y * info.width + (info.width - 1 - distance)) * info.channels;
      for (let channel = 0; channel < 3; channel += 1) {
        const shared = Math.round((data[left + channel] + data[right + channel]) / 2);
        data[left + channel] = shared;
        data[right + channel] = shared;
      }
    }
  }
  return data;
}

function clearMovingContinuationMargins(data, info) {
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (x >= CONTINUATION_MARGIN && x < info.width - CONTINUATION_MARGIN) continue;
      const offset = (y * info.width + x) * info.channels;
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    }
  }
  return data;
}

function despillMagentaBoundary(data, info, radius = 2) {
  const output = Buffer.from(data);
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (data[offset + 3] === 0) continue;
      let nearTransparency = false;
      for (let dy = -radius; dy <= radius && !nearTransparency; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextX >= info.width || nextY < 0 || nextY >= info.height) {
            nearTransparency = true;
            break;
          }
          if (data[(nextY * info.width + nextX) * info.channels + 3] === 0) {
            nearTransparency = true;
            break;
          }
        }
      }
      if (!nearTransparency) continue;
      const magentaSpill = Math.max(
        0,
        Math.min(data[offset], data[offset + 2]) - data[offset + 1],
      );
      output[offset] = Math.max(0, data[offset] - magentaSpill);
      output[offset + 2] = Math.max(0, data[offset + 2] - magentaSpill);
    }
  }
  return output;
}

async function buildFar(stage) {
  const resized = await sharp(sourcePath(stage, "far"))
    .removeAlpha()
    .resize(WIDTH, HEIGHT, { fit: "fill", kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const seamless = normalizeFarHorizontalSeam(resized.data, resized.info);
  const quantized = quantizeRgbValues(seamless, resized.info);
  await sharp(quantized, { raw: resized.info })
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

  const normalized = layer === "middle"
    ? normalizeGroundedComponents(resized.data, resized.info, {
    baseline: RUNTIME_BASELINE,
    })
    : resized;
  clearMovingContinuationMargins(normalized.data, normalized.info);
  return {
    data: despillMagentaBoundary(normalized.data, normalized.info),
    info: normalized.info,
  };
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
