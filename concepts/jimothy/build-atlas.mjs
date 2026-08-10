import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  JIMOTHY_SOURCE_STATE_IDENTITY,
  JIMOTHY_VICTORY_CONTRACT,
} from "./jimothy-animation.mjs";

const root = path.dirname(new URL(import.meta.url).pathname);
const privateAtlas = path.join(root, "jimothy-animation-atlas.png");
const privateContactSheet = path.join(root, "jimothy-animation-contact-sheet.png");
const publicDir = path.resolve(root, "../../public/assets/generated");
const CELL = 192;
const columns = 6;
const BASELINE_MARGIN = 8;

// Legacy concept rows provide the remaining intentional source poses. States
// with their own authored strips are declared in JIMOTHY_SOURCE_STATE_IDENTITY.
const sourceRows = {
  idle: 0,
  walk: 1,
  run: 2,
  jump: 3,
  fall: 4,
  forage: 5,
  paw_swipe: 6,
  roll: 7,
  climb: 8,
  eat: 9,
  groom: 10,
  hurt: 11,
};

const states = [
  ["small_idle", "idle", 4, 3, true],
  ["small_walk", "walk", 4, 8, true],
  ["small_run", "run", 4, 11, true],
  ["small_jump", "jump", 4, 8, false],
  ["small_fall", "fall", 4, 8, true],
  ["small_land", "jump", 4, 10, false],
  ["small_hurt", "hurt", 4, 8, false],
  ["small_skid", "roll", 4, 10, false],
  ["small_defeat", "hurt", 4, 6, false],
  ["small_victory", "idle", 4, 7, true],
  ["large_idle", "idle", 4, 3, true],
  ["large_walk", "walk", 4, 8, true],
  ["large_run", "run", 4, 11, true],
  ["large_jump", "jump", 4, 8, false],
  ["large_fall", "fall", 4, 8, true],
  ["large_land", "jump", 4, 10, false],
  ["large_tail_swipe", "paw_swipe", 4, 14, false],
  ["large_hurt", "hurt", 4, 8, false],
  ["large_shrink", "roll", 4, 10, false],
  ["large_glide", "jump", 4, 7, true],
  ["large_skid", "roll", 4, 10, false],
  ["large_victory", "idle", 4, 7, true],
];

const sourceFiles = {
  locomotion: path.join(root, "sheets/jimothy-locomotion.png"),
  actions: path.join(root, "sheets/jimothy-actions.png"),
  character: path.join(root, "sheets/jimothy-character.png"),
};

const sourceFor = (state) => {
  const row = sourceRows[state];
  return row < 4 ? [sourceFiles.locomotion, row] : row < 8 ? [sourceFiles.actions, row - 4] : [sourceFiles.character, row - 8];
};

const authoredSourceFor = (stateName) => {
  const source = JIMOTHY_SOURCE_STATE_IDENTITY[stateName];
  return source ? path.join(root, source.source) : null;
};

