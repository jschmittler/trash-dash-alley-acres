const levels = new Map();

export function registerCampaignLevels(definitions) {
  levels.clear();
  for (const definition of definitions) levels.set(definition.id, definition);
  return levels;
}

export const campaignLevelById = (id) => levels.get(id) ?? levels.get("level-1") ?? null;

export function campaignZoneAt(level, x) {
  const coordinate = Number.isFinite(x) ? x : 0;
  return level.zones.find(({ startX, endX }) => coordinate >= startX && coordinate < endX)
    ?? (coordinate < level.zones[0].startX ? level.zones[0] : level.zones.at(-1));
}

export function campaignLightingAt(level, x) {
  const coordinate = Number.isFinite(x) ? x : 0;
  const zone = campaignZoneAt(level, coordinate);
  const span = Math.max(1, zone.endX - zone.startX);
  return {
    lighting: zone.lighting,
    progress: Math.max(0, Math.min(1, (coordinate - zone.startX) / span)),
  };
}

export function validateCampaignLevel(level) {
  const errors = [];
  const zoneIds = new Set(level.zones.map(({ id }) => id));
  const surfaceIds = new Set((level.surfaces ?? []).map(({ id }) => id));
  const flightBandIds = new Set((level.flightBands ?? []).map(({ id }) => id));
  const checkpointIds = new Set((level.checkpoints ?? []).map(({ id }) => id));
  for (const encounter of level.encounters) {
    if (!zoneIds.has(encounter.zoneId)) {
      errors.push(`encounter ${encounter.id} references unknown zone ${encounter.zoneId}`);
    }
    for (const enemy of encounter.enemies ?? []) {
      if (enemy.movement === "flying") {
        if (!Number.isFinite(enemy.flightY)) errors.push(`enemy ${enemy.kind} in ${encounter.id} has no flightY`);
        if (enemy.flightBand && !flightBandIds.has(enemy.flightBand)) {
          errors.push(`enemy ${enemy.kind} in ${encounter.id} references unknown flight band ${enemy.flightBand}`);
        }
      } else if (enemy.surfaceId && !surfaceIds.has(enemy.surfaceId)) {
        errors.push(`enemy ${enemy.kind} in ${encounter.id} references unknown surface ${enemy.surfaceId}`);
      }
    }
  }
  for (const reward of level.rewards ?? []) {
    if (reward.surfaceId && !surfaceIds.has(reward.surfaceId)) {
      errors.push(`reward ${reward.id} references unknown surface ${reward.surfaceId}`);
    }
  }
  if (level.boss?.checkpointId && !checkpointIds.has(level.boss.checkpointId)) {
    errors.push(`boss ${level.boss.id} references unknown checkpoint ${level.boss.checkpointId}`);
  }
  return errors;
}
