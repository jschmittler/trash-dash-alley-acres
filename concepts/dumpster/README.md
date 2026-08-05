# Dumpster goal sprite concept

Private, unintegrated prop exploration for the post-boss goal reveal. This workspace is intentionally kept outside `public/` and outside all application, test, manifest, and production-output paths. Nothing here is loaded by the game; do not move or copy an approved frame into a runtime asset directory until the concept has been reviewed and explicitly approved.

## Frame format

- Canvas: 768×384 pixels, RGBA.
- Grid: four columns × two rows.
- Cell size: 192×192 pixels.
- Sampling: nearest-neighbor; preserve hard pixel edges.
- Camera, scale, footprint, and contact point stay locked in every frame.
- Row 0 (frames 0–3): ambient idle loop — restrained lid creak, trash settling, and/or fly movement.
- Row 1 (frames 4–7): stink loop — curling muted green-brown odor wisps that rise and change shape.

Final frame indices are 0–3 for idle and 4–7 for stink. Suggested playback is 140–180 ms per frame. Loop frames 0–3 and 4–7 independently; the stink loop may be enabled only while the goal is visible. Keep motion subtle enough for a stationary prop.

## Visual target

Three-quarter side view of an old, dark-green steel dumpster with dents, chipped paint, rust, grime, crooked caster wheels, a partly open lid, overflowing trash, and non-legible graffiti marks. Use the established dark navy contour, clustered three-to-four-value pixel shading, crisp edges, and no gradients or anti-aliasing. Trash and graffiti may add color, but the dumpster body remains visually dominant.

## Workspace layout

- `source/`: retained flat-key generation sheets for future revisions.
- `sheets/`: cleaned, transparent component sheets (created in later tasks).
- `dumpster-animation-atlas.png`: final 4×2 review atlas (created in later tasks).
- `PROMPTS.md`: exact generation prompts and constraints.

This is concept art only: no gameplay integration, collision, goal behavior, boss sequencing, victory logic, or runtime references belong in this workspace.
