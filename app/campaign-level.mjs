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
  const zone = campaignZoneAt(level, x);
  const span = Math.max(1, zone.endX - zone.startX);
  return {
    lighting: zone.lighting,
    progress: Math.max(0, Math.min(1, (x - zone.startX) / span)),
  };
}

export function validateCampaignLevel(level) {
  const errors = [];
  const zoneIds = new Set(level.zones.map(({ id }) => id));
  for (const encounter of level.encounters) {
    if (!zoneIds.has(encounter.zoneId)) {
      errors.push(`encounter ${encounter.id} references unknown zone ${encounter.zoneId}`);
    }
  }
  return errors;
}
