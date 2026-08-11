# DEPRECATED / HISTORICAL — Item Creator Snapshot

This is not an active project skill. Use `../../.skills/README.md` and the applicable canonical Sprite Art, Rendering Integrity, Animation, Placement, Overlap, and Visual QA skills. The remaining text is historical.

# Item Creator

Read `game-art-contract.md`. Reuse an existing game-wide item when it already
serves the requested function. New items must add gameplay or narrative value.

## Workflow

1. Define category, purpose, rarity, source, world placement, persistence,
   inventory behavior, stacking, duration, and consume/equip rules.
2. Establish a silhouette readable at gameplay scale and a palette/outline that
   separates the item from scenery without confusing it with hazards.
3. Author only needed states: world idle/hover, spawn, pickup, activate, use,
   cooldown, equipped, depleted, locked/unlocked, or destroyed.
4. Define pickup/interaction collision separately from visible pixels. Specify
   magnet radius, collection delay, respawn, checkpoint behavior, and duplicate
   handling where applicable.
5. Specify effect values, caps, timers, stacking/refresh rules, save behavior,
   UI icon, notification, sound, particles, and player-state integration.

## Required output

Provide sprite/animation metadata, item configuration, collision and trigger
regions, effect/state transitions, inventory/save keys, UI and feedback assets,
spawn/drop rules, runtime paths, and direct pickup/activation tests.

## Validation

Verify readability against every environment, clean hover without hitbox drift,
one collection event, correct state persistence, stacking limits, checkpoint
behavior, effect expiration, transparent pixels, and metadata/runtime parity.

Declare the complete placement contract from `game-art-contract.md`, including
the hover/activation motion envelope and largest frame. Map every applicable
world, pickup, activation, depleted, and destroyed gameplay state to stable,
timed visual frames. Validate platform exclusion, foreground readability,
collection alignment, and supported viewports in the rendered game after the
automated asset/placement checks. Do not repair one composition with a local
screenshot-only offset, scale, or layer override.

## Example

“Use Item Creator to create a taco power-up with a gentle hover, four-frame
animation, one collection event, a short reward freeze, and explicit form-change
metadata.”
