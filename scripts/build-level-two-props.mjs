import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "concepts/level-two/source/level2-props-reference.png");
const hydrantSourcePath = path.join(root, "concepts/level-two/source/level2-hydrant-idle-source.png");
const residentialCanSourcePath = path.join(root, "concepts/level-two/source/level2-residential-trash-can-source.png");
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
  { name: "residential-trash-can", col: 0, row: 1, source: "residential-can", fit: [84, 104], mode: "residential-can" },
  { name: "loose-acorn-pile", col: 1, row: 1, source: "loose-acorn-pile" },
  { name: "rolling-can", col: 3, row: 1, crop: [902, 798, 130, 163], fit: [84, 104] },
  { name: "hydrant-idle", col: 0, row: 2, source: "hydrant", fit: [72, 92], mode: "hydrant-body" },
];

function despill(raw, slot) {
  for (let index = 0; index < raw.length; index += 4) {
    const red = raw[index];
    const green = raw[index + 1];
    const blue = raw[index + 2];
    const alpha = raw[index + 3];
    raw[index + 3] = alpha === 0 ? 0 : 255;
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
    const lampPurpleFringe = slot.mode === "lamp-post"
      && red > 54 && blue > 48 && red > green * 1.28 && blue > green * 1.15;
    const lampCyanFringe = slot.mode === "lamp-post"
      && green > 105 && blue > 118 && red < Math.min(green, blue) * 0.52;
    if (magenta || lampPurpleFringe || lampCyanFringe) {
      raw[index + 3] = 0;
      continue;
    }
    if (slot.mode === "hydrant-body") {
      const water = blue > 110 && green > 95 && blue > red * 1.08 && green > red * 1.02;
      const grass = green > red * 1.08 && green > blue * 0.92;
      raw[index + 3] = water || grass ? 0 : 255;
      continue;
    }
    if (slot.mode === "residential-can") {
      const greenKey = green > 150 && green > red * 1.32 && green > blue * 1.25;
      raw[index + 3] = greenKey ? 0 : 255;
      if (!greenKey && green > red * 1.1 && green > blue * 1.05) {
        raw[index + 1] = Math.max(red, blue);
      }
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
  const inputPath = slot.source === "residential-can" ? residentialCanSourcePath : hydrantSourcePath;
  const metadata = await sharp(inputPath).metadata();
  const extraction = { left: 0, top: 0, width: metadata.width, height: metadata.height };
  const result = await sharp(inputPath).extract(extraction).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const keyed = hardKeyGenerated(result.data, slot);
  if (slot.mode === "hydrant-body" || slot.mode === "residential-can") keepLargestComponent(keyed, result.info);
  return { data: keyed, info: result.info };
}

async function looseAcornPileSprite() {
  const positions = [
    { crop: slots[0].crop, width: 27, height: 38, left: 7 },
    { crop: slots[1].crop, width: 27, height: 38, left: 38 },
    { crop: slots[3].crop, width: 27, height: 38, left: 69 },
  ];
  const sprites = [];
  for (const position of positions) {
    const input = await sharp(sourcePath)
      .extract({ left: position.crop[0], top: position.crop[1], width: position.crop[2], height: position.crop[3] })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const cleaned = despill(input.data, { name: "acorn-pile-part" });
    const sprite = await sharp(cleaned, { raw: input.info })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({ width: position.width, height: position.height, fit: "inside", kernel: "nearest" })
      .png()
      .toBuffer();
    const metadata = await sharp(sprite).metadata();
    sprites.push({ input: sprite, left: position.left, top: 46 - metadata.height });
  }
  return sharp({ create: { width: 104, height: 46, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(sprites)
    .png()
    .toBuffer();
}

async function normalizedSprite(slot) {
  if (slot.source === "loose-acorn-pile") {
    const sprite = await looseAcornPileSprite();
    const metadata = await sharp(sprite).metadata();
    return {
      input: sprite,
      left: slot.col * cell + Math.round((cell - metadata.width) / 2),
      top: slot.row * cell + baseline - metadata.height + 1,
    };
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

const quantizedAtlas = await sharp({ create: { width: cell * 4, height: cell * 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(sprites)
  .png({ palette: true, colours: 28, dither: 0 })
  .toBuffer();

await sharp(quantizedAtlas).png().toFile(outputPath);

const checkerSvg = `<svg width="512" height="384" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#172033"/><rect width="16" height="16" fill="#26344d"/><rect x="16" y="16" width="16" height="16" fill="#26344d"/></pattern></defs><rect width="512" height="384" fill="url(#c)"/><g stroke="#8aa0c0" stroke-opacity=".45">${[128,256,384].map((n) => `<path d="M${n} 0V384"/>`).join("")}${[128,256].map((n) => `<path d="M0 ${n}H512"/>`).join("")}</g></svg>`;
await sharp(Buffer.from(checkerSvg))
  .composite([{ input: outputPath }])
  .png()
  .toFile(contactPath);

const lampInput = await sharp(lampPostSourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const lampKeyed = hardKeyGenerated(lampInput.data, { mode: "lamp-post" });
keepLargestComponent(lampKeyed, lampInput.info);
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
