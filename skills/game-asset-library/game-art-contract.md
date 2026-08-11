# DEPRECATED / HISTORICAL — Game Art Contract Snapshot

This is not an active project instruction. Its current rules were merged into `.skills/`, principally `../../.skills/sprite-art/SKILL.md`, `../../.skills/rendering-asset-integrity/SKILL.md`, and their `references/` files. Use `../../.skills/README.md` for authoritative routing. The remaining text is preserved only for historical comparison.

## Historical Game Art Contract

This is the shared visual and technical contract for every skill in this
library. Read it before creating or modifying game art. Project-specific rules
and approved production assets take precedence; record any override instead of
silently changing the reusable contract.

## Establish the project profile

Record the engine, camera, target viewport, gameplay scale, art style, era
reference, palette, outline treatment, light direction, contrast, saturation,
native pixel density, and target frame rate. Inspect representative production
assets before generating anything new.

## Preserve one visual language

- Match established proportions, perspective, palette, outlines, shading,
  lighting, detail density, and animation exaggeration.
- Keep assets on the same gameplay plane at one native pixel density.
- Render pixel art at native resolution and scale with integer multiples.
- Reject antialiasing, fractional resampling, matte halos, baked checkerboards,
  inconsistent shadows, and accidental backgrounds.
- Do not redesign an established character, prop, environment, or palette
  unless the user explicitly requests it.

## Declare sprite geometry

For every sprite class, define frame width and height, visible bounds, default
facing direction, pivot, origin, ground baseline, runtime draw size, and any
intentional airborne offsets. Use identical frame geometry within an animation.
Default to a bottom-center pivot and one canonical facing direction when runtime
flipping is visually valid.

Visible pixels—not cell edges or transparent padding—determine alignment.
Normalize contact pixels before integration. Do not compensate for drifting art
by moving the world-space actor each frame.

## Author animation explicitly

Use true state artwork rather than frozen locomotion frames. Applicable states
include idle, walk, run, jump, fall, land, alert, attack, hit, stunned, special,
phase transition, defeat, spawn, and despawn.

Document for every animation:

- frame size, count, and read order;
- frames per second and loop behavior;
- pivot and baseline;
- anticipation, active, recovery, and event frames;
- transition conditions and interruptibility.

Dangerous actions require visible anticipation. Gameplay hit timing must agree
with the contact artwork. Non-looping reactions must play to completion unless
an explicit transition interrupts them.

## Separate art from gameplay geometry

Define collision, hurtboxes, attack hitboxes, weak points, detection areas, and
support surfaces independently from sprite transparency. Prefer simple,
debuggable primitives. Artwork may extend beyond collision, but any visible
contact surface must align with its authored gameplay region.

## Environment and depth contract

Separate sky/base, far, middle, close, gameplay, foreground, and atmospheric
planes when the camera moves. Typical starting parallax rates are 0.00, 0.10,
0.30, 0.60, 1.00, and 1.15 respectively. Farther planes normally use lower
contrast, saturation, and detail. Never split one semantic object across layers.

Every grounded landmark, prop, platform, and actor must declare a contact line.
Transparent padding is never placement metadata.

## World geometry / platform intersection contract

Freestanding sprites may never visually intersect the solid body of a
platform. Placement validation uses the full visible sprite bounds—not the
object origin, collision rectangle, atlas cell, or transparent padding—and
must resolve every object to exactly one declared relationship:

- `ON_SURFACE`: the bottom-center ground anchor meets the named top surface
  within the shared snap tolerance without entering structural pixels;
- `BESIDE`: the complete visual bounds clear the platform horizontally;
- `BELOW`: the complete visual bounds clear the structural bottom by the
  declared vertical clearance;
- `ABOVE_WITH_CLEARANCE`: the complete visual bounds clear the top surface;
- `EXPLICITLY_PLATFORM_ATTACHED`: the asset is intentionally part of the
  architecture and names its owning platform or structure.

Default to no intersection. Centralize platform exclusion padding with shared
horizontal and vertical values; never scatter correction offsets through individual levels.
Procedural placement must try ranked legal candidates and safely skip when no
candidate passes. A level-wide placement audit is required after geometry,
scale, or art bounds change.

## World scale, anchors, effects, and rendering layers

- Establish a canonical world scale from the player and representative doors,
  enemies, and props. Author new source sprites at that scale; reject arbitrary runtime sprite stretching or unrelated per-instance multipliers.
- Every grounded prop and grounded animation frame shares one bottom-center
  ground anchor. Normalize visible contact pixels before integration.
- Projectiles and attached VFX use one named attachment origin (paw, nozzle,
  muzzle, socket, and so on) mirrored from the same anchor contract. Do not
  duplicate magic offsets in state and render code.
- Keep the visual effect separate from the damage / collision area. Artwork may
  extend beyond a simple hitbox and may use broken silhouettes or particles;
  collision must not force rectangular-looking art.
