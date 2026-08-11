import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectFile = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

test("canonical rendering references own geometry scale anchors layers and effects", async () => {
  const rendering = await projectFile(".skills/rendering-asset-integrity/SKILL.md");
  const contract = await projectFile(".skills/rendering-asset-integrity/references/runtime-visual-contract.md");
  for (const phrase of [
    "FIXED_ASPECT", "sourceRect", "visibleBounds", "renderWidth", "renderHeight",
    "minScale / preferredScale / maxScale", "groundAnchor or attachmentOrigin",
    "placementFootprint", "effectOrigin", "Canonical layer order", "nearest-neighbor",
    "Systemic diagnosis", "Development bounds overlay",
  ]) assert.match(`${rendering}\n${contract}`, new RegExp(phrase, "i"), phrase);
  assert.match(rendering, /Non-uniform scaling is forbidden/i);
});

test("canonical source and animation skills own complete state artwork and motion", async () => {
  const sprite = await projectFile(".skills/sprite-art/SKILL.md");
  const source = await projectFile(".skills/sprite-art/references/source-art-contract.md");
  const animation = await projectFile(".skills/animation/SKILL.md");
  const states = await projectFile(".skills/animation/references/entity-state-coverage.md");
  for (const phrase of [
    "late-16-bit", "silhouette", "source integrity", "sheet", "Players", "Enemies", "Bosses",
    "JUMP ANTICIPATION", "ASCENT", "APEX", "DESCENT", "LAND", "HIT", "ATTACK",
    "STOMP", "BOUNCE", "DEATH", "SPECIAL STATES", "stable pivots", "state-local timer",
  ]) assert.match(`${sprite}\n${source}\n${animation}\n${states}`, new RegExp(phrase, "i"), phrase);
});

test("canonical placement and overlap skills own platform arena and composition rules", async () => {
  const placement = await projectFile(".skills/environment-placement/SKILL.md");
  const arena = await projectFile(".skills/environment-placement/references/level-arena-placement.md");
  const overlap = await projectFile(".skills/overlap-prevention/SKILL.md");
  const composition = await projectFile(".skills/overlap-prevention/references/composition-and-encounters.md");
  for (const phrase of [
    "ON_SURFACE", "platform exclusion", "semantic layers", "boss arenas", "open dodge lane",
    "occupied bounds", "exclusion regions", "duplicate", "minimum spacing", "deterministic",
    "pairs/trios", "isolated spaces", "negative space", "Spatial validity is necessary but insufficient",
  ]) assert.match(`${placement}\n${arena}\n${overlap}\n${composition}`, new RegExp(phrase, "i"), phrase);
});

test("canonical visual QA requires running-game evidence across the full defect matrix", async () => {
  const visualQa = await projectFile(".skills/visual-qa/SKILL.md");
  for (const phrase of [
    "running game", "stretched", "squeezed", "incorrect or inconsistent scale", "bad alpha",
    "clipping", "anchor/pivot jitter", "floating", "overlap", "z-order", "platform",
    "art direction", "parallax", "boss-arena", "CANNOT VERIFY",
  ]) assert.match(visualQa, new RegExp(phrase, "i"), phrase);
});

test("canonical Conductor owns scoring continuity looping boss variants and rescoring", async () => {
  const conductor = await projectFile(".skills/conductor/SKILL.md");
  const workflow = await projectFile(".skills/conductor/references/soundtrack-workflow.md");
  for (const phrase of [
    "implemented and rendered game", "Level Music Brief", "soundtrack-bible.md",
    "Exploration loop", "Boss arrangement", "Level 0", "Level 1", "Level 2", "Level 3", "Level 4",
    "audit the soundtrack", "rescore", "archive", "soundtrack-manifest.json", "seamless",
  ]) assert.match(`${conductor}\n${workflow}`, new RegExp(phrase, "i"), phrase);
  assert.match(conductor, /\.\.\/visual-qa\/SKILL\.md/);
});

test("the previous game asset library is explicitly historical rather than active", async () => {
  const files = [
    "boss_creator_SKILL.md", "conductor_SKILL.md", "enemy_creator_SKILL.md",
    "game_asset_director_SKILL.md", "item_creator_SKILL.md", "level_creator_SKILL.md",
    "npc_creator_SKILL.md", "player_character_creator_SKILL.md", "vfx_creator_SKILL.md",
  ];
  for (const file of files) {
    const source = await projectFile(`skills/game-asset-library/${file}`);
    assert.match(source, /^# DEPRECATED \/ HISTORICAL/);
    assert.doesNotMatch(source, /^---\n[\s\S]*?^name:/m);
  }
});
