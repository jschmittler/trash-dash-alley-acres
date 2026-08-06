# Decorative Side-On Asset Rebuild

## Goal

Bring every decorative prop and elevated platform into one coherent side-scrolling visual language: side-on orthographic silhouettes, crisp 16-bit pixel clusters, stable ground contact, and preserved aspect ratios. Characters, enemies, dumpsters, backgrounds, sky, level layout, and gameplay behavior remain unchanged.

## Visual direction

- Camera: strict side-on orthographic; no three-quarter perspective, top faces, or skewed depth.
- Rendering: polished 16-bit pixel-art-inspired clusters with dark navy outlines and restrained highlights.
- Palette: reuse the existing forest/city greens, warm wood, muted teal recycling accents, and industrial blue-gray.
- Grounding: every prop has an explicit visible-contact baseline; transparent atlas padding must not determine placement.
- Props remain static; no new gameplay animation is introduced in this pass.

## Decorative asset set

Create one canonical 256px-cell atlas containing six normalized props:

1. Bush — low rounded shrub with a flat ground contact.
2. Tree — compact side-on trunk and canopy, visually deeper than the bush but sharing the same contact line.
3. Recycle bin — front panel and lid shown side-on, not in perspective.
4. Recycling crate — wide wooden crate with a visible recycle mark, preserving its wide aspect ratio.
5. Checkpoint sign — side-on wood sign with raccoon mark and a planted post.
6. Tire stack — side-on nested tires with a grounded bottom edge.

The atlas may retain a 3×2 layout for code compatibility, but each cell must include measured visible bounds in an adjacent manifest or module constants.

## Platform tiles

Replace the current procedural branch and metal platform drawings with two horizontally scalable side-on tile strips. Each strip must have seamless left/middle/right behavior, a fixed top contact edge, and no perspective depth. The runtime may repeat or stretch only the middle segment.

## Runtime rules

- Draw props from visible-content bounds, not square-cell bounds.
- Preserve each asset’s aspect ratio with one destination dimension derived from the other.
- Use per-prop baseline offsets and optional contact-shadow offsets.
- Keep existing world positions and collision rectangles unchanged.
- Keep the current ground tile and background system unless a new decorative asset requires a narrow compatibility change.
- Remove or stop referencing unused legacy decorative definitions where safe, but do not delete unrelated legacy assets in this pass.

## Validation

- Atlas tests verify dimensions, alpha margins, visible bounds, and per-prop baselines.
- Rendering tests verify crate aspect ratio, prop grounding, and platform tile repeat behavior.
- Existing gameplay, mobile, boss, victory, and Pages tests remain green.
- Local visual smoke checks cover forest scenery, city scenery, recycling crates, checkpoint sign, tires, branch platforms, and metal platforms.

## Non-goals

- No changes to character or enemy sprites.
- No changes to dumpster art.
- No changes to backgrounds, sky, level geometry, enemy placement, collisions, or game rules.
- No new decorative animation system.
