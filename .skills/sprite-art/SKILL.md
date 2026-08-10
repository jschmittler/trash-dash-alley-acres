---
name: sprite-art
description: Define, generate, revise, or audit source pixel-art sprites and visual assets for Trash Dash. Use when artwork itself changes, including characters, enemies, bosses, props, tiles, effects, backgrounds, palettes, silhouettes, viewpoints, source sheets, or missing animation-state art.
---

# Trash Dash Sprite / Art Asset

## Purpose

Own the quality and completeness of source artwork. Trash Dash uses a polished late-16-bit visual language with crisp hard-edged pixel clusters, dark blue-gray contours, limited value groups, readable silhouettes, consistent lighting and pixel density, and side-on or front-on viewpoints appropriate to a 2D side-scroller.

Read [Source Art Contract](references/source-art-contract.md) for the complete project profile, source/output rules, and entity-specific coverage before generating or revising art.

## Applicability relationships

- Always also apply [Rendering / Asset Integrity](../rendering-asset-integrity/SKILL.md) to any asset intended for the game.
- Also apply [Animation / Motion Sprites](../animation/SKILL.md) when the asset has multiple frames or gameplay states.
- Also apply [Environment Placement / Z-Order](../environment-placement/SKILL.md) when art is an environment, prop, platform, background, foreground, or attached effect.
- Finish every meaningful visual change with [Visual QA](../visual-qa/SKILL.md).

These are applicability relationships, not recursive restart instructions.

## Source-art gate

1. Inspect representative approved runtime art before authoring.
2. Declare intended runtime role, viewpoint, native pixel density, target scale, silhouette, palette, outline, shading, light direction, and anchor.
3. Inventory every gameplay state before creating a sheet. Supply complete art for every applicable state; do not let missing art silently fall back to an unrelated frame.
4. Keep every intended silhouette complete inside its frame, including feet, tails, ears, attack props, emitted material, and motion extremes.
5. Prepare clean transparency with generous intentional margins. Reject mattes, key spill, halos, accidental partial alpha, checkerboards, scenery, labels, and frame borders.
   Inspect every cell boundary pixel and the first visible alpha contour at native size and 200–400% zoom. Hard-edged art must use intentional hard alpha; isolate approved glow or other soft effects from the body before judging boundary cleanliness.
6. Keep the source master unchanged where required; derive normalized runtime outputs deterministically and preserve generation notes.
7. Separate an emitter body from effects when their bounds, timing, layer, or scale differ.
8. Reject artwork that only looks correct when distorted, cropped, or patched in the renderer.
9. Record the canonical runtime dimensions and scale inherited by every consumer. Source poses must be reframed to that contract; do not authorize per-state runtime resizing to compensate for inconsistent source silhouettes.

## Diagnose before redrawing

Compare source dimensions, visible-alpha bounds, atlas cell/crop, and runtime output. If source art is correct but appears stretched, clipped, jittery, floating, haloed, or mis-scaled, repair the rendering or placement system instead of redrawing good art.

## Handoff

Report source and runtime paths, art profile, native dimensions, visible bounds, intended scale, anchor, frame/state coverage, alpha preparation, derived outputs, generation provenance, and running-game verification status.
