# Runtime Visual Contract

## Required asset metadata

Every implemented visual asset defines or inherits the relevant fields:

```text
assetName
sourcePath
nativePixelSize
textureWidth / textureHeight
visibleBounds
sourceRect
referenceWorldHeight
minScale / preferredScale / maxScale
renderMode
renderWidth / renderHeight
groundAnchor or attachmentOrigin
collisionBounds
placementFootprint
renderLayer
allowedZones / forbiddenZones
minimumClearance
viewportBehavior
```

Animation metadata additionally owns frame cell size, row/column or explicit rectangles, frame count, local timing, loop/one-shot behavior, per-state visible bounds, largest-frame/motion envelope, baseline/pivot, event frames, and attachment points.

## Render modes and scale

Default to `FIXED_ASPECT`. `TILEABLE_X`, `TILEABLE_Y`, `NINE_SLICE`, `PROCEDURAL`, and `STRETCH_ALLOWED` require intentional documented construction. Pick one reference dimension and derive the other from visible-source aspect ratio. Reject a location when it requires scale outside the declared family range.

## Canonical layer order

```text
far background
background scenery
rear environment
terrain / platforms
ground decor
gameplay objects and actors
gameplay effects
foreground
HUD
```

Fix invalid geometry before changing layer order. Z-order cannot conceal a platform intersection, floating asset, duplicate body, or detached effect.

## Effects and emitters

Every projectile, water, light, smoke, debris, flame, spray, trail, or attack effect names an emitter and `effectOrigin`. Keep body-only and effect-only atlas cells separate when their rectangles differ. Render the emitting body once. Effect bounds may extend beyond collision and must not be clipped or stretched to match a simple gameplay hitbox.

## Asset pipeline

1. Preserve source, processed, contact-sheet, and runtime outputs separately.
2. Key/despill by color relationship when generated antialiasing makes exact matching insufficient.
3. Use nearest-neighbor resize and integer source rectangles.
4. Normalize meaningful visible anchors, not entire texture canvases.
5. Reject edge-touching unintended pixels, neighboring-cell bleed, incomplete frames, mixed pixel density, key spill, and nondeterministic output.
6. Record rebuild commands and verify output dimensions/alpha in automated tests.

## Systemic diagnosis

Capture source size, visible-alpha box, atlas cell/crop, render transform, uniform scale, anchor, collision, placement footprint, layer, render-call count, and animation state. Compare multiple consumers before adding a local fix. Repeated compression implicates shared rectangle math; repeated jitter implicates registration; repeated halos implicate preprocessing; repeated floating implicates baseline/support resolution.

## Development bounds overlay

When practical, display source/texture bounds, visible-alpha bounds, destination/render bounds, collision, placement footprint, anchor, pivot, contact line, asset/state name, native/rendered dimensions, and scale. Keep this development-only and verify that production builds expose no debug overlay.
