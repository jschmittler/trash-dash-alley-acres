const layer = (order, label) => Object.freeze({ order, label });

export const RENDER_LAYERS = Object.freeze({
  FAR_BACKGROUND: layer(1, "Far background"),
  BACKGROUND_SCENERY: layer(2, "Background scenery"),
  REAR_ENVIRONMENT: layer(3, "Rear environmental props"),
  TERRAIN: layer(4, "Terrain and platforms"),
  GROUND_DECOR: layer(5, "Ground-level decorative props"),
  GAMEPLAY: layer(6, "Gameplay entities"),
  GAMEPLAY_EFFECTS: layer(7, "Projectiles and gameplay effects"),
  FOREGROUND: layer(8, "Foreground framing elements"),
  HUD: layer(9, "HUD and interface"),
});

export const SCALE_POLICIES = Object.freeze({
  CANONICAL_WORLD_SIZE: "CANONICAL_WORLD_SIZE",
  NATIVE_PIXEL_SIZE: "NATIVE_PIXEL_SIZE",
  VIEWPORT_COVER: "VIEWPORT_COVER",
  NINE_SLICE_OR_TILE: "NINE_SLICE_OR_TILE",
});

export const ASPECT_RATIO_TOLERANCE = 0.01;
export const GROUND_CONTACT_TOLERANCE = 2;

export const VIEWPORT_BEHAVIORS = Object.freeze({
  WORLD_SPACE_CULL: "WORLD_SPACE_CULL",
  PARALLAX_TILE: "PARALLAX_TILE",
  VIEWPORT_COVER: "VIEWPORT_COVER",
  SCREEN_SPACE_SAFE_AREA: "SCREEN_SPACE_SAFE_AREA",
});

export const PLACEMENT_SIZE_CLASSES = Object.freeze({
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  HERO: "hero",
  INTERACTIVE: "interactive",
  BOSS_ARENA: "bossArena",
});

export const COMPOSITION_GAPS = Object.freeze({
  small: 12,
  medium: 28,
  large: 52,
  hero: 88,
  interactive: 40,
  bossArena: 72,
});

export const COMPOSITION_DENSITY_LIMITS = Object.freeze({
  medium: 5,
  large: 3,
  hero: 2,
});

export const VISUAL_CONTRACT_FIELDS = Object.freeze([
  "visualBounds", "collisionBounds", "placementFootprint", "groundAnchor", "renderLayer",
  "allowedZones", "forbiddenZones", "minimumClearance", "scalePolicy", "viewportBehavior",
  "compositionPadding", "placementCategory", "nativePixelSize", "referenceWorldHeight",
  "preferredScale", "effectOrigin",
]);

const finite = (value) => Number.isFinite(value);
const rectValid = (rect) => rect && finite(rect.x) && finite(rect.y) && finite(rect.w) && finite(rect.h) && rect.w >= 0 && rect.h >= 0;
const freezeRect = (rect) => Object.freeze({ x: rect.x, y: rect.y, w: rect.w, h: rect.h });
const formatRatio = (value) => value.toFixed(2);
const formatCoordinate = (value) => value.toFixed(2);

export function validateAspectRatio({ source, destination, tolerance = ASPECT_RATIO_TOLERANCE } = {}) {
  if (!finite(source?.w) || !finite(source?.h) || source.w <= 0 || source.h <= 0) {
    return ["source dimensions must be positive"];
  }
  if (!finite(destination?.w) || !finite(destination?.h) || destination.w <= 0 || destination.h <= 0) {
    return ["destination dimensions must be positive"];
  }
  if (!finite(tolerance) || tolerance < 0) return ["aspect tolerance must be non-negative"];
  const sourceAspect = source.w / source.h;
  const destinationAspect = destination.w / destination.h;
  return Math.abs(sourceAspect - destinationAspect) <= tolerance
    ? []
    : [`source aspect ${formatRatio(sourceAspect)} does not match destination aspect ${formatRatio(destinationAspect)}`];
}

export function validateVisibleAnchor({ visibleBounds, groundAnchor, tolerance = GROUND_CONTACT_TOLERANCE } = {}) {
  if (!rectValid(visibleBounds) || visibleBounds.w <= 0 || visibleBounds.h <= 0) {
    return ["visible bounds must have positive dimensions"];
  }
  if (!finite(groundAnchor?.x) || !finite(groundAnchor?.y)) return ["ground anchor must be finite"];
  if (!finite(tolerance) || tolerance < 0) return ["ground contact tolerance must be non-negative"];
  const contactX = visibleBounds.x + visibleBounds.w / 2;
  const contactY = visibleBounds.y + visibleBounds.h;
  return Math.abs(groundAnchor.x - contactX) <= tolerance && Math.abs(groundAnchor.y - contactY) <= tolerance
    ? []
    : [`ground anchor ${formatCoordinate(groundAnchor.x)},${formatCoordinate(groundAnchor.y)} does not meet visible bottom center ${formatCoordinate(contactX)},${formatCoordinate(contactY)}`];
}

