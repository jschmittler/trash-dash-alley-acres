const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

const horizontalDistance = (point, surface) => {
  if (point < surface.x) return surface.x - point;
  if (point > surface.x + surface.w) return point - (surface.x + surface.w);
  return 0;
};

export function createEnemyPatrol({ x, width, surfaceY, surfaceId, patrolRadius, grounded, patrolBounds }, surfaces) {
  if (!grounded) {
    const requestedMin = patrolBounds?.[0] ?? (x - patrolRadius);
    const requestedMax = patrolBounds?.[1] ?? (x + patrolRadius);
    return {
      spawnX: x,
      minX: Math.min(requestedMin, requestedMax),
      maxX: Math.max(requestedMin, requestedMax),
      surfaceY,
    };
  }

  const centerX = x + width / 2;
  const authoredSupport = surfaceId
    ? surfaces.find((surface) => surface.id === surfaceId && surface.w >= width)
    : null;
  const support = surfaceId
    ? authoredSupport
    : surfaces
      .filter((surface) => Math.abs(surface.y - surfaceY) < 1 && surface.w >= width)
      .sort((left, right) => horizontalDistance(centerX, left) - horizontalDistance(centerX, right))[0]
      ?? surfaces
        .filter((surface) => surface.w >= width)
        .sort((left, right) => horizontalDistance(centerX, left) - horizontalDistance(centerX, right))[0];

  if (!support) {
    return {
      spawnX: x,
      minX: x - patrolRadius,
      maxX: x + patrolRadius,
      surfaceY,
    };
  }

  const supportMinX = support.x;
  const supportMaxX = support.x + support.w - width;
  const requestedMin = patrolBounds?.[0] ?? (x - patrolRadius);
  const requestedMax = patrolBounds?.[1] ?? (x + patrolRadius);
  const requestedStart = Math.min(requestedMin, requestedMax);
  const requestedEnd = Math.max(requestedMin, requestedMax);
  const patrolMinX = clamp(requestedStart, supportMinX, supportMaxX);
  const patrolMaxX = clamp(requestedEnd, supportMinX, supportMaxX);
  const spawnX = clamp(x, patrolMinX, patrolMaxX);

  const patrol = {
    spawnX,
    minX: Math.min(patrolMinX, patrolMaxX),
    maxX: Math.max(patrolMinX, patrolMaxX),
    surfaceY: support.y,
  };
  return surfaceId ? { ...patrol, surfaceId: support.id } : patrol;
}
