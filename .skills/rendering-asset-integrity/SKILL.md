---
name: rendering-asset-integrity
description: Preserve Trash Dash visual assets faithfully from source through alpha processing, atlas extraction, scaling, anchoring, animation, and runtime rendering. Use for any task that adds, changes, replaces, redraws, resizes, animates, positions, preprocesses, loads, or renders a visual asset, or diagnoses a visual defect.
---

# Trash Dash Rendering / Asset Integrity Skill

## Purpose

This skill governs how visual assets move from source files into the running Trash Dash game.

Its purpose is to guarantee that sprites, animated frames, props, platforms, effects, backgrounds, foregrounds, enemies, bosses, and player characters are rendered faithfully without unintended stretching, squeezing, squashing, clipping, cropping, transparency artifacts, scale inconsistencies, anchor drift, sprite jitter, pixel blurring, incorrect source rectangles, incorrect destination rectangles, or distorted animation frames.

This skill is mandatory whenever a task adds, changes, replaces, resizes, animates, positions, loads, preprocesses, or renders a visual asset. It is also mandatory whenever a visual defect could plausibly originate from the rendering or asset-loading pipeline.

## Core Principle

A correctly prepared source asset must reach the screen without accidental distortion.

```text
SOURCE ASSET
→ ALPHA / VISIBLE BOUNDS
→ SOURCE RECTANGLE
→ ASPECT RATIO
→ WORLD SCALE
→ ANCHOR
→ DESTINATION RECTANGLE
→ PIXEL-SAFE RENDERING
→ VISUAL QA
```

Do not compensate for a broken stage of this pipeline by introducing arbitrary corrections later in the pipeline. Do not redraw a good sprite because the renderer stretches it. Do not change world placement because transparent padding changes apparent size. Do not add scale hacks because the source rectangle is wrong. Fix the actual cause.

Read [Runtime Visual Contract](references/runtime-visual-contract.md) for the project-wide metadata schema, layer order, scale policy, effect ownership, placement footprint, and debugging procedure.

## Mandatory Application

Read and apply this skill before modifying player, enemy, boss, or NPC sprites; props; environmental objects; platforms; moving platforms; hazards; projectiles; particles; animated environmental elements; foreground or background assets; sprite sheets; texture atlases; PNG or transparency preprocessing; asset metadata; world-scale definitions; rendering helpers; anchors; pivots; origins; source or destination rectangles; sprite scaling; or animation frame geometry. If uncertain whether this skill applies, apply it.

## Related Skills

- `../sprite-art/SKILL.md`: governs source artwork. If source art is correct but appears wrong in-game, fix rendering; do not redraw to hide rendering problems.
- `../animation/SKILL.md`: animation requires stable dimensions, anchors, pivots, frame extraction, scale, and ground contact.
- `../environment-placement/SKILL.md`: placement must use corrected world-space and visible asset bounds.
- `../overlap-prevention/SKILL.md`: spatial checks must use meaningful occupied bounds rather than accidental transparent padding.
- `../visual-qa/SKILL.md`: rendering changes are incomplete until inspected in the running game.

## 1. Preserve Aspect Ratio

Non-uniform scaling is forbidden unless explicitly intended and documented. For normal sprites, `scaleX == scaleY` or equivalent behavior must be preserved. Determine one scale factor from a meaningful reference dimension:

```text
scale = desiredHeight / visibleSourceHeight
renderWidth = visibleSourceWidth * scale
renderHeight = visibleSourceHeight * scale
```

Do not independently force arbitrary width and height if doing so changes the source aspect ratio.

## 2. Explicit Stretching Categories

Every asset defaults to `FIXED_ASPECT`. Only explicitly approved asset types may use `TILEABLE_X`, `TILEABLE_Y`, `NINE_SLICE`, `PROCEDURAL`, or `STRETCH_ALLOWED`. Stretching may never be used merely to fit a desired rectangle.

For every fixed-aspect destination, prove `destinationWidth / sourceWidth == destinationHeight / sourceHeight` within the project tolerance. The actual runtime draw call is authoritative: inventory metadata or a contact sheet cannot excuse nonuniform destination axes in the renderer.

## 2A. Canonical Destination Dimensions

Each sprite family owns canonical runtime dimensions derived from one declared scale. Animation state may change silhouette and motion envelope, but it must not apply a state-specific scale multiplier. Characters may define separate canonical form sizes only when gameplay intentionally changes form; idle, locomotion, reaction, attack, and victory within a form keep the same runtime scale. Normalize source framing instead of resizing individual states at draw time.

## 3. Source Dimensions vs Visible Bounds

Distinguish `textureWidth` and `textureHeight` from `visibleLeft`, `visibleTop`, `visibleRight`, `visibleBottom`, `visibleWidth`, and `visibleHeight`. Transparent padding must not unintentionally determine world scale. A 64×64 PNG containing a visible 28×52 lamp should not automatically become a square world object.

## 4. Alpha / Transparency Integrity

Inspect stray edge pixels, color-key and matte remnants, unintended partial alpha, halos, anti-aliased edges, and excess transparent rows or columns. Preserve intentional glow, smoke, particles, light, soft effects, and semi-transparent water. Hard-edged pixel art should have clean, intentional alpha boundaries.

