export const PLACEMENT_TYPES = Object.freeze({
  ON_SURFACE: "ON_SURFACE",
  BESIDE: "BESIDE",
  BELOW: "BELOW",
  ABOVE_WITH_CLEARANCE: "ABOVE_WITH_CLEARANCE",
  EXPLICITLY_PLATFORM_ATTACHED: "EXPLICITLY_PLATFORM_ATTACHED",
});

export const WORLD_PLACEMENT_PADDING = Object.freeze({
  horizontal: 8,
  vertical: 6,
  surfaceTolerance: 2,
});

export function rectIntersectionArea(left, right) {
  const width = Math.max(0, Math.min(left.x + left.w, right.x + right.w) - Math.max(left.x, right.x));
  const height = Math.max(0, Math.min(left.y + left.h, right.y + right.h) - Math.max(left.y, right.y));
  return width * height;
}

const expanded = (rect, padding) => ({
  x: rect.x - padding.horizontal,
  y: rect.y - padding.vertical,
  w: rect.w + padding.horizontal * 2,
  h: rect.h + padding.vertical * 2,
});

export function boundsAtWorldAnchor(localBounds, worldAnchor, localAnchor = { x: 0, y: 0 }) {
  return {
    x: worldAnchor.x + localBounds.x - localAnchor.x,
    y: worldAnchor.y + localBounds.y - localAnchor.y,
    w: localBounds.w,
    h: localBounds.h,
  };
}

export function groundedEnvelopeAt({ x, surfaceY, collisionWidth, contract }) {
  return boundsAtWorldAnchor(
    contract.placementFootprint,
    { x: x + collisionWidth / 2, y: surfaceY },
    contract.groundAnchor,
  );
}

export function supportedPatrolInterval({ support, collisionWidth, contract, requested }) {
  if (!support || !contract || !Number.isFinite(collisionWidth) || collisionWidth <= 0) return null;
  const atZero = groundedEnvelopeAt({ x: 0, surfaceY: support.y, collisionWidth, contract });
  const minimum = support.x - atZero.x;
  const maximum = support.x + support.w - (atZero.x + atZero.w);
  if (minimum > maximum) return null;
  const requestedStart = Math.min(...requested);
  const requestedEnd = Math.max(...requested);
  const minX = Math.max(minimum, requestedStart);
  const maxX = Math.min(maximum, requestedEnd);
  return minX <= maxX ? Object.freeze({ minX, maxX }) : null;
}

export function supportedFlightInterval({ band, collisionWidth, contract, requested }) {
  if (!band || !contract || !Number.isFinite(collisionWidth) || collisionWidth <= 0) return null;
  const atZero = flightEnvelopeAt({
    baselineX: collisionWidth / 2,
    baselineY: 0,
    contract,
  });
  const minimum = band.startX - atZero.x;
  const maximum = band.endX - (atZero.x + atZero.w);
  if (minimum > maximum) return null;
  const requestedStart = Math.min(...requested);
  const requestedEnd = Math.max(...requested);
  const minX = Math.max(minimum, requestedStart);
  const maxX = Math.min(maximum, requestedEnd);
  return minX <= maxX ? Object.freeze({ minX, maxX }) : null;
}

export function flightEnvelopeAt({ baselineX, baselineY, contract }) {
  return boundsAtWorldAnchor(
    contract.placementFootprint,
    { x: baselineX, y: baselineY },
    contract.groundAnchor,
  );
}

const intersectionRecords = (bounds, platforms, usePadding, padding) => platforms
  .map((platform) => ({
    platformId: platform.id,
    area: rectIntersectionArea(bounds, usePadding ? expanded(platform, padding) : platform),
  }))
  .filter(({ area }) => area > 0);

