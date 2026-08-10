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
  { sourceRow: 3, sourceColumns: [0, 1, 0, 1] },
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
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const despillPurple = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] === 0) continue;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    if ((red + blue) / 2 > green * 1.45 && blue > 65) {
      data[offset] = 39;
      data[offset + 1] = 38;
      data[offset + 2] = 54;
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const connectedComponents = (data, info) => {
  const seen = new Uint8Array(info.width * info.height);
  const components = [];
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const start = y * info.width + x;
      if (seen[start] || data[start * 4 + 3] === 0) continue;
      const stack = [start];
      const pixels = [];
      seen[start] = 1;
      let red = 0;
      let green = 0;
      let blue = 0;
      let left = info.width;
      let top = info.height;
      let right = -1;
      let bottom = -1;
      while (stack.length > 0) {
        const point = stack.pop();
        const pointX = point % info.width;
        const pointY = (point - pointX) / info.width;
        const offset = point * 4;
        pixels.push(point);
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
        left = Math.min(left, pointX);
        top = Math.min(top, pointY);
        right = Math.max(right, pointX);
        bottom = Math.max(bottom, pointY);
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nextX = pointX + dx;
            const nextY = pointY + dy;
            if (nextX < 0 || nextX >= info.width || nextY < 0 || nextY >= info.height) continue;
            const next = nextY * info.width + nextX;
            if (!seen[next] && data[next * 4 + 3] > 0) {
              seen[next] = 1;
              stack.push(next);
            }
          }
        }
      }
      components.push({
        area: pixels.length,
        pixels,
        red: red / pixels.length,
        green: green / pixels.length,
        blue: blue / pixels.length,
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1,
      });
    }
  }
  return components.sort((left, right) => right.area - left.area);
};

const cleanDetachedKeyFragments = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const components = connectedComponents(data, info);
  if (components.length === 0) throw new Error("Generated source cell is empty after chroma removal");
  const primaryArea = components[0].area;
  for (const component of components.slice(1)) {
    const purpleBiased = (component.red + component.blue) / 2 > component.green * 1.35;
    if (component.area >= primaryArea * 0.02 || !purpleBiased) continue;
    for (const pixel of component.pixels) data[pixel * 4 + 3] = 0;
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const primaryAlphaBounds = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const primary = connectedComponents(data, info)[0];
  if (!primary) throw new Error("Generated source cell has no primary silhouette");
  return {
    left: primary.left,
    top: primary.top,
    width: primary.width,
    height: primary.height,
  };
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
      const transparent = await cleanDetachedKeyFragments(await keyOut(extracted));
      const bounds = await alphaBounds(transparent);
      const primary = await primaryAlphaBounds(transparent);
      cells[row][column] = {
        cropped: await sharp(transparent).extract(bounds).png().toBuffer(),
        width: bounds.width,
        height: bounds.height,
        primaryWidth: primary.width,
        primaryHeight: primary.height,
        primaryLeft: primary.left - bounds.left,
        primaryTop: primary.top - bounds.top,
      };
    }
  }
  if (kind === "squirrel") {
    const throwFile = path.join(sourceDir, "squirrel-throw-source.png");
    const throwMetadata = await sharp(throwFile).metadata();
    const throwWidth = Math.floor(throwMetadata.width / SOURCE_GRID);
    for (let column = 0; column < SOURCE_GRID; column += 1) {
      const extracted = await sharp(throwFile)
        .extract({ left: column * throwWidth, top: 0, width: throwWidth, height: throwMetadata.height })
        .png()
        .toBuffer();
      const transparent = await cleanDetachedKeyFragments(await keyOut(extracted));
      const bounds = await alphaBounds(transparent);
      const primary = await primaryAlphaBounds(transparent);
      cells[2][column] = {
        cropped: await sharp(transparent).extract(bounds).png().toBuffer(),
        width: bounds.width,
        height: bounds.height,
        primaryWidth: primary.width,
        primaryHeight: primary.height,
        primaryLeft: primary.left - bounds.left,
        primaryTop: primary.top - bounds.top,
      };
    }
  }
  return cells;
};

const normalizedFrames = async (enemy) => {
  const cells = await sourceCells(enemy.kind);
  const allCells = cells.flat();
  const placementScales = allCells.flatMap((cell) => {
    const primaryCenterX = cell.primaryLeft + cell.primaryWidth / 2;
    const horizontal = [
      (CELL / 2 - 4) / primaryCenterX,
      (CELL / 2 - 4) / (cell.width - primaryCenterX),
    ];
    if (enemy.grounded) {
      const primaryBottom = cell.primaryTop + cell.primaryHeight;
      const belowPrimary = cell.height - primaryBottom;
      return [
        ...horizontal,
        (CELL - 20) / primaryBottom,
        belowPrimary > 0 ? 12 / belowPrimary : 1,
      ];
    }
    const primaryCenterY = cell.primaryTop + cell.primaryHeight / 2;
    return [
      ...horizontal,
      (CELL / 2 - 4) / primaryCenterY,
      (CELL / 2 - 4) / (cell.height - primaryCenterY),
    ];
  });
  const scale = Math.min(
    1,
    enemy.maxWidth / Math.max(...allCells.map(({ primaryWidth }) => primaryWidth)),
    enemy.maxHeight / Math.max(...allCells.map(({ primaryHeight }) => primaryHeight)),
    ...placementScales,
  );
  const frames = [];
  for (const [rowOffset, row] of outputRows.entries()) {
    for (const [column, sourceColumn] of row.sourceColumns.entries()) {
      const source = cells[row.sourceRow][sourceColumn];
      const resizedWidth = Math.max(1, Math.round(source.width * scale));
      const resizedHeight = Math.max(1, Math.round(source.height * scale));
      const resized = await despillPurple(await cleanDetachedKeyFragments(await sharp(source.cropped)
        .resize(resizedWidth, resizedHeight, { kernel: "nearest" })
        .png({ palette: true, colours: 28, dither: 0 })
        .toBuffer()));
      const resizedBounds = await alphaBounds(resized);
      const width = resizedBounds.width;
      const height = resizedBounds.height;
      const tightlyCropped = await sharp(resized).extract(resizedBounds).png().toBuffer();
      const primary = await primaryAlphaBounds(tightlyCropped);
      const left = Math.round(CELL / 2 - (primary.left + primary.width / 2));
      const top = enemy.grounded
        ? CELL - 16 - (primary.top + primary.height)
        : Math.round(CELL / 2 - (primary.top + primary.height / 2));
      if (left < 0 || top < 0 || left + width > CELL || top + height > CELL) {
        throw new Error(`${enemy.kind} source ${row.sourceRow}:${sourceColumn} clips after primary alignment`);
      }
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
