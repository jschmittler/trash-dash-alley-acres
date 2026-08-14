export const PARALLAX_SPEEDS = Object.freeze({
  far: 0.018,
  middle: 0.055,
  close: 0.13,
});

export const BACKGROUND_PLATE_CONTRACTS = Object.freeze({
  "level-1": Object.freeze({ width: 1320, height: 540, drawY: 0 }),
  "level-2": Object.freeze({ width: 1320, height: 540, drawY: 0 }),
});

export function levelBackgroundPlateContract(activeLevel) {
  return BACKGROUND_PLATE_CONTRACTS[activeLevel.id]
    ?? Object.freeze({ width: 1320, height: 540, drawY: 0 });
}

const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function levelBackgroundAssetEntries(activeLevel) {
  const assetPrefix = activeLevel.id.replace("level-", "level");
  return activeLevel.backgroundSets.flatMap(({ zoneId, stage }) => (
    ["far", "middle", "close"].map((layer) => ({
      zoneId,
      layer,
      source: `assets/backgrounds/${assetPrefix}-${stage}-${layer}.png`,
    }))
  ));
}

export function levelBackgroundBlendAt(x, zones, blendDistance = 220) {
  const coordinate = Number.isFinite(x) ? x : 0;
  for (let index = 0; index < zones.length - 1; index += 1) {
    const boundary = zones[index].endX;
    if (Math.abs(coordinate - boundary) > blendDistance) continue;
    const linear = clamp01((coordinate - (boundary - blendDistance)) / (blendDistance * 2));
    const blend = linear * linear * (3 - 2 * linear);
    return {
      leftId: zones[index].id,
      rightId: zones[index + 1].id,
      blend,
    };
  }
  const zone = zones.find(({ startX, endX }) => coordinate >= startX && coordinate < endX)
    ?? (coordinate < zones[0].startX ? zones[0] : zones.at(-1));
  return { leftId: zone.id, rightId: null, blend: 0 };
}