export function classifyWorldObjectPlacement(object, platforms, options = {}) {
  const padding = { ...WORLD_PLACEMENT_PADDING, ...(options.padding ?? {}) };
  const bounds = object.bounds;
  const placementType = object.placementType ?? PLACEMENT_TYPES.BESIDE;
  const structural = intersectionRecords(bounds, platforms, false, padding);
  const padded = intersectionRecords(bounds, platforms, true, padding);
  const invalid = (intersections = structural) => Object.freeze({
    valid: false,
    classification: "INVALID_PLATFORM_INTERSECTION",
    intersections: Object.freeze(intersections),
    support: null,
  });
  const valid = (support = null) => Object.freeze({
    valid: true,
    classification: placementType,
    intersections: Object.freeze([]),
    support,
  });

  if (placementType === PLACEMENT_TYPES.EXPLICITLY_PLATFORM_ATTACHED) {
    const platform = platforms.find(({ id }) => id === object.platformId);
    return platform || object.structureId
      ? valid(Object.freeze(platform ? { platformId: platform.id } : { structureId: object.structureId }))
      : invalid();
  }

  if (placementType === PLACEMENT_TYPES.ON_SURFACE) {
    const surface = platforms.find(({ id }) => id === object.surfaceId);
    if (!surface) return invalid();
    const bottom = bounds.y + bounds.h;
    const supported = Math.abs(bottom - surface.y) <= padding.surfaceTolerance
      && bounds.x >= surface.x
      && bounds.x + bounds.w <= surface.x + surface.w;
    const otherIntersections = structural.filter(({ platformId }) => platformId !== surface.id);
    return supported && structural.every(({ platformId }) => platformId !== surface.id) && otherIntersections.length === 0
      ? valid(Object.freeze({ platformId: surface.id, contactY: surface.y }))
      : invalid(structural.length > 0 ? structural : [{ platformId: surface.id, area: 0 }]);
  }

  if (placementType === PLACEMENT_TYPES.BELOW) {
    const owner = object.platformId ? platforms.find(({ id }) => id === object.platformId) : null;
    const relation = !object.platformId || Boolean(owner && bounds.y >= owner.y + owner.h + padding.vertical);
    return relation && padded.length === 0 ? valid(owner ? Object.freeze({ platformId: owner.id }) : null) : invalid(structural.length > 0 ? structural : padded);
  }

  if (placementType === PLACEMENT_TYPES.ABOVE_WITH_CLEARANCE) {
    const owner = object.surfaceId ? platforms.find(({ id }) => id === object.surfaceId) : null;
    const relation = !object.surfaceId || Boolean(owner && bounds.y + bounds.h <= owner.y - padding.vertical);
    return relation && padded.length === 0 ? valid(owner ? Object.freeze({ platformId: owner.id }) : null) : invalid(structural.length > 0 ? structural : padded);
  }

  return padded.length === 0 ? valid() : invalid(padded);
}

export const isValidWorldObjectPlacement = (object, platforms, options) => (
  classifyWorldObjectPlacement(object, platforms, options).valid
);

export function nearestValidWorldObjectPlacement(object, platforms, candidates, anchor, options) {
  const legal = candidates.filter((bounds) => isValidWorldObjectPlacement({ ...object, bounds }, platforms, options));
  if (legal.length === 0) return null;
  return legal.toSorted((left, right) => {
    const leftX = left.x + left.w / 2;
    const leftY = left.y + left.h / 2;
    const rightX = right.x + right.w / 2;
    const rightY = right.y + right.h / 2;
    return (leftX - anchor.x) ** 2 + (leftY - anchor.y) ** 2
      - ((rightX - anchor.x) ** 2 + (rightY - anchor.y) ** 2)
      || left.x - right.x
      || left.y - right.y
      || left.w - right.w
      || left.h - right.h;
  })[0];
}

export function resolveWorldPlacement(object, platforms, candidates, anchor, options) {
  const bounds = nearestValidWorldObjectPlacement(object, platforms, candidates, anchor, options);
  if (!bounds) return null;
  const result = classifyWorldObjectPlacement({ ...object, bounds }, platforms, options);
  return result.valid ? Object.freeze({ bounds: Object.freeze({ ...bounds }), relationship: result }) : null;
}