- Declare rendering layers semantically: background, far environment, level
  architecture, behind-gameplay decor, gameplay objects, actors, foreground
  decor, particles, and UI. Fix invalid geometry before adjusting layers;
  z-order must never hide a platform intersection defect.

Every placeable asset must publish `nativePixelSize`, `referenceWorldHeight`,
`minScale`, `preferredScale`, and `maxScale`. Prefer the authored scale. If a
legal location requires scaling outside that range, reject the location instead
of stretching the asset until it fits.

Every placement footprint combines the largest physical/animated visual bounds
with category-aware `compositionPadding`. Use distinct small, medium, large,
hero, interactive, and boss-arena gaps. Validate the expanded footprint against
platform exclusion zones and neighboring assets. Large environmental props require negative space. Do not fill every valid placement region.

Effects must have an explicit emitter object and `effectOrigin`. Particle,
water, projectile, flame, smoke, light, or debris effects may not visually
float independently unless intentionally designed to do so. Keep the emitting
body in one sprite layer and the effect in another when that prevents duplicate
bodies or malformed compositing.

Spatial validity is not sufficient. Every generated or placed asset must also
pass a visual composition review.

## Output contract

- Preserve source, generated, processed, and runtime assets separately.
- Prefer RGBA PNG for raster sprites and hard alpha for pixel art.
- Use predictable atlases or zero-padded individual frames.
- Name assets `[scope]_[category]_[asset]_[state-or-variant]_[frame]`.
- Provide machine-readable metadata where practical.
- Include paths, dimensions, pivots, baselines, FPS, loops, events, collision
  requirements, layer order, and runtime scale in the implementation handoff.
- Never require an implementer to reverse-engineer a sprite sheet.

## Validation gate

Before approval, verify identity, scale, perspective, pixel density, palette,
lighting, outlines, frame dimensions, hard transparency, visible bounds,
baseline, pivot, animation completeness, event timing, collision alignment,
layer ownership, naming, metadata, and runtime paths. Inspect contact sheets and
at least one runtime composition. Reject cropping, mutation, extra/missing body
parts, key-color spill, mixed resolutions, floating contact pixels, or visual
effects that obscure required gameplay information.

Also reject origin-only placement checks, global scenery reused across
incompatible level geometry, raw placeholder primitives in production,
per-branch scale offsets, projectile events detached from their release frame,
or effects whose visible bounds are forced to match their gameplay hitbox.

Do not repair a malformed runtime sprite by repeatedly adjusting scale,
offsets, or crop values without confirming the source frame and runtime frame
boundaries. Compare source dimensions, atlas cell/crop, visible alpha bounds,
runtime draw size, transform, anchor, layer, and render-call count. Reject
neighbor-frame bleed, duplicate layers, clipped pixels, accidental alpha, and
state frames that do not visually connect.

For each rolling viewport, enforce category-specific limits for medium, large,
and hero props plus minimum repeated-asset spacing. Intentionally alternate
dense, medium, and open zones. A scene that passes geometry but reads as a pile
of props fails this gate.

## Mandatory rendered visual contract

The implemented, rendered game is the source of truth. Files, filenames,
sprite sheets, metadata, and code are intermediate evidence only. Every new or
modified placeable entity must define or inherit `visualBounds`,
`collisionBounds`, `placementFootprint`, `groundAnchor`, `renderLayer`,
`allowedZones`, `forbiddenZones`, `minimumClearance`, `scalePolicy`, and
`viewportBehavior`.

Use the centralized back-to-front layers: far background, background scenery,
rear environment, terrain/platforms, ground decor, gameplay, gameplay effects,
foreground, and HUD. Decorative/background bounds must remain fully outside
platform visual and collision interiors. Validate placement against the largest
visible frame and complete motion/attack envelope, not idle alone. Register all
frames to one stable anchor; state changes and horizontal flips must not move the
actor in world space.

Before changing motion, enumerate applicable gameplay states and map every one
to ordered, timed, reachable visual frames. After any asset, geometry, camera,
viewport, layer, enemy, boss, or animation change, run automated validation and
inspect every affected rendered route and viewport. No screenshot-only fixes:
never add an unexplained
per-instance offset, scale, or layer override to repair one screenshot; correct
shared metadata, placement rules, frame registration, or source art.

After meaningful asset changes, capture representative screenshots and inspect
the rendered start, middle, end, dense sections, platform sections, affected
effects, and boss arena at supported viewports. Validate grounding by comparing
the rendered visible contact line with the named surface within the project snap
tolerance. Screenshot evidence supplements automated checks; it never replaces
them.

A visual change is done only when the rendered scale/anchor/layer are correct,
placement is legal and unobstructed, all applicable states render at the right
moment, automated checks pass, and affected scenes were visually inspected.
