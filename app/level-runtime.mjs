export const carryPlayerProgress = (world) => ({
  selectedCharacterId: world.selectedCharacterId,
  large: world.player.large,
  glider: world.player.glider,
  trash: world.trash,
  score: world.score,
  lives: world.lives,
});

export function applyCarriedProgress(player, carried) {
  player.large = Boolean(carried?.large);
  player.glider = Math.max(0, carried?.glider ?? 0);
  return player;
}

export function nextCampaignStart(world) {
  const levelId = world.level.exit?.nextLevelId ?? null;
  return levelId ? { levelId, carried: carryPlayerProgress(world) } : null;
}

export function createLevelRuntime(level, { makeEnemy, makePickup }) {
  const surfaces = level.surfaces.filter(({ hazard }) => !hazard);
  return {
    enemies: level.encounters.flatMap(({ enemies }) => enemies.flatMap((spawn) => {
      const enemy = makeEnemy(spawn, surfaces);
      return enemy ? [enemy] : [];
    })),
    pickups: level.rewards
      .filter(({ kind }) => kind !== "checkpoint")
      .map((reward, index) => makePickup(reward, index)),
    surfaces,
    hazards: level.surfaces.filter(({ hazard }) => hazard),
    checkpoints: level.checkpoints,
    boss: level.boss,
  };
}
