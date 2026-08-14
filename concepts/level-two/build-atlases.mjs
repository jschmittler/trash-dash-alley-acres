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

const standardOutputRows = Object.freeze([
  Object.freeze([[0, 0], [0, 1], [0, 2], [0, 3]]),
  Object.freeze([[1, 0], [1, 1], [1, 2], [1, 3]]),
  Object.freeze([[2, 0], [2, 1], [2, 2], [2, 3]]),
  Object.freeze([[3, 0], [3, 1], [3, 0], [3, 1]]),
  Object.freeze([[3, 2], [3, 3], [3, 2], [3, 3]]),
]);

// The terrier owns an additional recovery row. All cells still come from the
// approved four-by-four source master; the final recovery cell repeats the
// first charge pose so returning control cannot introduce a registration pop.
const terrierOutputRows = Object.freeze([
  Object.freeze([[0, 0], [0, 1], [0, 2], [0, 3]]),
  Object.freeze([[1, 0], [1, 1], [1, 2], [1, 3]]),
  Object.freeze([[2, 0], [2, 1], [2, 2], [2, 3]]),
  Object.freeze([[3, 0], [3, 1], [3, 2], [3, 3]]),
  Object.freeze([[3, 1], [1, 3], [2, 0], [2, 1]]),
  Object.freeze([[3, 2], [3, 3], [3, 2], [3, 3]]),
]);

const roster = [
  { kind: "squirrel", row: 0, grounded: true, maxWidth: 164, maxHeight: 154, outputRows: standardOutputRows },
  { kind: "terrier", row: 5, grounded: true, maxWidth: 168, maxHeight: 146, outputRows: terrierOutputRows },
  { kind: "skunk", row: 11, grounded: true, maxWidth: 170, maxHeight: 146, outputRows: standardOutputRows },
  { kind: "moth", row: 16, grounded: false, maxWidth: 172, maxHeight: 164, outputRows: standardOutputRows },
];
const outputRowCount = Math.max(...roster.map(({ row, outputRows }) => row + outputRows.length));

const sheetPose = (left, top, width, height = 192) => Object.freeze({ left, top, width, height });

const UPDATED_SHEET_POSE_MAP = Object.freeze({
  squirrel: Object.freeze([
    [sheetPose(202, 348, 194, 155), sheetPose(429, 348, 210, 155), sheetPose(648, 348, 204, 155), sheetPose(860, 348, 234, 155)],
    [sheetPose(167, 491, 170, 190), sheetPose(337, 491, 185, 190), sheetPose(522, 491, 185, 190), sheetPose(672, 491, 183, 190)],
    [sheetPose(167, 491, 170, 190), sheetPose(337, 491, 185, 190), sheetPose(522, 491, 185, 190), sheetPose(672, 491, 183, 190)],
    [sheetPose(181, 673, 196, 215), sheetPose(382, 673, 193, 215), sheetPose(181, 673, 196, 215), sheetPose(382, 673, 193, 215)],
  ]),
  terrier: Object.freeze([
    [sheetPose(152, 188, 242, 187), sheetPose(393, 188, 234, 187), sheetPose(618, 188, 214, 187), sheetPose(821, 188, 230, 187)],
    [sheetPose(135, 510, 242, 211), sheetPose(377, 510, 242, 211), sheetPose(627, 510, 263, 211), sheetPose(898, 510, 296, 211)],
    [sheetPose(143, 360, 295, 165), sheetPose(448, 360, 334, 165), sheetPose(792, 360, 331, 165), sheetPose(1121, 360, 364, 165)],
    [sheetPose(168, 702, 180, 187), sheetPose(406, 702, 187, 187), sheetPose(168, 702, 180, 187), sheetPose(406, 702, 187, 187)],
  ]),
});

// This source-sheet element is an effects-layer tail used to illustrate the
// acorn's flight. It is not a squirrel pose and must never enter a runtime cell.
const SQUIRREL_EXCLUDED_SOURCE_REGIONS = Object.freeze([
  Object.freeze({ left: 1020, top: 520, width: 190, height: 150, label: "detached-flight-tail" }),
]);

const rectanglesOverlap = (left, right) => (
  left.left < right.left + right.width
  && left.left + left.width > right.left
  && left.top < right.top + right.height
  && left.top + left.height > right.top
);

const assertPoseAvoidsExcludedRegions = (kind, pose) => {
  if (kind !== "squirrel") return;
  const excluded = SQUIRREL_EXCLUDED_SOURCE_REGIONS.find((region) => rectanglesOverlap(pose, region));
  if (excluded) {
    throw new Error(`squirrel pose overlaps excluded source element "${excluded.label}"`);
  }
};

