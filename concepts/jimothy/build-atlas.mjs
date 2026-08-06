import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.dirname(new URL(import.meta.url).pathname);
const privateAtlas = path.join(root, "jimothy-animation-atlas.png");
const publicDir = path.resolve(root, "../../public/assets/generated");
const CELL = 192;
const columns = 6;

// Existing concept rows are reused as clean source poses until bespoke
// full-parity drawings are available. Every output state still has explicit
// frames, a normalized baseline, and a complete cell in the public atlas.
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

const makeFrames = async (state) => {
  const [, sourceRow, frames] = state;
  const [file, row] = sourceFor(sourceRow);
  const out = [];
  for (let column = 0; column < frames; column += 1) {
    const sourceColumn = column % 4;
    out.push({
      input: await clearCellEdge(await sharp(file).ensureAlpha().extract({ left: sourceColumn * CELL, top: row * CELL, width: CELL, height: CELL }).png().toBuffer()),
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
await sharp(privateAtlas).png().toFile(path.join(publicDir, "jimothy-hero-motion.png"));
await sharp(privateAtlas).png().toFile(path.join(publicDir, "jimothy-hero-contact-sheet.png"));
await sharp(privateAtlas).extract({ left: 0, top: 0, width: CELL, height: CELL }).png().toFile(path.join(publicDir, "jimothy-selection.png"));
