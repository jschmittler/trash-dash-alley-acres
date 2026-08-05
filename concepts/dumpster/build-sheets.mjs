import fs from "node:fs/promises";
import sharp from "sharp";

const root = new URL(".", import.meta.url).pathname;
const sourceDir = `${root}/source`;
const sheetsDir = `${root}/sheets`;

const FRAME_SIZE = 192;
const FRAME_COUNT = 4;
const KEY_GREEN = { r: 0, g: 255, b: 0 };

function isKeyPixel(r, g, b) {
  // The generated sheets use a flat #00ff00 key. A little tolerance clears
  // compression/edge spill while retaining the dumpster's olive greens.
  return g >= 180 && g > r * 1.35 && g > b * 1.35;
}

async function cleanAndResize(inputPath, left, width) {
  const { data, info } = await sharp(inputPath)
    .extract({ left, top: 0, width, height: 887 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += 4) {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    if (isKeyPixel(r, g, b)) {
      data[offset] = KEY_GREEN.r;
      data[offset + 1] = KEY_GREEN.g;
      data[offset + 2] = KEY_GREEN.b;
      data[offset + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(FRAME_SIZE, FRAME_SIZE, { fit: "fill", kernel: "nearest" })
    .png()
    .toBuffer();
}

async function buildRow(name) {
  const sourcePath = `${sourceDir}/${name}-key.png`;
  const metadata = await sharp(sourcePath).metadata();
  if (metadata.width !== 1774 || metadata.height !== 887) {
    throw new Error(`${name}: expected 1774x887 source, got ${metadata.width}x${metadata.height}`);
  }

  const frames = [];
  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const start = Math.round((index * metadata.width) / FRAME_COUNT);
    const end = Math.round(((index + 1) * metadata.width) / FRAME_COUNT);
    frames.push(await cleanAndResize(sourcePath, start, end - start));
  }

  const row = await sharp({
    create: {
      width: FRAME_SIZE * FRAME_COUNT,
      height: FRAME_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(frames.map((input, left) => ({ input, left: left * FRAME_SIZE, top: 0 })))
    .png()
    .toBuffer();

  await sharp(row).toFile(`${sheetsDir}/${name}.png`);
}

await fs.mkdir(sheetsDir, { recursive: true });
await buildRow("dumpster-idle");
await buildRow("dumpster-stink");