export function createVisualContract(input) {
  return Object.freeze({
    ...input,
    visualBounds: freezeRect(input.visualBounds),
    collisionBounds: freezeRect(input.collisionBounds),
    placementFootprint: freezeRect(input.placementFootprint),
    groundAnchor: Object.freeze({ ...input.groundAnchor }),
    allowedZones: Object.freeze([...(input.allowedZones ?? [])]),
    forbiddenZones: Object.freeze([...(input.forbiddenZones ?? [])]),
    minimumClearance: Object.freeze({ left: 0, right: 0, top: 0, bottom: 0, ...input.minimumClearance }),
    scalePolicy: Object.freeze({ ...input.scalePolicy }),
    compositionPadding: Object.freeze({ left: 0, right: 0, top: 0, bottom: 0, ...input.compositionPadding }),
    nativePixelSize: input.nativePixelSize ? Object.freeze({ ...input.nativePixelSize }) : null,
    effectOrigin: input.effectOrigin ? Object.freeze({ ...input.effectOrigin }) : null,
  });
}

export function expandedCompositionFootprint(contract) {
  const padding = contract.compositionPadding ?? {};
  const left = padding.left ?? 0;
  const right = padding.right ?? 0;
  const top = padding.top ?? 0;
  const bottom = padding.bottom ?? 0;
  return {
    x: contract.placementFootprint.x - left,
    y: contract.placementFootprint.y - top,
    w: contract.placementFootprint.w + left + right,
    h: contract.placementFootprint.h + top + bottom,
  };
}

