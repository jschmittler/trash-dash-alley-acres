const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

const horizontalDistance = (point, surface) => {
  if (point < surface.x) return surface.x - point;
  if (point > surface.x + surface.w) return point - (surface.x + surface.w);
  return 0;
};

export function createEnemyPatrol({ x, width, surfaceY, patrolRadius, grounded }, surfaces) {
  if (!grounded) {
    return {
      spawnX: x,
      minX: x - patrolRadius,
      maxX: x + patrolRadius,
      surfaceY,
    };
  }

  const centerX = x + width / 2;
  const matchingSurfaces = surfaces
    .filter((surface) => Math.abs(surface.y - surfaceY) < 1 && surface.w >= width)
    .sort((left, right) => horizontalDistance(centerX, left) - horizontalDistance(centerX, right));
  const support = matchingSurfaces[0];

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
  const spawnX = clamp(x, supportMinX, supportMaxX);

  return {
    spawnX,
    minX: Math.max(spawnX - patrolRadius, supportMinX),
    maxX: Math.min(spawnX + patrolRadius, supportMaxX),
    surfaceY: support.y,
  };
}
