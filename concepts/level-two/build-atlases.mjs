import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, "source");
const publicDir = path.resolve(root, "../../public/assets/generated");
const CELL = 192;
const SOURCE_GRID = 4;
const columns = 4;

const roster = [
  { kind: "squirrel", row: 0, grounded: true, maxWidth: 164, maxHeight: 154 },
  { kind: "terrier", row: 5, grounded: true, maxWidth: 168, maxHeight: 146 },
  { kind: "skunk", row: 10, grounded: true, maxWidth: 170, maxHeight: 146 },
  { kind: "moth", row: 15, grounded: false, maxWidth: 172, maxHeight: 164 },
];

const outputRows = [
  { sourceRow: 0, sourceColumns: [0, 1, 2, 3] },
  { sourceRow: 1, sourceColumns: [0, 1, 2, 3] },
  { sourceRow: 2, sourceColumns: [0, 1, 2, 3] },
  { sourceRow: 3, sourceColumns: [0, 0, 0, 0] },
  { sourceRow: 3, sourceColumns: [2, 3, 2, 3] },
];

const keyOut = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const chromaDistance = Math.hypot(255 - red, green, 255 - blue);
    if (chromaDistance < 118 || (red > 185 && blue > 145 && green < 110)) {
      data[offset + 3] = 0;
      continue;
    }
    data[offset + 3] = 255;
    if (red > blue * 1.35 && blue > green * 1.45) {
      data[offset] = Math.min(red, Math.max(green, blue));
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const alphaBounds = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error("Generated source cell is empty after chroma removal");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
};

const sourceCells = async (kind) => {
  const file = path.join(sourceDir, `${kind}-motion-source.png`);
  const metadata = await sharp(file).metadata();
  const sourceCellWidth = Math.floor(metadata.width / SOURCE_GRID);
  const sourceCellHeight = Math.floor(metadata.height / SOURCE_GRID);
  const cells = [];
  for (let row = 0; row < SOURCE_GRID; row += 1) {
    cells[row] = [];
    for (let column = 0; column < SOURCE_GRID; column += 1) {
      const extracted = await sharp(file)
        .extract({
          left: column * sourceCellWidth,
          top: row * sourceCellHeight,
          width: sourceCellWidth,
          height: sourceCellHeight,
        })
        .png()
        .toBuffer();
      const transparent = await keyOut(extracted);
      const bounds = await alphaBounds(transparent);
      cells[row][column] = {
        cropped: await sharp(transparent).extract(bounds).png().toBuffer(),
        width: bounds.width,
        height: bounds.height,
      };
    }
  }
  return cells;
};

const normalizedFrames = async (enemy) => {
  const cells = await sourceCells(enemy.kind);
  const allCells = cells.flat();
  const scale = Math.min(
    1,
    enemy.maxWidth / Math.max(...allCells.map(({ width }) => width)),
    enemy.maxHeight / Math.max(...allCells.map(({ height }) => height)),
  );
  const frames = [];
  for (const [rowOffset, row] of outputRows.entries()) {
    for (const [column, sourceColumn] of row.sourceColumns.entries()) {
      const source = cells[row.sourceRow][sourceColumn];
      const resizedWidth = Math.max(1, Math.round(source.width * scale));
      const resizedHeight = Math.max(1, Math.round(source.height * scale));
      const resized = await sharp(source.cropped)
        .resize(resizedWidth, resizedHeight, { kernel: "nearest" })
        .png({ palette: true, colours: 28, dither: 0 })
        .toBuffer();
      const resizedBounds = await alphaBounds(resized);
      const width = resizedBounds.width;
      const height = resizedBounds.height;
      const tightlyCropped = await sharp(resized).extract(resizedBounds).png().toBuffer();
      const left = Math.round((CELL - width) / 2);
      const top = enemy.grounded ? CELL - 16 - height : Math.round((CELL - height) / 2);
      frames.push({
        input: tightlyCropped,
        left: column * CELL + left,
        top: (enemy.row + rowOffset) * CELL + top,
      });
    }
  }
  return frames;
};

const composites = [];
for (const enemy of roster) composites.push(...await normalizedFrames(enemy));

await mkdir(publicDir, { recursive: true });
const atlasPath = path.join(publicDir, "level2-enemy-motion.png");
await sharp({
  create: {
    width: columns * CELL,
    height: 20 * CELL,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png({ palette: true, colours: 32, dither: 0 })
  .toFile(atlasPath);

await sharp(atlasPath)
  .resize({ width: columns * 96, height: 20 * 96, kernel: "nearest" })
  .png()
  .toFile(path.join(root, "level2-enemy-motion-contact-sheet.png"));

console.log(`Built ${path.relative(process.cwd(), atlasPath)} with 20 normalized 192px rows.`);