const clearCellEdge = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < CELL; y += 1) {
    for (let x = 0; x < CELL; x += 1) {
      if (x !== 0 && y !== 0 && x !== CELL - 1 && y !== CELL - 1) continue;
      data[(y * info.width + x) * 4 + 3] = 0;
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const normalizeToBaseline = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error("Jimothy source frame is empty");
  const sourceWidth = right - left + 1;
  const sourceHeight = bottom - top + 1;
  // A generated strip is uniformly reduced from its square source region;
  // never independently resize opaque width/height or distort Jimothy's pose.
  const scale = Math.min(1, (CELL - 2) / sourceWidth, (CELL - BASELINE_MARGIN - 1) / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const pose = await sharp(buffer)
    .extract({ left, top, width: sourceWidth, height: sourceHeight })
    .resize({ width, height, fit: "fill", kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  return sharp({ create: { width: CELL, height: CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: pose, left: Math.floor((CELL - width) / 2), top: CELL - BASELINE_MARGIN - height }])
    .png()
    .toBuffer();
};

const visibleBounds = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error("Jimothy source frame is empty");
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
};

const assertCanonicalVictoryFrame = async (buffer, frame) => {
  const bounds = await visibleBounds(buffer);
  if (bounds.width > JIMOTHY_VICTORY_CONTRACT.canonicalSideProfileWidth) {
    throw new Error(`Jimothy victory frame ${frame} exceeds canonical body width: ${bounds.width}px`);
  }
  if (bounds.height > JIMOTHY_VICTORY_CONTRACT.maximumPoseHeight) {
    throw new Error(`Jimothy victory frame ${frame} exceeds victory motion envelope: ${bounds.height}px`);
  }
  if (bounds.bottom !== JIMOTHY_VICTORY_CONTRACT.baseline - 1) {
    throw new Error(`Jimothy victory frame ${frame} baseline drifted to ${bounds.bottom}`);
  }
  const center = bounds.left + bounds.width / 2;
  if (Math.abs(center - CELL / 2) > 1) {
    throw new Error(`Jimothy victory frame ${frame} bottom-center anchor drifted to ${center}`);
  }
};

const makeFrames = async (state) => {
  const [stateName, sourceRow, frames] = state;
  const authoredFile = authoredSourceFor(stateName);
  const [file, row] = authoredFile ? [authoredFile, null] : sourceFor(sourceRow);
  const generatedMetadata = authoredFile ? await sharp(authoredFile).metadata() : null;
  const canonicalVictory = sourceRow === "idle" && stateName.endsWith("_victory");
  if (canonicalVictory) {
    const { width, height, columns: sourceColumns } = JIMOTHY_VICTORY_CONTRACT.sourceCell;
    if (generatedMetadata.width !== width * sourceColumns || generatedMetadata.height !== height) {
      throw new Error(`Jimothy victory source must be ${width * sourceColumns}x${height}; received ${generatedMetadata.width}x${generatedMetadata.height}`);
    }
  }
  const out = [];
  for (let column = 0; column < frames; column += 1) {
    const sourceColumn = column % 4;
    const sourceFrame = authoredFile
      ? await sharp(file).ensureAlpha().extract(canonicalVictory ? {
        left: sourceColumn * JIMOTHY_VICTORY_CONTRACT.sourceCell.width,
        top: 0,
        width: JIMOTHY_VICTORY_CONTRACT.sourceCell.width,
        height: JIMOTHY_VICTORY_CONTRACT.sourceCell.height,
      } : {
        left: Math.floor((sourceColumn * generatedMetadata.width) / 4),
        top: 0,
        width: Math.floor(((sourceColumn + 1) * generatedMetadata.width) / 4) - Math.floor((sourceColumn * generatedMetadata.width) / 4),
        height: generatedMetadata.height,
      }).png().toBuffer()
      : await clearCellEdge(await sharp(file).ensureAlpha().extract({ left: sourceColumn * CELL, top: row * CELL, width: CELL, height: CELL }).png().toBuffer());
    const normalized = await normalizeToBaseline(sourceFrame);
    if (canonicalVictory) await assertCanonicalVictoryFrame(normalized, column);
    out.push({
      input: normalized,
      left: (column % columns) * CELL,
      top: 0,
    });
  }
  return out;
};

const atlas = sharp({ create: { width: columns * CELL, height: states.length * CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
const composites = [];
for (let row = 0; row < states.length; row += 1) {
  for (const frame of await makeFrames(states[row])) {
    composites.push({ input: frame.input, left: frame.left, top: row * CELL });
  }
}

await mkdir(publicDir, { recursive: true });
await atlas.composite(composites).png().toFile(privateAtlas);
await sharp(privateAtlas).png().toFile(privateContactSheet);
await sharp(privateAtlas).png().toFile(path.join(publicDir, "jimothy-hero-motion.png"));
await sharp(privateAtlas).png().toFile(path.join(publicDir, "jimothy-hero-contact-sheet.png"));
await sharp(privateAtlas).extract({ left: 0, top: 0, width: CELL, height: CELL }).png().toFile(path.join(publicDir, "jimothy-selection.png"));
