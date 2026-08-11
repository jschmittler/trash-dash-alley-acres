# DEPRECATED / HISTORICAL — Game Asset Director Snapshot

This is not an active project skill. Task routing now begins at `../../AGENTS.md` and `../../.skills/README.md`. The remaining text is preserved only as pre-normalization history.

# Game Asset Director

Read `game-art-contract.md` first. Inspect current project assets, metadata,
mechanics, and technical constraints before proposing new work.

## Route with minimum context

Load only the children needed for the request:

- isolated item: contract + `item_creator_SKILL.md`;
- isolated VFX: contract + `vfx_creator_SKILL.md`;
- player: contract + `player_character_creator_SKILL.md`;
- NPC: contract + `npc_creator_SKILL.md`;
- enemy: contract + `enemy_creator_SKILL.md`;
- boss: contract + enemy + `boss_creator_SKILL.md`;
- level environment only: contract + `level_creator_SKILL.md`;
- level music, boss music, soundtrack audit, or rescore: `conductor_SKILL.md`
  plus the finalized level evidence and only the relevant art/gameplay briefs;
- full content drop: this director plus only selected child skills.

Do not load unrelated skills, duplicate contract rules into prompts, or recreate
working assets without a stated reason.

## Production workflow

1. Define content name, type, narrative purpose, gameplay purpose, emotional
   arc, difficulty, duration, and signature motifs.
2. Audit reusable assets and identify missing or incompatible states.
3. Build an inventory grouped by level, player, NPC, enemy, boss, item, VFX, and
   music when soundtrack work is in scope.
4. Declare dependencies and sequence work: contract → environment → player
   compatibility → actors → items → VFX → music → metadata → integration →
   validation.
5. Establish one shared palette, lighting direction, perspective, pixel density,
   ground line, scale chart, naming scheme, and asset root.
6. Pass only relevant outputs between children. For example, give enemies the
   level palette and support geometry; give VFX the finalized attack timings;
   give Conductor the rendered level evidence, pacing, boss mechanics, existing
   soundtrack bible, and current audio implementation.
7. Maintain a master asset map with status, owner skill, source, runtime path,
   dimensions, dependencies, and validation state.
8. Verify the combined gameplay composition, not merely isolated sheets.
9. Treat the implemented, rendered game as the source of truth. Require every asset-map entry to reference the complete placement contract,
   largest-frame motion envelope, gameplay-to-visual state map, and deterministic
   rendered QA route. Reject screenshot-only offsets and unverified “passes.”
10. Maintain a rolling-viewport composition audit across the whole content
    drop. Apply category-specific density limits, repeated-asset spacing, and
    explicit open zones; spatial validity alone is not approval.
10. Maintain a rolling-viewport composition audit across the whole content
    drop. Apply category-specific density limits, repeated-asset spacing, and
    explicit open zones; spatial validity alone is not approval.

## Coordination rules

- New enemies must have distinct gameplay roles and readable combinations.
- Bosses inherit mechanics taught earlier and the actual arena dimensions.
- NPCs exist for a narrative, guidance, commerce, objective, or pacing purpose.
- New items must add gameplay or narrative value; reuse global items otherwise.
- VFX is authored after interaction timing is known.
- Music is authored from the implemented/rendered game and shared soundtrack
  DNA, never from filenames or generic biome assumptions alone.
- Player changes are requested only when new mechanics require missing states.

## Handoff

Provide the production brief, inventory, dependency order, shared art profile,
soundtrack bible decisions when applicable, asset map, unresolved assumptions,
runtime integration order, and a validation matrix. Flag any conflict between
the shared contract and existing production art instead of silently choosing.
Include automated validation results and rendered evidence for every affected
level, boss, entity category, and supported viewport; mark unavailable evidence
as `CANNOT VERIFY`, never `PASS`.

## Example

“Use Game Asset Director to create a haunted carnival level with three enemy
roles, one NPC, a boss arena, collectible tickets, and matching VFX.”
