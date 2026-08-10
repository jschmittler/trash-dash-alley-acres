# Composition and Encounters

## Occupied bounds

Use `placementFootprint = largestVisibleOrMotionBounds + compositionPadding`. Category padding differs for small, medium, large, hero/landmark, interactive, effect, and boss-arena content. Transparent canvas padding is never occupied space; intentional aura/effect motion is.

## Placement rejection

Reject candidates that intersect platform interiors, forbidden zones, another expanded footprint, required routes, landing targets, hazard tells, camera-safe margins, or emitter relationships. Ranked deterministic candidates may be tried in order; if all fail, skip the object and record it for review.

## Duplicate and repetition control

- Do not render the same body/state twice.
- Do not place repeated hero-scale props within one viewport without a designed reason.
- Vary small decor while preserving open zones.
- Count both current and incoming viewport footprints around transitions.
- Keep large props, pickups, tutorial text, and interaction targets visually distinct.

## Enemy distribution

- Tiny/small enemies: coherent groups of one to three with separated silhouettes.
- Medium enemies: one or two, with at most one light supporting pressure.
- Large enemies: one per owned encounter space, normally at least 0.8 viewport before the next major group.
- Boss: one in a locked arena unless the design explicitly summons adds.
- Target no more than two ordinary groups visible at once; only one should demand immediate reaction.
- Follow show → solo test → repeat → combine → mastery/bypass → release.
- Give high-pressure groups a readable bypass, safe pocket, reward, or recovery space.

## Motion and support

Resolve grounded actors to one stable support ID and clamp the full collision body before edges. Validate the largest artwork envelope at patrol extremes. Flying actors own deliberate flight bands. Arena entry clears ordinary populations and prevents them from following the player.

## Final composition gate

Spatial validity is necessary but insufficient. Inspect full-speed motion and rolling viewports for silhouette merging, crowding, implausible support, repetitive texture, blocked route communication, obscured attacks, and missing negative space.
