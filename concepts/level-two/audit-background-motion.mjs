import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { LEVEL_TWO } from "../../app/level-two.mjs";
import { levelBackgroundBlendAt, PARALLAX_SPEEDS } from "../../app/level-background.mjs";

const VIEWPORT_WIDTH = 960;
const VIEWPORT_HEIGHT = 540;
const PLATE_WIDTH = 2048;
const DRAW_Y = -46;
const THUMB_WIDTH = 320;
const THUMB_HEIGHT = 180;
const MAX_CAMERA = LEVEL_TWO.worldWidth - VIEWPORT_WIDTH;
const STAGE_BY_ZONE = new Map(LEVEL_TWO.backgroundSets.map(({ zoneId, stage }) => [zoneId, stage]));
const backgroundRoot = new URL("../../public/assets/backgrounds/", import.meta.url);
const artifactPath = fileURLToPath(new URL("./level2-parallax-motion-audit.png", import.meta.url));
const auditPath = fileURLToPath(new URL("./level2-parallax-motion-audit.json", import.meta.url));
const stripCache = new Map();

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const platePath = (stage, layer) => fileURLToPath(
  new URL(`level2-${stage}-${layer}.png`, backgroundRoot),
);

async function tiledStrip(stage, layer) {
  const key = `${stage}-${layer}`;
  if (stripCache.has(key)) return stripCache.get(key);
  const plate = await sharp(platePath(stage, layer))
    .ensureAlpha()
    .extract({ left: 0, top: -DRAW_Y, width: PLATE_WIDTH, height: VIEWPORT_HEIGHT })
    .png()
    .toBuffer();
  const strip = await sharp({
    create: {
      width: PLATE_WIDTH * 3,
      height: VIEWPORT_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([0, 1, 2].map((index) => ({ input: plate, left: index * PLATE_WIDTH, top: 0 })))
    .png()
    .toBuffer();
  stripCache.set(key, strip);
  return strip;
}

function layerOffset(camera, layer) {
  return -Math.round((camera * PARALLAX_SPEEDS[layer]) % PLATE_WIDTH);
}

async function renderTiledLayer(stage, layer, camera) {
  const strip = await tiledStrip(stage, layer);
  const offset = layerOffset(camera, layer);
  return sharp(strip)
    .extract({ left: PLATE_WIDTH - offset, top: 0, width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT })
    .png()
    .toBuffer();
}

function visibleSurfaceOverlay(camera) {
  const rectangles = LEVEL_TWO.surfaces
    .filter(({ x, w }) => x + w >= camera && x <= camera + VIEWPORT_WIDTH)
    .map(({ x, y, w }) => {
      const left = Math.max(0, Math.round(x - camera));
      const width = Math.max(1, Math.min(VIEWPORT_WIDTH - left, Math.round(w)));
      return `<rect x="${left}" y="${Math.round(y)}" width="${width}" height="3" fill="#f6cf57"/>`;
    })
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEWPORT_WIDTH}" height="${VIEWPORT_HEIGHT}">${rectangles}</svg>`,
  );
}

async function renderFrame(camera) {
  const stageCenterX = camera + VIEWPORT_WIDTH * 0.5;
  const blendState = levelBackgroundBlendAt(stageCenterX, LEVEL_TWO.zones);
  const sets = [
    { zoneId: blendState.leftId, opacity: 1 - blendState.blend },
    ...(blendState.rightId ? [{ zoneId: blendState.rightId, opacity: blendState.blend }] : []),
  ].filter(({ opacity }) => opacity > 0);
  const composites = [];
  for (const { zoneId, opacity } of sets) {
    const stage = STAGE_BY_ZONE.get(zoneId);
    for (const layer of ["far", "middle", "close"]) {
      composites.push({
        input: await renderTiledLayer(stage, layer, camera),
        left: 0,
        top: 0,
        blend: "over",
        opacity,
      });
    }
  }
  composites.push({ input: visibleSurfaceOverlay(camera), left: 0, top: 0, blend: "over" });
  return sharp({
    create: {
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      channels: 4,
      background: "#080d1e",
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function closeCenterCoverage(camera) {
  const centerX = camera + VIEWPORT_WIDTH * 0.5;
  const zone = LEVEL_TWO.zones.find(({ startX, endX }) => centerX >= startX && centerX < endX)
    ?? LEVEL_TWO.zones.at(-1);
  const stage = STAGE_BY_ZONE.get(zone.id);
  const { data, info } = await sharp(await renderTiledLayer(stage, "close", camera))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let visible = 0;
  let total = 0;
  for (let y = 220; y < 468; y += 1) {
    for (let x = 240; x < 720; x += 1) {
      total += 1;
      if (data[(y * info.width + x) * info.channels + 3] > 0) visible += 1;
    }
  }
  return visible / total;
}

const chapterRows = LEVEL_TWO.zones.map((zone) => {
  const start = clamp(zone.startX - VIEWPORT_WIDTH * 0.5, 0, MAX_CAMERA - VIEWPORT_WIDTH);
  const forward = [start, start + VIEWPORT_WIDTH * 0.5, start + VIEWPORT_WIDTH];
  return {
    kind: "chapter",
    id: zone.id,
    forward,
    reverse: [...forward].reverse(),
  };
});

const boundaryRows = LEVEL_TWO.zones.slice(0, -1).map((zone) => {
  const centers = [zone.endX - 110, zone.endX, zone.endX + 110];
  return {
    kind: "boundary",
    id: `${zone.id}-to-next`,
    centers,
    cameras: centers.map((center) => clamp(center - VIEWPORT_WIDTH * 0.5, 0, MAX_CAMERA)),
    blends: centers.map((center) => levelBackgroundBlendAt(center, LEVEL_TWO.zones).blend),
  };
});

const reviewRows = [...chapterRows, ...boundaryRows];
const composites = [];
const frameAudits = [];
for (let row = 0; row < reviewRows.length; row += 1) {
  const review = reviewRows[row];
  const cameras = review.kind === "chapter" ? review.forward : review.cameras;
  for (let column = 0; column < cameras.length; column += 1) {
    const camera = cameras[column];
    const input = await sharp(await renderFrame(camera))
      .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "fill", kernel: sharp.kernel.nearest })
      .png()
      .toBuffer();
    composites.push({ input, left: column * THUMB_WIDTH, top: row * THUMB_HEIGHT });
    const offsets = Object.fromEntries(
      Object.keys(PARALLAX_SPEEDS).map((layer) => [layer, layerOffset(camera, layer)]),
    );
    const visibleSeams = Object.fromEntries(
      Object.entries(offsets).map(([layer, offset]) => {
        const seam = offset + PLATE_WIDTH;
        return [layer, seam >= 0 && seam < VIEWPORT_WIDTH ? [seam] : []];
      }),
    );
    frameAudits.push({
      row: review.id,
      camera,
      offsets,
      visibleSeams,
      closeCenterCoverage: await closeCenterCoverage(camera),
    });
  }
}

await sharp({
  create: {
    width: THUMB_WIDTH * 3,
    height: THUMB_HEIGHT * reviewRows.length,
    channels: 4,
    background: "#11162a",
  },
})
  .composite(composites)
  .png()
  .toFile(artifactPath);

const audit = {
  viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
  parallaxSpeeds: PARALLAX_SPEEDS,
  rows: reviewRows,
  frames: frameAudits,
  summary: {
    chapterSweeps: chapterRows.length,
    boundarySweeps: boundaryRows.length,
    maxCloseCenterCoverage: Math.max(...frameAudits.map(({ closeCenterCoverage }) => closeCenterCoverage)),
    visibleTileSeams: frameAudits.reduce(
      (total, frame) => total + Object.values(frame.visibleSeams).flat().length,
      0,
    ),
    tallObjectMotion: "whole middle plates use one offset per frame and reverse with the same samples",
    landingTargets: "yellow overlays use active Level 2 surface tops and remain above close scenery",
  },
};

await writeFile(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(
  `Wrote offline motion audit: ${chapterRows.length} chapter sweeps, ${boundaryRows.length} boundaries, max close-center coverage ${audit.summary.maxCloseCenterCoverage.toFixed(3)}.`,
);
