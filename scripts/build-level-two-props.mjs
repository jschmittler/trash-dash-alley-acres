import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "concepts/level-two/source/level2-props-reference.png");
const outputPath = path.join(root, "public/assets/generated/level2-props.png");
const contactPath = path.join(root, "concepts/level-two/level2-props-contact-sheet.png");
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
  { name: "sprinkler-spray-0", col: 1, row: 2, crop: [253, 448, 92, 90], fit: [86, 76], align: "left" },
  { name: "sprinkler-spray-1", col: 2, row: 2, crop: [413, 432, 102, 105], fit: [92, 82], align: "left" },
  { name: "sprinkler-spray-2", col: 3, row: 2, crop: [585, 420, 100, 116], fit: [98, 88], align: "left" },
  { name: "sprinkler-spray-3", col: 0, row: 3, crop: [755, 405, 245, 135], fit: [120, 96], align: "left" },
  { name: "hydrant", col: 1, row: 3, crop: [14, 774, 139, 226], fit: [72, 108] },
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

async function normalizedSprite(slot) {
  const [left, top, width, height] = slot.crop;
  const [maxWidth, maxHeight] = slot.fit;
  const { data, info } = await sharp(sourcePath)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cleaned = despill(data, slot);
  const resized = await sharp(cleaned, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: maxWidth, height: maxHeight, fit: "inside", kernel: "nearest" })
    .png()
    .toBuffer();
  const metadata = await sharp(resized).metadata();
  const x = slot.align === "left" ? 4 : Math.round((cell - metadata.width) / 2);
  const y = baseline - metadata.height + 1;
  return { input: resized, left: slot.col * cell + x, top: slot.row * cell + y };
}

await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(path.dirname(contactPath), { recursive: true });
const sprites = [];
for (const slot of slots) sprites.push(await normalizedSprite(slot));

await sharp({ create: { width: cell * 4, height: cell * 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(sprites)
  .png({ palette: true, colours: 32, dither: 0 })
  .toFile(outputPath);

const checkerSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#172033"/><rect width="16" height="16" fill="#26344d"/><rect x="16" y="16" width="16" height="16" fill="#26344d"/></pattern></defs><rect width="512" height="512" fill="url(#c)"/><g stroke="#8aa0c0" stroke-opacity=".45">${[128,256,384].map((n) => `<path d="M${n} 0V512M0 ${n}H512"/>`).join("")}</g></svg>`;
await sharp(Buffer.from(checkerSvg))
  .composite([{ input: outputPath }])
  .png()
  .toFile(contactPath);

console.log(`built ${path.relative(root, outputPath)} and ${path.relative(root, contactPath)}`);
