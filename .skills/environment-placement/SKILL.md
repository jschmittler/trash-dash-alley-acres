---
name: environment-placement
description: Place and layer Trash Dash props, platforms, backgrounds, foregrounds, hazards, scenery, bosses, and environmental effects. Use for world coordinates, ground contact, support surfaces, platform exclusion, anchors, parallax ownership, z-order, occlusion, collision alignment, arena composition, and environmental attachment.
---

# Trash Dash Environment Placement / Z-Order

Read [Level and Arena Placement](references/level-arena-placement.md) for the complete placement contract, semantic layers, platform relationships, parallax, and boss-arena rules.

## Applicability relationships

- Always apply [Rendering / Asset Integrity](../rendering-asset-integrity/SKILL.md) before using runtime dimensions or bounds.
- Also apply [Overlap Prevention / Spatial QA](../overlap-prevention/SKILL.md) whenever multiple footprints, exclusion regions, routes, or objects are involved.
- Finish meaningful visual changes with [Visual QA](../visual-qa/SKILL.md).
- Also apply [Sprite / Art Asset](../sprite-art/SKILL.md) if source artwork changes.

## Placement contract

1. Place from corrected visible bounds and a declared logical ground or attachment anchor, never texture dimensions or transparent padding.
2. Resolve every freestanding object to one relationship: `ON_SURFACE`, `BESIDE`, `BELOW`, `ABOVE_WITH_CLEARANCE`, or `EXPLICITLY_PLATFORM_ATTACHED`.
3. Keep complete visual and motion bounds outside forbidden platform interiors. Render order may not hide impossible geometry.
4. Keep visible platform tops aligned with collision surfaces and use modular tiles/end caps/nine-slice construction for scalable pixel-art platforms.
5. Use centralized semantic layers: far background, background scenery, rear environment, terrain/platforms, ground decor, gameplay, gameplay effects, foreground, HUD.
6. Assign each recognizable background object to exactly one parallax plane. Do not split landmarks or simulate depth with row-wide opacity.
7. Preserve safe gameplay spacing, visible landing targets, routes, hazards, pickups, tells, and boss silhouettes.
8. Boss arenas require a quiet runway, camera/player/boss bounds, open dodge/recovery lanes, correctly grounded props/platforms, and defeat-gated release.
   Every static arena prop owns one explicit identity and one construction path. Count identities across fresh entry, death, retry, checkpoint recovery, every phase, defeat, exit, and re-entry; state changes may update that object but may never append a duplicate.
9. Re-run level-wide placement validation after art bounds, scale, geometry, camera, or platform changes.

## Project guides

- Read `../../docs/guides/parallax-backgrounds.md` for layered background work.
- Read `../../docs/guides/trash-dash-v2-parallax-contract.md` before creating, validating, importing, or wiring a new three-layer background set. Treat its 960×540 camera, 1320×540 plate, naming, ownership, validation, and renderer rules as mandatory for new work.
- Read `../../docs/guides/enemy-placement-and-grounding.md` for enemy supports, patrols, encounter spacing, or arenas.

## Handoff

Report visible and motion bounds, anchors, world rectangles, named support/collision surfaces, placement relationships, clearances, draw order, parallax ownership, arena lanes, occlusions, and running-game scenes verified.
