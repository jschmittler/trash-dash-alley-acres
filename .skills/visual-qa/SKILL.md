---
name: visual-qa
description: Verify Trash Dash visual changes in the running game through browser inspection, screenshots, animation-state checks, source-to-runtime comparisons, and evidence-backed audit updates. Use after every meaningful visual change and when diagnosing rendering, placement, scale, animation, layering, overlap, collision, background, foreground, or boss-arena defects.
---

# Trash Dash Visual QA

Visual QA is the final verification gate. Code, metadata, atlases, contact sheets, and automated tests are intermediate evidence; the running game is the visual source of truth.

## Applicability relationships

Also apply the skills that govern the work being verified:

- [Sprite / Art Asset](../sprite-art/SKILL.md) for source quality and art direction.
- [Rendering / Asset Integrity](../rendering-asset-integrity/SKILL.md) for source-to-screen fidelity.
- [Animation / Motion Sprites](../animation/SKILL.md) for state coverage, timing, and registration.
- [Environment Placement / Z-Order](../environment-placement/SKILL.md) for grounding, supports, layers, and arenas.
- [Overlap Prevention / Spatial QA](../overlap-prevention/SKILL.md) for occupied bounds, spacing, exclusion, and density.

These are applicability relationships, not instructions to restart completed workflows.

## Workflow

1. Record the issue, expected result, affected routes, asset family, renderer, builder, metadata, and shared consumers.
2. Run deterministic asset, frame, alpha, geometry, placement, animation, state, and composition tests.
3. Start or reuse the local game server and open cache-busted direct routes plus at least one normal traversal route.
4. Inspect source/native art, processed atlas/contact sheet, and runtime result at normal play scale and zoomed screenshot scale.
5. Exercise every affected state, transition, facing, interaction, platform endpoint, parallax boundary, boss phase, and viewport.
6. Inspect nearby assets sharing the renderer, atlas builder, placement helper, or metadata family for regression.
7. Capture screenshots or short state sequences with route/build/world-position context.
8. Update `../../docs/visual-audit.md` with observed evidence, root cause, fix, files, verification, and unresolved items.

The running renderer after the final build is authoritative. Static source, atlas, inventory, and test evidence may locate defects, but none can upgrade a runtime observation from `CANNOT VERIFY` or `INCOMPLETE` to `PASS`.

## Required checks

- stretched, squeezed, or squashed sprites and mismatched aspect ratios;
- incorrect or inconsistent scale and pixel density;
- bad alpha, matte/key remnants, halos, blur, filtering, or frame bleed;
- clipping, cropping, incomplete silhouettes, and wrong source rectangles;
- anchor/pivot jitter, foot sliding, floating, sinking, and detached effects;
- missing, unreachable, stale, backward-facing, looping, or abrupt animation states;
- state-dependent destination scale or size pops across consecutive transition frames;
- dirty alpha boundaries, atlas-edge pixels, matte fringes, and intentional glow incorrectly merged into hard-alpha body art;
- prop overlap, duplicate bodies, platform penetration, invalid patrol/flight bounds, and blocked routes;
- incorrect z-order, foreground occlusion, semantic-layer splits, parallax seams, and empty sky bands;
- platform visual/collision misalignment and unsafe scalable segments;
- inconsistent art direction, viewpoint, palette, outline, or lighting;
- boss-arena scale, runway, camera lock, utility-platform reach, open lanes, weak-point alignment, defeat, and release presentation.
- duplicate static arena props across entry, death/retry, checkpoint recovery, phase changes, defeat, exit, and re-entry; persistent props must retain one identity throughout.

## Completion rule

Do not mark an issue fixed unless the exact running-game behavior was observed after the final change. If browser, viewport, device, state, or input access is unavailable, record `CANNOT VERIFY` or `INCOMPLETE`, never `PASS`.

## Handoff

Report routes and viewports visited, interactions/states performed, screenshots captured, automated checks, source-to-runtime measurements, observations, audit updates, and every unverified condition.
