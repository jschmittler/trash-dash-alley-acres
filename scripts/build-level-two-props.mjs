import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "concepts/level-two/source/level2-props-reference.png");
const hydrantSourcePath = path.join(root, "concepts/level-two/source/level2-hydrant-water-source.png");
const lampPostSourcePath = path.join(root, "concepts/level-two/source/level2-lamp-post-source.png");
const outputPath = path.join(root, "public/assets/generated/level2-props.png");
const contactPath = path.join(root, "concepts/level-two/level2-props-contact-sheet.png");
const lampOutputPath = path.join(root, "public/assets/generated/level2-lamp-post.png");
const lampContactPath = path.join(root, "concepts/level-two/level2-lamp-post-contact-sheet.png");
const cell = 128;
const baseline = 112;

const slots = [
  { name: "acorn-0", col: 0, row: 0, crop: [22, 73, 64, 90], fit: [58, 58] },
  { name: "acorn-1", col: 1, row: 0, crop: [98, 75, 64, 88], fit: [58, 58] },
  { name: "acorn-2", col: 2, row: 0, crop: [165, 76, 68, 87], fit: [58, 58] },
  { name: "acorn-3", col: 3, row: 0, crop: [240, 75, 69, 89], fit: [58, 58] },
  { name: "charge-obstacle", col: 0, row: 1, crop: [740, 248, 112, 158], fit: [72, 96] },
  { name: "boss-platform-left", col: 1, row: 1, crop: [341, 246, 187, 161], fit: [108, 88] },
  { name: "boss-platform-right", col: 2, row: 1, crop: [540, 246, 174, 161], fit: [96, 88] },
  { name: "rolling-can", col: 3, row: 1, crop: [902, 798, 130, 163], fit: [84, 104] },
  { name: "sprinkler-idle", col: 0, row: 2, crop: [38, 502, 120, 102], fit: [82, 88] },
  { name: "sprinkler-start", col: 1, row: 2, waterFrame: 0 },
  { name: "sprinkler-spray-0", col: 2, row: 2, waterFrame: 1 },
  { name: "sprinkler-spray-1", col: 3, row: 2, waterFrame: 2 },
  { name: "sprinkler-spray-2", col: 0, row: 3, waterFrame: 3 },
  { name: "sprinkler-spray-3", col: 1, row: 3, waterFrame: 4 },
  { name: "sprinkler-spray-4", col: 2, row: 3, waterFrame: 5 },
  { name: "sprinkler-spray-5", col: 3, row: 3, waterFrame: 6 },
  { name: "sprinkler-stop", col: 0, row: 4, waterFrame: 7 },
  { name: "hydrant-idle", col: 1, row: 4, source: "hydrant", grid: [0, 0], fit: [72, 92], mode: "hydrant-body" },
  { name: "hydrant-build", col: 2, row: 4, source: "hydrant", grid: [1, 0], fit: [72, 92], mode: "hydrant-body" },
  { name: "hydrant-spray", col: 3, row: 4, source: "hydrant", grid: [2, 0], fit: [72, 92], mode: "hydrant-body" },
  { name: "hydrant-recover", col: 0, row: 5, source: "hydrant", grid: [3, 0], fit: [72, 92], mode: "hydrant-body" },
  { name: "hydrant-water-burst", col: 1, row: 5, source: "hydrant", grid: [0, 1], fit: [120, 76], mode: "water", align: "left", top: 26 },
  { name: "hydrant-water-full-0", col: 2, row: 5, source: "hydrant", grid: [1, 1], fit: [120, 76], fitMode: "fill", mode: "water", align: "left", top: 26 },
  { name: "hydrant-water-full-1", col: 3, row: 5, source: "hydrant", grid: [2, 1], fit: [120, 76], fitMode: "fill", mode: "water", align: "left", top: 26 },
  { name: "hydrant-water-taper", col: 0, row: 6, source: "hydrant", grid: [3, 1], fit: [120, 76], mode: "water", align: "left", top: 26 },
];

const waterPalette = [
  [20, 82, 126, 255],
  [37, 135, 177, 255],
  [74, 192, 218, 255],
  [168, 239, 243, 255],
];

