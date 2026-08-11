# DEPRECATED / HISTORICAL — Enemy Creator Snapshot

This is not an active project skill. Use the canonical registry at `../../.skills/README.md`, especially `../../.skills/sprite-art/SKILL.md`, `../../.skills/animation/SKILL.md`, `../../.skills/environment-placement/SKILL.md`, `../../.skills/overlap-prevention/SKILL.md`, and `../../.skills/visual-qa/SKILL.md`. The remaining text is historical.

# Enemy Creator

Read `game-art-contract.md`. For Trash Dash, also read
`../../docs/guides/enemy-placement-and-grounding.md` when available.

## Design workflow

1. Define gameplay role, silhouette, shape language, palette separation,
   personality, size class, environment, support type, and difficulty purpose.
2. Choose applicable animation states: idle/sleep, patrol, walk, run, turn,
   alert, telegraph, attack, recover, jump/fall/land, hit, stunned, defeat,
   spawn/despawn, and special.
3. Structure attacks as anticipation → action → active contact → recovery.
   Document exact active frames, reaction time, cooldown, range, damage,
   knockback, and vulnerability.
4. Define explicit AI states and transitions using player distance, line of
   sight, surface limits, timers, health, and environment—not opaque randomness.
5. Define body collision, hurtbox, attack hitboxes, detection area, projectile
   geometry, and support/patrol bounds independently from art.
6. Place by encounter role and size: small enemies may form readable clusters;
   large enemies receive isolated reaction space. Grounded actors resolve to a
   real support and turn before its edges; flying actors use authored bands.
7. Resolve every grounded enemy's full visible bounds and bottom-center ground
   anchor against one named support surface. Clamp patrols before the complete
   body or artwork leaves that support; do not infer grounding from transparent
   atlas padding.
8. For thrown or fired attacks, declare a named projectile attachment point and
   author complete anticipation, release, follow-through, and recovery keys.
   Spawn exactly once on the release frame; keep the projectile sprite
   readable, its collision independently authored, and its scale stable.

## Fairness rules

No damage before visual activation, unavoidable spawn hits, hidden active
frames, attacks through geometry without intent, endless attack chains, or
unreadable invulnerability. Provide recovery windows and preserve committed
facing during attacks unless the design explicitly supports tracking.

## Required output

Provide sprite/atlas metadata, state diagram, tuning config, surface and patrol
contract, hit/hurt/detection boxes, attack timelines, projectiles, audio/VFX
events, spawn/activation rules, defeat handling, variants, asset paths, and
direct encounter test cases.

## Validation

Verify a true idle, complete locomotion where applicable, every attack tell and
reaction, local non-loop playback, consistent pivot/baseline, edge restraint,
grounding, facing, collision timing, configurable values, transparent art,
readable projectile attachment/release timing, and encounter density. Apply the
platform exclusion and visual-bounds rules in `game-art-contract.md` to all
enemy spawns.

Treat the largest-frame complete visible motion/attack envelope as the placement footprint,
including anticipation, projectile release, knockback, hit, and defeat—not the
idle origin. Every gameplay state must map to reachable, correctly timed frames
registered to one stable ground/action anchor. Declare all placement-contract
fields from `game-art-contract.md`; deterministic spawning must reject forbidden
geometry and never accept an invalid final retry. Re-run automated checks and
inspect every affected encounter, facing, viewport, pause/cull return, and state
in the rendered game. Do not use a per-instance offset or layer override as a
screenshot-only fix.

## Example

“Use Enemy Creator to build a neighborhood squirrel that patrols one fence,
telegraphs an acorn throw, can have its projectile reflected, reacts to hits,
and never leaves its authored support.”
