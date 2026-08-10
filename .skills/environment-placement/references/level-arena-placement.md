# Level and Arena Placement

## Placeable object schema

Every placeable object defines or inherits:

```text
visualBounds
collisionBounds
placementFootprint
groundAnchor or attachmentOrigin
renderLayer
allowedZones
forbiddenZones
minimumClearance
scalePolicy
viewportBehavior
```

Placement uses the largest frame and full motion/attack/effect envelope. Use ranked legal candidates and safely skip when none passes. Do not accept an invalid final retry.

## Grounding and attachment

- A ground object is grounded when its lowest intended contact pixel meets the named surface within the shared snap tolerance.
- Wall, ceiling, hanging, projectile, and effect assets use named sockets rather than guessed offsets.
- Moving-platform objects use platform-relative coordinates.
- Ground Y comes from the support contract, never an animation frame's padding.

## Platform exclusion

Freestanding art cannot intersect the solid body of a platform. `ON_SURFACE` meets the top without entering structural pixels; `BESIDE`, `BELOW`, and `ABOVE_WITH_CLEARANCE` fully clear the platform; attached assets name their owning structure. Centralize horizontal/vertical exclusion padding and keep collision aligned with visible surfaces.

## Layers and parallax

Draw back-to-front using the canonical semantic layers. Far backgrounds are opaque and slowest. Whole middle landmarks use object-shaped alpha and a declared contact row. Close framing moves fastest, owns complete silhouettes, and must not cover traversal information. Each boundary uses one monotonic eased blend.

See `../../../docs/guides/parallax-backgrounds.md` for the full processing, transition, baseline, and viewport checklist.

## Boss arenas

- Establish one canonical scale against the player and one named floor/support system.
- Reserve an enemy-free runway before camera lock.
- Remove ordinary populations on activation and prevent retreat.
- Keep the boss, weak point, platforms, hydrants/emitters, hazards, and reward/exit visually distinct.
- Preserve at least one open dodge lane and one recovery lane; arena props cannot form accidental walls or merge with the boss silhouette.
- Test actual player jump reach against utility platforms and boss top-contact regions.
- Release only after danger is disabled and the visible defeat/exit sequence finishes.

## Visual composition

Alternate dense, medium, and open zones. Protect negative space around landmarks, interactions, new mechanics, precision jumps, and boss silhouettes. A geometrically valid arrangement still fails when it looks crowded, unsupported, repetitive, incorrectly scaled, or physically impossible.
