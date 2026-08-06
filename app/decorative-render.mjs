import { DECORATIVE_PROPS, platformStrips } from "../concepts/decorative/decorative-manifest.mjs";

const SCALE = 0.5;

export function decorativeDrawRect(prop, worldX, cameraX, groundY) {
  const meta = DECORATIVE_PROPS[prop];
  if (!meta) throw new Error(`Unknown decorative prop: ${prop}`);
  const width = Math.round(meta.sourceWidth * SCALE);
  const height = Math.round(meta.sourceHeight * SCALE);
  return { x: Math.round(worldX - cameraX), y: Math.round(groundY - height), width, height };
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
  // The generated strip reserves transparent key space above/below the art.
  // Crop that padding so the visible top edge sits exactly on the collision
  // surface and the strip remains a compact 32px platform in world space.
  const sourceHeight = 48;
  const sourceY = 40;
  const source = (segment) => ({ ...segment, y: sourceY, height: sourceHeight });
  return [
    { source: source(strip.left), dest: { x: Math.round(x), y: Math.round(y), width: edge, height: 32 } },
    { source: source(strip.middle), dest: { x: Math.round(x + edge), y: Math.round(y), width: middle, height: 32 } },
    { source: source(strip.right), dest: { x: Math.round(x + edge + middle), y: Math.round(y), width: total - edge - middle, height: 32 } },
  ];
}

export { DECORATIVE_PROPS, platformStrips };