const keyOut = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] === 0) continue;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const magentaDistance = Math.hypot(255 - red, green, 255 - blue);
    const greenScreen = green > 100 && green > red * 1.5 && green > blue * 1.5;
    if (magentaDistance < 118 || greenScreen || (red > 185 && blue > 145 && green < 110)) {
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
    const keyedFragment = component.area < primaryArea * 0.02 && purpleBiased;
    if (component.area > 8 && !keyedFragment) continue;
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

const buildUpdatedSourceMaster = async (enemy) => {
  const layout = UPDATED_SHEET_POSE_MAP[enemy.kind];
  if (!layout) return;
  const sheetPath = path.join(sourceDir, `${enemy.kind}-updated-sheet.png`);
  const prepared = [];
  for (const row of layout) {
    for (const pose of row) {
      assertPoseAvoidsExcludedRegions(enemy.kind, pose);
      const { left, top, width, height } = pose;
      const extracted = await sharp(sheetPath).extract({ left, top, width, height }).png().toBuffer();
      const transparent = await cleanDetachedKeyFragments(await keyOut(extracted));
      const bounds = await alphaBounds(transparent);
      const cropped = await sharp(transparent).extract(bounds).png().toBuffer();
      const metadata = await sharp(cropped).metadata();
      prepared.push({ cropped, width: metadata.width, height: metadata.height, primary: await primaryAlphaBounds(cropped) });
    }
  }
  const scale = Math.min(
    1,
    enemy.maxWidth / Math.max(...prepared.map(({ primary }) => primary.width)),
    enemy.maxHeight / Math.max(...prepared.map(({ primary }) => primary.height)),
    (CELL - 8) / Math.max(...prepared.map(({ width }) => width)),
    (CELL - 24) / Math.max(...prepared.map(({ height }) => height)),
  );
  const composites = [];
  for (const [index, pose] of prepared.entries()) {
    const resized = await sharp(pose.cropped)
      .resize(
        Math.max(1, Math.round((await sharp(pose.cropped).metadata()).width * scale)),
        Math.max(1, Math.round((await sharp(pose.cropped).metadata()).height * scale)),
        { kernel: "nearest" },
      )
      .png()
      .toBuffer();
    const primary = await primaryAlphaBounds(resized);
    const resizedMeta = await sharp(resized).metadata();
    const left = Math.max(4, Math.min(CELL - 4 - resizedMeta.width, Math.round(CELL / 2 - (primary.left + primary.width / 2))));
    const top = Math.max(4, Math.min(176 - resizedMeta.height, 176 - resizedMeta.height));
    const row = Math.floor(index / SOURCE_GRID);
    const column = index % SOURCE_GRID;
    composites.push({ input: resized, left: column * CELL + left, top: row * CELL + top });
  }
  await sharp({
    create: { width: SOURCE_GRID * CELL, height: SOURCE_GRID * CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png({ palette: true, colours: 32, dither: 0 })
    .toFile(path.join(sourceDir, `${enemy.kind}-motion-source.png`));
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
    const locomotionWidth = Math.round(
      cells[0].reduce((sum, { primaryWidth }) => sum + primaryWidth, 0) / cells[0].length,
    );
    for (let column = 0; column < SOURCE_GRID; column += 1) {
      const source = cells[2][column];
      const scale = locomotionWidth / source.primaryWidth;
      const normalized = await sharp(source.cropped)
        .resize(
          Math.max(1, Math.round(source.width * scale)),
          Math.max(1, Math.round(source.height * scale)),
          { kernel: "nearest" },
        )
        .png()
        .toBuffer();
      const metadata = await sharp(normalized).metadata();
      const primary = await primaryAlphaBounds(normalized);
      cells[2][column] = {
        cropped: normalized,
        width: metadata.width,
        height: metadata.height,
        primaryWidth: primary.width,
        primaryHeight: primary.height,
        primaryLeft: primary.left,
        primaryTop: primary.top,
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
  for (const [rowOffset, row] of enemy.outputRows.entries()) {
    for (const [column, [sourceRow, sourceColumn]] of row.entries()) {
      const source = cells[sourceRow][sourceColumn];
      const resizedWidth = Math.max(1, Math.round(source.width * scale));
      const resizedHeight = Math.max(1, Math.round(source.height * scale));
      const resized = await cleanDetachedKeyFragments(await despillPurple(await sharp(source.cropped)
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
        ? CELL - 16 - height
        : Math.round(CELL / 2 - (primary.top + primary.height / 2));
      if (left < 0 || top < 0 || left + width > CELL || top + height > CELL) {
        throw new Error(`${enemy.kind} source ${sourceRow}:${sourceColumn} clips after primary alignment`);
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

for (const enemy of roster.filter(({ kind }) => kind === "squirrel" || kind === "terrier")) {
  await buildUpdatedSourceMaster(enemy);
}

const composites = [];
for (const enemy of roster) composites.push(...await normalizedFrames(enemy));

await mkdir(publicDir, { recursive: true });
const atlasPath = path.join(publicDir, "level2-enemy-motion.png");
await sharp({
  create: {
    width: columns * CELL,
    height: outputRowCount * CELL,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png({ palette: true, colours: 32, dither: 0 })
  .toFile(atlasPath);

await sharp(atlasPath)
  .resize({ width: columns * 96, height: outputRowCount * 96, kernel: "nearest" })
  .png()
  .toFile(path.join(root, "level2-enemy-motion-contact-sheet.png"));

console.log(`Built ${path.relative(process.cwd(), atlasPath)} with ${outputRowCount} normalized 192px rows.`);
