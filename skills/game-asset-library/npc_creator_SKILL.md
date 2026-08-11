# DEPRECATED / HISTORICAL — NPC Creator Snapshot

This is not an active project skill. Use `../../.skills/README.md` and the applicable canonical visual skills. The remaining text is historical.

# NPC Creator

Read `game-art-contract.md`. Determine why the NPC exists: narrative,
worldbuilding, guidance, objective, commerce, humor, companionship, or emotional
pacing. Do not add an NPC merely to increase asset count.

## Workflow

1. Define identity, role, motivation, relationship to player, silhouette,
   personality, location, schedule, and persistence.
2. Specify interaction conditions, dialogue states, quest/shop inputs and
   outputs, branching consequences, cooldowns, and save-state requirements.
3. Author only applicable states: idle, ambient action, notice, greet, talk,
   gesture, walk, run, interact, give/receive, celebrate, fear, hit, flee, sleep,
   companion actions, and exit.
4. Define gaze/facing, interaction radius, navigation/support constraints,
   collision policy, blocking behavior, and whether the NPC can take damage.
5. Provide portrait, dialogue pose, overhead indicator, or UI art only when the
   game presentation uses it.

## Behavior contract

Use explicit readable states such as AMBIENT, NOTICE, APPROACH, INTERACT,
FOLLOW, WAIT, FLEE, DISABLED. Avoid invisible teleportation, unavoidable player
blocking, dialogue retriggers, and navigation beyond authored supports.

## Required output

Provide character sheet and animation metadata, behavior/state diagram,
interaction and collision regions, dialogue/quest/shop schema, navigation and
spawn rules, persistence keys, audio/VFX cues, tunables, paths, and integration
events.

## Validation

Verify gameplay-scale readability, baseline/pivot stability, clean dialogue
entry and exit, state persistence, navigation bounds, non-blocking placement,
both facing directions, and all quest/shop edge cases.

## Example

“Use NPC Creator to make a tired alley shopkeeper who trades collected cans for
temporary upgrades and reacts differently after the neighborhood boss falls.”
