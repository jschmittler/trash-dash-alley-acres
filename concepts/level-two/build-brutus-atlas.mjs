import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, "source");
const publicDir = path.resolve(root, "../../public/assets/generated");
const CELL_WIDTH = 256;
const CELL_HEIGHT = 192;
const COLUMNS = 4;
const ROWS = 11;
const FOOT_BASELINE = 176;

const sources = {
  active: { file: "brutus-active-motion-source.png", columns: 4, rows: 4, reference: [[0, 0], [0, 1]] },
  defeat: { file: "brutus-defeat-motion-source.png", columns: 4, rows: 2, reference: [[0, 0], [0, 1]] },
};

const outputRows = [
  ["active", [[0, 0], [0, 1], [0, 0], [0, 1]]],
  ["active", [[0, 2], [0, 3], [0, 2], [0, 3]]],
  ["active", [[1, 0], [1, 1], [1, 0], [1, 1]]],
  ["active", [[1, 2], [1, 3], [2, 0], [2, 1]]],
  ["active", [[2, 2], [2, 2], [2, 2], [2, 2]]],
  ["active", [[2, 3], [3, 0], [2, 3], [3, 0]]],
  ["active", [[3, 1], [3, 2], [3, 3], [3, 3]]],
  ["defeat", [[0, 0], [0, 1], [0, 0], [0, 1]]],
  ["defeat", [[0, 2], [0, 3], [0, 2], [0, 3]]],
  ["defeat", [[1, 0], [1, 1], [1, 0], [1, 1]]],
  ["defeat", [[1, 2], [1, 3], [1, 2], [1, 3]]],
];

const components = (data, info) => {
  const seen = new Uint8Array(info.width * info.height);
  const found = [];
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const start = y * info.width + x;
      if (seen[start] || data[start * 4 + 3] === 0) continue;
      const stack = [start];
      const pixels = [];
      seen[start] = 1;
      let left = info.width;
      let top = info.height;
      let right = -1;
      let bottom = -1;
      let red = 0;
      let green = 0;
      let blue = 0;
      while (stack.length) {
        const point = stack.pop();
        const px = point % info.width;
        const py = (point - px) / info.width;
        const offset = point * 4;
        pixels.push(point);
        left = Math.min(left, px);
        top = Math.min(top, py);
        right = Math.max(right, px);
        bottom = Math.max(bottom, py);
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = px + dx;
            const ny = py + dy;
            if (nx < 0 || nx >= info.width || ny < 0 || ny >= info.height) continue;
            const next = ny * info.width + nx;
            if (!seen[next] && data[next * 4 + 3] > 0) {
              seen[next] = 1;
              stack.push(next);
            }
          }
        }
      }
      found.push({
        pixels,
        area: pixels.length,
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1,
        red: red / pixels.length,
        green: green / pixels.length,
        blue: blue / pixels.length,
      });
    }
  }
  return found.sort((a, b) => b.area - a.area);
};

const keyAndClean = async (input, preserveWater = false) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < data.length; offset += 4) {
    const distance = Math.hypot(255 - data[offset], data[offset + 1], 255 - data[offset + 2]);
    data[offset + 3] = distance < 118 || (data[offset] > 150 && data[offset + 2] > 110 && data[offset + 1] < 150) ? 0 : 255;
  }
  const found = components(data, info);
  if (!found.length) throw new Error("Brutus source frame is empty after chroma removal");
  for (const component of found.slice(1)) {
    const water = component.blue > component.red * 1.3 && component.green > component.red * 1.2;
    if (component.area >= found[0].area * 0.012 || (preserveWater && water && component.area >= 6)) continue;
    for (const pixel of component.pixels) data[pixel * 4 + 3] = 0;
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const extractSheet = async (definition) => {
  const source = sharp(path.join(sourceDir, definition.file));
  const metadata = await source.metadata();
  const width = Math.floor(metadata.width / definition.columns);
  const height = Math.floor(metadata.height / definition.rows);
  const cells = [];
  for (let row = 0; row < definition.rows; row += 1) {
    cells[row] = [];
    for (let column = 0; column < definition.columns; column += 1) {
      const keyed = await keyAndClean(await sharp(path.join(sourceDir, definition.file)).extract({
        left: column * width,
        top: row * height,
        width,
        height,
      }).png().toBuffer(), definition.file.includes("defeat") && row === 1);
      const { data, info } = await sharp(keyed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const found = components(data, info);
      const primary = found[0];
      const left = Math.min(...found.map((item) => item.left));
      const top = Math.min(...found.map((item) => item.top));
      const right = Math.max(...found.map((item) => item.left + item.width - 1));
      const bottom = Math.max(...found.map((item) => item.top + item.height - 1));
      cells[row][column] = {
        image: await sharp(keyed).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).png().toBuffer(),
        width: right - left + 1,
        height: bottom - top + 1,
        primaryLeft: primary.left - left,
        primaryTop: primary.top - top,
        primaryWidth: primary.width,
        primaryHeight: primary.height,
      };
    }
  }
  const referenceWidth = definition.reference.reduce((sum, [row, column]) => sum + cells[row][column].primaryWidth, 0) / definition.reference.length;
  const all = cells.flat();
  const scale = Math.min(
    205 / referenceWidth,
    ...all.map((cell) => (CELL_WIDTH - 8) / cell.width),
    ...all.map((cell) => (FOOT_BASELINE - 4) / (cell.primaryTop + cell.primaryHeight)),
  );
  return { cells, scale };
};

const sheets = {};
for (const [name, definition] of Object.entries(sources)) sheets[name] = await extractSheet(definition);

const composites = [];
for (const [outputRow, [sheetName, frames]] of outputRows.entries()) {
  const { cells, scale } = sheets[sheetName];
  for (const [column, [sourceRow, sourceColumn]] of frames.entries()) {
    const cell = cells[sourceRow][sourceColumn];
    const width = Math.max(1, Math.round(cell.width * scale));
    const height = Math.max(1, Math.round(cell.height * scale));
    const primaryLeft = cell.primaryLeft * scale;
    const primaryTop = cell.primaryTop * scale;
    const primaryWidth = cell.primaryWidth * scale;
    const primaryHeight = cell.primaryHeight * scale;
    const left = Math.round(CELL_WIDTH / 2 - (primaryLeft + primaryWidth / 2));
    const top = Math.round(FOOT_BASELINE - (primaryTop + primaryHeight));
    if (left < 0 || top < 0 || left + width > CELL_WIDTH || top + height > CELL_HEIGHT) {
      throw new Error(`Brutus ${sheetName} ${sourceRow}:${sourceColumn} clips its runtime cell`);
    }
    const resized = await sharp(cell.image)
      .resize(width, height, { kernel: "nearest" })
      .png({ palette: true, colours: 28, dither: 0 })
      .toBuffer();
    composites.push({ input: resized, left: column * CELL_WIDTH + left, top: outputRow * CELL_HEIGHT + top });
  }
}

await mkdir(publicDir, { recursive: true });
const atlasPath = path.join(publicDir, "brutus-motion.png");
await sharp({
  create: {
    width: COLUMNS * CELL_WIDTH,
    height: ROWS * CELL_HEIGHT,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
}).composite(composites).png({ palette: true, colours: 32, dither: 0 }).toFile(atlasPath);

await sharp(atlasPath)
  .resize(COLUMNS * 128, ROWS * 96, { kernel: "nearest" })
  .png()
  .toFile(path.join(root, "brutus-motion-contact-sheet.png"));

console.log(`Built ${path.relative(process.cwd(), atlasPath)} with ${ROWS} normalized 256x192 rows.`);
