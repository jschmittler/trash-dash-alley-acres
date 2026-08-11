# DEPRECATED / HISTORICAL — VFX Creator Snapshot

This is not an active project skill. Use `../../.skills/README.md` and the canonical Sprite Art, Rendering Integrity, Animation, Placement, and Visual QA skills. The remaining text is historical.

# VFX Creator

Read `game-art-contract.md`. Inspect the finalized interaction timing before
authoring an effect. Reuse compatible effects and preserve gameplay readability
over spectacle.

## Workflow

1. Define the effect purpose: telegraph, impact, movement feedback, pickup,
   activation, environment, atmosphere, transition, status, or celebration.
2. Specify trigger, world/screen space, attachment point, layer, duration,
   frame rate, loop, blend/compositing mode, scale, color roles, light response,
   and cleanup behavior.
3. Break effects into anticipation, active/readable peak, dissipation, and end.
   Dangerous effects must reveal the gameplay region before it becomes active.
4. Choose sprite animation, particles, shader, camera treatment, UI overlay, or
   a minimal combination. Avoid unnecessary layers and uncontrolled randomness.
5. Separate visual extent from damage/interaction geometry. Synchronize event
   frames with existing attack, item, boss, and environment state machines.
6. Provide variants only when scale, surface, direction, or phase requires them.
7. Keep each visual effect's authored bounds independent from its damage /
   collision region. A simple rectangular hitbox must never force a rectangular
   spray, flame, smoke, or impact silhouette.
8. Use one named attachment origin from `game-art-contract.md` and audit every
   animation frame for gaps, drifting sockets, duplicate source props, hard
   atlas cutoffs, and accidental platform intersection.
9. Store `effectOrigin`, `effectAnchor`, `effectBounds`, `effectDirection`,
   `effectScale`, and `effectLayer` explicitly. Animate emitted material from
   the source outward with connected start, active, taper, and stop states; do
   not teleport wedges, rectangles, or detached cones between frames.
9. Store `effectOrigin`, `effectAnchor`, `effectBounds`, `effectDirection`,
   `effectScale`, and `effectLayer` explicitly. Animate emitted material from
   the source outward with connected start, active, taper, and stop states; do
   not teleport wedges, rectangles, or detached cones between frames.

## Common outputs

Movement dust, landing puffs, swipes, impacts, projectiles/trails, hit flashes,
defeat bursts, pickup glows, power-up notices, water/fire/smoke/sparks, weather,
ambient motion, phase transitions, and victory effects.

## Required output

Provide source/runtime assets, atlas metadata, trigger event, position/origin,
layer order, timing, loops, palette, blend mode, particle tunables, collision
relationship, audio synchronization, lifecycle/pooling rules, and performance
budget.

## Validation

Verify native pixel density, clean alpha, correct origin and facing, timing with
the triggering event, visibility on all backgrounds, no hidden hazards, no
duplicate embedded props, no lingering instances, deterministic cleanup, and
acceptable overdraw/particle counts on the weakest target device.

Apply the complete placement contract: declare visual bounds, collision/interaction bounds, placement footprint,
attachment or ground anchor, render layer, zones, clearance, scale policy, and
viewport behavior. Reserve the largest frame and full effect envelope. Every
applicable gameplay state—spawn, anticipation, active, impact, taper, destroyed,
or despawn—must map to ordered, reachable, correctly timed frames registered to
one stable attachment. Run automated checks and inspect the effect in motion in
the rendered game on every affected background, facing, phase, and viewport; screenshot-only
offsets and draw-order concealment are forbidden.

For body-plus-effect props, render the body exactly once and make effect atlas
cells contain effect pixels only. Programmatically validate frame dimensions,
hard alpha, neighboring-cell bleed, and emitter attachment in both facings.

For body-plus-effect props, render the body exactly once and make effect atlas
cells contain effect pixels only. Programmatically validate frame dimensions,
hard alpha, neighboring-cell bleed, and emitter attachment in both facings.

## Example

“Use VFX Creator to make a four-frame pixel-art sprinkler spray that contains
water only, flips cleanly, matches the hazard timing, and composes over one
grounded sprinkler body.”