function sprinklerWaterSprite(frame) {
  const width = cell;
  const height = cell;
  const raw = Buffer.alloc(width * height * 4);
  const lengths = [38, 66, 84, 104, 116, 108, 92, 48];
  const arches = [7, 12, 18, 23, 28, 21, 16, 9];
  const length = lengths[frame];
  const arch = arches[frame];
  const put = (x, y, colorIndex, radius = 1) => {
    const color = waterPalette[colorIndex % waterPalette.length];
    for (let yy = y - radius; yy <= y + radius; yy += 1) for (let xx = x - radius; xx <= x + radius; xx += 1) {
      if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
      const offset = (yy * width + xx) * 4;
      raw[offset] = color[0]; raw[offset + 1] = color[1]; raw[offset + 2] = color[2]; raw[offset + 3] = color[3];
    }
  };
  for (let stream = -2; stream <= 2; stream += 1) {
    const phaseOffset = (frame * 3 + stream * 5 + 40) % 11;
    for (let step = 0; step <= length; step += 2) {
      const t = step / length;
      if (t > 0.76 && (step + phaseOffset) % 9 < 3) continue;
      const breakup = t > 0.86 ? Math.round(Math.sin((step + frame) * 1.7) * 2) : 0;
      const x = 4 + step;
      const y = Math.round(64 + stream * 3 - Math.sin(Math.PI * t) * (arch + stream * 1.5) + breakup);
      put(x, y, stream + 3, t < 0.28 ? 1 : 0);
    }
  }
  const dropletCount = frame === 0 || frame === 7 ? 3 : 7;
  for (let index = 0; index < dropletCount; index += 1) {
    const x = Math.min(123, 8 + length * (0.66 + index * 0.055));
    const y = 48 + ((frame * 13 + index * 17) % 38);
    put(Math.round(x), y, index + frame, index % 3 === 0 ? 1 : 0);
  }
  return sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

function despill(raw, slot) {
  for (let index = 0; index < raw.length; index += 4) {
    const red = raw[index];
    const green = raw[index + 1];
    const blue = raw[index + 2];
    const alpha = raw[index + 3];
    raw[index + 3] = alpha === 0 ? 0 : 255;
    if (slot.name.startsWith("sprinkler-spray")) {
      const water = alpha > 0 && blue > 85 && green > 65 && blue > red * 1.12 && green > red * 1.03;
      raw[index + 3] = water ? 255 : 0;
      if (water) {
        const value = (red + green + blue) / 3;
        const color = value > 200
          ? [168, 239, 243]
          : value > 150
            ? [74, 192, 218]
            : value > 100
              ? [37, 135, 177]
              : [20, 82, 126];
        raw[index] = color[0];
        raw[index + 1] = color[1];
        raw[index + 2] = color[2];
      }
      continue;
    }
    if (alpha > 0 && red < 6 && green < 6 && blue < 6) {
      raw[index + 3] = 0;
      continue;
    }
    const grassOrGreenGuide = alpha > 0 && green > red * 1.18 && green > blue * 1.04 && blue < 168;
    const redGuide = slot.name.startsWith("acorn") && alpha > 0 && red > 176 && green < 66 && blue < 70;
    if (grassOrGreenGuide || redGuide) {
      raw[index + 3] = 0;
    }
  }
  return raw;
}

function hardKeyGenerated(raw, slot) {
  for (let index = 0; index < raw.length; index += 4) {
    const red = raw[index];
    const green = raw[index + 1];
    const blue = raw[index + 2];
    const magenta = red > 170 && blue > 145 && green < Math.min(red, blue) * 0.62;
    if (magenta) {
      raw[index + 3] = 0;
      continue;
    }
    if (slot.mode === "water") {
      const water = blue > 105 && green > 92 && blue > red * 1.08 && green > red * 1.02;
      raw[index + 3] = water ? 255 : 0;
      continue;
    }
    if (slot.mode === "hydrant-body") {
      const water = blue > 110 && green > 95 && blue > red * 1.08 && green > red * 1.02;
      const grass = green > red * 1.08 && green > blue * 0.92;
      raw[index + 3] = water || grass ? 0 : 255;
      continue;
    }
    raw[index + 3] = raw[index + 3] === 0 ? 0 : 255;
  }
  return raw;
}

function keepLargestComponent(raw, info) {
  const seen = new Uint8Array(info.width * info.height);
  const components = [];
  for (let start = 0; start < seen.length; start += 1) {
    if (seen[start] || raw[start * 4 + 3] === 0) continue;
    const stack = [start];
    const pixels = [];
    seen[start] = 1;
    while (stack.length > 0) {
      const point = stack.pop();
      pixels.push(point);
      const x = point % info.width;
      const y = Math.floor(point / info.width);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= info.width || ny < 0 || ny >= info.height) continue;
          const next = ny * info.width + nx;
          if (!seen[next] && raw[next * 4 + 3] > 0) {
            seen[next] = 1;
            stack.push(next);
          }
        }
      }
    }
    components.push(pixels);
  }
  components.sort((left, right) => right.length - left.length);
  const keep = new Set(components[0] ?? []);
  for (let pixel = 0; pixel < seen.length; pixel += 1) {
    if (!keep.has(pixel)) raw[pixel * 4 + 3] = 0;
  }
  return raw;
}

async function generatedInput(slot) {
  const inputPath = hydrantSourcePath;
  const metadata = await sharp(inputPath).metadata();
  const extraction = slot.grid
    ? {
        left: slot.grid[0] * Math.floor(metadata.width / 4),
        top: slot.grid[1] * Math.floor(metadata.height / 2),
        width: Math.floor(metadata.width / 4),
        height: Math.floor(metadata.height / 2),
      }
    : { left: 0, top: 0, width: metadata.width, height: metadata.height };
  const result = await sharp(inputPath).extract(extraction).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const keyed = hardKeyGenerated(result.data, slot);
  if (slot.mode === "hydrant-body") keepLargestComponent(keyed, result.info);
  return { data: keyed, info: result.info };
}

