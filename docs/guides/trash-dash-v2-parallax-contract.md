# Trash Dash v2 Parallax Background Contract

Use this contract for every newly authored Trash Dash background set. It is the approved production rule for five-stage levels. Existing 2048×716 legacy plates remain supported only until their level is migrated; do not use that size for new art.

## Fixed runtime rules

| Rule | Value |
| --- | --- |
| Internal camera | 960×540 px, 16:9 |
| New segment plate | 1320×540 px PNG |
| Background layers per segment | `far`, `middle`, `close` |
| Level 1 width | 6600 world px; five authored segments |
| Follow framing | player target is 36% from the left (camera target = player X − 345.6) |
| Normal / boss camera follow | 5.5×dt / 9×dt; boss arenas use authored camera start X |
| Parallax | far 0.018; middle 0.055; close 0.13 |
| Sampling | nearest-neighbor only; canvas smoothing disabled |

Name every delivery `level<id>-<stage>-<layer>.png` and place all 15 files in one directory. Stage names are stable lowercase kebab-case identifiers shared by level data and filenames.

## Plane ownership

- **Far:** opaque sky, clouds, haze, distant terrain, treeline, and skyline. It establishes scale and contains no transparent pixels.
- **Middle:** transparent scene context: whole trees, ruins, bridges, utility infrastructure, warehouses, rail cars, or buildings. Each recognizable landmark belongs only here or on another single plane.
- **Close:** transparent, sharply detailed framing: roots, rocks, reeds, fences, wall edges, near trunks, and low vegetation. Keep the central gameplay-reading corridor clear.

Do not bake collision, gameplay platforms, enemies, pickups, hazards, UI, or critical landing geometry into any plate. Do not create layers by horizontally masking a flattened concept image. Do not duplicate a landmark across planes.

## Boundary and composition rules

Reserve approximately 120 px at both plate edges for continuation material, not a unique focal landmark. Every plate must look natural when independently tiled and when cross-faded with its adjacent stage. Keep the visible player space clear near the normal screen position (x≈346 of the 960 px view). Maintain the authored lighting progression through adjacent segments.

## Engine integration

1. Store ordered `{ zoneId, stage }` entries in level data; each stage maps to one far/middle/close triplet.
2. Load only the active level's 15 assets; do not mix Level 1 and Level 2 assets.
3. Disable `imageSmoothingEnabled`, draw at native logical pixels, and let CSS scale the 960×540 canvas with pixelated/crisp edges.
4. Render in this order: `far → middle → close → terrain/platforms → actors → effects → HUD`.
5. Tile each layer independently using its natural width (1320 for this contract) and `offset = -round((cameraX * layerSpeed) % plateWidth)`.
6. Resolve exactly one smoothstep blend around each declarative zone boundary. Draw complete left and right triplets with `1 - blend` and `blend`; never hard-switch or run a second transition path.
7. Keep boss-camera locking separate from parallax: the same layer-speed calculation uses the locked authored camera X.

## Required validation

Run before importing a new set:

```sh
node scripts/validate-parallax-background-set.mjs \
  public/assets/backgrounds level1 woodland creek highway industrial park
```

The command verifies all 15 names, PNG format, exact 1320×540 dimensions, opacity for far, meaningful transparency and object-shaped alpha for moving layers. Then run a camera sweep at 960×540 through every stage and boundary, forward and reverse, at the production parallax speeds. Reject visible tile seams, doubled landmarks, empty alpha gaps, lighting pops, or close scenery that hides a landing target.