Audit every generated atlas cell at native resolution. Its outer boundary must be transparent unless edge contact is explicitly authored and documented; reject isolated fringe pixels, key-colored neighbors, and accidental partial alpha. Test intentional soft effects separately from hard-alpha body art so glow cannot hide a dirty body boundary.

## 5. Sprite-Sheet Source Rectangles

Validate every frame's width, height, row, column, starting offset, margin, padding, spacing, and atlas metadata. Incorrect extraction must never be compensated for with destination scaling. Every frame must contain its complete intended artwork.

## 6. Animation Frame Geometry

Compare every animated frame's texture dimensions, visible dimensions, logical anchor, pivot, ground point, and attachment points. Silhouettes may change size, but the entity must not move merely because padding differs. Preserve a stable logical foot/ground anchor and effect attachment point. Do not independently center frames when that creates jitter.

## 7. Stable Anchors

Every asset needs an intentional gameplay-meaningful anchor: `BOTTOM_CENTER` for ground objects, `ATTACHMENT_POINT` for wall objects, `TOP_ATTACHMENT` for hanging lamps, `FEET` for characters, `LOGICAL_CENTER` for projectiles, and `EMITTER_ORIGIN` for effects. Do not derive anchors solely from PNG canvas dimensions.

## 8. World-Space Size

World size should derive from art direction, gameplay role, reference character scale, environment scale, and meaningful source dimensions. Avoid arbitrary per-instance sizing; prefer canonical asset-family metadata where useful, such as render mode, reference dimension, world height, and anchor.

## 9. Pixel-Art Rendering

Verify nearest-neighbor sampling, texture filtering, integer source rectangles, sprite-sheet boundaries, image-rendering behavior, canvas configuration, and engine texture settings. Do not allow unintended smoothing. Physics may use fractional coordinates; separate simulation coordinates from final render sampling instead of degrading movement.

## 10. Effects Have Independent Bounds

Effects may extend beyond their emitter. A sprinkler body and water spray should not share one forced render rectangle. The emitter origin must match the nozzle, while water uses independent bounds. Apply the same rule to smoke, sparks, light, projectiles, splashes, attacks, and boss effects.

## 11. Platform Rendering

Classify platforms as static sprite, repeated tile, end caps plus center tile, nine-slice, procedural, or animated. Never horizontally stretch complete pixel-art platforms just to fill geometry. Prefer modular construction and keep collision aligned with the visible top.

## 12. No Magic Scaling Patches

Do not use arbitrary per-object values such as `scaleX = 0.83`, `scaleY = 1.12`, `width -= 13`, or `height += 7` unless explicitly intentional and documented. First investigate source art, transparent padding, source rectangle, loader, preprocessing, scale calculation, anchor, destination rectangle, camera, and animation metadata. Prefer the shared-system repair.

## 13. Required Debug Information

For rendering bugs, collect actual `assetName`, `sourcePath`, texture and visible dimensions, `sourceRect`, world and render dimensions, uniform and axis scales, anchor, pivot, collision bounds, and render mode. Do not diagnose persistent issues solely by visual intuition.

## 14. Aspect Ratio Validation

For `FIXED_ASPECT` assets, compare:

```text
sourceAspect = visibleWidth / visibleHeight
renderAspect = renderWidth / renderHeight
```

They must match within a small reasonable tolerance. Otherwise the check fails; never silently accept distortion.

## 15. Debug Bounds Mode

When practical, support a developer mode showing texture bounds, visible-alpha bounds, render bounds, collision bounds, anchor, pivot, ground point, asset name, source dimensions, rendered dimensions, and scale. It must never appear in normal gameplay.

## 16. Root-Cause Requirement

When unrelated assets share a defect, assume a systemic cause until disproven. Multiple compressed objects implicate shared sizing; multiple jittering animations implicate frame canvases or anchors; repeated fringes implicate alpha processing; repeatedly small props implicate world normalization. Do not repair dozens of symptoms independently when one shared cause exists.

## 17. Visual Verification

Rendering work is never complete from code inspection alone. After meaningful changes:

1. Run the game.
2. Inspect the relevant object in its actual level.
3. Inspect nearby objects for regressions.
4. Exercise relevant animation states.
5. Inspect representative areas of every affected level.
6. Capture screenshots where tooling permits.
7. Look for squeezing, stretching, wrong scale, clipping, remnants, halos, jitter, anchor movement, floating, platform penetration, blur, z-order errors, cropping, and effect clipping.
8. Apply `../visual-qa/SKILL.md`.

Metadata and static image checks are supporting evidence only. Verify the final source rectangle, destination rectangle, dimensions, scale, anchor, and state transition in the running renderer after the last change.

## 18. Success Criteria

A prepared sprite should automatically preserve aspect ratio and transparency, remain crisp, use predictable world scale and a stable anchor, animate without geometry-driven jitter, render without clipping, align with collision, and coexist with related effects without arbitrary per-object correction. Otherwise the pipeline is not reliable.

## 19. Completion Report

For rendering work report: rendering path investigated; root cause; source dimensions; visible-alpha dimensions; render dimensions; aspect ratio before and after; scale behavior before and after; anchor behavior; source changes; renderer changes; object-specific hacks removed; visual areas inspected; and remaining defects. Do not report a fix unless it was verified in the running game.
