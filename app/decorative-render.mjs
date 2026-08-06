import { DECORATIVE_PROPS, platformStrips } from "../concepts/decorative/decorative-manifest.mjs";

const SCALE = 0.5;

export function decorativeDrawRect(prop, worldX, cameraX, groundY) {
  const meta = DECORATIVE_PROPS[prop];
  if (!meta) throw new Error(`Unknown decorative prop: ${prop}`);
  const width = Math.round(meta.sourceWidth * SCALE);
  const height = Math.round(meta.sourceHeight * SCALE);
  return { x: Math.round(worldX - cameraX), y: Math.round(groundY - meta.baseline * SCALE), width, height };
}

export function decorativeShadowRect(prop, drawRect) {
  const meta = DECORATIVE_PROPS[prop];
  if (!meta) throw new Error(`Unknown decorative prop: ${prop}`);
  return {
    x: Math.round(drawRect.x + drawRect.width * 0.18),
    y: Math.round(drawRect.y + drawRect.height - meta.shadowOffset * SCALE),
    width: Math.max(8, Math.round(drawRect.width * 0.64)),
    height: Math.max(2, Math.round(drawRect.height * 0.045)),
  };
}

export function platformStripSegments(kind, x, y, width) {
  const strip = platformStrips[kind];
  if (!strip) throw new Error(`Unknown platform strip: ${kind}`);
  const total = Math.max(0, Math.round(width));
  const edge = Math.min(64, Math.floor(total / 2));
  const middle = Math.max(0, total - edge * 2);
  return [
    { source: strip.left, dest: { x: Math.round(x), y: Math.round(y), width: edge, height: strip.height / 2 } },
    { source: strip.middle, dest: { x: Math.round(x + edge), y: Math.round(y), width: middle, height: strip.height / 2 } },
    { source: strip.right, dest: { x: Math.round(x + edge + middle), y: Math.round(y), width: total - edge - middle, height: strip.height / 2 } },
  ];
}

export { DECORATIVE_PROPS, platformStrips };
