# DEPRECATED / HISTORICAL — Boss Creator Snapshot

This is not an active project skill. Use the canonical registry at `../../.skills/README.md`, especially `../../.skills/sprite-art/SKILL.md`, `../../.skills/animation/SKILL.md`, `../../.skills/environment-placement/SKILL.md`, and `../../.skills/visual-qa/SKILL.md`. The remaining text is preserved only as pre-normalization history.

# Boss Creator

Read `game-art-contract.md` and `enemy_creator_SKILL.md`. Inherit the enemy
animation, AI, collision, fairness, placement, metadata, and validation rules;
this skill adds only boss-specific requirements.

## Encounter workflow

1. Define narrative role, signature silhouette/feature, player-relative scale,
   intended duration, mastery test, and learned mechanic twist.
2. Design the actual arena: dimensions, entrance, runway, camera lock, player
   and boss spawns, platforms, safe/danger zones, hazards, boundaries,
   environmental weapons, respawn, and exit.
3. Author intro, true idle, locomotion, primary, secondary, special, hit,
   stunned/vulnerable, phase transition, enraged/final, defeat, and exit states
   as applicable.
4. Give every attack a readable telegraph, active region, recovery, selection
   constraints, cooldown, and counterplay. Avoid pure random selection and
   unfair repetition.
5. Define phases with explicit health/event triggers, protected transitions,
   changed behavior, visual/audio escalation, hazard changes, and tunables.
6. Align visible weak points or stomp surfaces with narrow authored regions;
   side/body contact retains its separate behavior.
7. Make defeat proportional: disable danger, play reactions to completion,
   resolve hazards, release the arena only after the visible exit/death beat,
   award the reward, and unlock progression.
8. Establish one canonical arena scale using the player as the reference.
   Resolve the boss, props, attack sources, projectiles, and raised platforms
   against a common ground plane or named support; validate their full visual
   bounds with the platform rules in `game-art-contract.md`.
9. Author attack-effect visual bounds separately from gameplay hitboxes. Use
   named attachment origins for nozzles, paws, muzzles, and spawned props so
   animation frames cannot detach an effect from its source.
10. Compose the arena around one readable boss silhouette. Reserve boss-arena
    composition padding around the boss, weak points, platforms, hazards, and
    attack sources. Reject duplicate or stacked state artwork and ensure exactly
    one coherent boss state renders at a time.

## Arena fairness

Test every attack against actual player speed, jump reach, size, and platform
geometry. The boss must not permanently trap the player, block all recovery
routes, attack before the reveal finishes, or hide dangerous regions in VFX.
Each new phase must remain learnable.

Also prove all arena props share the canonical perceptual scale, grounded
visuals meet the common floor, and no freestanding visual bounds intersect
solid geometry.

Require open dodge and recovery lanes. Crates, platforms, hydrants, bins, or
other arena props may not merge visually with the boss, obscure attack cues, or
form accidental walls. Validate the complete arena in motion, including intro,
every phase, hit/stun, defeat, unlock, and exit.

## Required output

Provide arena and camera contract, phase/state diagrams, animation/atlas
metadata, attack-selection rules, telegraph and active frames, hit/hurt/weak
regions, hazard and projectile contracts, tunables, intro/defeat timelines,
audio/VFX events, asset paths, direct boss routes, and deterministic tests.

Also provide the complete placement contract for the boss, every arena prop,
projectile, hazard, and effect; reserve largest-frame and full phase/attack
envelopes. Every gameplay/phase state must map to stable, reachable visual
frames. Validate both facings, every phase, weak-point alignment, defeat/exit,
arena lock/release, and supported viewport in the rendered game after automated
checks. Never hide an arena intersection with draw order or use a one-off
screenshot-only offset.

## Example

“Use Boss Creator to build an oversized bin-hound whose armor opens only after
a hydrant crash, then escalates through rolling debris and sprinklers before a
fully animated arena exit.”