export function motionEnvelope(bounds) {
  if (!bounds.length) return { x: 0, y: 0, w: 0, h: 0 };
  const left = Math.min(...bounds.map(({ x }) => x));
  const top = Math.min(...bounds.map(({ y }) => y));
  const right = Math.max(...bounds.map(({ x, w }) => x + w));
  const bottom = Math.max(...bounds.map(({ y, h }) => y + h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

const containsRect = (outer, inner, tolerance = 0.001) => (
  inner.x >= outer.x - tolerance
  && inner.y >= outer.y - tolerance
  && inner.x + inner.w <= outer.x + outer.w + tolerance
  && inner.y + inner.h <= outer.y + outer.h + tolerance
);

export function validateVisualContract(contract) {
  const errors = [];
  for (const field of VISUAL_CONTRACT_FIELDS) {
    if (!Object.hasOwn(contract ?? {}, field)) errors.push(`${contract?.id ?? "unknown"}: missing ${field}`);
  }
  if (!contract) return errors;
  for (const field of ["visualBounds", "collisionBounds", "placementFootprint"]) {
    if (!rectValid(contract[field])) errors.push(`${contract.id}: invalid ${field}`);
  }
  if (!finite(contract.groundAnchor?.x) || !finite(contract.groundAnchor?.y)) errors.push(`${contract.id}: invalid groundAnchor`);
  if (!Object.hasOwn(RENDER_LAYERS, contract.renderLayer)) errors.push(`${contract.id}: unknown renderLayer ${contract.renderLayer}`);
  if (!Array.isArray(contract.allowedZones) || contract.allowedZones.length === 0) errors.push(`${contract.id}: allowedZones must not be empty`);
  if (!Array.isArray(contract.forbiddenZones)) errors.push(`${contract.id}: forbiddenZones must be an array`);
  if (!Object.values(PLACEMENT_SIZE_CLASSES).includes(contract.placementCategory)) errors.push(`${contract.id}: unknown placementCategory`);
  for (const side of ["left", "right", "top", "bottom"]) {
    if (!finite(contract.compositionPadding?.[side]) || contract.compositionPadding[side] < 0) errors.push(`${contract.id}: invalid compositionPadding.${side}`);
  }
  if (contract.nativePixelSize !== null && (!finite(contract.nativePixelSize?.w) || !finite(contract.nativePixelSize?.h) || contract.nativePixelSize.w <= 0 || contract.nativePixelSize.h <= 0)) {
    errors.push(`${contract.id}: invalid nativePixelSize`);
  }
  if (contract.referenceWorldHeight !== null && (!finite(contract.referenceWorldHeight) || contract.referenceWorldHeight <= 0)) errors.push(`${contract.id}: invalid referenceWorldHeight`);
  if (!finite(contract.preferredScale) || contract.preferredScale <= 0) errors.push(`${contract.id}: invalid preferredScale`);
  if (contract.effectOrigin !== null && (!finite(contract.effectOrigin?.x) || !finite(contract.effectOrigin?.y))) errors.push(`${contract.id}: invalid effectOrigin`);
  if (!Object.values(VIEWPORT_BEHAVIORS).includes(contract.viewportBehavior)) errors.push(`${contract.id}: unknown viewportBehavior`);
  const scale = contract.scalePolicy;
  if (!scale || !Object.values(SCALE_POLICIES).includes(scale.kind)) errors.push(`${contract.id}: unknown scale policy`);
  if (!finite(scale?.min) || !finite(scale?.max) || scale.min <= 0 || scale.max < scale.min) errors.push(`${contract.id}: invalid scale range`);
  if (finite(contract.preferredScale) && scale && (contract.preferredScale < scale.min || contract.preferredScale > scale.max)) errors.push(`${contract.id}: preferredScale outside scale range`);
  if (scale?.preserveAspectRatio !== true) errors.push(`${contract.id}: aspect ratio must be preserved`);
  if (rectValid(contract.placementFootprint) && rectValid(contract.visualBounds) && !containsRect(contract.placementFootprint, contract.visualBounds)) {
    errors.push(`${contract.id}: placementFootprint does not contain visualBounds`);
  }
  if (rectValid(contract.placementFootprint) && rectValid(contract.collisionBounds) && !containsRect(contract.placementFootprint, contract.collisionBounds)) {
    errors.push(`${contract.id}: placementFootprint does not contain collisionBounds`);
  }
  return errors;
}

export function validateCompositionDensity(items, viewport, limits = COMPOSITION_DENSITY_LIMITS) {
  const visible = items.filter(({ bounds }) => rectsIntersect(bounds, viewport));
  const errors = [];
  const names = {
    [PLACEMENT_SIZE_CLASSES.HERO]: "hero prop density",
    [PLACEMENT_SIZE_CLASSES.LARGE]: "large prop density",
    [PLACEMENT_SIZE_CLASSES.MEDIUM]: "medium prop density",
  };
  for (const [category, limit] of Object.entries(limits)) {
    const count = visible.filter((item) => item.placementCategory === category).length;
    if (count > limit) errors.push(`${names[category] ?? `${category} density`} ${count} exceeds ${limit} in viewport ${viewport.x}-${viewport.x + viewport.w}`);
  }
  return errors;
}

export const rectsIntersect = (left, right, clearance = 0) => (
  left.x - clearance < right.x + right.w
  && left.x + left.w + clearance > right.x
  && left.y - clearance < right.y + right.h
  && left.y + left.h + clearance > right.y
);

export function deterministicValidPlacement(candidates, { anchor, forbiddenZones = [], allowedRegion, clearance = 0 }) {
  const legal = candidates.filter((candidate) => (
    rectValid(candidate)
    && (!allowedRegion || containsRect(allowedRegion, candidate))
    && forbiddenZones.every((zone) => !rectsIntersect(candidate, zone, clearance))
  ));
  if (!legal.length) return null;
  return legal.toSorted((left, right) => {
    const distance = (candidate) => {
      const x = candidate.x + candidate.w / 2 - anchor.x;
      const y = candidate.y + candidate.h / 2 - anchor.y;
      return x * x + y * y;
    };
    return distance(left) - distance(right)
      || left.x - right.x || left.y - right.y || left.w - right.w || left.h - right.h;
  })[0];
}

export function validateAnimationManifest(manifest, { requiredStates = [], atlas = null } = {}) {
  const errors = [];
  for (const state of requiredStates) {
    if (!manifest?.[state]) errors.push(`missing required animation state ${state}`);
  }
  for (const [state, animation] of Object.entries(manifest ?? {})) {
    const frameCount = Array.isArray(animation.frames) ? animation.frames.length : animation.frames;
    if (!Number.isInteger(frameCount) || frameCount <= 0) errors.push(`${state}: frames must be a positive integer or non-empty sequence`);
    if (!finite(animation.fps) || animation.fps < 0 || (frameCount > 1 && animation.fps <= 0)) errors.push(`${state}: invalid frame duration/fps`);
    if (atlas && (!Number.isInteger(animation.row) || animation.row < 0 || animation.row >= atlas.rows)) errors.push(`${state}: row is outside atlas`);
    if (atlas && Number.isInteger(frameCount) && frameCount > atlas.columns) errors.push(`${state}: frames exceed atlas columns`);
    if (Array.isArray(animation.frames)) {
      for (const frame of animation.frames) {
        if (!Array.isArray(frame) || frame.length !== 4 || frame.some((value) => !finite(value)) || frame[2] <= 0 || frame[3] <= 0) {
          errors.push(`${state}: invalid sprite-sheet frame rectangle`);
          break;
        }
      }
    }
  }
  return errors;
}