async function normalizedSprite(slot) {
  if (Number.isInteger(slot.waterFrame)) {
    return { input: await sprinklerWaterSprite(slot.waterFrame), left: slot.col * cell, top: slot.row * cell };
  }
  const [maxWidth, maxHeight] = slot.fit;
  const input = slot.source
    ? await generatedInput(slot)
    : await sharp(sourcePath)
      .extract({ left: slot.crop[0], top: slot.crop[1], width: slot.crop[2], height: slot.crop[3] })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  const cleaned = slot.source ? input.data : despill(input.data, slot);
  const resized = await sharp(cleaned, { raw: input.info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: maxWidth, height: maxHeight, fit: slot.fitMode ?? "inside", kernel: "nearest" })
    .png()
    .toBuffer();
  const metadata = await sharp(resized).metadata();
  const x = slot.align === "left" ? 4 : Math.round((cell - metadata.width) / 2);
  const y = slot.top ?? ((slot.anchorBottom ?? baseline) - metadata.height + 1);
  return { input: resized, left: slot.col * cell + x, top: slot.row * cell + y };
}

await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(path.dirname(contactPath), { recursive: true });
const sprites = [];
for (const slot of slots) sprites.push(await normalizedSprite(slot));

const quantizedAtlas = await sharp({ create: { width: cell * 4, height: cell * 7, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(sprites)
  .png({ palette: true, colours: 28, dither: 0 })
  .toBuffer();

// Palette quantization can make a few foam highlights neutral enough to look
// like a second sprinkler body. Reassert one shared four-value water palette
// after quantization while preserving the authored hard-alpha silhouettes.
const atlasRaw = await sharp(quantizedAtlas).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const waterSlots = slots.filter(({ name }) => name.startsWith("sprinkler-") && name !== "sprinkler-idle" || name.startsWith("hydrant-water"));
for (const slot of waterSlots) {
  for (let y = slot.row * cell; y < (slot.row + 1) * cell; y += 1) {
    for (let x = slot.col * cell; x < (slot.col + 1) * cell; x += 1) {
      const offset = (y * atlasRaw.info.width + x) * 4;
      if (atlasRaw.data[offset + 3] === 0) continue;
      const value = (atlasRaw.data[offset] + atlasRaw.data[offset + 1] + atlasRaw.data[offset + 2]) / 3;
      const color = value > 190
        ? [168, 239, 243]
        : value > 140
          ? [74, 192, 218]
          : value > 95
            ? [37, 135, 177]
            : [20, 82, 126];
      atlasRaw.data[offset] = color[0];
      atlasRaw.data[offset + 1] = color[1];
      atlasRaw.data[offset + 2] = color[2];
    }
  }
}
await sharp(atlasRaw.data, { raw: atlasRaw.info }).png().toFile(outputPath);

const checkerSvg = `<svg width="512" height="896" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#172033"/><rect width="16" height="16" fill="#26344d"/><rect x="16" y="16" width="16" height="16" fill="#26344d"/></pattern></defs><rect width="512" height="896" fill="url(#c)"/><g stroke="#8aa0c0" stroke-opacity=".45">${[128,256,384].map((n) => `<path d="M${n} 0V896"/>`).join("")}${[128,256,384,512,640,768].map((n) => `<path d="M0 ${n}H512"/>`).join("")}</g></svg>`;
await sharp(Buffer.from(checkerSvg))
  .composite([{ input: outputPath }])
  .png()
  .toFile(contactPath);

const lampInput = await sharp(lampPostSourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const lampKeyed = hardKeyGenerated(lampInput.data, { mode: "lamp-post" });
const lampSprite = await sharp(lampKeyed, { raw: lampInput.info })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize({ width: 184, height: 248, fit: "inside", kernel: "nearest" })
  .png()
  .toBuffer();
const lampMeta = await sharp(lampSprite).metadata();
const lampAtlas = await sharp({ create: { width: 192, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: lampSprite, left: Math.round((192 - lampMeta.width) / 2), top: 255 - lampMeta.height }])
  .png({ palette: true, colours: 28, dither: 0 })
  .toBuffer();
await sharp(lampAtlas).png().toFile(lampOutputPath);
const lampChecker = `<svg width="192" height="256" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="c" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#172033"/><rect width="12" height="12" fill="#26344d"/><rect x="12" y="12" width="12" height="12" fill="#26344d"/></pattern></defs><rect width="192" height="256" fill="url(#c)"/></svg>`;
await sharp(Buffer.from(lampChecker)).composite([{ input: lampOutputPath }]).png().toFile(lampContactPath);

console.log(`built ${path.relative(root, outputPath)}, ${path.relative(root, contactPath)}, ${path.relative(root, lampOutputPath)}, and ${path.relative(root, lampContactPath)}`);
